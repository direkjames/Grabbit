/*
 * Grabbit - main process
 * Author: direk james
 *
 * Owns the window, the bundled tools (yt-dlp, ffmpeg, deno), settings,
 * the download queue, notifications, and the self-updates of yt-dlp and of
 * Grabbit itself.
 */
'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell, Menu, clipboard, Notification, nativeTheme, screen, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execFile, execFileSync } = require('child_process');
const yt = require('./src/ytdlp-args');
const { JobQueue } = require('./src/queue');
const { DEFAULTS, MAX_PARALLEL, sanitizePatch, sanitizeHistory, languageForLocale } = require('./src/settings-schema');
const updateConfig = require('./src/update-config');
const { discordUrl } = require('./src/links');
const { isNewer, fetchLatestVersion } = require('./src/updates');
const pacing = require('./src/pacing');
const health = require('./src/health');
const { cleanStale } = require('./src/tempclean');
const { createLog } = require('./src/applog');
const { saveJson, loadJson } = require('./src/json-file');
const { fitBounds } = require('./src/windowstate');
const { pathToFileURL } = require('url');

const IS_WIN = process.platform === 'win32';
const IS_PORTABLE = Boolean(process.env.PORTABLE_EXECUTABLE_DIR); // the "Portable" .exe
const exeName = (name) => (IS_WIN ? `${name}.exe` : name);

let win = null;
let tools = null;
let settings = null;
const jobs = new Map();
let nextJobId = 1;
let updating = false;
let lastYoutubeStart = 0; // when the latest YouTube download was allowed to start (see pacing.js)
const infoCache = new Map(); // link -> { json, at }: the preview's raw info, reused by the download
const failedOpts = new Map(); // job id -> the download's options, so "Try again" can repeat it
let ytdlpVer = null; // last known yt-dlp version, for the "Details" text
const DAY_MS = 24 * 60 * 60 * 1000;
const THEME_BG = { light: '#f6f3ee', dark: '#1b1916' }; // the window's color before the page loads
const queue = new JobQueue({ limit: () => settings.maxConcurrent, onStart: runJob });

// A small log in %APPDATA%\Grabbit\logs for things that go wrong inside the app (no links, no personal data).
let logger = null;
const log = {
  info: (m) => (logger ||= createLog(path.join(app.getPath('userData'), 'logs'))).info(m),
  warn: (m) => (logger ||= createLog(path.join(app.getPath('userData'), 'logs'))).warn(m),
  error: (m, err) => (logger ||= createLog(path.join(app.getPath('userData'), 'logs'))).error(m, err),
};
// A stray error must be written down, not silently kill or freeze the app.
process.on('uncaughtException', (err) => log.error('uncaughtException', err));
process.on('unhandledRejection', (err) => log.error('unhandledRejection', err));

const RENDERER_INDEX = path.join(__dirname, 'renderer', 'index.html');
const RENDERER_URL = pathToFileURL(RENDERER_INDEX).href;

// ---------------------------------------------------------------- tools

function bundledBinDir() {
  return app.isPackaged ? path.join(process.resourcesPath, 'bin') : path.join(__dirname, 'bin');
}

function userBinDir() {
  return path.join(app.getPath('userData'), 'bin');
}

function resolveFfmpeg() {
  try {
    let p = require('ffmpeg-static');
    if (!p) return null;
    // Inside the packaged app, ffmpeg lives in app.asar.unpacked (asar can't run executables)
    p = p.replace(/app\.asar([\\/])/, 'app.asar.unpacked$1');
    return fs.existsSync(p) ? p : null;
  } catch {
    return null;
  }
}

/**
 * yt-dlp is copied from the app's resources to the user's AppData folder on
 * first launch. That copy is writable, so `yt-dlp -U` can update it even when
 * the app is installed in Program Files.
 */
function resolveYtDlp() {
  const bundled = path.join(bundledBinDir(), exeName('yt-dlp'));
  const userCopy = path.join(userBinDir(), exeName('yt-dlp'));
  try {
    if (!fs.existsSync(userCopy) && fs.existsSync(bundled)) {
      fs.mkdirSync(userBinDir(), { recursive: true });
      fs.copyFileSync(bundled, userCopy);
    }
  } catch (err) {
    log.error('Could not copy yt-dlp', err);
  }
  if (fs.existsSync(userCopy)) return { path: userCopy, updatable: true };
  if (fs.existsSync(bundled)) return { path: bundled, updatable: false };
  return { path: exeName('yt-dlp'), updatable: false, fromPath: true }; // dev fallback: system PATH
}

function resolveDeno() {
  const bundled = path.join(bundledBinDir(), exeName('deno'));
  return fs.existsSync(bundled) ? bundled : null; // null -> yt-dlp looks for deno on PATH itself
}

function loadTools() {
  const ytdlp = resolveYtDlp();
  tools = {
    ytdlpPath: ytdlp.path,
    ytdlpUpdatable: ytdlp.updatable,
    ffmpegPath: resolveFfmpeg(),
    denoPath: resolveDeno(),
  };
}

function runEnv() {
  return { ...process.env, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1' };
}

function ytdlpVersion() {
  return new Promise((resolve) => {
    execFile(tools.ytdlpPath, ['--version'], { windowsHide: true, timeout: 20000, env: runEnv() }, (err, out) => {
      if (!err) ytdlpVer = String(out).trim();
      resolve(err ? null : ytdlpVer);
    });
  });
}

/** What the footer shows about yt-dlp. `old` and `noDeno` drive the warnings. */
function ytStatus(state, version, extra = {}) {
  return { state, version, old: health.isOldVersion(version), noDeno: !tools.denoPath, ...extra };
}

/** A download or lookup must not start while yt-dlp.exe is being replaced. */
async function waitWhileUpdating() {
  for (let i = 0; updating && i < 240; i++) await new Promise((r) => setTimeout(r, 250));
}

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

/** `auto` = the quiet check at launch: it never greys out the Grab button. */
async function updateYtDlp(auto = false) {
  if (updating) return;
  if (!tools.ytdlpUpdatable) {
    send('ytdlp:status', ytStatus('dev', await ytdlpVersion()));
    return;
  }
  updating = true;
  send('ytdlp:status', ytStatus('checking', await ytdlpVersion(), { quiet: auto }));
  execFile(tools.ytdlpPath, ['-U'], { windowsHide: true, timeout: 120000, env: runEnv() }, async (err, stdout, stderr) => {
    const text = `${stdout}\n${stderr}`;
    const version = await ytdlpVersion();
    updating = false;
    let state = 'ok';
    if (/Updated yt-dlp to/i.test(text)) state = 'updated';
    else if (err && !/up to date/i.test(text)) state = 'failed';
    if (state !== 'failed') {
      settings.ytdlpCheckedAt = Date.now();
      saveSettings();
    }
    send('ytdlp:status', ytStatus(state, version));
  });
}

/** At launch: update quietly, at most twice a day, unless the user turned it off. */
async function startupYtDlpCheck() {
  const recent = Date.now() - settings.ytdlpCheckedAt < DAY_MS / 2;
  if (settings.autoUpdateYtdlp && !recent) return updateYtDlp(true);
  send('ytdlp:status', ytStatus(settings.autoUpdateYtdlp ? 'ok' : 'idle', await ytdlpVersion()));
}

// ---------------------------------------------------------------- Grabbit's own updates

/*
 * Installed version (Setup .exe): electron-updater downloads the new version
 * from GitHub Releases in the background and installs it when Grabbit closes
 * (or right away when the user clicks "Restart to update").
 * Portable version: it can't replace itself, so it only checks GitHub for a
 * newer version and offers a link to the download page.
 */
let updateState = { state: 'idle' };
let updater = null;
let updateBusy = false;

function setUpdate(next) {
  updateState = next;
  send('update:status', next);
}

function loadUpdater() {
  if (updater) return updater;
  try {
    updater = require('electron-updater').autoUpdater;
  } catch (err) {
    log.error('electron-updater is not installed', err);
    return null;
  }
  const { config } = updateConfig;
  updater.setFeedURL({ provider: 'github', owner: config.owner, repo: config.repo });
  updater.autoDownload = true;
  updater.autoInstallOnAppQuit = true; // also installs when the user simply closes Grabbit
  updater.on('checking-for-update', () => setUpdate({ state: 'checking' }));
  updater.on('update-available', (info) => setUpdate({ state: 'downloading', version: info.version, percent: 0 }));
  updater.on('update-not-available', () => setUpdate({ state: 'latest' }));
  updater.on('download-progress', (p) => {
    setUpdate({ state: 'downloading', version: updateState.version, percent: Math.round(p.percent) });
  });
  updater.on('update-downloaded', (info) => setUpdate({ state: 'ready', version: info.version }));
  updater.on('error', (err) => {
    log.error('Update error', err);
    setUpdate({ state: 'error' });
  });
  return updater;
}

async function checkForUpdates() {
  if (updateBusy || updateState.state === 'downloading' || updateState.state === 'ready') return;
  if (!app.isPackaged) return setUpdate({ state: 'dev' });
  if (!updateConfig.isConfigured()) return setUpdate({ state: 'notConfigured' });

  updateBusy = true;
  try {
    if (IS_PORTABLE) {
      setUpdate({ state: 'checking' });
      const { config } = updateConfig;
      const latest = await fetchLatestVersion(config.owner, config.repo);
      if (latest && isNewer(latest, app.getVersion())) setUpdate({ state: 'portableAvailable', version: latest });
      else setUpdate({ state: 'latest' });
    } else {
      const u = loadUpdater();
      if (!u) setUpdate({ state: 'error' });
      else await u.checkForUpdates();
    }
  } catch (err) {
    log.error('Update check failed', err);
    setUpdate({ state: 'error' });
  } finally {
    updateBusy = false;
  }
}

// ---------------------------------------------------------------- settings

function settingsFile() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function defaultOutputDir() {
  return path.join(app.getPath('downloads'), 'Grabbit');
}

function loadSettings() {
  const loaded = loadJson(settingsFile());
  const saved = loaded.data;
  if (loaded.note) log.warn(`settings: ${loaded.note}`);
  settings = {
    ...DEFAULTS,
    language: languageForLocale(app.getLocale()),
    ...sanitizePatch(saved), // a damaged or edited settings file can't break anything
    outputDir: typeof saved.outputDir === 'string' && saved.outputDir ? saved.outputDir : defaultOutputDir(),
    history: sanitizeHistory(saved.history),
  };
}

function saveSettings() {
  try {
    fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
    saveJson(settingsFile(), settings);
  } catch (err) {
    log.error('Could not save settings', err);
  }
}

function addHistory(entry) {
  settings.history.unshift(entry);
  settings.history = settings.history.slice(0, 50);
  saveSettings();
}

// ---------------------------------------------------------------- jobs

/** Same as killTree but waits for it, for the moment Grabbit is closing (the app must not exit first). */
function killTreeSync(proc) {
  if (!proc || proc.exitCode !== null) return;
  try {
    if (IS_WIN) execFileSync('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { windowsHide: true, timeout: 5000, stdio: 'ignore' });
    else proc.kill('SIGTERM');
  } catch {
    try { proc.kill(); } catch { /* already gone */ }
  }
}

function killTree(proc) {
  if (!proc || proc.exitCode !== null) return;
  if (IS_WIN) {
    // yt-dlp starts ffmpeg as a child; /T kills the whole tree
    execFile('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { windowsHide: true }, (err) => {
      if (err && proc.exitCode === null) proc.kill(); // taskkill failed: stop at least the main process
    });
  } else {
    proc.kill('SIGTERM');
  }
}

/** Windows taskbar button: filled by the running downloads' average, or "busy" while none has a percentage yet. */
function updateTaskbar() {
  if (!win || win.isDestroyed()) return;
  const running = [...queue.running].map((id) => jobs.get(id)).filter(Boolean);
  if (running.length === 0) return win.setProgressBar(-1);
  const known = running.map((j) => j.percent).filter((p) => p !== null && p !== undefined);
  if (known.length === 0) return win.setProgressBar(2, { mode: 'indeterminate' });
  win.setProgressBar(Math.min(1, known.reduce((a, b) => a + b, 0) / known.length / 100));
}

/** Validate and register a download. It starts now, or waits in line if the limit is reached. */
function createJob(opts) {
  const args = yt.buildDownloadArgs(opts, tools); // throws on a bad link, time range, etc.
  fs.mkdirSync(opts.outputDir, { recursive: true });

  const id = nextJobId++;
  const job = {
    id,
    args,
    // If the saved preview can't be used (expired stream links...), the job retries from the link
    fallbackArgs: opts.infoFile ? yt.buildDownloadArgs({ ...opts, infoFile: null }, tools) : null,
    infoFile: opts.infoFile || null,
    botTries: 0,
    opts: { ...opts, infoFile: null }, // kept for "Try again"
    raw: [], // yt-dlp's own messages, shown under "Details" if the download fails
    percent: null,
    solverFailed: false,
    cancelWait: null, // set while the job is only waiting (pause between YouTube jobs, bot-check wait)
    title: opts.title || opts.url,
    url: opts.url,
    mode: opts.mode,
    quality: opts.quality,
    playlist: Boolean(opts.playlist),
    files: [],
    errors: [], // { message, code }
    cancelled: false,
    ended: false,
    proc: null,
  };
  jobs.set(id, job);
  const state = queue.enqueue(job);
  return { id, queued: state === 'waiting', position: queue.position(id) };
}

/** Called by the queue when a job's turn comes. */
function runJob(job) {
  const { id } = job;
  send('job:event', { id, type: 'started' });
  updateTaskbar();

  const outBuf = { value: '' };
  const errBuf = { value: '' };

  const handleChunk = (buffered, isErr = false) => {
    let buf = buffered.value;
    let idx;
    while ((idx = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (isErr && line.trim()) {
        job.raw.push(line.trim().slice(0, 2000)); // yt-dlp's own words, kept for "Details"
        if (job.raw.length > 80) job.raw.shift();
      }
      if (yt.SOLVER_FAIL.test(line)) job.solverFailed = true;
      const ev = yt.parseLine(line);
      if (!ev) continue;
      if (ev.type === 'file') job.files.push(ev.path);
      if (ev.type === 'error') job.errors.push({ message: ev.message, code: ev.code });
      if (ev.type === 'progress') {
        job.percent = ev.percent;
        updateTaskbar();
      }
      if (!job.cancelled) send('job:event', { id, ...ev }); // after Cancel, stray progress must not bring the card back to life
    }
    buffered.value = buf.length > 65536 ? buf.slice(-4096) : buf; // a process that never ends a line can't fill memory
  };

  // Runs exactly once per job, however the process ends.
  const end = (code) => {
    if (job.ended) return;
    job.ended = true;

    // flush any last partial line
    outBuf.value += '\n';
    errBuf.value += '\n';
    handleChunk(outBuf);
    handleChunk(errBuf, true);

    let status;
    if (job.cancelled) status = 'cancelled';
    else if (code === 0 || (job.playlist && job.files.length > 0)) status = 'done';
    else status = 'error';

    let lastError = job.errors[job.errors.length - 1];
    // If YouTube's challenge helper failed, say that instead of yt-dlp's vague "format not available"
    if (status === 'error' && job.solverFailed && !(lastError && lastError.code === 'bot')) {
      lastError = { code: 'solver', message: yt.classifyError('challenge solving failed').message };
    }

    // Try again instead of failing: from the link if the saved preview didn't work, or after
    // a pause if YouTube asked for a bot check. The job keeps its slot in the queue meanwhile.
    const retry = status === 'error' ? pacing.nextRetry(job, lastError) : null;
    if (retry) {
      if (retry.dropInfo) {
        fs.unlink(job.infoFile, () => {});
        job.infoFile = null;
        job.args = job.fallbackArgs;
      }
      if (retry.bot) {
        job.botTries++;
        send('job:event', { id, type: 'waiting', seconds: Math.round(retry.wait / 1000), attempt: job.botTries, of: pacing.BOT_RETRIES });
      }
      job.ended = false;
      job.proc = null;
      job.errors = [];
      job.files = [];
      job.percent = null;
      job.solverFailed = false;
      updateTaskbar();
      later(retry.wait);
      return;
    }
    if (job.infoFile) fs.unlink(job.infoFile, () => {});

    if (status === 'error') {
      failedOpts.set(id, job.opts); // lets "Try again" repeat it; the half-done .part file in temp is resumed
      if (failedOpts.size > 20) failedOpts.delete(failedOpts.keys().next().value);
    }
    send('job:finished', {
      id,
      status,
      files: job.files,
      error: status === 'error' ? (lastError ? lastError.message : `yt-dlp exited with code ${code}`) : null,
      errorCode: status === 'error' && lastError ? lastError.code : null,
      details: status === 'error'
        ? health.buildDetails({ appVersion: app.getVersion(), ytdlpVersion: ytdlpVer, url: job.url, code, lines: job.raw })
        : null,
      skipped: job.playlist ? job.errors.length : 0,
    });

    if (status === 'done') {
      addHistory({
        title: job.title,
        url: job.url,
        mode: job.mode,
        quality: job.quality,
        files: job.files,
        at: new Date().toISOString(),
      });
      send('history:changed', settings.history);
    }
    jobs.delete(id);
    queue.finish(id); // frees the slot and starts the next waiting download
    updateTaskbar();
  };

  job.forceEnd = () => end(-1);

  const launch = () => {
    job.cancelWait = null;
    if (updating) return later(500); // yt-dlp.exe is being replaced: wait a moment
    outBuf.value = '';
    errBuf.value = '';
    let proc;
    try {
      proc = spawn(tools.ytdlpPath, job.args, { windowsHide: true, env: runEnv() });
    } catch (err) {
      job.errors.push({ message: `Could not start yt-dlp: ${err.message}`, code: 'startFail' });
      end(-1);
      return;
    }
    job.proc = proc;
    if (job.cancelled) killTree(proc); // cancelled in the instant before it started

    proc.stdout.setEncoding('utf8');
    proc.stderr.setEncoding('utf8');
    proc.stdout.on('data', (d) => { outBuf.value += d; handleChunk(outBuf); });
    proc.stderr.on('data', (d) => { errBuf.value += d; handleChunk(errBuf, true); });

    proc.on('error', (err) => {
      job.errors.push({ message: `Could not start yt-dlp: ${err.message}`, code: 'startFail' });
      if (proc.pid === undefined) end(-1); // it never started, so 'close' may never come
    });
    proc.on('close', (code) => end(code));
  };

  // Start after `ms` (0 = now). Cancel during the wait ends the job at once (see yt:cancel).
  function later(ms) {
    if (ms <= 0) return launch();
    const timer = setTimeout(launch, ms);
    job.cancelWait = () => { clearTimeout(timer); job.cancelWait = null; end(-1); };
  }

  // YouTube downloads start a few seconds apart; other sites start right away.
  if (yt.detectSite(job.url) === 'youtube') {
    const startAt = pacing.youtubeStartAt(Date.now(), lastYoutubeStart);
    lastYoutubeStart = startAt;
    later(startAt - Date.now());
  } else {
    launch();
  }
}

// ---------------------------------------------------------------- IPC

/** True only when the message comes from Grabbit's own page (never from anything else a window might load). */
function trusted(e) {
  const url = e && e.senderFrame && e.senderFrame.url ? String(e.senderFrame.url).split(/[?#]/)[0] : '';
  return url === RENDERER_URL;
}

function registerIpc() {
  const handle = (channel, fn) => ipcMain.handle(channel, (e, ...args) => {
    if (!trusted(e)) {
      log.warn(`ignored a message on "${channel}" from an unexpected page`);
      return null;
    }
    return fn(e, ...args);
  });

  handle('app:getState', async () => ({
    appVersion: app.getVersion(),
    settings: { ...settings },
    tools: {
      ytdlp: Boolean(tools.ytdlpPath),
      ffmpeg: Boolean(tools.ffmpegPath),
      deno: Boolean(tools.denoPath),
    },
    platform: process.platform,
    maxParallel: MAX_PARALLEL,
    portable: IS_PORTABLE,
    update: updateState,
    discordConfigured: Boolean(discordUrl()),
  }));

  handle('settings:set', (_e, patch) => {
    const clean = sanitizePatch(patch);
    Object.assign(settings, clean);
    saveSettings();
    if ('maxConcurrent' in clean) queue.pump(); // a higher limit lets waiting downloads start now
    if ('theme' in clean) applyTheme(); // the title bar and window color follow the app's own light/dark switch
    return true;
  });

  handle('dialog:chooseFolder', async (_e, title) => {
    const res = await dialog.showOpenDialog(win, {
      title: typeof title === 'string' ? title.slice(0, 120) : 'Choose where Grabbit saves files',
      defaultPath: settings.outputDir,
      properties: ['openDirectory', 'createDirectory'],
    });
    if (res.canceled || !res.filePaths[0]) return null;
    settings.outputDir = res.filePaths[0];
    saveSettings();
    return settings.outputDir;
  });

  handle('shell:openFolder', async () => {
    fs.mkdirSync(settings.outputDir, { recursive: true });
    return shell.openPath(settings.outputDir);
  });

  handle('shell:showFile', async (_e, filePath) => {
    if (typeof filePath === 'string' && filePath.length < 1000 && path.isAbsolute(filePath) && fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
      return true;
    }
    return false;
  });

  // Electron 44+ makes clipboard reads return a Promise; Promise.resolve works with both old and new.
  handle('clipboard:read', async () => String((await Promise.resolve(clipboard.readText())) || '').trim().slice(0, 2048));

  // A desktop notification when a grab finishes. Only shown while Grabbit is in the
  // background (in the foreground the download card already says it), and the taskbar
  // button flashes until the user comes back. Grabbit plays its own chime, so the
  // notification itself is silent.
  handle('notify:show', (_e, payload) => {
    if (!settings.notifyOnDone || !win || win.isDestroyed() || win.isFocused()) return false;
    const { title, body } = payload || {};
    win.flashFrame(true);
    if (!Notification.isSupported()) return false;
    const n = new Notification({
      title: String(title || 'Grabbit').slice(0, 100),
      body: String(body || '').slice(0, 200),
      silent: true,
    });
    n.on('click', () => {
      if (win.isMinimized()) win.restore();
      win.show();
      win.focus();
    });
    n.show();
    return true;
  });

  handle('yt:info', async (_e, payload) => {
    const { url, playlist } = payload && typeof payload === 'object' ? payload : {};
    let args;
    try {
      args = yt.buildInfoArgs({ url, playlist, cookiesBrowser: settings.cookiesBrowser }, tools);
    } catch (err) {
      return { ok: false, error: err.message, code: err.code || null };
    }
    await waitWhileUpdating();
    return new Promise((resolve) => {
      execFile(
        tools.ytdlpPath,
        args,
        { windowsHide: true, timeout: 120000, maxBuffer: 64 * 1024 * 1024, env: runEnv() },
        (err, stdout, stderr) => {
          if (err) {
            const lines = String(stderr).split(/\r?\n/).filter(Boolean);
            const details = health.buildDetails({ appVersion: app.getVersion(), ytdlpVersion: ytdlpVer, url, code: err.code, lines });
            const errLine = [...lines].reverse().find((l) => l.startsWith('ERROR:'));
            let fail;
            if (errLine) fail = yt.classifyError(errLine.slice(6).trim());
            else if (err.code === 'ENOENT') fail = { code: 'ytdlpMissing', message: 'yt-dlp is missing. Reinstall Grabbit.' };
            else fail = { code: 'readFail', message: 'Could not read that link.' };
            // If YouTube's challenge helper failed, say that instead of yt-dlp's vague wording
            if (yt.SOLVER_FAIL.test(stderr) && fail.code !== 'bot' && fail.code !== 'ytdlpMissing') {
              fail = yt.classifyError('challenge solving failed');
            }
            resolve({ ok: false, error: fail.message, code: fail.code, details });
            return;
          }
          try {
            const info = yt.summarizeInfo(JSON.parse(stdout), url);
            // Keep a single YouTube video's raw info so the download can skip a second lookup
            if (info.kind === 'video' && info.site === 'youtube' && !info.isLive && stdout.length < 8 * 1024 * 1024) {
              infoCache.set(url.trim(), { json: stdout, at: Date.now() });
              if (infoCache.size > 5) infoCache.delete(infoCache.keys().next().value);
            }
            resolve({ ok: true, info });
          } catch {
            resolve({ ok: false, error: 'Could not read the video info.', code: 'infoFail' });
          }
        },
      );
    });
  });

  handle('yt:download', async (_e, opts) => {
    try {
      const trim = opts.trimEnabled ? yt.validateTrim(opts.start, opts.end, opts.duration) : null;
      const tempDir = path.join(app.getPath('userData'), 'temp');
      let infoFile = null;
      const cached = infoCache.get(String(opts.url).trim());
      infoCache.delete(String(opts.url).trim()); // one use: stream links in it expire
      if (cached && !opts.playlist && Date.now() - cached.at < pacing.INFO_MAX_AGE_MS) {
        try {
          fs.mkdirSync(tempDir, { recursive: true });
          infoFile = path.join(tempDir, `info-${Date.now()}.json`);
          fs.writeFileSync(infoFile, cached.json);
        } catch {
          infoFile = null; // can't save it: the download just asks YouTube itself
        }
      }
      const created = createJob({
        infoFile,
        url: opts.url,
        title: opts.title,
        mode: opts.mode,
        quality: opts.quality,
        editorFriendly: Boolean(opts.editorFriendly),
        playlist: Boolean(opts.playlist),
        saveThumbnail: Boolean(opts.saveThumbnail),
        embedCover: Boolean(opts.embedCover),
        cookiesBrowser: settings.cookiesBrowser,
        trim,
        outputDir: settings.outputDir,
        tempDir,
      });
      return { ok: true, ...created };
    } catch (err) {
      return { ok: false, error: err.message, code: err.code || null };
    }
  });

  handle('yt:retry', (_e, id) => {
    const opts = failedOpts.get(id);
    if (!opts) return { ok: false, error: 'Could not try again. Paste the link again.', code: null };
    try {
      // today's folder and sign-in settings, in case they changed since
      const created = createJob({ ...opts, outputDir: settings.outputDir, cookiesBrowser: settings.cookiesBrowser });
      failedOpts.delete(id);
      return { ok: true, ...created };
    } catch (err) {
      return { ok: false, error: err.message, code: err.code || null };
    }
  });

  handle('yt:cancel', (_e, id) => {
    const job = jobs.get(id);
    if (!job) return false;
    job.cancelled = true;
    if (queue.remove(id)) {
      // It never started: just drop it from the line
      job.ended = true;
      jobs.delete(id);
      send('job:finished', { id, status: 'cancelled', files: [], error: null, errorCode: null, skipped: 0 });
    } else if (job.cancelWait) {
      job.cancelWait(); // only waiting, no process yet: end it now and free the slot
    } else {
      killTree(job.proc);
      // Safety net: if the process is still alive a few seconds later, force it, and finally free the slot.
      const proc = job.proc;
      setTimeout(() => { if (!job.ended && proc) killTree(proc); }, 3000).unref();
      setTimeout(() => {
        if (!job.ended && proc) { try { proc.kill('SIGKILL'); } catch { /* already gone */ } job.forceEnd?.(); }
      }, 8000).unref();
    }
    return true;
  });

  handle('history:clear', () => {
    settings.history = [];
    saveSettings();
    return true;
  });

  handle('ytdlp:update', () => {
    updateYtDlp();
    return true;
  });

  handle('update:check', () => {
    checkForUpdates();
    return true;
  });

  handle('update:install', () => {
    if (updateState.state !== 'ready' || !updater) return false;
    updater.quitAndInstall(true, true); // silent install, then reopen Grabbit
    return true;
  });

  // "Open on YouTube" under a card's Details: only real web links, opened in the user's browser
  handle('link:open', (_e, url) => {
    try {
      const u = new URL(String(url));
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
      shell.openExternal(u.href);
      return true;
    } catch {
      return false;
    }
  });

  handle('link:discord', () => {
    const url = discordUrl(); // always our own fixed link, never one sent from the window
    if (!url) return false;
    shell.openExternal(url);
    return true;
  });

  handle('update:openPage', () => {
    if (!updateConfig.isConfigured()) return false;
    shell.openExternal(updateConfig.releasesUrl());
    return true;
  });
}

// ---------------------------------------------------------------- window

/** Light or dark for the title bar and the window background (the page colors itself). */
function applyTheme() {
  nativeTheme.themeSource = settings.theme === 'dark' ? 'dark' : 'light';
  if (win && !win.isDestroyed()) win.setBackgroundColor(THEME_BG[settings.theme] || THEME_BG.light);
}

const WINDOW_DEFAULTS = { width: 980, height: 860, minWidth: 720, minHeight: 640 };
const windowFile = () => path.join(app.getPath('userData'), 'window.json');

function createWindow() {
  const saved = loadJson(windowFile()).data;
  const bounds = fitBounds(saved, screen.getAllDisplays().map((d) => d.workArea), WINDOW_DEFAULTS);
  win = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    ...(bounds.x !== undefined ? { x: bounds.x, y: bounds.y } : {}),
    minWidth: WINDOW_DEFAULTS.minWidth,
    minHeight: WINDOW_DEFAULTS.minHeight,
    backgroundColor: THEME_BG[settings.theme] || THEME_BG.light,
    title: 'Grabbit',
    icon: path.join(__dirname, 'build', 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: !app.isPackaged, // no developer tools in the shipped app
    },
  });
  if (bounds.maximized) win.maximize();

  win.once('ready-to-show', () => win.show());
  win.on('focus', () => win.flashFrame(false));
  win.loadFile(RENDERER_INDEX);

  // Remember size and place (saved a moment after the last change, and when closing)
  let saveTimer = null;
  const saveBounds = () => {
    if (!win || win.isDestroyed()) return;
    try {
      saveJson(windowFile(), { ...win.getNormalBounds(), maximized: win.isMaximized() });
    } catch (err) {
      log.error('Could not save the window position', err);
    }
  };
  const later = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveBounds, 600); };
  win.on('resize', later);
  win.on('move', later);
  win.on('close', saveBounds);

  // If the page itself crashes, say so in the log and bring it back once instead of leaving a blank window
  let reloaded = false;
  win.webContents.on('render-process-gone', (_e, details) => {
    log.error(`the window's page stopped (${details.reason}, code ${details.exitCode})`);
    if (!reloaded && details.reason !== 'clean-exit' && win && !win.isDestroyed()) {
      reloaded = true;
      win.reload();
    }
  });
}

/** Rules for every web page Electron creates, so nothing can navigate away, open windows, or ask for permissions. */
function lockDownWebContents() {
  app.on('web-contents-created', (_e, contents) => {
    contents.on('will-attach-webview', (e) => e.preventDefault());
    contents.on('will-navigate', (e) => e.preventDefault()); // never navigate away from the app
    contents.setWindowOpenHandler(({ url }) => {
      if (/^https:\/\//i.test(url)) shell.openExternal(url); // real web links open in the user's browser
      return { action: 'deny' };
    });
  });
  // The window needs nothing from the system except copying text to the clipboard
  const allowed = (permission) => permission === 'clipboard-sanitized-write';
  session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => callback(allowed(permission)));
  session.defaultSession.setPermissionCheckHandler((_wc, permission) => allowed(permission));
}

// The shipped app can't be steered from the outside: no remote debugging or inspector switches.
const DEBUG_SWITCHES = ['remote-debugging-port', 'remote-debugging-pipe', 'inspect', 'inspect-brk', 'inspect-port'];
const debugRequested = app.isPackaged && DEBUG_SWITCHES.some((name) => app.commandLine.hasSwitch(name));

if (debugRequested || !app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    if (IS_WIN) app.setAppUserModelId('com.direkjames.grabbit');
    Menu.setApplicationMenu(null);
    lockDownWebContents();
    app.on('child-process-gone', (_e, details) => log.error(`a helper process stopped (${details.type}: ${details.reason})`));
    loadSettings();
    loadTools();
    cleanStale(path.join(app.getPath('userData'), 'temp'), 2 * DAY_MS); // leftovers from old crashes or cancels
    registerIpc();
    applyTheme();
    createWindow();
    // Check for a newer yt-dlp a moment after launch (YouTube changes often)
    setTimeout(startupYtDlpCheck, 1500);
    // ...and for a newer Grabbit a little later, then every few hours while it stays open
    setTimeout(checkForUpdates, 6000);
    setInterval(checkForUpdates, 6 * 60 * 60 * 1000).unref();
  });

  app.on('before-quit', () => {
    for (const job of jobs.values()) {
      job.cancelled = true;
      killTreeSync(job.proc);
    }
    // saved previews are only useful for the next few minutes
    cleanStale(path.join(app.getPath('userData'), 'temp'), 0, { match: /^info-.*\.json$/ });
  });

  app.on('window-all-closed', () => app.quit());
}
