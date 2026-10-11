/*
 * Grabbit - main process
 * Author: direk james
 *
 * Owns the window, the bundled tools (yt-dlp, ffmpeg, deno), settings,
 * download jobs, and yt-dlp's self-update.
 */
'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell, Menu, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn, execFile } = require('child_process');
const yt = require('./src/ytdlp-args');

const IS_WIN = process.platform === 'win32';
const exeName = (name) => (IS_WIN ? `${name}.exe` : name);

let win = null;
let tools = null;
let settings = null;
const jobs = new Map();
let nextJobId = 1;
let updating = false;

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
    send('ytdlp:status', { state: 'idle', version: await ytdlpVersion(), note: 'Self-update not available in dev mode' });
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

// ---------------------------------------------------------------- settings

function settingsFile() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function defaultOutputDir() {
  return path.join(app.getPath('downloads'), 'Grabbit');
}

function loadSettings() {
  const defaults = {
    outputDir: defaultOutputDir(),
    mode: 'mp4',
    videoQuality: '1080',
    audioQuality: '320',
    editorFriendly: true,
    history: [],
  };
  try {
    const saved = JSON.parse(fs.readFileSync(settingsFile(), 'utf8'));
    settings = { ...defaults, ...saved };
    if (!Array.isArray(settings.history)) settings.history = [];
  } catch {
    settings = defaults;
  }
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
    execFile('taskkill', ['/pid', String(proc.pid), '/T', '/F'], { windowsHide: true }, () => {});
  } else {
    proc.kill('SIGTERM');
  }
}

function startDownload(opts) {
  const args = yt.buildDownloadArgs(opts, tools);
  fs.mkdirSync(opts.outputDir, { recursive: true });

  const id = nextJobId++;
  const job = {
    id,
    title: opts.title || opts.url,
    url: opts.url,
    mode: opts.mode,
    quality: opts.quality,
    playlist: Boolean(opts.playlist),
    files: [],
    errors: [],
    cancelled: false,
    proc: null,
  };
  jobs.set(id, job);

  const proc = spawn(tools.ytdlpPath, args, { windowsHide: true, env: runEnv() });
  job.proc = proc;

  const handleChunk = (buffered) => {
    let buf = buffered.value;
    let idx;
    while ((idx = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      const ev = yt.parseLine(line);
      if (!ev) continue;
      if (ev.type === 'file') job.files.push(ev.path);
      if (ev.type === 'error') job.errors.push(ev.message);
      send('job:event', { id, ...ev });
    }
    buffered.value = buf;
  };

  const outBuf = { value: '' };
  const errBuf = { value: '' };
  proc.stdout.setEncoding('utf8');
  proc.stderr.setEncoding('utf8');
  proc.stdout.on('data', (d) => { outBuf.value += d; handleChunk(outBuf); });
  proc.stderr.on('data', (d) => { errBuf.value += d; handleChunk(errBuf); });

  proc.on('error', (err) => {
    job.errors.push(`Could not start yt-dlp: ${err.message}`);
  });

  proc.on('close', (code) => {
    // flush any last partial line
    outBuf.value += '\n';
    errBuf.value += '\n';
    handleChunk(outBuf);
    handleChunk(errBuf);

    let status;
    if (job.cancelled) status = 'cancelled';
    else if (code === 0 || (job.playlist && job.files.length > 0)) status = 'done';
    else status = 'error';

    const result = {
      id,
      status,
      files: job.files,
      error: status === 'error' ? (job.errors[job.errors.length - 1] || `yt-dlp exited with code ${code}`) : null,
      skipped: job.playlist ? job.errors.length : 0,
    };
    send('job:finished', result);

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
  });

  return id;
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
  }));

  ipcMain.handle('settings:set', (_e, patch) => {
    const allowed = ['mode', 'videoQuality', 'audioQuality', 'editorFriendly'];
    for (const key of allowed) {
      if (patch && Object.prototype.hasOwnProperty.call(patch, key)) settings[key] = patch[key];
    }
    saveSettings();
    return true;
  });

  ipcMain.handle('dialog:chooseFolder', async () => {
    const res = await dialog.showOpenDialog(win, {
      title: 'Choose where Grabbit saves files',
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

  ipcMain.handle('clipboard:read', () => clipboard.readText().trim().slice(0, 2048));

  ipcMain.handle('yt:info', async (_e, { url, playlist }) => {
    const args = yt.buildInfoArgs({ url, playlist }, tools);
    return new Promise((resolve) => {
      execFile(
        tools.ytdlpPath,
        args,
        { windowsHide: true, timeout: 120000, maxBuffer: 64 * 1024 * 1024, env: runEnv() },
        (err, stdout, stderr) => {
          if (err) {
            const errLine = String(stderr).split(/\r?\n/).reverse().find((l) => l.startsWith('ERROR:'));
            const message = errLine
              ? yt.friendlyError(errLine.slice(6).trim())
              : err.code === 'ENOENT'
                ? 'yt-dlp is missing. Reinstall Grabbit.'
                : 'Could not read that link.';
            resolve({ ok: false, error: message });
            return;
          }
          try {
            resolve({ ok: true, info: yt.summarizeInfo(JSON.parse(stdout)) });
          } catch {
            resolve({ ok: false, error: 'Could not read the video info.' });
          }
        },
      );
    });
  });

  ipcMain.handle('yt:download', async (_e, opts) => {
    try {
      const trim = opts.trimEnabled ? yt.validateTrim(opts.start, opts.end, opts.duration) : null;
      const id = startDownload({
        url: opts.url,
        title: opts.title,
        mode: opts.mode,
        quality: opts.quality,
        editorFriendly: Boolean(opts.editorFriendly),
        playlist: Boolean(opts.playlist),
        trim,
        outputDir: settings.outputDir,
        tempDir: path.join(app.getPath('userData'), 'temp'),
      });
      return { ok: true, id };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('yt:cancel', (_e, id) => {
    const job = jobs.get(id);
    if (!job) return false;
    job.cancelled = true;
    killTree(job.proc);
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
}

// ---------------------------------------------------------------- window

function createWindow() {
  win = new BrowserWindow({
    width: 980,
    height: 820,
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
  });

  app.on('before-quit', () => {
    for (const job of jobs.values()) {
      job.cancelled = true;
      killTree(job.proc);
    }
  });

  app.on('window-all-closed', () => app.quit());
}
