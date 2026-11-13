'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { nextRetry, youtubeStartAt, BOT_RETRIES, BOT_WAIT_MS } = require('../src/pacing');

const job = (extra = {}) => ({ cancelled: false, files: [], infoFile: null, botTries: 0, ...extra });

test('YouTube starts are spaced 2-5 seconds apart, the first one is not delayed', () => {
  assert.equal(youtubeStartAt(1000, 0, () => 0.5), 1000);
  assert.equal(youtubeStartAt(1000, 1000, () => 0), 3000);
  assert.equal(youtubeStartAt(1000, 1000, () => 1), 6000);
  assert.equal(youtubeStartAt(20000, 1000, () => 1), 20000); // long idle: no extra wait
});

test('a bot check is retried after a wait, at most BOT_RETRIES times', () => {
  const bot = { code: 'bot' };
  const j = job();
  assert.deepEqual(nextRetry(j, bot), { wait: BOT_WAIT_MS, dropInfo: false, bot: true });
  assert.equal(nextRetry(job({ botTries: BOT_RETRIES }), bot), null);
  assert.equal(nextRetry(j, { code: 'private' }), null);
  assert.equal(nextRetry(j, undefined), null);
});

test('a failed saved preview is retried at once from the link', () => {
  assert.deepEqual(nextRetry(job({ infoFile: 'x.json' }), { code: 'http403' }), { wait: 0, dropInfo: true, bot: false });
});

test('cancelled jobs and jobs that already saved files are never retried', () => {
  assert.equal(nextRetry(job({ cancelled: true }), { code: 'bot' }), null);
  assert.equal(nextRetry(job({ files: ['a.mp4'] }), { code: 'bot' }), null);
});
