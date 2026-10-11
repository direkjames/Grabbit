/*
 * Grabbit - main process
 * Author: direk james
 *
 * Owns the window, the bundled tools (yt-dlp, ffmpeg, deno), settings,
 * the download queue, notifications, and the self-updates of yt-dlp and of
 * Grabbit itself.
 */
'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell, Menu, clipboard, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execFile } = require('child_process');
const yt = require('./src/ytdlp-args');
const { JobQueue } = require('./src/queue');
const { DEFAULTS, MAX_PARALLEL, sanitizePatch, languageForLocale } = require('./src/settings-schema');
const updateConfig = require('./src/update-config');
const { discordUrl } = require('./src/links');
const { isNewer, fetchLatestVersion } = require('./src/updates');

const IS_WIN = process.platform === 'win32';
const IS_PORTABLE = Boolean(process.env.PORTABLE_EXECUTABLE_DIR); // the "Portable" .exe
const exeName = (name) => (IS_WIN ? `${name}.exe` : name);

let win = null;
let tools = null;
let settings = null;
const jobs = new Map();
let nextJobId = 1;
let updating = false;
const queue = new JobQueue({ limit: () => settings.maxConcurrent, onStart: runJob });

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
    console.error('Could not copy yt-dlp:', err);
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
      resolve(err ? null : String(out).trim());
    });
  });
}

function send(channel, payload) {
  if (win && !win.isDestroyed()) win.webContents.send(channel, payload);
}

async function updateYtDlp() {
  if (updating) return;
  if (!tools.ytdlpUpdatable) {
    send('ytdlp:status', { state: 'dev', version: await ytdlpVersion() });
    return;
  }
  updating = true;
  send('ytdlp:status', { state: 'checking', version: await ytdlpVersion() });
  execFile(tools.ytdlpPath, ['-U'], { windowsHide: true, timeout: 120000, env: runEnv() }, async (err, stdout, stderr) => {
    updating = false;
    const text = `${stdout}\n${stderr}`;
    const version = await ytdlpVersion();
    let state = 'ok';
    if (/Updated yt-dlp to/i.test(text)) state = 'updated';
    else if (err && !/up to date/i.test(text)) state = 'failed';
    send('ytdlp:status', { state, version });
  });
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
    console.error('electron-updater is not installed:', err);
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
    console.error('Update error:', err);
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
    console.error('Update check failed:', err);
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
  let saved = {};
  try {
    saved = JSON.parse(fs.readFileSync(settingsFile(), 'utf8')) || {};
  } catch {
    saved = {};
  }
  settings = {
    ...DEFAULTS,
    language: languageForLocale(app.getLocale()),
    ...sanitizePatch(saved), // a damaged or edited settings file can't break anything
    outputDir: typeof saved.outputDir === 'string' && saved.outputDir ? saved.outputDir : defaultOutputDir(),
    history: Array.isArray(saved.history) ? saved.history : [],
  };
}

function saveSettings() {
  try {
    fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
    const tmp = `${settingsFile()}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(settings, null, 2));
    fs.renameSync(tmp, settingsFile());
  } catch (err) {
    console.error('Could not save settings:', err);
  }
}

function addHistory(entry) {
  settings.history.unshift(entry);
  settings.history = settings.history.slice(0, 50);
  saveSettings();
}

// ---------------------------------------------------------------- jobs

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

/** Validate and register a download. It starts now, or waits in line if the limit is reached. */
function createJob(opts) {
  const args = yt.buildDownloadArgs(opts, tools); // throws on a bad link, time range, etc.
  fs.mkdirSync(opts.outputDir, { recursive: true });

  const id = nextJobId++;
  const job = {
    id,
    args,
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

  const outBuf = { value: '' };
  const errBuf = { value: '' };

  const handleChunk = (buffered) => {
    let buf = buffered.value;
    let idx;
    while ((idx = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      const ev = yt.parseLine(line);
      if (!ev) continue;
      if (ev.type === 'file') job.files.push(ev.path);
      if (ev.type === 'error') job.errors.push({ message: ev.message, code: ev.code });
      if (!job.cancelled) send('job:event', { id, ...ev }); // after Cancel, stray progress must not bring the card back to life
    }
    buffered.value = buf;
  };

  // Runs exactly once per job, however the process ends.
  const end = (code) => {
    if (job.ended) return;
    job.ended = true;

    // flush any last partial line
    outBuf.value += '\n';
    errBuf.value += '\n';
    handleChunk(outBuf);
    handleChunk(errBuf);

    let status;
    if (job.cancelled) status = 'cancelled';
    else if (code === 0 || (job.playlist && job.files.length > 0)) status = 'done';
    else status = 'error';

    const lastError = job.errors[job.errors.length - 1];
    send('job:finished', {
      id,
      status,
      files: job.files,
      error: status === 'error' ? (lastError ? lastError.message : `yt-dlp exited with code ${code}`) : null,
      errorCode: status === 'error' && lastError ? lastError.code : null,
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
  };

  job.forceEnd = () => end(-1);

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
  proc.stderr.on('data', (d) => { errBuf.value += d; handleChunk(errBuf); });

  proc.on('error', (err) => {
    job.errors.push({ message: `Could not start yt-dlp: ${err.message}`, code: 'startFail' });
    if (proc.pid === undefined) end(-1); // it never started, so 'close' may never come
  });
  proc.on('close', (code) => end(code));
}

// ---------------------------------------------------------------- IPC

function registerIpc() {
  ipcMain.handle('app:getState', async () => ({
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

  ipcMain.handle('settings:set', (_e, patch) => {
    const clean = sanitizePatch(patch);
    Object.assign(settings, clean);
    saveSettings();
    if ('maxConcurrent' in clean) queue.pump(); // a higher limit lets waiting downloads start now
    return true;
  });

  ipcMain.handle('dialog:chooseFolder', async (_e, title) => {
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

  ipcMain.handle('shell:openFolder', async () => {
    fs.mkdirSync(settings.outputDir, { recursive: true });
    return shell.openPath(settings.outputDir);
  });

  ipcMain.handle('shell:showFile', async (_e, filePath) => {
    if (typeof filePath === 'string' && fs.existsSync(filePath)) {
      shell.showItemInFolder(filePath);
      return true;
    }
    return false;
  });

  // Electron 44+ makes clipboard reads return a Promise; Promise.resolve works with both old and new.
  ipcMain.handle('clipboard:read', async () => String((await Promise.resolve(clipboard.readText())) || '').trim().slice(0, 2048));

  // A desktop notification when a grab finishes. Only shown while Grabbit is in the
  // background (in the foreground the download card already says it), and the taskbar
  // button flashes until the user comes back. Grabbit plays its own chime, so the
  // notification itself is silent.
  ipcMain.handle('notify:show', (_e, payload) => {
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

  ipcMain.handle('yt:info', async (_e, { url, playlist }) => {
    let args;
    try {
      args = yt.buildInfoArgs({ url, playlist, cookiesBrowser: settings.cookiesBrowser }, tools);
    } catch (err) {
      return { ok: false, error: err.message, code: err.code || null };
    }
    return new Promise((resolve) => {
      execFile(
        tools.ytdlpPath,
        args,
        { windowsHide: true, timeout: 120000, maxBuffer: 64 * 1024 * 1024, env: runEnv() },
        (err, stdout, stderr) => {
          if (err) {
            const errLine = String(stderr).split(/\r?\n/).reverse().find((l) => l.startsWith('ERROR:'));
            if (errLine) {
              const { code, message } = yt.classifyError(errLine.slice(6).trim());
              resolve({ ok: false, error: message, code });
            } else if (err.code === 'ENOENT') {
              resolve({ ok: false, error: 'yt-dlp is missing. Reinstall Grabbit.', code: 'ytdlpMissing' });
            } else {
              resolve({ ok: false, error: 'Could not read that link.', code: 'readFail' });
            }
            return;
          }
          try {
            resolve({ ok: true, info: yt.summarizeInfo(JSON.parse(stdout), url) });
          } catch {
            resolve({ ok: false, error: 'Could not read the video info.', code: 'infoFail' });
          }
        },
      );
    });
  });

  ipcMain.handle('yt:download', async (_e, opts) => {
    try {
      const trim = opts.trimEnabled ? yt.validateTrim(opts.start, opts.end, opts.duration) : null;
      const created = createJob({
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
        tempDir: path.join(app.getPath('userData'), 'temp'),
      });
      return { ok: true, ...created };
    } catch (err) {
      return { ok: false, error: err.message, code: err.code || null };
    }
  });

  ipcMain.handle('yt:cancel', (_e, id) => {
    const job = jobs.get(id);
    if (!job) return false;
    job.cancelled = true;
    if (queue.remove(id)) {
      // It never started: just drop it from the line
      job.ended = true;
      jobs.delete(id);
      send('job:finished', { id, status: 'cancelled', files: [], error: null, errorCode: null, skipped: 0 });
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

  ipcMain.handle('history:clear', () => {
    settings.history = [];
    saveSettings();
    return true;
  });

  ipcMain.handle('ytdlp:update', () => {
    updateYtDlp();
    return true;
  });

  ipcMain.handle('update:check', () => {
    checkForUpdates();
    return true;
  });

  ipcMain.handle('update:install', () => {
    if (updateState.state !== 'ready' || !updater) return false;
    updater.quitAndInstall(true, true); // silent install, then reopen Grabbit
    return true;
  });

  ipcMain.handle('link:discord', () => {
    const url = discordUrl(); // always our own fixed link, never one sent from the window
    if (!url) return false;
    shell.openExternal(url);
    return true;
  });

  ipcMain.handle('update:openPage', () => {
    if (!updateConfig.isConfigured()) return false;
    shell.openExternal(updateConfig.releasesUrl());
    return true;
  });
}

// ---------------------------------------------------------------- window

function createWindow() {
  win = new BrowserWindow({
    width: 980,
    height: 860,
    minWidth: 720,
    minHeight: 640,
    backgroundColor: '#14110f',
    title: 'Grabbit',
    icon: path.join(__dirname, 'build', 'icon.png'),
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
    },
  });

  win.once('ready-to-show', () => win.show());
  win.on('focus', () => win.flashFrame(false));
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Never navigate away from the app; open real web links in the browser
  win.webContents.on('will-navigate', (e) => e.preventDefault());
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

if (!app.requestSingleInstanceLock()) {
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
    loadSettings();
    loadTools();
    registerIpc();
    createWindow();
    // Check for a newer yt-dlp a moment after launch (YouTube changes often)
    setTimeout(updateYtDlp, 1500);
    // ...and for a newer Grabbit a little later, then every few hours while it stays open
    setTimeout(checkForUpdates, 6000);
    setInterval(checkForUpdates, 6 * 60 * 60 * 1000).unref();
  });

  app.on('before-quit', () => {
    for (const job of jobs.values()) {
      job.cancelled = true;
      killTree(job.proc);
    }
  });

  app.on('window-all-closed', () => app.quit());
}
