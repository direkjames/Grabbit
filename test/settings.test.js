/*
 * Grabbit - tests for settings rules, updates and the GitHub config
 * Run: npm test
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { sanitizePatch, languageForLocale, DEFAULTS, MAX_PARALLEL } = require('../src/settings-schema');
const { parseVersion, isNewer, fetchLatestVersion } = require('../src/updates');
const updateConfig = require('../src/update-config');
const pkg = require('../package.json');

test('sanitizePatch keeps valid values and drops everything else', () => {
  assert.deepEqual(sanitizePatch({ maxConcurrent: 3, language: 'fil', notifyOnDone: false }), {
    maxConcurrent: 3, language: 'fil', notifyOnDone: false,
  });
  assert.deepEqual(sanitizePatch({ maxConcurrent: 0 }), {});
  assert.deepEqual(sanitizePatch({ maxConcurrent: MAX_PARALLEL + 1 }), {});
  assert.deepEqual(sanitizePatch({ maxConcurrent: '3' }), {});
  assert.deepEqual(sanitizePatch({ language: 'de' }), {});
  assert.deepEqual(sanitizePatch({ mode: 'avi', videoQuality: '9999', audioQuality: 'lots' }), {});
  assert.deepEqual(sanitizePatch({ cookiesBrowser: 'x; calc' }), {});
  assert.deepEqual(sanitizePatch({ cookiesBrowser: '' }), { cookiesBrowser: '' });
  assert.deepEqual(sanitizePatch({ cookiesBrowser: 'firefox' }), { cookiesBrowser: 'firefox' });
  assert.deepEqual(sanitizePatch({ outputDir: 'C:\\Windows', history: [], __proto__: { x: 1 } }), {}); // only through the folder dialog
  assert.deepEqual(sanitizePatch(null), {});
  assert.deepEqual(sanitizePatch('nope'), {});
});

test('defaults pass their own rules', () => {
  assert.deepEqual(sanitizePatch(DEFAULTS), DEFAULTS);
});

test('first-run language follows the computer language', () => {
  assert.equal(languageForLocale('fil'), 'fil');
  assert.equal(languageForLocale('fil-PH'), 'fil');
  assert.equal(languageForLocale('tl'), 'fil');
  assert.equal(languageForLocale('ceb'), 'ceb');
  assert.equal(languageForLocale('hil'), 'hil');
  assert.equal(languageForLocale('hil-PH'), 'hil');
  assert.equal(languageForLocale('en-PH'), 'en');
  assert.equal(languageForLocale('de-DE'), 'en');
  assert.equal(languageForLocale(undefined), 'en');
});

test('version comparison', () => {
  assert.deepEqual(parseVersion('v1.2.3'), [1, 2, 3]);
  assert.deepEqual(parseVersion('2.0'), [2, 0, 0]);
  assert.equal(parseVersion('nope'), null);
  assert.equal(isNewer('1.1.0', '1.0.0'), true);
  assert.equal(isNewer('v1.0.1', '1.0.0'), true);
  assert.equal(isNewer('1.10.0', '1.9.0'), true); // not a text comparison
  assert.equal(isNewer('1.0.0', '1.0.0'), false);
  assert.equal(isNewer('0.9.9', '1.0.0'), false);
  assert.equal(isNewer('garbage', '1.0.0'), false);
});

test('fetchLatestVersion reads the release tag from GitHub', async () => {
  const ok = async () => ({ ok: true, status: 200, json: async () => ({ tag_name: 'v1.4.0' }) });
  assert.equal(await fetchLatestVersion('me', 'grabbit', ok), '1.4.0');
  const none = async () => ({ ok: false, status: 404 });
  assert.equal(await fetchLatestVersion('me', 'grabbit', none), null);
  const down = async () => ({ ok: false, status: 500 });
  await assert.rejects(() => fetchLatestVersion('me', 'grabbit', down), /500/);
});

test('src/update-config.js and package.json publish the same GitHub repo', () => {
  const publish = pkg.build.publish[0];
  assert.equal(publish.provider, 'github');
  assert.equal(publish.owner, updateConfig.config.owner, 'owner differs between package.json and src/update-config.js');
  assert.equal(publish.repo, updateConfig.config.repo, 'repo differs between package.json and src/update-config.js');
});

test('auto-update stays off until the GitHub username is filled in', () => {
  assert.equal(updateConfig.isConfigured({ owner: updateConfig.PLACEHOLDER, repo: 'grabbit' }), false);
  assert.equal(updateConfig.isConfigured({ owner: 'someone', repo: 'grabbit' }), true);
  assert.equal(updateConfig.releasesUrl({ owner: 'someone', repo: 'grabbit' }), 'https://github.com/someone/grabbit/releases/latest');
});
