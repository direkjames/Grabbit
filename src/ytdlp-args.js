/*
 * Grabbit - yt-dlp argument builder and output parser
 * Author: direk james
 *
 * Pure functions only (no Electron imports) so they can be unit-tested
 * with plain Node: `npm test`.
 */
'use strict';

const VIDEO_QUALITIES = ['best', '2160', '1440', '1080', '720', '480', '360'];
const MP3_BITRATES = ['320', '256', '192', '128'];
const MODES = ['mp4', 'mp3', 'wav'];
// Browsers yt-dlp can borrow a sign-in from (used for Instagram / Facebook / TikTok only)
const COOKIE_BROWSERS = ['firefox', 'chrome', 'edge', 'brave'];

/**
 * An error with a short machine code (e.g. "trimOrder") next to the English
 * message, so the interface can show it in the user's language.
 */
class GrabError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/**
 * Parse "45", "1:30", "01:02:03" (optionally with decimals on the seconds
 * part, like "1:30.5") into seconds. Returns null for empty input and
 * NaN for invalid input.
 */
function parseTime(input) {
  if (input === undefined || input === null) return null;
  const str = String(input).trim();
  if (str === '') return null;
  if (!/^\d+(:\d{1,2}){0,2}(\.\d+)?$/.test(str)) return NaN;
  const parts = str.split(':');
  // Minutes/seconds after the first part must be < 60
  for (let i = 1; i < parts.length; i++) {
    if (parseFloat(parts[i]) >= 60) return NaN;
  }
  return parts.reduce((total, part) => total * 60 + parseFloat(part), 0);
}

/** 75 -> "1m15s", 3725 -> "1h02m05s" (used in clip file names) */
function labelTime(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) return `${h}h${pad(m)}m${pad(sec)}s`;
  if (m > 0) return `${m}m${pad(sec)}s`;
  return `${sec}s`;
}

/**
 * Validate a trim range. Returns { start, end } in seconds (either may be
 * null) or throws a GrabError with a friendly message.
 */
function validateTrim(startInput, endInput, durationSeconds) {
  const start = parseTime(startInput);
  const end = parseTime(endInput);
  if (Number.isNaN(start)) throw new GrabError('trimStart', 'Start time should look like 45, 1:30 or 1:02:03.');
  if (Number.isNaN(end)) throw new GrabError('trimEnd', 'End time should look like 45, 1:30 or 1:02:03.');
  if (start === null && end === null) throw new GrabError('trimEmpty', 'Enter a start time, an end time, or both.');
  if (start !== null && end !== null && end <= start) throw new GrabError('trimOrder', 'End time must be after the start time.');
  if (durationSeconds && start !== null && start >= durationSeconds) {
    throw new GrabError('trimPast', 'Start time is past the end of the video.');
  }
  return { start, end };
}

/** Validate that a string is an http(s) URL. Returns the normalized URL or throws. */
function validateUrl(input) {
  const str = String(input || '').trim();
  if (!str) throw new GrabError('urlEmpty', 'Paste a link first.');
  if (str.length > 2048) throw new GrabError('urlLong', 'That link is too long.');
  let url;
  try {
    url = new URL(str);
  } catch {
    throw new GrabError('urlBad', "That doesn't look like a link.");
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new GrabError('urlProto', 'Only http and https links are supported.');
  }
  return url.toString();
}

/** True when the link points at a playlist (or a video inside one). */
function hasPlaylist(input) {
  try {
    const url = new URL(String(input).trim());
    return url.searchParams.has('list') || url.pathname.startsWith('/playlist');
  } catch {
    return false;
  }
}

const isHost = (host, domain) => host === domain || host.endsWith(`.${domain}`);

/**
 * Which site a link belongs to: 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'twitter' | 'other'.
 * ('twitter' covers X: x.com, twitter.com and the t.co short links.)
 * Works for the usual share links too (vm.tiktok.com, fb.watch, youtu.be ...).
 */
function detectSite(input) {
  let host;
  try {
    host = new URL(String(input).trim()).hostname.toLowerCase();
  } catch {
    return 'other';
  }
  if (isHost(host, 'youtube.com') || isHost(host, 'youtu.be') || isHost(host, 'youtube-nocookie.com')) return 'youtube';
  if (isHost(host, 'tiktok.com')) return 'tiktok';
  if (isHost(host, 'instagram.com') || isHost(host, 'instagr.am')) return 'instagram';
  if (isHost(host, 'facebook.com') || isHost(host, 'fb.watch') || isHost(host, 'fb.com')) return 'facebook';
  if (isHost(host, 'twitter.com') || isHost(host, 'x.com') || host === 't.co') return 'twitter';
  return 'other';
}

/** Arguments every yt-dlp call shares. */
function baseArgs(tools, { url, cookiesBrowser } = {}) {
  const args = [
    '--ignore-config',
    '--no-color',
    '--encoding', 'utf-8',
    '--windows-filenames',
  ];
  if (tools && tools.ffmpegPath) args.push('--ffmpeg-location', tools.ffmpegPath);
  if (tools && tools.denoPath) args.push('--js-runtimes', `deno:${tools.denoPath}`);
  // Lets yt-dlp fetch YouTube's challenge-solver script if the bundled one is missing/outdated.
  args.push('--remote-components', 'ejs:github');
  // Borrow the browser's sign-in, but never for YouTube: that is only meant for the
  // sites that ask for a login (Instagram, Facebook, TikTok, X).
  if (url && COOKIE_BROWSERS.includes(cookiesBrowser) && detectSite(url) !== 'youtube') {
    args.push('--cookies-from-browser', cookiesBrowser);
  }
  return args;
}

/** Arguments for fetching video/playlist info as JSON (no download). */
function buildInfoArgs({ url, playlist, cookiesBrowser }, tools) {
  const valid = validateUrl(url);
  return [
    ...baseArgs(tools, { url: valid, cookiesBrowser }),
    '-J',
    '--no-warnings',
    // --flat-playlist keeps profile/collection pages (TikTok, Instagram...) from being
    // looked up video by video. It has no effect on a normal single video.
    '--flat-playlist',
    ...(playlist ? ['--yes-playlist'] : ['--no-playlist']),
    '--',
    valid,
  ];
}

/**
 * Arguments for a download.
 * opts: { url, mode: 'mp4'|'mp3'|'wav', quality, editorFriendly,
 *         playlist, trim: {start,end}|null, outputDir, tempDir,
 *         saveThumbnail, embedCover, cookiesBrowser }
 */
function buildDownloadArgs(opts, tools) {
  const url = validateUrl(opts.url);
  const mode = MODES.includes(opts.mode) ? opts.mode : 'mp4';
  if (!opts.outputDir) throw new GrabError('noFolder', 'Choose a folder to save into.');
  const trim = opts.trim && !opts.playlist ? opts.trim : null;

  const args = [
    ...baseArgs(tools, { url, cookiesBrowser: opts.cookiesBrowser }),
    '--newline',
    '--progress',
    '--no-mtime', // file date = the day you grabbed it (handy for sorting in editors)
    '--progress-template',
    'download:GRABBIT_PROGRESS|%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(info.playlist_index)s|%(info.n_entries)s',
    '--progress-template',
    'postprocess:GRABBIT_PP|%(progress.postprocessor)s|%(progress.status)s',
    '--print', 'after_move:GRABBIT_FILE|%(filepath)s',
    '--paths', `home:${opts.outputDir}`,
  ];
  // Work files (.part, the source before MP3/WAV conversion) go to a private
  // temp folder, so converting to MP3 never touches an MP4 you grabbed earlier.
  if (opts.tempDir) args.push('--paths', `temp:${opts.tempDir}`);

  // ---- Format selection
  if (mode === 'mp4') {
    const q = VIDEO_QUALITIES.includes(String(opts.quality)) ? String(opts.quality) : '1080';
    const res = q === 'best' ? 'res' : `res:${q}`;
    const sort = opts.editorFriendly ? `${res},vcodec:h264,acodec:aac` : res;
    args.push(
      '-f', 'bv*+ba/b',
      '-S', sort,
      '--merge-output-format', 'mp4',
      '--remux-video', 'mp4',
      '--embed-metadata',
    );
  } else if (mode === 'mp3') {
    const kbps = MP3_BITRATES.includes(String(opts.quality)) ? String(opts.quality) : '320';
    args.push(
      '-f', 'ba/b',
      '-x', '--audio-format', 'mp3', '--audio-quality', `${kbps}K`,
      '--embed-metadata',
    );
  } else {
    args.push('-f', 'ba/b', '-x', '--audio-format', 'wav');
  }

  // ---- Thumbnail: save as a picture and/or embed as cover art
  // (WAV files can't hold cover art, so embedding is skipped for WAV.)
  const wantEmbed = Boolean(opts.embedCover) && mode !== 'wav';
  const wantSave = Boolean(opts.saveThumbnail);
  if (wantSave) args.push('--write-thumbnail');
  if (wantEmbed) args.push('--embed-thumbnail');
  // YouTube's thumbnails are .webp, which most editors and players can't open: make them .jpg
  if (wantSave || wantEmbed) args.push('--convert-thumbnails', 'jpg');

  // ---- Trimming (one section of a single video)
  if (trim && (trim.start !== null || trim.end !== null)) {
    const start = trim.start !== null ? trim.start : 0;
    const end = trim.end !== null ? trim.end : 'inf';
    args.push('--download-sections', `*${start}-${end}`);
    if (mode === 'mp4') args.push('--force-keyframes-at-cuts'); // frame-accurate cut
  }

  // ---- Output names
  // Video names carry the resolution, e.g. "Title [id] [1080p].mp4". Besides being handy in
  // an editor's media bin, this keeps a video from sharing a name with the temporary source
  // file of an MP3/WAV grab of the same link (yt-dlp would reuse and then delete it).
  const res = mode === 'mp4' ? '%(height& [{}p]| [video])s' : '';
  if (opts.playlist) {
    args.push(
      '--yes-playlist',
      '--ignore-errors', // skip private/deleted videos instead of stopping
      '-o', `%(playlist_title,playlist_id).100B/%(playlist_index)03d - %(title).150B${res}.%(ext)s`,
    );
  } else if (trim) {
    const from = labelTime(trim.start || 0);
    const to = trim.end !== null ? labelTime(trim.end) : 'end';
    args.push('--no-playlist', '-o', `%(title).140B [%(id)s]${res} (clip ${from}-${to}).%(ext)s`);
  } else {
    args.push('--no-playlist', '-o', `%(title).150B [%(id)s]${res}.%(ext)s`);
  }

  args.push('--', url);
  return args;
}

const NA = new Set(['', 'NA', 'N/A', 'Unknown', 'None']);
const clean = (s) => {
  const t = String(s || '').trim();
  return NA.has(t) ? null : t;
};

/** Turn one line of yt-dlp output into an event, or null if it's noise. */
function parseLine(rawLine) {
  const line = String(rawLine || '').replace(/\r/g, '').trim();
  if (!line) return null;

  if (line.startsWith('GRABBIT_PROGRESS|')) {
    const [, pct, speed, eta, index, total] = line.split('|');
    const percent = parseFloat(clean(pct));
    return {
      type: 'progress',
      percent: Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : null,
      speed: clean(speed),
      eta: clean(eta),
      index: clean(index) ? parseInt(index, 10) : null,
      total: clean(total) ? parseInt(total, 10) : null,
    };
  }
  if (line.startsWith('GRABBIT_PP|')) {
    const [, name, status] = line.split('|');
    return { type: 'postprocess', name: clean(name), status: clean(status) };
  }
  if (line.startsWith('GRABBIT_FILE|')) {
    return { type: 'file', path: line.slice('GRABBIT_FILE|'.length).trim() };
  }
  if (line.startsWith('ERROR:')) {
    const { code, message } = classifyError(line.slice(6).trim());
    return { type: 'error', message, code };
  }
  return null;
}

/**
 * Make the most common yt-dlp errors understandable for non-techy friends.
 * Returns { code, message }: `code` lets the interface show the message in the
 * user's language (code is null when we have nothing better than yt-dlp's own text).
 * Site-specific rules come first because their errors are worded generically.
 */
const ERROR_RULES = [
  ['noVideo', /No video could be found in this (tweet|post)/i, null, "That post doesn't have a video."],
  ['twitter', /\[twitter/i, /login|log in|sign in|authenticat|nsfw|protected|not available|unavailable|suspended|rate.?limit|age-restricted|guest|403|404|private/i,
    "X wouldn't let Grabbit in. Open Settings → Sign-in help, pick the browser where you're logged in to X, then try again. Protected accounts can't be grabbed."],
  ['instagram', /\[instagram\]/i, /login|log in|rate-limit|empty media|cookies|not available|private|restricted/i,
    "Instagram wouldn't let Grabbit in. Open Settings → Sign-in help, pick the browser where you're logged in to Instagram, then try again."],
  ['facebook', /\[facebook\]/i, /log in|login|cookies|private|not available|unavailable|cannot parse|permission/i,
    "Facebook wouldn't let Grabbit in. Open Settings → Sign-in help, pick the browser where you're logged in to Facebook, then try again. Private videos can't be grabbed."],
  ['tiktok', /\[tiktok\]/i, /unable to extract|blocked|ip address|login|private|not available|status code|expecting value/i,
    'TikTok didn\'t let Grabbit through. Click "Update yt-dlp" at the bottom and try again. Private accounts can\'t be grabbed.'],
  ['private', /Private video/i, null, 'This video is private.'],
  ['unavailable', /Video unavailable|This video is not available/i, null,
    'Video unavailable. If it plays fine in your browser, click "Update yt-dlp" at the bottom and try again.'],
  ['age', /Sign in to confirm your age|age-restricted/i, null, 'This video is age-restricted and needs a signed-in account.'],
  ['bot', /Sign in to confirm you.?re not a bot/i, null, 'YouTube is asking for a bot check. Wait a bit, then try again.'],
  ['members', /members-only|Join this channel/i, null, 'This is a members-only video.'],
  ['notStarted', /live event will begin|Premieres in/i, null, "This video hasn't started yet."],
  ['unsupported', /Unsupported URL/i, null, "That site or link type isn't supported."],
  ['network', /getaddrinfo|Unable to download webpage|timed out|Connection refused/i, null,
    'Network problem. Check your internet connection and try again.'],
  ['http403', /HTTP Error 403/i, null, 'Download was blocked (403). Click "Update yt-dlp" at the bottom and try again.'],
  ['diskFull', /No space left/i, null, 'Your drive is full.'],
];

function classifyError(msg) {
  const m = String(msg);
  for (const [code, test, also, message] of ERROR_RULES) {
    if (test.test(m) && (!also || also.test(m))) return { code, message };
  }
  return { code: null, message: m.replace(/^\[[^\]]+\]\s*[\w-]+:\s*/, '') };
}

function friendlyError(msg) {
  return classifyError(msg).message;
}

/** Pick out what the UI needs from yt-dlp's -J output. */
function summarizeInfo(info, url) {
  if (!info || typeof info !== 'object') throw new Error('No info returned.');
  const site = detectSite(url || info.webpage_url || '');
  if (info._type === 'playlist') {
    const entries = Array.isArray(info.entries) ? info.entries.filter(Boolean) : [];
    const firstThumb = entries.find((e) => Array.isArray(e.thumbnails) && e.thumbnails.length);
    return {
      kind: 'playlist',
      site,
      title: info.title || 'Playlist',
      channel: info.uploader || info.channel || null,
      count: entries.length,
      thumbnail: firstThumb ? firstThumb.thumbnails[firstThumb.thumbnails.length - 1].url : null,
      duration: null,
      maxHeight: null,
    };
  }
  // "Resolution" is the shorter side, the same way yt-dlp's quality sorting sees it,
  // so a vertical 1080x1920 TikTok or Reel counts as 1080p, not 1920p.
  const heights = (info.formats || [])
    .filter((f) => f && f.vcodec && f.vcodec !== 'none' && Number.isFinite(f.height))
    .map((f) => (Number.isFinite(f.width) ? Math.min(f.width, f.height) : f.height));
  return {
    kind: 'video',
    site,
    title: info.title || 'Untitled',
    channel: info.channel || info.uploader || null,
    duration: Number.isFinite(info.duration) ? info.duration : null,
    thumbnail: info.thumbnail || null,
    maxHeight: heights.length ? Math.max(...heights) : null,
    isLive: Boolean(info.is_live),
    count: 1,
  };
}

module.exports = {
  VIDEO_QUALITIES,
  MP3_BITRATES,
  MODES,
  COOKIE_BROWSERS,
  GrabError,
  parseTime,
  labelTime,
  validateTrim,
  validateUrl,
  hasPlaylist,
  detectSite,
  buildInfoArgs,
  buildDownloadArgs,
  parseLine,
  classifyError,
  friendlyError,
  summarizeInfo,
};
