import { failure, success } from "../shared/result.js";

const DB_NAME = "site-text-archiver";
const DB_VERSION = 1;
const STORE_NAME = "fetchedHtml";

function openDatabase(indexedDBFactory = globalThis.indexedDB) {
  return new Promise((resolve, reject) => {
    if (!indexedDBFactory || typeof indexedDBFactory.open !== "function") {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }
    const request = indexedDBFactory.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "key" });
        store.createIndex("crawlId", "crawlId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

function transactionPromise(transaction, resultValue) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(resultValue);
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
  });
}

export async function putFetchedHtml(record, indexedDBFactory = globalThis.indexedDB) {
  if (!record || typeof record.crawlId !== "string" || typeof record.taskId !== "string" || typeof record.html !== "string") {
    return failure("INVALID_FETCHED_HTML", "Fetched HTML record is invalid");
  }
  let db;
  try {
    db = await openDatabase(indexedDBFactory);
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put({
      key: `${record.crawlId}:${record.taskId}`,
      crawlId: record.crawlId,
      taskId: record.taskId,
      url: record.url ?? null,
      html: record.html,
      fetchedAt: record.fetchedAt ?? Date.now()
    });
    await transactionPromise(transaction, null);
    return success({ crawlId: record.crawlId, taskId: record.taskId, stored: true });
  } catch (error) {
    return failure("FETCHED_HTML_STORE_FAILED", "Fetched HTML could not be stored", true, {
      message: error instanceof Error ? error.message : String(error)
    });
  } finally {
    db?.close?.();
  }
}

export async function getFetchedHtml(crawlId, taskId, indexedDBFactory = globalThis.indexedDB) {
  let db;
  try {
    db = await openDatabase(indexedDBFactory);
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(`${crawlId}:${taskId}`);
    const value = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB read failed"));
    });
    return success(value);
  } catch (error) {
    return failure("FETCHED_HTML_LOAD_FAILED", "Fetched HTML could not be loaded", true, {
      message: error instanceof Error ? error.message : String(error)
    });
  } finally {
    db?.close?.();
  }
}

export async function deleteFetchedHtmlForCrawl(crawlId, indexedDBFactory = globalThis.indexedDB) {
  let db;
  try {
    db = await openDatabase(indexedDBFactory);
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("crawlId");
    const request = index.openCursor(IDBKeyRange.only(crawlId));
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      cursor.delete();
      cursor.continue();
    };
    await transactionPromise(transaction, null);
    return success({ crawlId, deleted: true });
  } catch (error) {
    return failure("FETCHED_HTML_DELETE_FAILED", "Fetched HTML could not be deleted", true, {
      message: error instanceof Error ? error.message : String(error)
    });
  } finally {
    db?.close?.();
  }
}
