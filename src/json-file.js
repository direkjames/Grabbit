/*
 * Grabbit - saving and loading small JSON files without ever losing them
 * Author: direk james
 *
 * Saving: write a temporary file, keep the previous good file as ".bak", then
 * swap the new one in, so a crash or power loss can't leave half a file.
 * Loading: if the file can't be read, keep a copy as ".corrupt.json", fall back
 * to the ".bak" and say so, instead of quietly starting from nothing.
 * No Electron imports, so `npm test` can check it.
 */
'use strict';

const fs = require('node:fs');

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

function tryRead(file) {
  try {
    const value = JSON.parse(fs.readFileSync(file, 'utf8'));
    return isObject(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

/** Safely save `data` as JSON at `file`. Throws if the disk write fails (the caller decides what to tell the user). */
function saveJson(file, data) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  if (tryRead(file)) fs.copyFileSync(file, `${file}.bak`); // only a good file becomes the backup
  fs.renameSync(tmp, file);
}

/**
 * Load `file`. Returns { data, source, note }:
 *   source 'file'   it was read normally
 *   source 'none'   nothing saved yet (first run)
 *   source 'backup' the file was damaged and the .bak was used
 *   source 'reset'  the file was damaged and there was no usable backup
 * `note` is a sentence for the log when something went wrong.
 */
function loadJson(file) {
  if (!fs.existsSync(file)) {
    const backup = tryRead(`${file}.bak`);
    return backup ? { data: backup, source: 'backup', note: 'settings file was missing, used the backup' } : { data: {}, source: 'none', note: null };
  }
  const data = tryRead(file);
  if (data) return { data, source: 'file', note: null };
  try { fs.copyFileSync(file, file.replace(/\.json$/i, '') + '.corrupt.json'); } catch { /* keep going without the copy */ }
  const backup = tryRead(`${file}.bak`);
  if (backup) return { data: backup, source: 'backup', note: 'file was damaged, kept a copy as .corrupt.json and used the backup' };
  return { data: {}, source: 'reset', note: 'file was damaged and there was no usable backup, kept a copy as .corrupt.json and started fresh' };
}

module.exports = { saveJson, loadJson };
