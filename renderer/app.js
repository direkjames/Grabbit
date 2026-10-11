/*
 * Grabbit - interface logic
 * Author: direk james
 */
'use strict';

const api = window.grabbit;
const $ = (id) => document.getElementById(id);

const QUALITY = {
  mp4: [
    ['best', 'Best available'],
    ['2160', '4K (2160p)'],
    ['1440', '1440p'],
    ['1080', '1080p (Full HD)'],
    ['720', '720p'],
    ['480', '480p'],
    ['360', '360p'],
  ],
  mp3: [
    ['320', '320 kbps (best)'],
    ['256', '256 kbps'],
    ['192', '192 kbps'],
    ['128', '128 kbps (smallest)'],
  ],
};

const PP_LABELS = {
  Merger: 'Joining video and audio…',
  FFmpegMerger: 'Joining video and audio…',
  ExtractAudio: 'Converting audio…',
  FFmpegExtractAudio: 'Converting audio…',
  VideoRemuxer: 'Finishing MP4…',
  FFmpegVideoRemuxer: 'Finishing MP4…',
  Metadata: 'Adding title info…',
  FFmpegMetadata: 'Adding title info…',
  MoveFiles: 'Saving…',
  MoveFilesAfterDownload: 'Saving…',
};

const state = {
  settings: null,
  mode: 'mp4',
  info: null,        // summary of the current link
  infoKey: null,     // url|playlist that `info` belongs to
  infoToken: 0,
  ytdlpBusy: false,
  jobs: new Map(),   // id -> { el, meta }
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

function chipText(mode, quality, clip) {
  let t = mode.toUpperCase();
  if (mode === 'mp4') t += quality === 'best' ? ' BEST' : ` ${quality}p`;
  if (mode === 'mp3') t += ` ${quality}`;
  if (clip) t += ' · CLIP';
  return t;
}

function showFormError(message) {
  const box = $('formError');
  box.textContent = message || '';
  box.classList.toggle('hidden', !message);
}

// ------------------------------------------------------------ format + quality

function setMode(mode) {
  state.mode = mode;
  document.querySelectorAll('.seg').forEach((b) => {
    b.setAttribute('aria-checked', String(b.dataset.mode === mode));
  });
  $('editorRow').classList.toggle('hidden', mode !== 'mp4');
  $('qualityWrap').classList.toggle('hidden', mode === 'wav');
  renderQualityOptions();
  api.setSettings({ mode });
}

function renderQualityOptions() {
  const select = $('quality');
  const mode = state.mode;
  select.textContent = '';
  if (mode === 'wav') return;

  const maxHeight = state.info && state.info.maxHeight;
  const wanted = mode === 'mp4' ? state.settings.videoQuality : state.settings.audioQuality;

  for (const [value, label] of QUALITY[mode]) {
    const opt = el('option', null, label);
    opt.value = value;
    if (mode === 'mp4' && maxHeight && value !== 'best' && Number(value) > maxHeight) {
      opt.disabled = true;
      opt.textContent = `${label} (not available)`;
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

function setPreview(kind, info, message) {
  const box = $('preview');
  const thumb = $('thumb');
  box.className = `preview ${kind}`;
  if (kind === 'ready' && info) {
    $('previewTitle').textContent = info.title;
    const bits = [];
    if (info.kind === 'playlist') bits.push(`Playlist · ${info.count} videos`);
    if (info.channel) bits.push(info.channel);
    if (info.duration) bits.push(fmtDuration(info.duration));
    if (info.maxHeight) bits.push(`up to ${info.maxHeight}p`);
    $('previewMeta').textContent = bits.join(' · ');
    if (info.thumbnail) thumb.src = info.thumbnail;
    else thumb.removeAttribute('src');
  } else {
    thumb.removeAttribute('src');
    $('previewTitle').textContent = kind === 'loading' ? 'Looking up the link…' : 'Paste a link to see the video here';
    $('previewMeta').textContent = message || (kind === 'loading' ? 'This can take a few seconds' : 'YouTube and most other video sites work');
  }
}

let lookupTimer = null;
function scheduleLookup(delay = 500) {
  clearTimeout(lookupTimer);
  lookupTimer = setTimeout(lookup, delay);
}

async function lookup() {
  const url = $('url').value.trim();
  showFormError('');

  const playlistLink = hasPlaylist(url);
  $('playlistRow').classList.toggle('hidden', !playlistLink);
  if (!playlistLink) $('playlist').checked = false;
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
    setPreview('error', null, "That doesn't look like a link");
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
  } else {
    state.info = null;
    setPreview('error', null, res.error);
  }
  renderQualityOptions();
}

function updateTrimAvailability() {
  const playlist = $('playlist').checked;
  $('trimBlock').classList.toggle('hidden', playlist);
}

// ------------------------------------------------------------ grabbing

async function grab() {
  showFormError('');
  const url = $('url').value.trim();
  if (!url) return showFormError('Paste a link first.');
  if (!isHttpUrl(url)) return showFormError("That doesn't look like a link.");
  if (state.info && state.info.isLive) return showFormError("Live streams can't be grabbed while they're live.");

  const playlist = $('playlist').checked;
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
    playlist,
    trimEnabled,
    start: $('start').value,
    end: $('end').value,
    duration: state.info ? state.info.duration : null,
  });
  button.disabled = state.ytdlpBusy;

  if (!res.ok) return showFormError(res.error);

  addJobCard(res.id, { title, mode, quality, clip: trimEnabled, playlist, count: state.info ? state.info.count : null });
  switchTab('active');

  // Ready for the next link
  $('url').value = '';
  $('start').value = '';
  $('end').value = '';
  $('trimEnabled').checked = false;
  $('trimFields').classList.add('hidden');
  $('playlist').checked = false;
  $('playlistRow').classList.add('hidden');
  state.info = null;
  state.infoKey = null;
  setPreview('empty');
  renderQualityOptions();
  updateTrimAvailability();
}

function addJobCard(id, meta) {
  const li = el('li', 'job');
  const top = el('div', 'job-top');
  top.append(el('p', 'job-title', meta.title), el('span', 'chip', chipText(meta.mode, meta.quality, meta.clip)));
  const bar = el('div', 'bar indeterminate');
  bar.appendChild(el('span'));
  const bottom = el('div', 'job-bottom');
  const status = el('span', 'job-status', 'Starting…');
  const action = el('button', 'btn ghost small', 'Cancel');
  action.type = 'button';
  action.addEventListener('click', () => {
    action.disabled = true;
    status.textContent = 'Cancelling…';
    api.cancel(id);
  });
  bottom.append(status, action);
  li.append(top, bar, bottom);
  li.title = meta.title;

  $('jobList').prepend(li);
  state.jobs.set(id, { el: li, bar, status, action, meta });
  refreshCounts();
}

function onJobEvent(ev) {
  const job = state.jobs.get(ev.id);
  if (!job) return;

  if (ev.type === 'progress') {
    const parts = [];
    if (job.meta.playlist && ev.index) parts.push(`Video ${ev.index}${ev.total ? ` of ${ev.total}` : ''}`);
    if (ev.percent !== null) {
      job.bar.classList.remove('indeterminate');
      job.bar.firstChild.style.width = `${ev.percent}%`;
      parts.push(`${ev.percent.toFixed(1)}%`);
    } else {
      job.bar.classList.add('indeterminate');
      parts.push(job.meta.clip ? 'Cutting your clip…' : 'Downloading…');
    }
    if (ev.speed) parts.push(ev.speed);
    if (ev.eta) parts.push(`${ev.eta} left`);
    job.status.textContent = parts.join(' · ');
  } else if (ev.type === 'postprocess' && ev.status === 'started') {
    job.bar.classList.add('indeterminate');
    job.status.textContent = PP_LABELS[ev.name] || 'Finishing up…';
  } else if (ev.type === 'error' && job.meta.playlist) {
    job.lastSkip = ev.message;
  }
}

function onJobFinished(res) {
  const job = state.jobs.get(res.id);
  if (!job) return;
  job.bar.classList.remove('indeterminate');
  job.el.classList.add(res.status);
  job.action.disabled = false;

  if (res.status === 'done') {
    const n = res.files.length;
    let msg = n > 1 ? `Done · ${n} files saved` : 'Done · saved';
    if (res.skipped) msg += ` · ${res.skipped} skipped (private or unavailable)`;
    job.status.textContent = msg;
    const file = res.files[res.files.length - 1];
    const show = el('button', 'btn ghost small', 'Show file');
    show.type = 'button';
    show.addEventListener('click', () => {
      if (file) api.showFile(file);
      else api.openFolder();
    });
    job.action.replaceWith(show);
    job.action = show;
  } else {
    job.status.textContent = res.status === 'cancelled' ? 'Cancelled' : res.error;
    const dismiss = el('button', 'btn ghost small', 'Dismiss');
    dismiss.type = 'button';
    dismiss.addEventListener('click', () => {
      job.el.remove();
      state.jobs.delete(res.id);
      refreshCounts();
    });
    job.action.replaceWith(dismiss);
  }
  job.finished = true;
  refreshCounts();
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
    const li = el('li', 'job history');
    const top = el('div', 'job-top');
    top.append(el('p', 'job-title', item.title), el('span', 'chip', chipText(item.mode, item.quality, false)));
    const bottom = el('div', 'job-bottom');
    const when = new Date(item.at);
    bottom.appendChild(el('span', 'job-status', when.toLocaleString()));
    const file = item.files && item.files[item.files.length - 1];
    if (file) {
      const show = el('button', 'btn ghost small', 'Show file');
      show.type = 'button';
      show.addEventListener('click', async () => {
        const found = await api.showFile(file);
        if (!found) show.textContent = 'File moved or deleted';
      });
      bottom.appendChild(show);
    }
    li.title = item.title;
    li.append(top, bottom);
    list.appendChild(li);
  }
  const empty = !history || history.length === 0;
  $('historyEmpty').classList.toggle('hidden', !empty);
  $('clearHistory').classList.toggle('hidden', empty);
}

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  $('tab-active').classList.toggle('hidden', name !== 'active');
  $('tab-history').classList.toggle('hidden', name !== 'history');
}

// ------------------------------------------------------------ yt-dlp status

function onYtDlpStatus(s) {
  const label = $('ytdlpStatus');
  const v = s.version ? ` ${s.version}` : '';
  state.ytdlpBusy = s.state === 'checking';
  $('updateBtn').disabled = state.ytdlpBusy;
  $('grabBtn').disabled = state.ytdlpBusy;
  $('grabBtn').textContent = state.ytdlpBusy ? 'Getting ready…' : 'Grab it';

  switch (s.state) {
    case 'checking': label.textContent = `yt-dlp${v}: checking for updates…`; break;
    case 'updated': label.textContent = `yt-dlp updated to ${s.version}`; break;
    case 'ok': label.textContent = `yt-dlp${v} · up to date`; break;
    case 'failed': label.textContent = `yt-dlp${v} · couldn't check for updates (offline?)`; break;
    default: label.textContent = `yt-dlp${v}${s.note ? ` · ${s.note}` : ''}`;
  }
}

// ------------------------------------------------------------ setup

async function init() {
  const appState = await api.getState();
  state.settings = appState.settings;
  $('appVersion').textContent = `Grabbit v${appState.appVersion} · by direk james`;
  $('outputDir').textContent = state.settings.outputDir;
  $('outputDir').title = state.settings.outputDir;
  $('editorFriendly').checked = state.settings.editorFriendly !== false;
  setMode(state.settings.mode || 'mp4');
  renderHistory(state.settings.history);
  refreshCounts();

  if (!appState.tools.ffmpeg) {
    showFormError('ffmpeg is missing, so MP3/WAV conversion and HD video won\'t work. Reinstall Grabbit.');
  }

  // events from the app
  api.onJobEvent(onJobEvent);
  api.onJobFinished(onJobFinished);
  api.onHistoryChanged(renderHistory);
  api.onYtDlpStatus(onYtDlpStatus);

  // link box
  $('url').addEventListener('input', () => scheduleLookup(600));
  $('url').addEventListener('paste', () => scheduleLookup(50));
  $('url').addEventListener('keydown', (e) => { if (e.key === 'Enter') grab(); });
  $('pasteBtn').addEventListener('click', async () => {
    $('url').value = await api.readClipboard();
    scheduleLookup(0);
  });
  $('playlist').addEventListener('change', () => { updateTrimAvailability(); scheduleLookup(0); });

  // format + quality
  document.querySelectorAll('.seg').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  $('quality').addEventListener('change', () => {
    const key = state.mode === 'mp4' ? 'videoQuality' : 'audioQuality';
    state.settings[key] = $('quality').value;
    api.setSettings({ [key]: $('quality').value });
  });
  $('editorFriendly').addEventListener('change', () => api.setSettings({ editorFriendly: $('editorFriendly').checked }));

  // trim
  $('trimEnabled').addEventListener('change', () => {
    $('trimFields').classList.toggle('hidden', !$('trimEnabled').checked);
    if ($('trimEnabled').checked) $('start').focus();
  });

  // folders
  $('changeFolder').addEventListener('click', async () => {
    const dir = await api.chooseFolder();
    if (dir) {
      $('outputDir').textContent = dir;
      $('outputDir').title = dir;
    }
  });
  $('openFolder').addEventListener('click', () => api.openFolder());

  // misc
  $('grabBtn').addEventListener('click', grab);
  $('updateBtn').addEventListener('click', () => api.updateYtDlp());
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => switchTab(t.dataset.tab)));
  $('clearHistory').addEventListener('click', async () => {
    await api.clearHistory();
    renderHistory([]);
  });

  $('url').focus();
}

init();
