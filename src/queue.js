/*
 * Grabbit - download queue
 * Author: direk james
 *
 * Runs at most `limit()` jobs at once; the rest wait in line, first come first
 * served. Knows nothing about yt-dlp or Electron, so it can be unit-tested.
 */
'use strict';

class JobQueue {
  /**
   * @param {{ limit: () => number, onStart: (job: {id: number}) => void }} options
   *   `limit` is read every time, so changing the setting takes effect at once.
   */
  constructor({ limit, onStart }) {
    this.limit = limit;
    this.onStart = onStart;
    this.waiting = [];
    this.running = new Set();
  }

  /** Add a job. Returns 'running' if it started right away, else 'waiting'. */
  enqueue(job) {
    this.waiting.push(job);
    this.pump();
    return this.running.has(job.id) ? 'running' : 'waiting';
  }

  /** Take a job out of the line before it starts. True if it was waiting. */
  remove(id) {
    const i = this.waiting.findIndex((j) => j.id === id);
    if (i === -1) return false;
    this.waiting.splice(i, 1);
    return true;
  }

  /** A running job ended (finished, failed or cancelled): free its slot. */
  finish(id) {
    if (this.running.delete(id)) this.pump();
  }

  /** Start waiting jobs while there is room. Safe to call any time. */
  pump() {
    const max = Math.max(1, Number(this.limit()) || 1);
    while (this.running.size < max && this.waiting.length > 0) {
      const job = this.waiting.shift();
      this.running.add(job.id);
      this.onStart(job);
    }
  }

  /** 1 = next in line. 0 if the job isn't waiting. */
  position(id) {
    return this.waiting.findIndex((j) => j.id === id) + 1;
  }
}

module.exports = { JobQueue };
