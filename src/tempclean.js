/*
 * Grabbit - clears old work files out of the temp folder
 * Author: direk james
 *
 * Half-finished downloads (.part) stay for a couple of days so "Try again" can
 * pick up where it stopped; anything older is junk. No Electron, so it can be tested.
 */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Delete entries in `dir` that were last changed `maxAgeMs` or more ago (0 = all).
 * `match` (optional regex) limits it to certain names. Returns how many were removed.
 */
function cleanStale(dir, maxAgeMs, { now = Date.now(), match = null } = {}) {
  let names;
  try {
    names = fs.readdirSync(dir);
  } catch {
    return 0; // no temp folder yet
  }
  let removed = 0;
  for (const name of names) {
    if (match && !match.test(name)) continue;
    const p = path.join(dir, name);
    try {
      // maxAgeMs 0 = everything that matches (a new file's timestamp can be a few ms ahead of the clock)
      if (maxAgeMs <= 0 || now - fs.statSync(p).mtimeMs >= maxAgeMs) {
        fs.rmSync(p, { recursive: true, force: true });
        removed++;
      }
    } catch {
      // in use or already gone: leave it for next time
    }
  }
  return removed;
}

module.exports = { cleanStale };
