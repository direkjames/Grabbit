/*
 * Grabbit - unit tests for the yt-dlp argument builder
 * Author: direk james
 * Run: npm test
 */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const yt = require('../src/ytdlp-args');

const tools = { ffmpegPath: 'C:\\ff\\ffmpeg.exe', denoPath: 'C:\\bin\\deno.exe' };
const base = { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', outputDir: 'C:\\Users\\me\\Downloads\\Grabbit' };
const after = (args, flag) => args[args.indexOf(flag) + 1];

test('parseTime handles common formats', () => {
  assert.equal(yt.parseTime('45'), 45);
  assert.equal(yt.parseTime('1:30'), 90);
  assert.equal(yt.parseTime('01:02:03'), 3723);
  assert.equal(yt.parseTime('0:05.5'), 5.5);
  assert.equal(yt.parseTime(''), null);
  assert.ok(Number.isNaN(yt.parseTime('1:75')));
  assert.ok(Number.isNaN(yt.parseTime('abc')));
  assert.ok(Number.isNaN(yt.parseTime('1:2:3:4')));
});

test('validateTrim catches bad ranges', () => {
  assert.deepEqual(yt.validateTrim('0:30', '0:45'), { start: 30, end: 45 });
  assert.deepEqual(yt.validateTrim('', '10'), { start: null, end: 10 });
  assert.throws(() => yt.validateTrim('0:45', '0:30'), /after the start/);
  assert.throws(() => yt.validateTrim('', ''), /Enter a start/);
  assert.throws(() => yt.validateTrim('10:00', '', 300), /past the end/);
});

test('validateUrl only allows http(s)', () => {
  assert.throws(() => yt.validateUrl(''), /Paste a link/);
  assert.throws(() => yt.validateUrl('file:///C:/x'), /Only http/);
  assert.throws(() => yt.validateUrl('not a url'), /doesn't look/);
  assert.match(yt.validateUrl(' https://youtu.be/abc '), /^https:\/\/youtu\.be\/abc$/);
});

test('hasPlaylist detects playlist links', () => {
  assert.equal(yt.hasPlaylist('https://www.youtube.com/watch?v=a&list=PL123'), true);
  assert.equal(yt.hasPlaylist('https://www.youtube.com/playlist?list=PL123'), true);
  assert.equal(yt.hasPlaylist('https://www.youtube.com/watch?v=a'), false);
});

test('URL always comes after -- so it can never be read as an option', () => {
  const args = yt.buildDownloadArgs({ ...base, mode: 'mp4', quality: '1080' }, tools);
  assert.equal(args[args.length - 2], '--');
  assert.equal(args[args.length - 1], base.url);
});

test('MP4 1080 editor-friendly prefers H.264 and merges to mp4', () => {
  const args = yt.buildDownloadArgs({ ...base, mode: 'mp4', quality: '1080', editorFriendly: true }, tools);
  assert.equal(after(args, '-f'), 'bv*+ba/b');
  assert.equal(after(args, '-S'), 'res:1080,vcodec:h264,acodec:aac');
  assert.equal(after(args, '--merge-output-format'), 'mp4');
  assert.equal(after(args, '--ffmpeg-location'), tools.ffmpegPath);
  assert.equal(after(args, '--js-runtimes'), `deno:${tools.denoPath}`);
  assert.equal(after(args, '--paths'), `home:${base.outputDir}`);
  assert.ok(args.includes('--no-playlist'));
  assert.equal(after(args, '-o'), '%(title).150B [%(id)s]%(height& [{}p]| [video])s.%(ext)s');
});

test('MP4 best without editor mode just sorts by resolution', () => {
  const args = yt.buildDownloadArgs({ ...base, mode: 'mp4', quality: 'best', editorFriendly: false }, tools);
  assert.equal(after(args, '-S'), 'res');
});

test('MP3 extracts audio at the chosen bitrate', () => {
  const args = yt.buildDownloadArgs({ ...base, mode: 'mp3', quality: '192' }, tools);
  assert.equal(after(args, '-f'), 'ba/b');
  assert.equal(after(args, '--audio-format'), 'mp3');
  assert.equal(after(args, '--audio-quality'), '192K');
});

test('Unknown quality falls back to safe defaults', () => {
  const v = yt.buildDownloadArgs({ ...base, mode: 'mp4', quality: '9999' }, tools);
  assert.match(after(v, '-S'), /^res:1080/);
  const a = yt.buildDownloadArgs({ ...base, mode: 'mp3', quality: 'lots' }, tools);
  assert.equal(after(a, '--audio-quality'), '320K');
});

test('WAV extracts lossless audio', () => {
  const args = yt.buildDownloadArgs({ ...base, mode: 'wav' }, tools);
  assert.equal(after(args, '--audio-format'), 'wav');
  assert.ok(!args.includes('--audio-quality'));
});

test('Trim adds a download section and clip name', () => {
  const args = yt.buildDownloadArgs({ ...base, mode: 'mp4', quality: '720', trim: { start: 30, end: 45 } }, tools);
  assert.equal(after(args, '--download-sections'), '*30-45');
  assert.ok(args.includes('--force-keyframes-at-cuts'));
  assert.match(after(args, '-o'), /\(clip 30s-45s\)/);

  const open = yt.buildDownloadArgs({ ...base, mode: 'mp3', quality: '320', trim: { start: 90, end: null } }, tools);
  assert.equal(after(open, '--download-sections'), '*90-inf');
  assert.ok(!open.includes('--force-keyframes-at-cuts'));
  assert.match(after(open, '-o'), /\(clip 1m30s-end\)/);
});

test('Playlist mode ignores trim and uses a folder per playlist', () => {
  const args = yt.buildDownloadArgs({ ...base, mode: 'mp3', quality: '320', playlist: true, trim: { start: 1, end: 2 } }, tools);
  assert.ok(args.includes('--yes-playlist'));
  assert.ok(args.includes('--ignore-errors'));
  assert.ok(!args.includes('--download-sections'));
  assert.match(after(args, '-o'), /^%\(playlist_title,playlist_id\)\.100B\//);
  assert.ok(!after(args, '-o').includes('height'));
});

test('Info args', () => {
  const single = yt.buildInfoArgs({ url: base.url, playlist: false }, tools);
  assert.ok(single.includes('-J') && single.includes('--no-playlist'));
  const list = yt.buildInfoArgs({ url: base.url, playlist: true }, tools);
  assert.ok(list.includes('--flat-playlist') && list.includes('--yes-playlist'));
});

test('parseLine understands Grabbit progress output', () => {
  assert.deepEqual(yt.parseLine('GRABBIT_PROGRESS|  45.3%|2.10MiB/s|00:12|NA|NA'), {
    type: 'progress', percent: 45.3, speed: '2.10MiB/s', eta: '00:12', index: null, total: null,
  });
  const pl = yt.parseLine('GRABBIT_PROGRESS|100.0%|NA|NA|3|12\r');
  assert.equal(pl.index, 3);
  assert.equal(pl.total, 12);
  assert.equal(pl.speed, null);
  assert.equal(yt.parseLine('GRABBIT_PROGRESS|NA|NA|NA|NA|NA').percent, null);
  assert.deepEqual(yt.parseLine('GRABBIT_PP|Merger|started'), { type: 'postprocess', name: 'Merger', status: 'started' });
  assert.deepEqual(yt.parseLine('GRABBIT_FILE|C:\\x\\My Video [abc].mp4'), { type: 'file', path: 'C:\\x\\My Video [abc].mp4' });
  assert.equal(yt.parseLine('[youtube] abc: Downloading webpage'), null);
  assert.equal(yt.parseLine(''), null);
});

test('friendly error messages', () => {
  assert.equal(yt.parseLine('ERROR: [youtube] abc: Private video. Sign in if you have access').message, 'This video is private.');
  assert.match(yt.friendlyError('[youtube] abc: Video unavailable'), /Update yt-dlp/);
  assert.equal(yt.friendlyError('[youtube] abc: Something odd happened'), 'Something odd happened');
});

test('summarizeInfo for video and playlist', () => {
  const v = yt.summarizeInfo({
    title: 'Whoosh SFX', channel: 'Sounds', duration: 4, thumbnail: 'https://i.ytimg.com/x.jpg',
    formats: [{ vcodec: 'avc1', height: 720 }, { vcodec: 'vp9', height: 1080 }, { vcodec: 'none', height: null }],
  });
  assert.equal(v.kind, 'video');
  assert.equal(v.maxHeight, 1080);
  const p = yt.summarizeInfo({ _type: 'playlist', title: 'Pack', entries: [{ id: 1 }, { id: 2 }, null] });
  assert.equal(p.kind, 'playlist');
  assert.equal(p.count, 2);
});

// ---------------------------------------------------------------- v1.1 features

test('detectSite recognises the supported sites and their share links', () => {
  const site = yt.detectSite;
  assert.equal(site('https://www.youtube.com/watch?v=a'), 'youtube');
  assert.equal(site('https://youtu.be/a'), 'youtube');
  assert.equal(site('https://m.youtube.com/watch?v=a'), 'youtube');
  assert.equal(site('https://www.tiktok.com/@someone/video/123'), 'tiktok');
  assert.equal(site('https://vm.tiktok.com/ZMabc/'), 'tiktok');
  assert.equal(site('https://www.instagram.com/reel/Cabc123/'), 'instagram');
  assert.equal(site('https://www.instagram.com/reels/Cabc123/'), 'instagram');
  assert.equal(site('https://www.facebook.com/reel/123456'), 'facebook');
  assert.equal(site('https://fb.watch/abc/'), 'facebook');
  assert.equal(site('https://vimeo.com/123'), 'other');
  assert.equal(site('not a link'), 'other');
  // look-alike hosts must not be mistaken for the real thing
  assert.equal(site('https://nottiktok.com/x'), 'other');
  assert.equal(site('https://tiktok.com.evil.example/x'), 'other');
});

test('thumbnail options: save, embed, both, neither', () => {
  const none = yt.buildDownloadArgs({ ...base, mode: 'mp3', quality: '320' }, tools);
  assert.ok(!none.includes('--write-thumbnail') && !none.includes('--embed-thumbnail'));
  assert.ok(!none.includes('--convert-thumbnails'));

  const save = yt.buildDownloadArgs({ ...base, mode: 'mp4', quality: '720', saveThumbnail: true }, tools);
  assert.ok(save.includes('--write-thumbnail'));
  assert.ok(!save.includes('--embed-thumbnail'));
  assert.equal(after(save, '--convert-thumbnails'), 'jpg');

  const embed = yt.buildDownloadArgs({ ...base, mode: 'mp3', quality: '320', embedCover: true }, tools);
  assert.ok(embed.includes('--embed-thumbnail'));
  assert.ok(!embed.includes('--write-thumbnail'));
  assert.equal(after(embed, '--convert-thumbnails'), 'jpg');

  const both = yt.buildDownloadArgs({ ...base, mode: 'mp3', quality: '320', saveThumbnail: true, embedCover: true }, tools);
  assert.ok(both.includes('--write-thumbnail') && both.includes('--embed-thumbnail'));
});

test('WAV never tries to embed cover art (it cannot hold any) but can still save the picture', () => {
  const wav = yt.buildDownloadArgs({ ...base, mode: 'wav', embedCover: true, saveThumbnail: true }, tools);
  assert.ok(!wav.includes('--embed-thumbnail'));
  assert.ok(wav.includes('--write-thumbnail'));
});

test('browser sign-in is used for TikTok/Instagram/Facebook, never for YouTube', () => {
  const tiktok = 'https://www.tiktok.com/@a/video/1';
  const withCookies = yt.buildDownloadArgs({ ...base, url: tiktok, mode: 'mp4', quality: '720', cookiesBrowser: 'firefox' }, tools);
  assert.equal(after(withCookies, '--cookies-from-browser'), 'firefox');

  const youtube = yt.buildDownloadArgs({ ...base, mode: 'mp4', quality: '720', cookiesBrowser: 'firefox' }, tools);
  assert.ok(!youtube.includes('--cookies-from-browser'));

  const info = yt.buildInfoArgs({ url: 'https://www.instagram.com/reel/abc/', playlist: false, cookiesBrowser: 'edge' }, tools);
  assert.equal(after(info, '--cookies-from-browser'), 'edge');
  const infoYt = yt.buildInfoArgs({ url: base.url, playlist: false, cookiesBrowser: 'edge' }, tools);
  assert.ok(!infoYt.includes('--cookies-from-browser'));

  // an unknown browser name is ignored, so nothing odd can reach the command line
  const bad = yt.buildDownloadArgs({ ...base, url: tiktok, mode: 'mp4', cookiesBrowser: 'x; calc' }, tools);
  assert.ok(!bad.includes('--cookies-from-browser'));
});

test('single-video info lookups never expand a profile page video by video', () => {
  const args = yt.buildInfoArgs({ url: 'https://www.tiktok.com/@someone', playlist: false }, tools);
  assert.ok(args.includes('--flat-playlist'));
  assert.ok(args.includes('--no-playlist'));
});

test('errors carry a code so the window can translate them', () => {
  assert.throws(() => yt.validateTrim('0:45', '0:30'), (e) => e.code === 'trimOrder' && /after the start/.test(e.message));
  assert.throws(() => yt.validateTrim('x', ''), (e) => e.code === 'trimStart');
  assert.throws(() => yt.validateUrl(''), (e) => e.code === 'urlEmpty');
  assert.throws(() => yt.validateUrl('ftp://x.y/z'), (e) => e.code === 'urlProto');
  assert.equal(yt.classifyError('[youtube] abc: Private video. Sign in').code, 'private');
  assert.equal(yt.parseLine('ERROR: [youtube] abc: Video unavailable').code, 'unavailable');
  assert.equal(yt.classifyError('[youtube] abc: Something odd happened').code, null);
});

test('site-specific errors get a helpful message', () => {
  const ig = yt.classifyError('[Instagram] Cabc: Instagram sent an empty media response. Check if this post is accessible in your browser without being logged-in.');
  assert.equal(ig.code, 'instagram');
  assert.match(ig.message, /Sign-in help/);
  const fb = yt.classifyError('[facebook] 123: Cannot parse data. You may need to log in');
  assert.equal(fb.code, 'facebook');
  const tt = yt.classifyError('[TikTok] 123: Unable to extract webpage video data');
  assert.equal(tt.code, 'tiktok');
  // a generic "unavailable" from YouTube is still the generic message
  assert.equal(yt.classifyError('[youtube] x: Video unavailable').code, 'unavailable');
});

test('summarizeInfo reports the site and counts a vertical video by its shorter side', () => {
  const reel = yt.summarizeInfo({
    title: 'Reel', formats: [{ vcodec: 'h264', width: 720, height: 1280 }, { vcodec: 'h264', width: 1080, height: 1920 }],
  }, 'https://www.instagram.com/reel/abc/');
  assert.equal(reel.site, 'instagram');
  assert.equal(reel.maxHeight, 1080);
  const wide = yt.summarizeInfo({ title: 'Wide', formats: [{ vcodec: 'avc1', width: 1920, height: 1080 }] }, 'https://youtu.be/a');
  assert.equal(wide.maxHeight, 1080);
  assert.equal(wide.site, 'youtube');
});

// ---------------------------------------------------------------- X (Twitter)

test('detectSite recognises X / Twitter links, not look-alikes', () => {
  assert.equal(yt.detectSite('https://x.com/someone/status/123'), 'twitter');
  assert.equal(yt.detectSite('https://twitter.com/someone/status/123'), 'twitter');
  assert.equal(yt.detectSite('https://mobile.twitter.com/someone/status/123'), 'twitter');
  assert.equal(yt.detectSite('https://t.co/abc123'), 'twitter');
  assert.equal(yt.detectSite('https://box.com/file'), 'other');
  assert.equal(yt.detectSite('https://notx.com/a'), 'other');
  assert.equal(yt.detectSite('https://x.com.evil.example/a'), 'other');
});

test('X links use the browser sign-in when one is chosen', () => {
  const args = yt.buildDownloadArgs({ ...base, url: 'https://x.com/a/status/1', mode: 'mp4', cookiesBrowser: 'firefox' }, tools);
  assert.equal(after(args, '--cookies-from-browser'), 'firefox');
});

test('X errors get a helpful message and a post without video says so', () => {
  assert.equal(yt.classifyError('[twitter] 1: No video could be found in this tweet').code, 'noVideo');
  assert.equal(yt.classifyError('[twitter] 1: NSFW tweet requires authentication').code, 'twitter');
  assert.match(yt.classifyError('[twitter] 1: HTTP Error 403: Forbidden').message, /Sign-in help/);
  assert.equal(yt.summarizeInfo({ _type: 'playlist', title: 'Post', entries: [{ id: 1 }, { id: 2 }] }, 'https://x.com/a/status/1').site, 'twitter');
});
