/*
 * Grabbit - settings rules
 * Author: direk james
 *
 * The window may only change the settings listed here, and only to values
 * that make sense. Pure functions (no Electron) so `npm test` can check them.
 */
'use strict';

const { VIDEO_QUALITIES, MP3_BITRATES, MODES, COOKIE_BROWSERS } = require('./ytdlp-args');

const LANGUAGES = ['en', 'fil', 'ceb', 'hil', 'pirate', 'enchant']; // English, Filipino, Cebuano, Hiligaynon, Pirate, Enchanting Table
const MAX_PARALLEL = 5;

const DEFAULTS = {
  mode: 'mp4',
  videoQuality: '1080',
  audioQuality: '320',
  editorFriendly: true,
  seenHelp: false,
  language: 'en',
  maxConcurrent: 2,
  notifyOnDone: true,
  soundOnDone: true,
  saveThumbnail: false,
  embedCoverAudio: true,  // cover art in MP3s is what people expect
  embedCoverVideo: false, // off for MP4: some editors read the picture as an extra video track
  cookiesBrowser: '',
  theme: 'light',        // light is the default; dark is a switch in Settings
  autoUpdateYtdlp: true, // check for a newer yt-dlp when Grabbit starts
  ytdlpCheckedAt: 0,     // when that last worked (ms), so it runs at most twice a day
};

const bool = (v) => v === true || v === false;

const RULES = {
  mode: (v) => MODES.includes(v),
  videoQuality: (v) => VIDEO_QUALITIES.includes(v),
  audioQuality: (v) => MP3_BITRATES.includes(v),
  editorFriendly: bool,
  seenHelp: bool,
  language: (v) => LANGUAGES.includes(v),
  maxConcurrent: (v) => Number.isInteger(v) && v >= 1 && v <= MAX_PARALLEL,
  notifyOnDone: bool,
  soundOnDone: bool,
  saveThumbnail: bool,
  embedCoverAudio: bool,
  embedCoverVideo: bool,
  cookiesBrowser: (v) => v === '' || COOKIE_BROWSERS.includes(v),
  theme: (v) => v === 'light' || v === 'dark',
  autoUpdateYtdlp: bool,
  ytdlpCheckedAt: (v) => Number.isFinite(v) && v >= 0,
};

/** Keep only the allowed keys with valid values; everything else is dropped. */
function sanitizePatch(patch) {
  const clean = {};
  if (!patch || typeof patch !== 'object') return clean;
  for (const key of Object.keys(RULES)) {
    if (Object.prototype.hasOwnProperty.call(patch, key) && RULES[key](patch[key])) clean[key] = patch[key];
  }
  return clean;
}

/**
 * The saved download history comes from a file on disk, which anyone (or a
 * crash) could have changed: keep only well-formed entries, cut every text to a
 * sane length, and never more than 50.
 */
function sanitizeHistory(list) {
  if (!Array.isArray(list)) return [];
  const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
  const out = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const at = str(item.at, 40);
    if (Number.isNaN(Date.parse(at))) continue;
    out.push({
      title: str(item.title, 300) || str(item.url, 300) || 'Untitled',
      url: str(item.url, 2048),
      mode: MODES.includes(item.mode) ? item.mode : 'mp4',
      quality: str(item.quality, 12),
      files: Array.isArray(item.files) ? item.files.filter((f) => typeof f === 'string').slice(0, 200).map((f) => f.slice(0, 1000)) : [],
      at,
    });
    if (out.length >= 50) break;
  }
  return out;
}

/** Pick the first-run language from the computer's language (en-PH stays English). */
function languageForLocale(locale) {
  const l = String(locale || '').toLowerCase();
  if (l.startsWith('fil') || l.startsWith('tl')) return 'fil';
  if (l.startsWith('ceb')) return 'ceb';
  if (l.startsWith('hil')) return 'hil';
  return 'en';
}

module.exports = { LANGUAGES, MAX_PARALLEL, DEFAULTS, sanitizePatch, sanitizeHistory, languageForLocale };
