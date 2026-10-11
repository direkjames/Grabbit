/* Grabbit - Discord link + Enchanting Table checks. Run: npm test */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { discordUrl, DISCORD_INVITE } = require('../src/links');
const { LANGUAGES } = require('../src/settings-schema');

test('Discord button stays hidden until a real invite link is pasted', () => {
  assert.equal(discordUrl(DISCORD_INVITE) === null || discordUrl(DISCORD_INVITE).startsWith('https://'), true);
  assert.equal(discordUrl('PASTE-YOUR-DISCORD-INVITE-LINK-HERE'), null);
  assert.equal(discordUrl(''), null);
});

test('only real Discord invite links are accepted', () => {
  assert.equal(discordUrl('https://discord.gg/abc123'), 'https://discord.gg/abc123');
  assert.equal(discordUrl(' https://discord.com/invite/abc-123 '), 'https://discord.com/invite/abc-123');
  for (const bad of ['http://discord.gg/abc', 'https://discord.gg/', 'https://evil.com/discord.gg/abc',
    'https://discord.gg.evil.com/abc', 'file:///C:/x', 'javascript:alert(1)', 'https://discord.com/channels/1/2']) {
    assert.equal(discordUrl(bad), null, bad);
  }
});

test('Enchanting Table is a language and its font ships with the app', () => {
  assert.ok(LANGUAGES.includes('enchant'));
  assert.ok(fs.statSync(path.join(__dirname, '..', 'renderer', 'fonts', 'enchant.woff')).size > 500);
  const html = fs.readFileSync(path.join(__dirname, '..', 'renderer', 'index.html'), 'utf8');
  assert.match(html, /<option value="enchant">Enchanting Table<\/option>/);
});
