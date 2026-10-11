# Grabbit 🐇

Paste a link, grab the file. A free Windows desktop app for downloading video and audio as **MP4**, **MP3** or **WAV**, made for video editors.

**Author:** direk james

## Features

- MP4 video from 360p up to 4K, with an **Editor-friendly (H.264)** option for Premiere, CapCut and Vegas
- MP3 audio (128–320 kbps) and lossless WAV
- **Only grab a part:** set a From/To time to download just a sound effect or a short clip
- Whole-playlist downloads, saved into a folder per playlist
- Several downloads at once, with progress, speed and time left
- History with a "Show file" button
- Built-in **How to use** guide (top-right button, or press F1). It opens by itself the first time the app runs
- yt-dlp updates itself on every launch, so the app keeps working when YouTube changes things

Grabbit is a friendly front end for [yt-dlp](https://github.com/yt-dlp/yt-dlp), [FFmpeg](https://ffmpeg.org) and [Deno](https://deno.com), which are all bundled inside the app. Your friends don't install anything else.

---

## Building the app (Windows)

### 1. Install the software (once)

| Software | What it's for | Get it |
|---|---|---|
| **Node.js LTS** (v22 or newer) | Runs the build tools | https://nodejs.org (pick the LTS installer, keep the default options) |
| **Visual Studio Code** | Editing the code | You already have it |
| **Git** (optional) | Pushing to GitHub | https://git-scm.com |

You don't need to install Electron or electron-builder yourself. `npm install` gets them.

To check Node is installed, open a new terminal and run:

```
node -v
npm -v
```

### 2. Open the project

1. Unzip `grabbit` somewhere simple, like `C:\Projects\grabbit`.
2. In VS Code: **File → Open Folder…** and pick the `grabbit` folder.
3. Open the terminal: **Terminal → New Terminal**.

### 3. Install dependencies

```
npm install
```

This downloads Electron, electron-builder and ffmpeg. It also runs `scripts/fetch-binaries.js`, which puts `yt-dlp.exe` and `deno.exe` in the `bin` folder. Expect a few minutes and roughly 400 MB of downloads the first time.

### 4. Try it

```
npm start
```

The Grabbit window opens. Test a few downloads before you package it.

### 5. Build the .exe files

```
npm run dist
```

When it finishes, open the `dist` folder:

| File | What it is |
|---|---|
| `Grabbit-Setup-1.0.0.exe` | **Installer.** Adds desktop and Start menu shortcuts and an uninstaller. Best for most friends. |
| `Grabbit-Portable-1.0.0.exe` | **Portable.** One file you can run from anywhere, even a USB stick. No install needed. |

Send either file to your friends, or attach both to a **GitHub Release** (repo → Releases → *Draft a new release* → drag the files in).

### 6. Making a new version later

1. Change `"version"` in `package.json` (for example `1.0.0` → `1.1.0`).
2. Run `npm run dist` again.

You only need a new build when Grabbit's own code changes. yt-dlp updates itself inside the app.

---

## What your friends will see

The first time they run it, Windows may show **"Windows protected your PC"**. That's because the app isn't code-signed (certificates cost money). Tell them to click **More info → Run anyway**. It only happens once.

Some antivirus programs also flag yt-dlp by mistake. That's a known false positive with downloader tools.

---

## Troubleshooting the build

| Problem | Fix |
|---|---|
| `Cannot create symbolic link : A required privilege is not held by the client` during `npm run dist` | Turn on **Developer Mode** (Windows Settings → System → For developers), or run VS Code as Administrator once, then build again. |
| `Could not download the tools` | Check your internet, then run `npm run fetch-bins`. Add `-- --force` to re-download. |
| `'npm' is not recognized` | Restart VS Code (or your PC) after installing Node.js. |
| A video says "unavailable" but plays in the browser | Click **Update yt-dlp** at the bottom of the app. |

## Project layout

```
grabbit/
├─ main.js                 App window, downloads, settings, yt-dlp updates
├─ preload.js              Safe bridge between the window and the app
├─ src/ytdlp-args.js       Builds yt-dlp commands, reads its output
├─ renderer/               The interface (HTML, CSS, JS)
├─ scripts/fetch-binaries.js  Downloads yt-dlp.exe and deno.exe into bin/
├─ build/icon.png          App icon
├─ test/                   Unit tests (npm test)
└─ package.json            Scripts + electron-builder packaging settings
```

## Where things are saved

- Downloads: `Downloads\Grabbit` by default (change it in the app)
- Settings, history, the updatable yt-dlp copy and temp files: `%APPDATA%\Grabbit`

## A note on use

Grab content you have the right to use: your own uploads, Creative Commons or royalty-free material, or clips used within your local fair-use rules. Downloading may be against YouTube's Terms of Service.

## License

MIT © 2026 direk james. Bundled tools keep their own licenses (see `LICENSE`).
