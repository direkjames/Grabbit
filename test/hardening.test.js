/*
 * Grabbit - tests for the safety code: app log, safe JSON files, window place,
 * saved history, download checksums.
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { createLog, scrub, MAX_BYTES, MAX_LINE } = require('../src/applog');
const { saveJson, loadJson } = require('../src/json-file');
const { fitBounds } = require('../src/windowstate');
const { sanitizeHistory } = require('../src/settings-schema');
const { sha256, expectedHash } = require('../scripts/checksum');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'grabbit-hard-'));
const done = (dir) => fs.rmSync(dir, { recursive: true, force: true });

// ---------------------------------------------------------------- app log

test('the log scrubs links and the user folder', () => {
  assert.equal(scrub('failed for https://youtu.be/abc?si=secret now', 'C:\\Users\\me'), 'failed for [link] now');
  assert.equal(scrub('C:\\Users\\me\\Downloads\\x.mp4', 'C:\\Users\\me'), '%USERPROFILE%\\Downloads\\x.mp4');
  assert.equal(scrub('C:/Users/me/AppData', 'C:\\Users\\me'), '%USERPROFILE%/AppData');
});

test('the log cuts long lines, rolls at 1 MB and keeps only one older copy', () => {
  const dir = tmp();
  try {
    const log = createLog(dir);
    log.error('boom', new Error('x'.repeat(20000)));
    const first = fs.readFileSync(log.file, 'utf8');
    assert.ok(first.length <= MAX_LINE + 100, 'one line is cut near 8 KB');
    assert.ok(first.endsWith('\n') && first.split('\n').length === 2, 'newlines inside a message become one line');

    const big = 'y'.repeat(7000);
    for (let i = 0; i < Math.ceil((MAX_BYTES * 2.2) / 7000); i++) log.info(big);
    assert.ok(fs.statSync(log.file).size <= MAX_BYTES, 'the current file stays under 1 MB');
    assert.ok(fs.existsSync(`${log.file}.1`), 'the previous file is kept');
    assert.deepEqual(fs.readdirSync(dir).sort(), ['grabbit.log', 'grabbit.log.1'], 'and nothing older piles up');
  } finally {
    done(dir);
  }
});

test('logging never throws, even when the folder cannot be written', () => {
  const dir = tmp();
  try {
    const blocker = path.join(dir, 'file');
    fs.writeFileSync(blocker, 'x');
    const log = createLog(path.join(blocker, 'logs')); // a folder can't be made inside a file
    assert.doesNotThrow(() => log.error('still fine'));
  } finally {
    done(dir);
  }
});

// ---------------------------------------------------------------- safe JSON files

test('saving keeps the last good file as .bak and leaves no temp file', () => {
  const dir = tmp();
  try {
    const file = path.join(dir, 'settings.json');
    saveJson(file, { v: 1 });
    saveJson(file, { v: 2 });
    assert.deepEqual(JSON.parse(fs.readFileSync(file, 'utf8')), { v: 2 });
    assert.deepEqual(JSON.parse(fs.readFileSync(`${file}.bak`, 'utf8')), { v: 1 });
    assert.ok(!fs.existsSync(`${file}.tmp`));
  } finally {
    done(dir);
  }
});

test('a damaged settings file is kept as .corrupt.json and the backup is used', () => {
  const dir = tmp();
  try {
    const file = path.join(dir, 'settings.json');
    saveJson(file, { theme: 'dark' });
    saveJson(file, { theme: 'light' });
    fs.writeFileSync(file, '{ "theme": "dar'); // cut off by a crash
    const loaded = loadJson(file);
    assert.equal(loaded.source, 'backup');
    assert.deepEqual(loaded.data, { theme: 'dark' });
    assert.match(loaded.note, /corrupt/);
    assert.equal(fs.readFileSync(path.join(dir, 'settings.corrupt.json'), 'utf8'), '{ "theme": "dar');
  } finally {
    done(dir);
  }
});

test('a damaged file with no backup starts fresh but says so, and a bad backup is never made', () => {
  const dir = tmp();
  try {
    const file = path.join(dir, 'settings.json');
    fs.writeFileSync(file, 'not json at all');
    const loaded = loadJson(file);
    assert.equal(loaded.source, 'reset');
    assert.deepEqual(loaded.data, {});
    assert.ok(loaded.note);
    saveJson(file, { ok: true }); // the broken file must not become the .bak
    assert.ok(!fs.existsSync(`${file}.bak`));
    assert.deepEqual(loadJson(file).data, { ok: true });
  } finally {
    done(dir);
  }
});

test('first run and a deleted settings file are not treated as damage', () => {
  const dir = tmp();
  try {
    const file = path.join(dir, 'settings.json');
    assert.deepEqual(loadJson(file), { data: {}, source: 'none', note: null });
    saveJson(file, { a: 1 });
    saveJson(file, { a: 2 });
    fs.rmSync(file);
    assert.equal(loadJson(file).source, 'backup'); // the file went missing: use the backup
    fs.writeFileSync(file, '[1,2]'); // valid JSON but not an object
    assert.equal(loadJson(file).source, 'backup');
  } finally {
    done(dir);
  }
});

// ---------------------------------------------------------------- window place

const D = { width: 980, height: 860, minWidth: 720, minHeight: 640 };
const screenA = { x: 0, y: 0, width: 1920, height: 1040 };
const screenB = { x: 1920, y: 0, width: 1280, height: 1024 };

test('the window opens where it was, if that place is still on a screen', () => {
  assert.deepEqual(fitBounds({ x: 100, y: 50, width: 1000, height: 700 }, [screenA], D), { width: 1000, height: 700, maximized: false, x: 100, y: 50 });
  assert.equal(fitBounds({ x: 2000, y: 100, width: 900, height: 700 }, [screenA, screenB], D).x, 2000);
});

test('a place on an unplugged monitor is ignored (the window opens centered)', () => {
  const r = fitBounds({ x: 2000, y: 100, width: 900, height: 700 }, [screenA], D);
  assert.equal(r.x, undefined);
  assert.equal(r.y, undefined);
  assert.equal(r.width, 900);
});

test('nothing saved, nonsense saved, or a huge size all give a usable window', () => {
  assert.deepEqual(fitBounds(undefined, [screenA], D), { width: 980, height: 860, maximized: false });
  assert.deepEqual(fitBounds({ x: 'a', width: NaN, height: null }, [screenA], D), { width: 980, height: 860, maximized: false });
  const big = fitBounds({ width: 99999, height: 99999 }, [screenA], D);
  assert.equal(big.width, 1920);
  assert.equal(big.height, 1040);
  const tiny = fitBounds({ width: 10, height: 10 }, [screenA], D);
  assert.equal(tiny.width, 720);
  assert.equal(tiny.height, 640);
  assert.equal(fitBounds({ maximized: true }, [screenA], D).maximized, true);
});

// ---------------------------------------------------------------- saved history

test('saved history keeps good entries and drops or cuts bad ones', () => {
  const good = { title: 'A video', url: 'https://youtu.be/x', mode: 'mp3', quality: '320', files: ['C:\\a.mp3'], at: '2026-11-14T00:00:00Z' };
  const out = sanitizeHistory([
    good,
    null,
    'text',
    { title: 5, at: 'not a date' },
    { ...good, title: 't'.repeat(900), mode: 'evil', files: ['ok', 7, { x: 1 }] },
    { ...good, title: '', url: 'https://youtu.be/y' },
  ]);
  assert.equal(out.length, 3);
  assert.deepEqual(out[0], good);
  assert.equal(out[1].title.length, 300);
  assert.equal(out[1].mode, 'mp4');
  assert.deepEqual(out[1].files, ['ok']);
  assert.equal(out[2].title, 'https://youtu.be/y');
  assert.deepEqual(sanitizeHistory('nope'), []);
  assert.equal(sanitizeHistory(Array.from({ length: 80 }, () => good)).length, 50);
});

// ---------------------------------------------------------------- checksums

test('checksums: the right hash is picked from yt-dlp and Deno style files, and a changed file is caught', () => {
  const ytdlp = `aaaa${'0'.repeat(60)}  yt-dlp_x86.exe\n${'ab'.repeat(32)}  yt-dlp.exe\n${'cd'.repeat(32)}  yt-dlp_linux\n`;
  assert.equal(expectedHash(ytdlp, 'yt-dlp.exe'), 'ab'.repeat(32));
  const deno = `\nAlgorithm : SHA256\nHash      : ${'EF'.repeat(32)}\n`;
  assert.equal(expectedHash(deno, 'deno-x86_64-pc-windows-msvc.zip'), 'ef'.repeat(32));
  assert.equal(expectedHash('no hash here', 'x'), null);

  const data = Buffer.from('the real file');
  assert.equal(sha256(data), sha256(Buffer.from('the real file')));
  assert.notEqual(sha256(data), sha256(Buffer.from('the real file!')));
  assert.equal(sha256(data).length, 64);
});
