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
 * null) or throws an Error with a friendly message.
 */
function validateTrim(startInput, endInput, durationSeconds) {
  const start = parseTime(startInput);
  const end = parseTime(endInput);
  if (Number.isNaN(start)) throw new Error('Start time should look like 45, 1:30 or 1:02:03.');
  if (Number.isNaN(end)) throw new Error('End time should look like 45, 1:30 or 1:02:03.');
  if (start === null && end === null) throw new Error('Enter a start time, an end time, or both.');
  if (start !== null && end !== null && end <= start) throw new Error('End time must be after the start time.');
  if (durationSeconds && start !== null && start >= durationSeconds) {
    throw new Error('Start time is past the end of the video.');
  }
  return { start, end };
}

/** Validate that a string is an http(s) URL. Returns the normalized URL or throws. */
function validateUrl(input) {
  const str = String(input || '').trim();
  if (!str) throw new Error('Paste a link first.');
  if (str.length > 2048) throw new Error('That link is too long.');
  let url;
  try {
    url = new URL(str);
  } catch {
    throw new Error("That doesn't look like a link.");
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('Only http and https links are supported.');
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

/** Arguments every yt-dlp call shares. */
function baseArgs(tools) {
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
  return args;
}

/** Arguments for fetching video/playlist info as JSON (no download). */
function buildInfoArgs({ url, playlist }, tools) {
  return [
    ...baseArgs(tools),
    '-J',
    '--no-warnings',
    ...(playlist ? ['--yes-playlist', '--flat-playlist'] : ['--no-playlist']),
    '--',
    validateUrl(url),
  ];
}

/**
 * Arguments for a download.
 * opts: { url, mode: 'mp4'|'mp3'|'wav', quality, editorFriendly,
 *         playlist, trim: {start,end}|null, outputDir, tempDir }
 */
function buildDownloadArgs(opts, tools) {
  const url = validateUrl(opts.url);
  const mode = MODES.includes(opts.mode) ? opts.mode : 'mp4';
  if (!opts.outputDir) throw new Error('Choose a folder to save into.');
  const trim = opts.trim && !opts.playlist ? opts.trim : null;

  const args = [
    ...baseArgs(tools),
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
    return { type: 'error', message: friendlyError(line.slice(6).trim()) };
  }
  return null;
}

/** Make the most common yt-dlp errors understandable for non-techy friends. */
function friendlyError(msg) {
  const m = String(msg);
  if (/Private video/i.test(m)) return 'This video is private.';
  if (/Video unavailable|This video is not available/i.test(m)) {
    return 'Video unavailable. If it plays fine in your browser, click "Update yt-dlp" at the bottom and try again.';
  }
  if (/Sign in to confirm your age|age-restricted/i.test(m)) return 'This video is age-restricted and needs a signed-in account.';
  if (/Sign in to confirm you.?re not a bot/i.test(m)) return 'YouTube is asking for a bot check. Wait a bit, then try again.';
  if (/members-only|Join this channel/i.test(m)) return 'This is a members-only video.';
  if (/live event will begin|Premieres in/i.test(m)) return "This video hasn't started yet.";
  if (/Unsupported URL/i.test(m)) return "That site or link type isn't supported.";
  if (/getaddrinfo|Unable to download webpage|timed out|Connection refused/i.test(m)) {
    return 'Network problem. Check your internet connection and try again.';
  }
  if (/HTTP Error 403/i.test(m)) return 'Download was blocked (403). Click "Update yt-dlp" at the bottom and try again.';
  if (/No space left/i.test(m)) return 'Your drive is full.';
  return m.replace(/^\[[^\]]+\]\s*[\w-]+:\s*/, '');
}

/** Pick out what the UI needs from yt-dlp's -J output. */
function summarizeInfo(info) {
  if (!info || typeof info !== 'object') throw new Error('No info returned.');
  if (info._type === 'playlist') {
    const entries = Array.isArray(info.entries) ? info.entries.filter(Boolean) : [];
    const firstThumb = entries.find((e) => Array.isArray(e.thumbnails) && e.thumbnails.length);
    return {
      kind: 'playlist',
      title: info.title || 'Playlist',
      channel: info.uploader || info.channel || null,
      count: entries.length,
      thumbnail: firstThumb ? firstThumb.thumbnails[firstThumb.thumbnails.length - 1].url : null,
      duration: null,
      maxHeight: null,
    };
  }
  const heights = (info.formats || [])
    .filter((f) => f && f.vcodec && f.vcodec !== 'none' && Number.isFinite(f.height))
    .map((f) => f.height);
  return {
    kind: 'video',
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
  parseTime,
  labelTime,
  validateTrim,
  validateUrl,
  hasPlaylist,
  buildInfoArgs,
  buildDownloadArgs,
  parseLine,
  friendlyError,
  summarizeInfo,
};
