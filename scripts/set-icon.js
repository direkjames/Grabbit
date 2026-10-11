/*
 * Grabbit - swap the app icon in one step
 * Author: direk james
 *
 * Usage:   npm run icon -- C:\path\to\my-icon.png
 *
 * Checks the picture, then copies it to the two places Grabbit uses:
 *   build/icon.png            the .exe, installer, shortcuts, taskbar and window icon
 *   renderer/assets/icon.png  the logo in the top-left corner of the app
 * Then run `npm start` to look at it, or `npm run dist` to build.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MIN_SIZE = 256; // electron-builder needs at least 256x256 to make the Windows icon

/** Read width and height from a PNG file's first bytes. Throws a friendly error if it isn't a PNG. */
function readPngSize(buf) {
  if (buf.length < 24 || !buf.subarray(0, 8).equals(PNG_SIGNATURE) || buf.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('That is not a PNG picture. Export your icon as a .png file and try again.\n(Renaming a .jpg or .ico to .png does not work.)');
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** Throws if the picture can't be used as the icon. Returns its size plus any friendly advice. */
function checkIcon(buf) {
  const { width, height } = readPngSize(buf);
  if (width !== height) {
    throw new Error(`The icon must be a square, and yours is ${width}x${height}. Crop it to a square (for example 1024x1024) and try again.`);
  }
  if (width < MIN_SIZE) {
    throw new Error(`The icon is only ${width}x${width}. It needs to be at least ${MIN_SIZE}x${MIN_SIZE} (512x512 or 1024x1024 is best).`);
  }
  const advice = [];
  if (width < 512) advice.push('It works, but 512x512 or 1024x1024 will look sharper.');
  if (width > 1024) advice.push('Bigger than 1024x1024 is fine, but it only makes the app larger. 512 to 1024 is plenty.');
  return { width, height, advice };
}

function main() {
  const input = process.argv[2];
  if (!input) {
    console.error('Tell me which picture to use, for example:');
    console.error('  npm run icon -- C:\\Users\\you\\Pictures\\my-icon.png');
    process.exit(1);
  }
  const source = path.resolve(input);
  if (!fs.existsSync(source)) {
    console.error(`I can't find that file: ${source}`);
    console.error('Tip: drag the picture into the VS Code terminal to paste its full path.');
    process.exit(1);
  }
  let info;
  const buf = fs.readFileSync(source);
  try {
    info = checkIcon(buf);
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }

  const root = path.join(__dirname, '..');
  const targets = [path.join(root, 'build', 'icon.png'), path.join(root, 'renderer', 'assets', 'icon.png')];
  for (const target of targets) {
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, buf);
    console.log(`[grabbit] Saved ${path.relative(root, target)}`);
  }
  console.log(`[grabbit] Icon set (${info.width}x${info.height}).`);
  for (const note of info.advice) console.log(`[grabbit] Note: ${note}`);
  console.log('[grabbit] Run `npm start` to see it, or `npm run dist` to build the installer.');
}

if (require.main === module) main();

module.exports = { readPngSize, checkIcon, MIN_SIZE };
