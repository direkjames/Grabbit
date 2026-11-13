/*
 * Grabbit - small checks for the "Details" text and for an old yt-dlp
 * Author: direk james
 *
 * Pure functions (no Electron), so `npm test` can check them.
 */
'use strict';

const OLD_AFTER_DAYS = 60; // YouTube changes often; a yt-dlp older than this starts failing

/** Age of a yt-dlp version like "2026.10.26" in days, or null if the text isn't a date. */
function ytdlpAgeDays(version, now = Date.now()) {
  const m = /^(\d{4})\.(\d{2})\.(\d{2})/.exec(String(version || '').trim());
  if (!m) return null;
  const then = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isFinite(then) ? Math.floor((now - then) / 86400000) : null;
}

function isOldVersion(version, now) {
  const days = ytdlpAgeDays(version, now);
  return days !== null && days > OLD_AFTER_DAYS;
}

/** The text under a failed card's "Details": versions, the link, then yt-dlp's own last lines. */
function buildDetails({ appVersion, ytdlpVersion, url, code, lines }) {
  const tail = (lines || []).slice(-40).map((l) => String(l).slice(0, 400));
  return [
    `Grabbit ${appVersion || '?'} · yt-dlp ${ytdlpVersion || '?'} · exit code ${code}`,
    `Link: ${url}`,
    '',
    ...tail,
  ].join('\n');
}

module.exports = { OLD_AFTER_DAYS, ytdlpAgeDays, isOldVersion, buildDetails };
