/*
 * Grabbit - tests for the icon helper
 * Run: npm test
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { readPngSize, checkIcon } = require('../scripts/set-icon');

/** Just enough of a PNG (signature + IHDR header) to test the size check. */
function fakePng(width, height) {
  const b = Buffer.alloc(33);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(b, 0);
  b.writeUInt32BE(13, 8);
  b.write('IHDR', 12, 'ascii');
  b.writeUInt32BE(width, 16);
  b.writeUInt32BE(height, 20);
  return b;
}

test('reads the size of a PNG', () => {
  assert.deepEqual(readPngSize(fakePng(512, 512)), { width: 512, height: 512 });
});

test('refuses things that are not PNG pictures', () => {
  assert.throws(() => readPngSize(Buffer.from('GIF89a......................')), /not a PNG/);
  assert.throws(() => readPngSize(Buffer.from('hi')), /not a PNG/);
});

test('refuses non-square and too-small icons, with a clear reason', () => {
  assert.throws(() => checkIcon(fakePng(512, 256)), /square/);
  assert.throws(() => checkIcon(fakePng(128, 128)), /at least 256/);
});

test('accepts good sizes and gives advice for borderline ones', () => {
  assert.deepEqual(checkIcon(fakePng(512, 512)).advice, []);
  assert.deepEqual(checkIcon(fakePng(1024, 1024)).advice, []);
  assert.equal(checkIcon(fakePng(256, 256)).advice.length, 1);
  assert.equal(checkIcon(fakePng(4096, 4096)).advice.length, 1);
});

test('the icons that ship with Grabbit pass their own check', () => {
  for (const file of ['build/icon.png', 'renderer/assets/icon.png']) {
    const info = checkIcon(fs.readFileSync(path.join(__dirname, '..', file)));
    assert.ok(info.width >= 256, file);
  }
});
