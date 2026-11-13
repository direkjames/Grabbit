/*
 * Grabbit - pacing and retry rules for YouTube's bot check
 * Author: direk james
 *
 * Pure functions, so they can be unit-tested without Electron or yt-dlp.
 */
'use strict';

const BOT_RETRIES = 2; // automatic tries after a bot check
const BOT_WAIT_MS = 45000; // wait before each of those tries
const YT_GAP_MIN_MS = 2000; // YouTube downloads start at least this far apart...
const YT_GAP_SPREAD_MS = 3000; // ...plus up to this much extra, so it isn't a steady beat
const INFO_MAX_AGE_MS = 20 * 60 * 1000; // a preview older than this isn't reused (stream links expire)

/** When the next YouTube job may start. `lastStart` is when the previous one was scheduled (0 = never). */
function youtubeStartAt(now, lastStart, rand = Math.random) {
  if (!lastStart) return now;
  return Math.max(now, lastStart + YT_GAP_MIN_MS + rand() * YT_GAP_SPREAD_MS);
}

/**
 * After a failed run: should it be tried again? Returns null (give up) or
 * { wait, dropInfo, bot }. `dropInfo` = the saved preview didn't work, so retry
 * from the link itself. `bot` = YouTube asked for a bot check, so wait first.
 */
function nextRetry(job, lastError) {
  if (job.cancelled || job.files.length > 0) return null;
  if (job.infoFile) return { wait: 0, dropInfo: true, bot: false };
  if (lastError && lastError.code === 'bot' && job.botTries < BOT_RETRIES) {
    return { wait: BOT_WAIT_MS, dropInfo: false, bot: true };
  }
  return null;
}

module.exports = { BOT_RETRIES, BOT_WAIT_MS, INFO_MAX_AGE_MS, youtubeStartAt, nextRetry };
