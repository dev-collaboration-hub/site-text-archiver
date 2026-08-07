import { failure, success } from "../shared/result.js";

const DB_NAME = "site-text-archiver-pages";
const DB_VERSION = 1;
const STORE_NAME = "pageRecords";

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
        const store = db.createObjectStore(STORE_NAME, { keyPath: "pageId" });
        store.createIndex("crawlId", "crawlId", { unique: false });
        store.createIndex("taskId", "taskId", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

function transactionPromise(transaction, value) {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(value);
    transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB transaction aborted"));
    transaction.onerror = () => reject(transaction.error ?? new Error("IndexedDB transaction failed"));
  });
}

export async function putPageRecord(record, indexedDBFactory = globalThis.indexedDB) {
  if (!record || typeof record.pageId !== "string" || typeof record.crawlId !== "string" || typeof record.taskId !== "string") {
    return failure("INVALID_PAGE_RECORD", "Page record is invalid");
  }
  let db;
  try {
    db = await openDatabase(indexedDBFactory);
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(record);
    await transactionPromise(transaction, null);
    return success({ pageId: record.pageId, crawlId: record.crawlId, taskId: record.taskId, stored: true });
  } catch (error) {
    return failure("PAGE_RECORD_STORE_FAILED", "Page record could not be stored", true, {
      message: error instanceof Error ? error.message : String(error)
    });
  } finally {
    db?.close?.();
  }
}

export async function getPageRecord(pageId, indexedDBFactory = globalThis.indexedDB) {
  let db;
  try {
    db = await openDatabase(indexedDBFactory);
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(pageId);
    const value = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB read failed"));
    });
    return success(value);
  } catch (error) {
    return failure("PAGE_RECORD_LOAD_FAILED", "Page record could not be loaded", true, {
      message: error instanceof Error ? error.message : String(error)
    });
  } finally {
    db?.close?.();
  }
}

export async function listPageRecords(crawlId, indexedDBFactory = globalThis.indexedDB) {
  let db;
  try {
    db = await openDatabase(indexedDBFactory);
    const transaction = db.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).index("crawlId").getAll(crawlId);
    const value = await new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? []);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB list failed"));
    });
    return success(value.sort((a, b) => a.discoverySequence - b.discoverySequence || a.pageId.localeCompare(b.pageId)));
  } catch (error) {
    return failure("PAGE_RECORD_LIST_FAILED", "Page records could not be listed", true, {
      message: error instanceof Error ? error.message : String(error)
    });
  } finally {
    db?.close?.();
  }
}
