/*
 * Grabbit - check that a downloaded tool is the one the publisher released
 * Author: direk james
 *
 * `npm run fetch-bins` downloads yt-dlp.exe and deno.exe from their official
 * GitHub releases. Each release publishes a SHA-256 checksum, so a file that was
 * tampered with or cut short on the way is refused instead of being bundled.
 */
'use strict';

const crypto = require('node:crypto');

const sha256 = (buffer) => crypto.createHash('sha256').update(buffer).digest('hex');

/**
 * Pull the expected hash out of a published checksum file. Understands both
 * "<hash>  yt-dlp.exe" lines (yt-dlp's SHA2-256SUMS) and a lone hash anywhere
 * in the text (Deno's .sha256sum). `fileName` picks the right line when there are several.
 */
function expectedHash(text, fileName) {
  const lines = String(text).split(/\r?\n/);
  if (fileName) {
    const line = lines.find((l) => {
      const parts = l.trim().split(/\s+/);
      return /^[0-9a-f]{64}$/i.test(parts[0]) && parts[parts.length - 1].replace(/^\*/, '') === fileName;
    });
    if (line) return line.trim().slice(0, 64).toLowerCase();
  }
  const m = String(text).match(/\b[0-9a-f]{64}\b/i);
  return m ? m[0].toLowerCase() : null;
}

module.exports = { sha256, expectedHash };
