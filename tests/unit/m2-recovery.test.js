import {
  assertEqual,
  assertResultOk
} from "../assertions.js";
import { describe, test } from "../test-runner.js";
import { CRAWL_STATES, STORAGE_KEYS } from "../../src/shared/constants.js";
import { TASK_STATES } from "../../src/crawler/task-record.js";
import { createRuntimeController } from "../../src/background/runtime-controller.js";
import { MESSAGE_TYPES } from "../../src/messaging/message-types.js";

const fakeCrypto = {
  getRandomValues(array) {
    array[0] = 3;
    array[1] = 4;
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

describe("M2 restart recovery", () => {
  test("requeues interrupted work without losing completed tasks", async () => {
    const storage = createMemoryStorage();
    let now = 2000;
    const controller = createRuntimeController({
      storageArea: storage,
      now: () => now++,
      cryptoObject: fakeCrypto
    });

    const created = await controller.createCrawl(command(
      MESSAGE_TYPES.CRAWL_CREATE,
      "req_recovery_create",
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

    const snapshot = structuredClone(storage.data[STORAGE_KEYS.ACTIVE_CRAWL]);
    const activeTask = snapshot.queue.tasks[0];
    snapshot.run.lifecycle = CRAWL_STATES.RUNNING;
    snapshot.run.activeTaskId = activeTask.taskId;
    activeTask.state = TASK_STATES.FETCHING;
    snapshot.queue.tasks.push({
      ...activeTask,
      taskId: "task_completed_recovery",
      canonicalKey: "https://example.test/docs/completed",
      url: "https://example.test/docs/completed",
      discoveryOrder: 2,
      state: TASK_STATES.COMPLETED
    });
    storage.data[STORAGE_KEYS.ACTIVE_CRAWL] = snapshot;

    const restored = await controller.restoreActiveCrawl();
    assertResultOk(restored);

    const repaired = storage.data[STORAGE_KEYS.ACTIVE_CRAWL];
    assertEqual(repaired.run.activeTaskId, null);
    assertEqual(
      repaired.queue.tasks.find(task => task.taskId === activeTask.taskId).state,
      TASK_STATES.QUEUED
    );
    assertEqual(
      repaired.queue.tasks.find(task => task.taskId === "task_completed_recovery").state,
      TASK_STATES.COMPLETED
    );
  });
});
