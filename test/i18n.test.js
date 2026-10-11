/*
 * Grabbit - tests that every language is complete
 * Run: npm test
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DICT } = require('../renderer/i18n');

const OTHERS = Object.keys(DICT).filter((l) => l !== 'en'); // Filipino, Cebuano, Pirate
const placeholders = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
const tags = (s) => [...String(s).matchAll(/<\/?(\w+)/g)].map((m) => m[1]).join(',');

test('Every other language has every line that English has (and nothing extra)', () => {
  const en = Object.keys(DICT.en).sort();
  for (const lang of OTHERS) {
    const keys = Object.keys(DICT[lang]).sort();
    assert.deepEqual(en.filter((k) => !keys.includes(k)), [], `${lang} is missing lines`);
    assert.deepEqual(keys.filter((k) => !en.includes(k)), [], `${lang} has lines English doesn't`);
  }
});

test('{placeholders} match English in every language', () => {
  for (const lang of OTHERS) {
    for (const key of Object.keys(DICT.en)) {
      assert.equal(placeholders(DICT[lang][key]), placeholders(DICT.en[key]), `${lang}: ${key}`);
    }
  }
});

test('markup inside the lines (bold, lists, guide layout) matches English', () => {
  for (const lang of OTHERS) {
    for (const key of Object.keys(DICT.en)) {
      assert.equal(tags(DICT[lang][key]), tags(DICT.en[key]), `${lang}: ${key}`);
    }
  }
});

test('no line is empty', () => {
  for (const lang of Object.keys(DICT)) {
    for (const [key, text] of Object.entries(DICT[lang])) assert.ok(String(text).trim(), `${lang}: ${key}`);
  }
});

test('every error code the app can send has a message in every language', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'ytdlp-args.js'), 'utf8');
  const codes = new Set([...src.matchAll(/(?:GrabError\(|^\s*\[)'(\w+)'/gm)].map((m) => m[1]));
  for (const extra of ['ytdlpMissing', 'readFail', 'infoFail', 'startFail']) codes.add(extra);
  assert.ok(codes.size > 15);
  for (const lang of Object.keys(DICT)) {
    for (const code of codes) assert.ok(DICT[lang][`e.${code}`], `${lang}: no message for error code "${code}"`);
  }
});

test('every data-i18n key used in the window exists', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'index.html'), 'utf8');
  const keys = [...html.matchAll(/data-i18n(?:-html|-title|-placeholder|-aria)?="([\w.]+)"/g)].map((m) => m[1]);
  assert.ok(keys.length > 40);
  for (const key of keys) assert.ok(DICT.en[key], `index.html uses "${key}" but English has no such line`);
});

test('every t("...") key used in app.js exists', () => {
  const js = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'app.js'), 'utf8');
  const keys = new Set([...js.matchAll(/\bt\(\s*'([\w.]+)'/g)].map((m) => m[1]));
  for (const m of js.matchAll(/'((?:pp|job|err|upd|set|thumb|ytdlp|notify|preview|grab|jobs|dialog)\.[\w.]+)'/g)) keys.add(m[1]);
  assert.ok(keys.size > 30);
  for (const key of keys) assert.ok(DICT.en[key], `app.js uses "${key}" but English has no such line`);
});
