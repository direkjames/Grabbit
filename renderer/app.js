/*
 * Grabbit - interface logic
 * Author: direk james
 */
'use strict';

const api = window.grabbit;
const { t, has: hasText } = window.I18N;
const $ = (id) => document.getElementById(id);

const QUALITY = {
  mp4: ['best', '2160', '1440', '1080', '720', '480', '360'],
  mp3: ['320', '256', '192', '128'],
};

// yt-dlp post-processing step -> the line shown on the download card
const PP_LABELS = {
  Merger: 'pp.join',
  FFmpegMerger: 'pp.join',
  ExtractAudio: 'pp.audio',
  FFmpegExtractAudio: 'pp.audio',
  VideoRemuxer: 'pp.mp4',
  FFmpegVideoRemuxer: 'pp.mp4',
  Metadata: 'pp.meta',
  FFmpegMetadata: 'pp.meta',
  ThumbnailsConvertor: 'pp.thumb',
  FFmpegThumbnailsConvertor: 'pp.thumb',
  EmbedThumbnail: 'pp.thumb',
  MoveFiles: 'pp.save',
  MoveFilesAfterDownload: 'pp.save',
};

const state = {
  settings: null,
  mode: 'mp4',
  info: null,        // summary of the current link
  infoKey: null,     // url|playlist that `info` belongs to
  infoToken: 0,
  multiUrl: null,    // an X post that holds several videos (offered like a playlist)
  ytdlpBusy: false,
  ytdlp: null,       // last yt-dlp status from the app
  update: { state: 'idle' },
  maxParallel: 5,
  preview: { kind: 'empty', info: null, msg: null },
  formError: null,   // function returning the message, so it can be re-translated
  jobs: new Map(),   // id -> { el, bar, status, action, meta, statusFn, finished }
  audio: null,
};

// ------------------------------------------------------------ helpers

function isHttpUrl(text) {
  try {
    const u = new URL(String(text).trim());
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function hasPlaylist(text) {
  try {
    const u = new URL(String(text).trim());
    return u.searchParams.has('list') || u.pathname.startsWith('/playlist');
  } catch {
    return false;
  }
}

function fmtDuration(sec) {
  if (!Number.isFinite(sec)) return '';
  const s = Math.round(sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** A button whose label follows the chosen language. */
function i18nButton(key, className) {
  const b = el('button', className);
  b.type = 'button';
  b.dataset.i18n = key;
  b.textContent = t(key);
  return b;
}

function chipText(mode, quality, clip) {
  let s = mode.toUpperCase();
  if (mode === 'mp4') s += quality === 'best' ? ' BEST' : ` ${quality}p`;
  if (mode === 'mp3') s += ` ${quality}`;
  if (clip) s += ' · CLIP';
  return s;
}

/** The message for an error code from the app, in the current language (falls back to the app's own text). */
function errText(code, fallback) {
  return code && hasText(`e.${code}`) ? t(`e.${code}`) : fallback || '';
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const box = el('textarea');
    box.value = text;
    document.body.append(box);
    box.select();
    document.execCommand('copy');
    box.remove();
  }
}

/** "Details" link that opens yt-dlp's own messages, with a Copy button for bug reports. Not translated on purpose. */
function detailsBlock(text) {
  const wrap = el('div', 'details');
  const toggle = i18nButton('job.details', 'link');
  const box = el('div', 'details-box hidden');
  const copy = i18nButton('job.copyDetails', 'btn ghost small');
  toggle.addEventListener('click', () => box.classList.toggle('hidden'));
  copy.addEventListener('click', async () => {
    await copyText(text);
    copy.textContent = t('job.copied');
    setTimeout(() => { copy.textContent = t('job.copyDetails'); }, 1500);
  });
  box.append(el('pre', null, text), copy);
  wrap.append(toggle, box);
  return wrap;
}

function showFormError(messageFn) {
  state.formError = messageFn || null;
  const box = $('formError');
  const text = messageFn ? messageFn() : '';
  box.textContent = text;
  box.classList.toggle('hidden', !text);
}

// ------------------------------------------------------------ sound

/** A short two-note chime made in code (no sound files needed). Rising = done, falling = failed. */
function playChime(ok) {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    state.audio = state.audio || new AC();
    const ctx = state.audio;
    if (ctx.state === 'suspended') ctx.resume();
    const notes = ok ? [659.25, 987.77] : [329.63, 246.94];
    const begin = ctx.currentTime + 0.03;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const at = begin + i * 0.17;
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.18, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.55);
    });
  } catch {
    /* no sound is not worth an error */
  }
}

// ------------------------------------------------------------ format + quality + extras

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.seg').forEach((b) => {
    b.setAttribute('aria-checked', String(b.dataset.mode === mode));
  });
  $('editorRow').classList.toggle('hidden', mode !== 'mp4');
  $('qualityWrap').classList.toggle('hidden', mode === 'wav');
  renderQualityOptions();
  renderEmbedOption();
  api.setSettings({ mode });
}

/** "Add cover art" is remembered separately for audio and video, and doesn't exist for WAV. */
function renderEmbedOption() {
  const mode = state.mode;
  $('embedRow').classList.toggle('hidden', mode === 'wav');
  if (mode === 'wav') return;
  $('embedCover').checked = Boolean(mode === 'mp3' ? state.settings.embedCoverAudio : state.settings.embedCoverVideo);
  $('embedHint').textContent = t(mode === 'mp3' ? 'thumb.embedHintAudio' : 'thumb.embedHintVideo');
}

function renderQualityOptions() {
  const select = $('quality');
  const mode = state.mode;
  select.textContent = '';
  if (mode === 'wav') return;

  const maxHeight = state.info && state.info.maxHeight;
  const wanted = mode === 'mp4' ? state.settings.videoQuality : state.settings.audioQuality;

  for (const value of QUALITY[mode]) {
    const label = t(`q.${value}`);
    const opt = el('option', null, label);
    opt.value = value;
    if (mode === 'mp4' && maxHeight && value !== 'best' && Number(value) > maxHeight) {
      opt.disabled = true;
      opt.textContent = t('q.notAvailable', { label });
    }
    select.appendChild(opt);
  }
  // keep the saved choice if possible, else fall back to the best enabled option
  const match = [...select.options].find((o) => o.value === wanted && !o.disabled);
  if (match) select.value = wanted;
  else {
    const firstOk = [...select.options].find((o) => !o.disabled && o.value !== 'best');
    select.value = firstOk ? firstOk.value : 'best';
  }
}

// ------------------------------------------------------------ link preview

function setPreview(kind, info, msg, details) {
  state.preview = { kind, info: info || null, msg: msg || null, details: details || null };
  renderPreview();
}

function renderPreview() {
  const { kind, info, msg, details } = state.preview;
  const box = $('preview');
  const thumb = $('thumb');
  box.className = `preview ${kind}`;
  box.querySelectorAll('.details').forEach((n) => n.remove());
  if (kind === 'error' && details) $('previewMeta').after(detailsBlock(details));
  if (kind === 'ready' && info) {
    $('previewTitle').textContent = info.title;
    const bits = [];
    if (info.kind === 'playlist') bits.push(t('preview.playlist', { n: info.count }));
    if (info.site && info.site !== 'other' && info.site !== 'youtube') bits.push(t(`site.${info.site}`));
    if (info.channel) bits.push(info.channel);
    if (info.duration) bits.push(fmtDuration(info.duration));
    if (info.maxHeight) bits.push(t('preview.upTo', { h: info.maxHeight }));
    $('previewMeta').textContent = bits.join(' · ');
    if (info.thumbnail) thumb.src = info.thumbnail;
    else thumb.removeAttribute('src');
  } else {
    thumb.removeAttribute('src');
    $('previewTitle').textContent = kind === 'loading' ? t('preview.loading') : t('preview.empty');
    $('previewMeta').textContent = msg ? msg() : (kind === 'loading' ? t('preview.loadingMeta') : t('preview.emptyMeta'));
  }
}

let lookupTimer = null;
function scheduleLookup(delay = 500) {
  clearTimeout(lookupTimer);
  lookupTimer = setTimeout(lookup, delay);
}

async function lookup() {
  const url = $('url').value.trim();
  showFormError(null);

  const playlistLink = hasPlaylist(url);
  const multi = !playlistLink && state.multiUrl === url;
  setPlaylistRow(playlistLink || multi, multi);
  updateTrimAvailability();

  if (!url) {
    state.info = null;
    state.infoKey = null;
    setPreview('empty');
    renderQualityOptions();
    return;
  }
  if (!isHttpUrl(url)) {
    state.info = null;
    state.infoKey = null;
    setPreview('error', null, () => t('preview.notLink'));
    return;
  }

  const playlist = $('playlist').checked;
  const key = `${url}|${playlist}`;
  if (key === state.infoKey && state.info) return;

  const token = ++state.infoToken;
  state.info = null;
  state.infoKey = key;
  setPreview('loading');

  const res = await api.getInfo(url, playlist);
  if (token !== state.infoToken) return; // a newer link was pasted meanwhile
  if (res.ok) {
    state.info = res.info;
    setPreview('ready', res.info);
    // An X post with more than one video comes back as a list: offer to grab all of them
    if (res.info.kind === 'playlist' && res.info.site === 'twitter' && !playlist) {
      state.multiUrl = url;
      setPlaylistRow(true, true);
    }
  } else {
    state.info = null;
    setPreview('error', null, () => errText(res.code, res.error), res.details);
  }
  renderQualityOptions();
}

/** The "grab the whole playlist" box. Wording differs for a post that has several videos. */
function setPlaylistRow(show, multi) {
  $('playlistRow').classList.toggle('hidden', !show);
  if (!show) $('playlist').checked = false;
  const text = $('playlistRow').querySelector('span');
  text.dataset.i18nHtml = multi ? 'playlist.textMulti' : 'playlist.text';
  text.innerHTML = t(text.dataset.i18nHtml); // our own fixed text, never user input
}

function updateTrimAvailability() {
  const playlist = $('playlist').checked;
  $('trimBlock').classList.toggle('hidden', playlist);
}

// ------------------------------------------------------------ grabbing

async function grab() {
  showFormError(null);
  const url = $('url').value.trim();
  if (!url) return showFormError(() => t('err.pasteFirst'));
  if (!isHttpUrl(url)) return showFormError(() => t('err.notLink'));
  if (state.info && state.info.isLive) return showFormError(() => t('err.live'));

  const playlist = $('playlist').checked;
  // A profile or collection page would download everything on it: ask for one video instead
  if (state.info && state.info.kind === 'playlist' && !playlist) {
    const multiPost = state.info.site === 'twitter';
    return showFormError(() => t(multiPost ? 'err.multi' : 'err.profile'));
  }

  const trimEnabled = !playlist && $('trimEnabled').checked;
  const mode = state.mode;
  const quality = mode === 'wav' ? null : $('quality').value;
  const title = state.info ? state.info.title : url;

  const button = $('grabBtn');
  button.disabled = true;
  const res = await api.download({
    url,
    title,
    mode,
    quality,
    editorFriendly: $('editorFriendly').checked,
    saveThumbnail: $('saveThumb').checked,
    embedCover: mode !== 'wav' && $('embedCover').checked,
    playlist,
    trimEnabled,
    start: $('start').value,
    end: $('end').value,
    duration: state.info ? state.info.duration : null,
  });
  button.disabled = state.ytdlpBusy;

  if (!res.ok) return showFormError(() => errText(res.code, res.error));

  addJobCard(res.id, { url, title, mode, quality, clip: trimEnabled, playlist, count: state.info ? state.info.count : null }, res.queued);
  switchTab('active');

  // Ready for the next link
  $('url').value = '';
  $('start').value = '';
  $('end').value = '';
  $('trimEnabled').checked = false;
  $('trimFields').classList.add('hidden');
  state.multiUrl = null;
  setPlaylistRow(false, false);
  state.info = null;
  state.infoKey = null;
  setPreview('empty');
  renderQualityOptions();
  updateTrimAvailability();
}

// ---- small inline icons, drawn in the text color

const ICON_PATHS = {
  check: '<path d="M5 12l5 5 9-10"/>',
  alert: '<path d="M12 7v6M12 17h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  list: '<path d="M6 12h12M6 7h12M6 17h7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  copy: '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
};

function icon(name, size = 18, width = 2.2) {
  const span = el('span', 'ico');
  span.setAttribute('aria-hidden', 'true');
  // fixed markup of our own, never user input
  span.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]}</svg>`;
  return span;
}

/** The progress ring on a running download. It spins until a percentage is known. */
function ringIcon() {
  const span = el('span', 'ico');
  span.setAttribute('aria-hidden', 'true');
  span.innerHTML = '<svg class="ring spin" width="38" height="38" viewBox="0 0 38 38"><circle class="ring-bg" cx="19" cy="19" r="15" fill="none" stroke-width="4"/><circle class="ring-fg" cx="19" cy="19" r="15" fill="none" stroke-width="4" stroke-linecap="round" transform="rotate(-90 19 19)"/></svg>';
  return span;
}

/** An element whose text follows the chosen language. */
function i18nEl(tag, className, key) {
  const node = el(tag, className);
  node.dataset.i18n = key;
  node.textContent = t(key);
  return node;
}

// ---- the video link, and the button that opens it

function siteOf(url) {
  let host;
  try {
    host = new URL(String(url)).hostname.toLowerCase();
  } catch {
    return 'other';
  }
  const is = (d) => host === d || host.endsWith(`.${d}`);
  if (is('youtube.com') || is('youtu.be') || is('youtube-nocookie.com')) return 'youtube';
  if (is('tiktok.com')) return 'tiktok';
  if (is('instagram.com') || is('instagr.am')) return 'instagram';
  if (is('facebook.com') || is('fb.watch') || is('fb.com')) return 'facebook';
  if (is('twitter.com') || is('x.com') || host === 't.co') return 'twitter';
  return 'other';
}

/** "Open on YouTube", "Open on TikTok"... or "Open in browser" for any other site. */
function openLabel(url) {
  const site = siteOf(url);
  return site === 'other' ? t('details.openBrowser') : t('details.open', { site: t(`site.${site}`) });
}

function copyButton(text, labelKey) {
  const b = el('button', 'btn ghost icon-only');
  b.type = 'button';
  b.dataset.i18nAria = labelKey;
  b.dataset.i18nTitle = labelKey;
  b.setAttribute('aria-label', t(labelKey));
  b.title = t(labelKey);
  b.append(icon('copy', 14, 2));
  b.addEventListener('click', async () => {
    await copyText(text);
    b.replaceChildren(icon('check', 14, 2.6));
    setTimeout(() => b.replaceChildren(icon('copy', 14, 2)), 1200);
  });
  return b;
}

/** What opens under a card's "Details": the video link, the saved file, and (failed) yt-dlp's own words. */
function detailsPanel({ url, file, raw }) {
  const panel = el('div', 'job-panel');
  if (url) {
    panel.append(i18nEl('p', 'kv-label', 'details.link'));
    const value = el('div', 'kv-value', url);
    value.title = url;
    const row = el('div', 'kv-row kv-actions');
    const open = el('button', 'btn small outline');
    open.type = 'button';
    open.dataset.openUrl = url;
    open.append(icon('external', 14, 2.2), el('span', 'lbl', openLabel(url)));
    open.addEventListener('click', () => api.openLink(url));
    row.append(open, copyButton(url, 'details.copyLink'));
    panel.append(value, row);
  }
  if (file) {
    panel.append(i18nEl('p', 'kv-label', 'details.file'));
    const value = el('div', 'kv-value', file);
    value.title = file;
    panel.append(value);
  }
  if (raw) {
    panel.append(i18nEl('p', 'kv-label', 'details.raw'), el('pre', null, raw));
    const copy = i18nEl('button', 'btn ghost small', 'job.copyDetails');
    copy.type = 'button';
    copy.addEventListener('click', async () => {
      await copyText(raw);
      copy.textContent = t('job.copied');
      setTimeout(() => { copy.textContent = t('job.copyDetails'); }, 1500);
    });
    panel.append(copy);
  }
  return panel;
}

/** The "Details" link with its small arrow. `quiet` = grey, for secondary links like Dismiss. */
function moreButton(key, quiet) {
  const b = el('button', quiet ? 'job-more quiet' : 'job-more');
  b.type = 'button';
  b.append(i18nEl('span', null, key), icon('chevron', 12, 2.6));
  return b;
}

/** Open or close a card's Details box. `info` = { el, more, url, file, raw, panel }. */
function toggleDetails(info, force) {
  const open = force !== undefined ? force : info.more.getAttribute('aria-expanded') !== 'true';
  info.more.setAttribute('aria-expanded', String(open));
  if (info.panel) { info.panel.remove(); info.panel = null; }
  if (open) {
    info.panel = detailsPanel({ url: info.url, file: info.file, raw: info.raw });
    info.el.appendChild(info.panel);
  }
}

// ---- download cards

function setJobStatus(job, fn) {
  job.statusFn = fn;
  job.status.textContent = fn();
}

/** running | waiting | queued | done | error | cancelled: drives the colors and the round icon. */
function setJobState(job, name) {
  job.el.classList.remove('running', 'waiting', 'queued', 'done', 'error', 'cancelled');
  job.el.classList.add(name);
  const kind = { running: 'ring', waiting: 'clock', queued: 'list', done: 'check', error: 'alert', cancelled: 'x' }[name];
  if (job.iconKind === kind) return;
  job.iconKind = kind;
  job.ico.replaceChildren(kind === 'ring' ? ringIcon() : icon(kind));
  job.ring = job.ico.querySelector('.ring');
}

function addJobCard(id, meta, queued) {
  const li = el('li', 'job');
  const ico = el('div', 'job-ico');
  const top = el('div', 'job-top');
  top.append(el('p', 'job-title', meta.title), el('span', 'chip', chipText(meta.mode, meta.quality, meta.clip)));
  const status = el('p', 'job-status');
  const bar = el('div', 'bar');
  bar.appendChild(el('span'));
  const body = el('div', 'job-body');
  body.append(top, status, bar);

  const action = i18nButton('job.cancel', 'btn ghost small');
  const more = moreButton('job.details');
  const side = el('div', 'job-side');
  side.append(action, more);
  const main = el('div', 'job-main');
  main.append(ico, body, side);
  li.append(main);
  li.title = meta.title;

  const job = { el: li, ico, bar, status, action, side, more, meta, url: meta.url, file: null, raw: null, panel: null, statusFn: null, finished: false, iconKind: null, ring: null };
  action.addEventListener('click', () => {
    action.disabled = true;
    job.cancelling = true; // from now on ignore late progress from the dying download
    setJobStatus(job, () => t('job.cancelling'));
    api.cancel(id);
  });
  more.addEventListener('click', () => toggleDetails(job));

  setJobState(job, queued ? 'queued' : 'running');
  bar.classList.toggle('indeterminate', !queued);
  setJobStatus(job, () => t(queued ? 'job.queued' : 'job.starting'));

  $('jobList').prepend(li);
  state.jobs.set(id, job);
  refreshCounts();
}

function onJobEvent(ev) {
  const job = state.jobs.get(ev.id);
  if (!job || job.cancelling) return;

  if (ev.type === 'started') {
    // its turn came: it was waiting in line
    setJobState(job, 'running');
    job.bar.classList.add('indeterminate');
    setJobStatus(job, () => t('job.starting'));
  } else if (ev.type === 'progress') {
    setJobState(job, 'running'); // also brings the ring back after a bot-check wait
    const percent = ev.percent;
    if (percent !== null) {
      job.bar.classList.remove('indeterminate');
      job.bar.firstChild.style.width = `${percent}%`;
      if (job.ring) {
        job.ring.classList.remove('spin');
        job.ring.querySelector('.ring-fg').style.strokeDashoffset = String(94.25 * (1 - percent / 100));
      }
    } else {
      job.bar.classList.add('indeterminate');
      if (job.ring) job.ring.classList.add('spin');
    }
    setJobStatus(job, () => {
      const parts = [];
      if (job.meta.playlist && ev.index) {
        parts.push(ev.total ? t('job.videoOf', { i: ev.index, n: ev.total }) : t('job.videoN', { i: ev.index }));
      }
      if (percent !== null) parts.push(`${percent.toFixed(1)}%`);
      else parts.push(job.meta.clip ? t('job.cutting') : t('job.downloading'));
      if (ev.speed) parts.push(ev.speed);
      if (ev.eta) parts.push(t('job.left', { eta: ev.eta }));
      return parts.join(' · ');
    });
  } else if (ev.type === 'waiting') {
    // YouTube asked for a bot check: Grabbit waits, then tries again by itself
    setJobState(job, 'waiting');
    setJobStatus(job, () => t('job.botWait', { s: ev.seconds, n: ev.attempt, of: ev.of }));
  } else if (ev.type === 'postprocess' && ev.status === 'started') {
    setJobState(job, 'running');
    job.bar.classList.add('indeterminate');
    if (job.ring) job.ring.classList.add('spin');
    setJobStatus(job, () => t(PP_LABELS[ev.name] || 'pp.finish'));
  }
}

function onJobFinished(res) {
  const job = state.jobs.get(res.id);
  if (!job) return;
  job.bar.classList.remove('indeterminate');
  setJobState(job, res.status);
  job.file = res.files[res.files.length - 1] || null;
  job.raw = res.status === 'error' ? res.details : null;

  const dismiss = moreButton('job.dismiss', true);
  dismiss.lastChild.remove(); // no arrow on Dismiss
  dismiss.addEventListener('click', () => {
    job.el.remove();
    state.jobs.delete(res.id);
    refreshCounts();
  });

  if (res.status === 'done') {
    const n = res.files.length;
    setJobStatus(job, () => {
      let msg = n > 1 ? t('job.doneN', { n }) : t('job.done');
      if (res.skipped) msg += ` · ${t('job.skipped', { n: res.skipped })}`;
      return msg;
    });
    const show = i18nButton('job.showFile', 'btn ghost small');
    show.addEventListener('click', () => {
      if (job.file) api.showFile(job.file);
      else api.openFolder();
    });
    job.side.replaceChildren(show, job.more);
  } else if (res.status === 'error') {
    setJobStatus(job, () => errText(res.errorCode, res.error));
    // Try again: the app repeats the same download and picks up a half-finished file where it stopped
    const retry = i18nButton('job.retry', 'btn small outline');
    retry.addEventListener('click', async () => {
      retry.disabled = true;
      const r = await api.retry(res.id);
      if (!r.ok) {
        retry.disabled = false;
        setJobStatus(job, () => errText(r.code, r.error));
        return;
      }
      job.el.remove();
      state.jobs.delete(res.id);
      addJobCard(r.id, job.meta, r.queued);
    });
    job.side.replaceChildren(retry, job.more, dismiss);
  } else {
    setJobStatus(job, () => t('job.cancelled'));
    job.side.replaceChildren(job.more, dismiss);
  }
  if (job.more.getAttribute('aria-expanded') === 'true') toggleDetails(job, true); // refresh an open box with the final info
  job.finished = true;
  refreshCounts();

  // Tell the user it's finished (they may be in another window)
  if (res.status === 'done' || res.status === 'error') {
    const ok = res.status === 'done';
    if (state.settings.notifyOnDone) {
      const body = ok ? job.meta.title : `${job.meta.title}\n${errText(res.errorCode, res.error)}`;
      api.notify(t(ok ? 'notify.done' : 'notify.failed'), body);
    }
    if (state.settings.soundOnDone) playChime(ok);
  }
}

function refreshCounts() {
  const running = [...state.jobs.values()].filter((j) => !j.finished).length;
  const count = $('activeCount');
  count.textContent = String(running);
  count.classList.toggle('hidden', running === 0);
  $('jobsEmpty').classList.toggle('hidden', state.jobs.size > 0);
}

// ------------------------------------------------------------ history

function renderHistory(history) {
  const list = $('historyList');
  list.textContent = '';
  for (const item of history || []) {
    const file = item.files && item.files[item.files.length - 1];
    const li = el('li', 'job history done');
    const ico = el('div', 'job-ico');
    ico.append(icon('check'));
    const top = el('div', 'job-top');
    top.append(el('p', 'job-title', item.title), el('span', 'chip', chipText(item.mode, item.quality, false)));
    const body = el('div', 'job-body');
    body.append(top, el('p', 'job-status', new Date(item.at).toLocaleString()));

    const side = el('div', 'job-side');
    if (file) {
      const show = i18nButton('job.showFile', 'btn ghost small');
      show.addEventListener('click', async () => {
        const found = await api.showFile(file);
        if (!found) {
          show.removeAttribute('data-i18n');
          show.textContent = t('job.fileGone');
        }
      });
      side.append(show);
    }
    const more = moreButton('job.details');
    side.append(more);
    const main = el('div', 'job-main');
    main.append(ico, body, side);
    li.append(main);
    li.title = item.title;

    const info = { el: li, more, url: item.url, file, raw: null, panel: null };
    more.addEventListener('click', () => toggleDetails(info));
    list.appendChild(li);
  }
  const empty = !history || history.length === 0;
  $('historyEmpty').classList.toggle('hidden', !empty);
  $('clearHistory').classList.toggle('hidden', empty);
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.tab === name));
  $('tab-active').classList.toggle('hidden', name !== 'active');
  $('tab-history').classList.toggle('hidden', name !== 'history');
}

// ------------------------------------------------------------ yt-dlp status

function onYtDlpStatus(s) {
  state.ytdlp = s;
  state.ytdlpBusy = s.state === 'checking' && !s.quiet; // the quiet check at launch never blocks Grab
  $('updateBtn').disabled = s.state === 'checking';
  renderYtDlp();
}

function renderYtDlp() {
  const s = state.ytdlp;
  const label = $('ytdlpStatus');
  $('grabBtn').disabled = state.ytdlpBusy;
  $('grabBtn').textContent = state.ytdlpBusy ? t('grab.getting') : t('grab.go');
  if (!s) {
    label.textContent = t('ytdlp.starting');
    return;
  }
  const v = s.version ? ` ${s.version}` : '';
  switch (s.state) {
    case 'checking': label.textContent = t('ytdlp.checking', { v }); break;
    case 'updated': label.textContent = t('ytdlp.updated', { v: s.version }); break;
    case 'ok': label.textContent = t('ytdlp.ok', { v }); break;
    case 'failed': label.textContent = t('ytdlp.failed', { v }); break;
    case 'idle': label.textContent = t('ytdlp.idle', { v }); break;
    default: label.textContent = t('ytdlp.dev', { v });
  }
  // Warnings replace the line: no YouTube helper (Deno), or an old yt-dlp that couldn't be refreshed
  let warn = null;
  if (s.state !== 'checking') {
    if (s.noDeno) warn = t('ytdlp.noDeno');
    else if (s.old && s.state !== 'ok' && s.state !== 'updated') warn = t('ytdlp.old', { v });
  }
  if (warn) label.textContent = warn;
  label.classList.toggle('warn', Boolean(warn));
}

// ------------------------------------------------------------ Grabbit's own updates

function updateLine(u) {
  switch (u.state) {
    case 'checking': return t('upd.checking');
    case 'downloading': return t('upd.downloading', { v: u.version || '', p: u.percent || 0 });
    case 'ready': return t('upd.ready', { v: u.version });
    case 'latest': return t('upd.latest');
    case 'error': return t('upd.error');
    case 'dev': return t('upd.dev');
    case 'notConfigured': return t('upd.notConfigured');
    case 'portableAvailable': return t('upd.portable', { v: u.version });
    default: return '';
  }
}

function renderUpdate() {
  const u = state.update || { state: 'idle' };
  const action = u.state === 'ready' ? 'restart' : u.state === 'portableAvailable' ? 'download' : null;
  const actionLabel = action === 'restart' ? t('upd.restart') : t('upd.download');

  // footer: only shown when there's news (downloading / ready / newer portable)
  const news = u.state === 'downloading' || action;
  $('appUpdate').classList.toggle('hidden', !news);
  $('appUpdateText').textContent = news ? updateLine(u) : '';
  $('appUpdateBtn').classList.toggle('hidden', !action);
  $('appUpdateBtn').textContent = actionLabel;
  $('appUpdateBtn').dataset.action = action || '';

  // settings
  $('updStatus').textContent = updateLine(u);
  $('updActionBtn').classList.toggle('hidden', !action);
  $('updActionBtn').textContent = actionLabel;
  $('updActionBtn').dataset.action = action || '';
  $('updCheckBtn').disabled = u.state === 'checking' || u.state === 'downloading';
}

function runUpdateAction(action) {
  if (action === 'restart') {
    const busy = [...state.jobs.values()].some((j) => !j.finished);
    if (busy && !window.confirm(t('upd.confirmBusy'))) return;
    api.installUpdate();
  } else if (action === 'download') {
    api.openUpdatePage();
  }
}

// ------------------------------------------------------------ language

/** Switch language and redraw everything that was built from text in code. */
function applyLanguage(lang) {
  window.I18N.setLang(lang);       // static text (data-i18n attributes)
  $('helpBody').innerHTML = t('help.body') + (state.discordConfigured ? t('help.discord') : ''); // our own fixed text, never user input
  $('jobsEmptyHint').textContent = t('jobs.emptyHint', { n: state.settings.maxConcurrent });
  renderQualityOptions();
  renderEmbedOption();
  renderPreview();
  renderYtDlp();
  renderUpdate();
  showFormError(state.formError);
  for (const job of state.jobs.values()) if (job.statusFn) job.status.textContent = job.statusFn();
  document.querySelectorAll('[data-open-url] .lbl').forEach((n) => { n.textContent = openLabel(n.parentElement.dataset.openUrl); });
  renderHistory(state.settings.history);
  $('setVersion').textContent = t('set.version', { v: state.appVersion });
}

// ------------------------------------------------------------ modals (How to use, Settings)

let modalReturnFocus = null;
const openModal = () => [$('settingsOverlay'), $('helpOverlay')].find((o) => !o.classList.contains('hidden')) || null;

function showModal(overlay, focusId) {
  modalReturnFocus = document.activeElement;
  overlay.classList.remove('hidden');
  // keep keyboard focus inside the dialog
  document.querySelectorAll('.topbar, .layout, .statusbar').forEach((n) => { n.inert = true; });
  overlay.querySelector('.modal-body').scrollTop = 0;
  $(focusId).focus();
}

function hideModal(overlay) {
  overlay.classList.add('hidden');
  document.querySelectorAll('.topbar, .layout, .statusbar').forEach((n) => { n.inert = false; });
  if (modalReturnFocus && modalReturnFocus.focus) modalReturnFocus.focus();
}

function openHelp() {
  const current = openModal();
  if (current) hideModal(current);
  showModal($('helpOverlay'), 'helpDone');
}

function closeHelp() {
  hideModal($('helpOverlay'));
  if (!state.settings.seenHelp) {
    state.settings.seenHelp = true;
    api.setSettings({ seenHelp: true });
  }
}

/** Light is the default; dark is an explicit switch in Settings (it does not follow Windows). */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === 'dark' ? 'dark' : 'light';
}

function openSettings() {
  const s = state.settings;
  $('langSelect').value = s.language;
  $('themeSelect').value = s.theme;
  $('parallelSelect').value = String(s.maxConcurrent);
  $('notifyChk').checked = s.notifyOnDone;
  $('soundChk').checked = s.soundOnDone;
  $('signinSelect').value = s.cookiesBrowser || '';
  $('autoYtChk').checked = s.autoUpdateYtdlp;
  renderUpdate();
  showModal($('settingsOverlay'), 'settingsDone');
}

function closeSettings() {
  hideModal($('settingsOverlay'));
}

function setSetting(patch) {
  Object.assign(state.settings, patch);
  api.setSettings(patch);
}

function setupModals() {
  // How to use
  $('helpBtn').addEventListener('click', openHelp);
  $('helpClose').addEventListener('click', closeHelp);
  $('helpDone').addEventListener('click', closeHelp);
  $('helpOverlay').addEventListener('mousedown', (e) => { if (e.target === $('helpOverlay')) closeHelp(); });

  // Settings
  $('settingsBtn').addEventListener('click', openSettings);
  $('settingsClose').addEventListener('click', closeSettings);
  $('settingsDone').addEventListener('click', closeSettings);
  $('settingsOverlay').addEventListener('mousedown', (e) => { if (e.target === $('settingsOverlay')) closeSettings(); });

  $('langSelect').addEventListener('change', () => {
    setSetting({ language: $('langSelect').value });
    applyLanguage(state.settings.language);
  });
  $('themeSelect').addEventListener('change', () => {
    setSetting({ theme: $('themeSelect').value });
    applyTheme(state.settings.theme);
  });
  $('parallelSelect').addEventListener('change', () => {
    const n = Number($('parallelSelect').value);
    setSetting({ maxConcurrent: n });
    $('jobsEmptyHint').textContent = t('jobs.emptyHint', { n });
  });
  $('notifyChk').addEventListener('change', () => setSetting({ notifyOnDone: $('notifyChk').checked }));
  $('soundChk').addEventListener('change', () => {
    setSetting({ soundOnDone: $('soundChk').checked });
    if ($('soundChk').checked) playChime(true);
  });
  $('soundTest').addEventListener('click', () => playChime(true));
  $('autoYtChk').addEventListener('change', () => setSetting({ autoUpdateYtdlp: $('autoYtChk').checked }));
  $('signinSelect').addEventListener('change', () => {
    setSetting({ cookiesBrowser: $('signinSelect').value });
    state.infoKey = null; // look the current link up again with the new sign-in
    if ($('url').value.trim()) scheduleLookup(0);
  });
  $('updCheckBtn').addEventListener('click', () => api.checkForUpdates());
  $('updActionBtn').addEventListener('click', () => runUpdateAction($('updActionBtn').dataset.action));
  $('appUpdateBtn').addEventListener('click', () => runUpdateAction($('appUpdateBtn').dataset.action));

  document.addEventListener('keydown', (e) => {
    const current = openModal();
    if (e.key === 'F1') {
      e.preventDefault();
      if (current === $('helpOverlay')) closeHelp();
      else openHelp();
    } else if (e.key === 'Escape' && current) {
      if (current === $('helpOverlay')) closeHelp();
      else closeSettings();
    }
  });

  // Show the guide by itself the very first time Grabbit is opened
  if (!state.settings.seenHelp) openHelp();
}

// ------------------------------------------------------------ setup

async function init() {
  const appState = await api.getState();
  state.settings = appState.settings;
  applyTheme(state.settings.theme);
  state.appVersion = appState.appVersion;
  state.discordConfigured = Boolean(appState.discordConfigured);
  $('discordBtn').classList.toggle('hidden', !state.discordConfigured);
  $('discordBtn').addEventListener('click', () => api.openDiscord());
  state.maxParallel = appState.maxParallel;
  state.update = appState.update || { state: 'idle' };

  $('appVersion').textContent = `Grabbit v${appState.appVersion} · by direk james`;
  $('outputDir').textContent = state.settings.outputDir;
  $('outputDir').title = state.settings.outputDir;
  $('editorFriendly').checked = state.settings.editorFriendly !== false;
  $('saveThumb').checked = Boolean(state.settings.saveThumbnail);

  window.I18N.setLang(state.settings.language);
  setMode(state.settings.mode || 'mp4');
  refreshCounts();
  applyLanguage(state.settings.language);

  if (!appState.tools.ffmpeg) showFormError(() => t('err.ffmpeg'));

  // events from the app
  api.onJobEvent(onJobEvent);
  api.onJobFinished(onJobFinished);
  api.onHistoryChanged((history) => {
    state.settings.history = history;
    renderHistory(history);
  });
  api.onYtDlpStatus(onYtDlpStatus);
  api.onUpdateStatus((u) => {
    state.update = u;
    renderUpdate();
  });

  // link box
  $('url').addEventListener('input', () => scheduleLookup(600));
  $('url').addEventListener('paste', () => scheduleLookup(50));
  $('url').addEventListener('keydown', (e) => { if (e.key === 'Enter') grab(); });
  $('pasteBtn').addEventListener('click', async () => {
    $('url').value = await api.readClipboard();
    scheduleLookup(0);
  });
  $('playlist').addEventListener('change', () => { updateTrimAvailability(); scheduleLookup(0); });
  $('thumb').addEventListener('error', () => $('thumb').removeAttribute('src')); // some sites block hot-linked pictures

  // format + quality
  document.querySelectorAll('.seg').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $('quality').addEventListener('change', () => {
    const key = state.mode === 'mp4' ? 'videoQuality' : 'audioQuality';
    setSetting({ [key]: $('quality').value });
  });
  $('editorFriendly').addEventListener('change', () => setSetting({ editorFriendly: $('editorFriendly').checked }));

  // thumbnails
  $('saveThumb').addEventListener('change', () => setSetting({ saveThumbnail: $('saveThumb').checked }));
  $('embedCover').addEventListener('change', () => {
    const key = state.mode === 'mp3' ? 'embedCoverAudio' : 'embedCoverVideo';
    setSetting({ [key]: $('embedCover').checked });
  });

  // trim
  $('trimEnabled').addEventListener('change', () => {
    $('trimFields').classList.toggle('hidden', !$('trimEnabled').checked);
    if ($('trimEnabled').checked) $('start').focus();
  });

  // folders
  $('changeFolder').addEventListener('click', async () => {
    const dir = await api.chooseFolder(t('dialog.chooseFolder'));
    if (dir) {
      $('outputDir').textContent = dir;
      $('outputDir').title = dir;
    }
  });
  $('openFolder').addEventListener('click', () => api.openFolder());

  // misc
  $('grabBtn').addEventListener('click', grab);
  $('updateBtn').addEventListener('click', () => api.updateYtDlp());
  document.querySelectorAll('.tab').forEach((tab) => tab.addEventListener('click', () => switchTab(tab.dataset.tab)));
  $('clearHistory').addEventListener('click', async () => {
    await api.clearHistory();
    state.settings.history = [];
    renderHistory([]);
  });

  $('url').focus();
  setupModals();
}

init();
