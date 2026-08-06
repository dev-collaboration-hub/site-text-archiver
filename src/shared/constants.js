export const APP_NAME = "Site Text Archiver";
export const APP_VERSION = "0.2.0";
export const SCHEMA_VERSION = 1;
export const PROTOCOL_VERSION = 1;

export const STORAGE_KEYS = Object.freeze({
  SETTINGS: "siteTextArchiver.settings",
  ACTIVE_CRAWL: "siteTextArchiver.activeCrawl"
});

export const CRAWL_STATES = Object.freeze({
  IDLE: "IDLE",
  PLANNING: "PLANNING",
  READY: "READY",
  RUNNING: "RUNNING",
  PAUSING: "PAUSING",
  PAUSED: "PAUSED",
  FINALIZING: "FINALIZING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
  FAILED: "FAILED"
});
