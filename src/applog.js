/*
 * Grabbit - the app's own small log file
 * Author: direk james
 *
 * Things that go wrong inside the app (a crash, a settings file that could not
 * be read, an update that failed) go here, because a packaged app has no console.
 * Kept small on purpose: one file of at most 1 MB plus one older copy, lines cut
 * at 8 KB, and no personal data (links and your user folder are scrubbed).
 * No Electron imports, so `npm test` can check it.
 */
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const MAX_BYTES = 1024 * 1024;
const MAX_LINE = 8 * 1024;

/** Remove what is personal before text reaches the log: links and the user's folder. */
function scrub(text, home = os.homedir()) {
  let s = String(text);
  if (home) s = s.split(home).join('%USERPROFILE%').split(home.replace(/\\/g, '/')).join('%USERPROFILE%');
  return s.replace(/https?:\/\/\S+/gi, '[link]');
}

function createLog(dir, name = 'grabbit.log') {
  const file = path.join(dir, name);
  let size = null;

  function write(level, message) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      if (size === null) size = fs.existsSync(file) ? fs.statSync(file).size : 0;
      let line = `${new Date().toISOString()} ${level} ${scrub(message).replace(/\r?\n/g, ' | ')}`;
      if (line.length > MAX_LINE) line = `${line.slice(0, MAX_LINE)}…`;
      line += '\n';
      if (size + line.length > MAX_BYTES) {
        try { fs.renameSync(file, `${file}.1`); } catch { /* the old copy is just replaced next time */ }
        size = 0;
      }
      fs.appendFileSync(file, line);
      size += line.length;
    } catch {
      // logging must never be the thing that crashes the app
    }
  }

  const describe = (err) => (err && err.stack ? err.stack : String(err));
  return {
    file,
    info: (m) => write('INFO', m),
    warn: (m) => write('WARN', m),
    error: (m, err) => write('ERROR', err === undefined ? m : `${m}: ${describe(err)}`),
  };
}

module.exports = { createLog, scrub, MAX_BYTES, MAX_LINE };
