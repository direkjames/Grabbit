'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { ytdlpAgeDays, isOldVersion, buildDetails } = require('../src/health');
const { cleanStale } = require('../src/tempclean');
const yt = require('../src/ytdlp-args');

const NOW = Date.UTC(2026, 10, 14); // 2026-11-14

test('yt-dlp age comes from its date-style version', () => {
  assert.equal(ytdlpAgeDays('2026.11.04', NOW), 10);
  assert.equal(ytdlpAgeDays('2026.10.26.232815', NOW), 19); // nightly builds have a time suffix
  assert.equal(ytdlpAgeDays('not a date', NOW), null);
  assert.equal(ytdlpAgeDays(null, NOW), null);
});

test('a yt-dlp older than 60 days counts as old; unknown versions never warn', () => {
  assert.equal(isOldVersion('2026.09.15', NOW), false); // 60 days
  assert.equal(isOldVersion('2026.09.14', NOW), true); // 61 days
  assert.equal(isOldVersion('garbage', NOW), false);
});

test('Details start with versions and link, then only the last 40 yt-dlp lines', () => {
  const lines = Array.from({ length: 100 }, (_, i) => `line ${i}`);
  const text = buildDetails({ appVersion: '2.0.0', ytdlpVersion: '2026.10.26', url: 'https://youtu.be/x', code: 1, lines });
  const rows = text.split('\n');
  assert.equal(rows[0], 'Grabbit 2.0.0 · yt-dlp 2026.10.26 · exit code 1');
  assert.equal(rows[1], 'Link: https://youtu.be/x');
  assert.equal(rows.length, 3 + 40);
  assert.equal(rows[rows.length - 1], 'line 99');
});

test('the Deno helper failing gets its own message', () => {
  const warning = 'WARNING: [youtube] abc: n challenge solving failed: Some formats may be missing.';
  assert.ok(yt.SOLVER_FAIL.test(warning));
  assert.equal(yt.classifyError('No supported JavaScript runtime could be found').code, 'solver');
  assert.equal(yt.classifyError("Sign in to confirm you're not a bot").code, 'bot'); // not mistaken for it
});

test('stale temp files are removed, fresh ones and other names are kept', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'grabbit-temp-'));
  try {
    const old = path.join(dir, 'old.part');
    const fresh = path.join(dir, 'fresh.part');
    const oldInfo = path.join(dir, 'info-1.json');
    for (const f of [old, fresh, oldInfo]) fs.writeFileSync(f, 'x');
    const longAgo = new Date(Date.now() - 3 * 86400000);
    fs.utimesSync(old, longAgo, longAgo);
    fs.utimesSync(oldInfo, longAgo, longAgo);

    assert.equal(cleanStale(dir, 2 * 86400000), 2);
    assert.deepEqual(fs.readdirSync(dir), ['fresh.part']);

    fs.writeFileSync(path.join(dir, 'info-2.json'), 'x');
    assert.equal(cleanStale(dir, 0, { match: /^info-.*\.json$/ }), 1); // quit-time sweep: only saved previews
    assert.deepEqual(fs.readdirSync(dir), ['fresh.part']);
    assert.equal(cleanStale(path.join(dir, 'missing'), 0), 0);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
