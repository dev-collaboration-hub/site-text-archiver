import {
  assertDeepEqual,
  assertEqual,
  assertResultError,
  assertResultOk,
  assertTrue
} from "../assertions.js";
import { describe, test } from "../test-runner.js";
import { CRAWL_STATES, STORAGE_KEYS } from "../../src/shared/constants.js";
import { CRAWL_EVENTS } from "../../src/crawler/crawl-state.js";
import { applyRunTransition, transition } from "../../src/crawler/state-transition.js";
import { createCrawlRun } from "../../src/crawler/crawl-run.js";
import { createTaskRecord, TASK_STATES } from "../../src/crawler/task-record.js";
import { createPriorityTaskQueue } from "../../src/crawler/priority-task-queue.js";
import { createRuntimeController } from "../../src/background/runtime-controller.js";
import { MESSAGE_TYPES } from "../../src/messaging/message-types.js";
import { createMessage, validateMessage } from "../../src/messaging/message-validator.js";

const fakeCrypto = {
  getRandomValues(array) {
    array[0] = 1;
    array[1] = 2;
    return array;
  }
};

function createMemoryStorage() {
  const data = {};
  return {
    data,
    async get(key) {
      return {
        [key]: data[key] === undefined ? undefined : structuredClone(data[key])
      };
    },
    async set(values) {
      for (const [key, value] of Object.entries(values)) {
        data[key] = structuredClone(value);
      }
    },
    async remove(key) {
      delete data[key];
    }
  };
}

function command(type, requestId, payload) {
  return { type, requestId, payload };
}

describe("M2 crawl state machine", () => {
  test("moves through ready, running, pausing, and paused", () => {
    const run = createCrawlRun("crawl_test", 10).value;
    const ready = applyRunTransition(run, CRAWL_EVENTS.PLAN_READY, 11);
    assertResultOk(ready);
    const running = applyRunTransition(ready.value, CRAWL_EVENTS.START, 12);
    assertResultOk(running);
    const pausing = applyRunTransition(running.value, CRAWL_EVENTS.REQUEST_PAUSE, 13);
    assertResultOk(pausing);
    const paused = applyRunTransition(pausing.value, CRAWL_EVENTS.PAUSE_SAFE, 14);
    assertResultOk(paused);
    assertEqual(paused.value.lifecycle, CRAWL_STATES.PAUSED);
    assertEqual(paused.value.stateVersion, 4);
  });

  test("rejects invalid and terminal transitions", () => {
    assertResultError(
      transition(CRAWL_STATES.READY, CRAWL_EVENTS.RESUME),
      "INVALID_TRANSITION"
    );
    assertResultError(
      transition(CRAWL_STATES.COMPLETED, CRAWL_EVENTS.START),
      "TERMINAL_STATE_LOCKED"
    );
  });
});

describe("M2 deterministic priority queue", () => {
  test("uses score, attempt, depth, discovery order, and URL tie breaks", () => {
    const queue = createPriorityTaskQueue({ maxSize: 5 });
    const common = {
      crawlId: "crawl_test",
      parentUrl: null,
      state: TASK_STATES.QUEUED,
      availableAt: 0
    };
    const tasks = [
      createTaskRecord({
        ...common,
        taskId: "task_a",
        url: "https://example.test/a",
        canonicalKey: "a",
        depth: 2,
        priorityScore: 10,
        discoveryOrder: 3,
        attempt: 0
      }, 0).value,
      createTaskRecord({
        ...common,
        taskId: "task_b",
        url: "https://example.test/b",
        canonicalKey: "b",
        depth: 1,
        priorityScore: 20,
        discoveryOrder: 2,
        attempt: 0
      }, 0).value,
      createTaskRecord({
        ...common,
        taskId: "task_c",
        url: "https://example.test/c",
        canonicalKey: "c",
        depth: 0,
        priorityScore: 20,
        discoveryOrder: 1,
        attempt: 1
      }, 0).value
    ];
    assertResultOk(queue.enqueueMany(tasks));
    assertEqual(queue.peek(0).value.taskId, "task_b");
    assertEqual(queue.dequeue(1).value.state, TASK_STATES.FETCHING);
    assertEqual(queue.peek(1).value.taskId, "task_c");
  });

  test("rejects duplicates and restores snapshots exactly", () => {
    const queue = createPriorityTaskQueue({ maxSize: 2 });
    const task = createTaskRecord({
      taskId: "task_1",
      crawlId: "crawl_test",
      url: "https://example.test/docs",
      canonicalKey: "https://example.test/docs",
      depth: 0,
      priorityScore: 1,
      discoveryOrder: 1,
      attempt: 0,
      state: TASK_STATES.QUEUED,
      availableAt: 0
    }, 0).value;
    assertResultOk(queue.enqueue(task));
    assertResultError(queue.enqueue(task), "DUPLICATE_TASK");
    const snapshot = queue.snapshot();
    const restored = createPriorityTaskQueue({ maxSize: 2, snapshot });
    assertDeepEqual(restored.snapshot(), snapshot);
  });
});

describe("M2 message and persisted runtime", () => {
  test("validates crawl command payloads", () => {
    const invalid = createMessage(MESSAGE_TYPES.CRAWL_START, "req_1", {}, 10);
    assertResultError(validateMessage(invalid), "INVALID_PAYLOAD");
    const valid = createMessage(
      MESSAGE_TYPES.CRAWL_START,
      "req_2",
      { crawlId: "crawl_test" },
      10
    );
    assertResultOk(validateMessage(valid));
  });

  test("creates, starts, pauses, resumes, and cancels a persisted crawl", async () => {
    const storage = createMemoryStorage();
    let now = 1000;
    const controller = createRuntimeController({
      storageArea: storage,
      now: () => now++,
      cryptoObject: fakeCrypto
    });
    const created = await controller.createCrawl(command(
      MESSAGE_TYPES.CRAWL_CREATE,
      "req_create",
      {
        config: {
          startUrl: "https://example.test/docs/",
          allowedOrigin: "https://example.test",
          allowedPathPrefix: "/docs",
          maxPages: 20,
          maxDepth: 5,
          requestDelayMs: 0,
          retryLimit: 2,
          includePatterns: [],
          excludePatterns: []
        }
      }
    ));
    assertResultOk(created);
    assertEqual(created.value.lifecycle, CRAWL_STATES.READY);
    assertEqual(created.value.counts.queued, 1);
    assertTrue(Boolean(storage.data[STORAGE_KEYS.ACTIVE_CRAWL]));

    const crawlId = created.value.crawlId;
    const started = await controller.startCrawl(command(
      MESSAGE_TYPES.CRAWL_START,
      "req_start",
      { crawlId }
    ));
    assertEqual(started.value.lifecycle, CRAWL_STATES.RUNNING);

    const replayed = await controller.startCrawl(command(
      MESSAGE_TYPES.CRAWL_START,
      "req_start",
      { crawlId }
    ));
    assertDeepEqual(replayed, started);

    const paused = await controller.pauseCrawl(command(
      MESSAGE_TYPES.CRAWL_PAUSE,
      "req_pause",
      { crawlId }
    ));
    assertEqual(paused.value.lifecycle, CRAWL_STATES.PAUSED);

    const resumed = await controller.resumeCrawl(command(
      MESSAGE_TYPES.CRAWL_RESUME,
      "req_resume",
      { crawlId }
    ));
    assertEqual(resumed.value.lifecycle, CRAWL_STATES.RUNNING);

    const cancelled = await controller.cancelCrawl(command(
      MESSAGE_TYPES.CRAWL_CANCEL,
      "req_cancel",
      { crawlId }
    ));
    assertEqual(cancelled.value.lifecycle, CRAWL_STATES.CANCELLED);
    assertEqual(
      storage.data[STORAGE_KEYS.ACTIVE_CRAWL].queue.tasks[0].state,
      TASK_STATES.CANCELLED
    );
  });
});
