import { failure, success } from "../shared/result.js";

export const CRAWL_TICK_ALARM = "siteTextArchiver.crawlTick";

export async function scheduleCrawlTick(delayMs = 0, chromeApi = globalThis.chrome) {
  try {
    if (!chromeApi?.alarms?.create) return failure("ALARMS_UNAVAILABLE", "Chrome alarms API is unavailable");
    await chromeApi.alarms.create(CRAWL_TICK_ALARM, { when: Date.now() + Math.max(1, Number(delayMs) || 0) });
    return success({ scheduled: true, delayMs: Math.max(0, Number(delayMs) || 0) });
  } catch (error) {
    return failure("ALARM_SCHEDULE_FAILED", "Crawl alarm could not be scheduled", true, { message: error instanceof Error ? error.message : String(error) });
  }
}

export async function clearCrawlTick(chromeApi = globalThis.chrome) {
  try {
    if (!chromeApi?.alarms?.clear) return failure("ALARMS_UNAVAILABLE", "Chrome alarms API is unavailable");
    const cleared = await chromeApi.alarms.clear(CRAWL_TICK_ALARM);
    return success({ cleared: Boolean(cleared) });
  } catch (error) {
    return failure("ALARM_CLEAR_FAILED", "Crawl alarm could not be cleared", true, { message: error instanceof Error ? error.message : String(error) });
  }
}
