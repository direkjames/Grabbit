/*
 * Grabbit - downloads the tools that get bundled into the app
 * Author: direk james
 *
 * Runs automatically after `npm install`. Run it again any time with:
 *   npm run fetch-bins           (skip files that already exist)
 *   npm run fetch-bins -- --force (re-download everything)
 *
 * ffmpeg is NOT downloaded here: it comes from the `ffmpeg-static` npm package.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const BIN = path.join(__dirname, '..', 'bin');
const FORCE = process.argv.includes('--force');

const DOWNLOADS = [
  {
    name: 'yt-dlp.exe',
    url: 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe',
  },
  {
    // JavaScript runtime that yt-dlp needs for YouTube (since late 2025)
    name: 'deno.exe',
    url: 'https://github.com/denoland/deno/releases/latest/download/deno-x86_64-pc-windows-msvc.zip',
    zip: true,
  },
];

async function download(url, dest) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const total = Number(res.headers.get('content-length')) || 0;
  const chunks = [];
  let got = 0;
  let lastPct = -1;
  for await (const chunk of res.body) {
    chunks.push(chunk);
    got += chunk.length;
    if (total) {
      const pct = Math.floor((got / total) * 100);
      if (pct % 10 === 0 && pct !== lastPct) {
        process.stdout.write(`  ${pct}%`);
        lastPct = pct;
      }
    }
  }
  process.stdout.write('\n');
  fs.writeFileSync(dest, Buffer.concat(chunks));
}

function unzip(zipPath, outDir) {
  try {
    // tar ships with Windows 10 (1803+) and 11 and can read .zip files
    execFileSync('tar', ['-xf', zipPath, '-C', outDir], { stdio: 'inherit' });
  } catch {
    execFileSync('powershell', [
      '-NoProfile', '-Command',
      `Expand-Archive -LiteralPath '${zipPath}' -DestinationPath '${outDir}' -Force`,
    ], { stdio: 'inherit' });
  }
}

async function main() {
  if (process.platform !== 'win32') {
    console.log('[grabbit] Not on Windows: skipping yt-dlp.exe / deno.exe download.');
    console.log('[grabbit] For development here, install yt-dlp and deno on your PATH instead.');
    return;
  }
  fs.mkdirSync(BIN, { recursive: true });

  for (const item of DOWNLOADS) {
    const finalPath = path.join(BIN, item.name);
    if (fs.existsSync(finalPath) && !FORCE) {
      console.log(`[grabbit] ${item.name} already there, skipping (use --force to refresh)`);
      continue;
    }
    console.log(`[grabbit] Downloading ${item.name}…`);
    if (item.zip) {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grabbit-'));
      const zipPath = path.join(tmpDir, 'download.zip');
      await download(item.url, zipPath);
      unzip(zipPath, tmpDir);
      fs.copyFileSync(path.join(tmpDir, item.name), finalPath);
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } else {
      await download(item.url, finalPath);
    }
    console.log(`[grabbit] Saved bin/${item.name}`);
  }
  console.log('[grabbit] Tools ready.');
}

main().catch((err) => {
  console.error(`[grabbit] Could not download the tools: ${err.message}`);
  console.error('[grabbit] Check your internet connection, then run: npm run fetch-bins');
  process.exit(1);
});
