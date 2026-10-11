/*
 * Grabbit - tests for the download queue
 * Run: npm test
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { JobQueue } = require('../src/queue');

function make(limit) {
  const started = [];
  const ctl = { limit };
  const q = new JobQueue({ limit: () => ctl.limit, onStart: (job) => started.push(job.id) });
  return { q, started, ctl };
}

test('starts up to the limit, the rest wait in order', () => {
  const { q, started } = make(2);
  assert.equal(q.enqueue({ id: 1 }), 'running');
  assert.equal(q.enqueue({ id: 2 }), 'running');
  assert.equal(q.enqueue({ id: 3 }), 'waiting');
  assert.equal(q.enqueue({ id: 4 }), 'waiting');
  assert.deepEqual(started, [1, 2]);
  assert.equal(q.position(3), 1);
  assert.equal(q.position(4), 2);
});

test('a finished job hands its slot to the next one in line', () => {
  const { q, started } = make(1);
  q.enqueue({ id: 1 });
  q.enqueue({ id: 2 });
  q.enqueue({ id: 3 });
  q.finish(1);
  assert.deepEqual(started, [1, 2]);
  q.finish(2);
  assert.deepEqual(started, [1, 2, 3]);
});

test('finishing twice or finishing an unknown job does nothing', () => {
  const { q, started } = make(1);
  q.enqueue({ id: 1 });
  q.enqueue({ id: 2 });
  q.finish(1);
  q.finish(1);
  q.finish(99);
  assert.deepEqual(started, [1, 2]);
  assert.equal(q.running.size, 1);
});

test('a waiting job can be removed; a running one cannot', () => {
  const { q, started } = make(1);
  q.enqueue({ id: 1 });
  q.enqueue({ id: 2 });
  q.enqueue({ id: 3 });
  assert.equal(q.remove(2), true);
  assert.equal(q.remove(1), false); // already running
  q.finish(1);
  assert.deepEqual(started, [1, 3]);
});

test('raising the limit lets waiting jobs start straight away', () => {
  const { q, started, ctl } = make(1);
  q.enqueue({ id: 1 });
  q.enqueue({ id: 2 });
  q.enqueue({ id: 3 });
  ctl.limit = 3;
  q.pump();
  assert.deepEqual(started, [1, 2, 3]);
});

test('lowering the limit never stops running jobs, it just holds new ones back', () => {
  const { q, started, ctl } = make(3);
  q.enqueue({ id: 1 });
  q.enqueue({ id: 2 });
  q.enqueue({ id: 3 });
  ctl.limit = 1;
  q.enqueue({ id: 4 });
  q.finish(1);
  q.finish(2);
  assert.deepEqual(started, [1, 2, 3]); // 4 still waits: job 3 is the one allowed to run
  q.finish(3);
  assert.deepEqual(started, [1, 2, 3, 4]);
});

test('a nonsense limit still lets one job run', () => {
  const { q, started, ctl } = make(0);
  ctl.limit = undefined;
  q.enqueue({ id: 1 });
  assert.deepEqual(started, [1]);
});
