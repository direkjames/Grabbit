'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'styles.css'), 'utf8');
const block = (selector) => {
  const start = css.indexOf(selector);
  assert.ok(start >= 0, `${selector} block exists`);
  return css.slice(start, css.indexOf('\n}', start));
};
const defined = (text) => new Set([...text.matchAll(/(--[\w-]+)\s*:/g)].map((m) => m[1]));

test('light and dark define exactly the same colors', () => {
  const light = defined(block(':root {'));
  const dark = defined(block(':root[data-theme="dark"] {'));
  for (const name of dark) assert.ok(light.has(name), `${name} is in dark but not light`);
  const darkOnly = [...light].filter((n) => !dark.has(n) && !['--radius', '--font', '--font-display'].includes(n));
  assert.deepEqual(darkOnly, [], 'every color in light also exists in dark');
});

test('every var(--name) in the stylesheet is defined', () => {
  const light = defined(block(':root {'));
  const used = new Set([...css.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]));
  for (const name of used) assert.ok(light.has(name), `${name} is used but never defined`);
});

test('the fonts the stylesheet loads are bundled in the app', () => {
  const files = [...css.matchAll(/url\("(fonts\/[^"]+)"\)/g)].map((m) => m[1]);
  assert.ok(files.length >= 3);
  for (const f of files) assert.ok(fs.existsSync(path.join(__dirname, '..', 'renderer', f)), `${f} exists`);
});

test('the window never loads anything from the internet', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'index.html'), 'utf8');
  assert.ok(!/(href|src)="https?:/i.test(html));
  assert.ok(!/@import|https?:\/\//.test(css));
});
