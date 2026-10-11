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

/** Pick the first-run language from the computer's language (en-PH stays English). */
function languageForLocale(locale) {
  const l = String(locale || '').toLowerCase();
  if (l.startsWith('fil') || l.startsWith('tl')) return 'fil';
  if (l.startsWith('ceb')) return 'ceb';
  if (l.startsWith('hil')) return 'hil';
  return 'en';
}

module.exports = { LANGUAGES, MAX_PARALLEL, DEFAULTS, sanitizePatch, languageForLocale };
