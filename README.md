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
- **TikTok, Instagram Reels, Facebook Reels and X (Twitter)** as well as YouTube and most other video sites
- **Thumbnail saver** (a .jpg next to the download) and **cover art** embedded in MP3s
- **Download queue:** choose how many run at the same time (1 to 5); the rest wait in line
- **Notification and sound** when a download finishes
- **Languages:** English, Filipino and Cebuano (and Pirate, for fun)
- **Built-in How to use guide** (top-right button, or press F1). It opens by itself the first time the app runs
- **Auto-update** for Grabbit itself through GitHub Releases
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

### 5. Tell Grabbit where your updates will live (once)

Grabbit updates itself from the **GitHub Releases** of your repository. Create a GitHub repository for it (for example `grabbit`), then put your GitHub username in **two places**:

| File | What to change |
|---|---|
| `src/update-config.js` | `owner: 'YOUR-GITHUB-USERNAME'` → your username (and `repo` if you named the repository something else) |
| `package.json` | `"build"` → `"publish"` → `"owner"` (and `"repo"`) → the same values |

`npm test` checks that both files match. Until the username is filled in, auto-update simply stays off and nothing else is affected.

### 6. Build the .exe files

```
npm run dist
```

When it finishes, open the `dist` folder:

| File | What it is |
|---|---|
| `Grabbit-Setup-1.1.2.exe` | **Installer.** Adds desktop and Start menu shortcuts and an uninstaller. Best for most friends. |
| `Grabbit-Portable-1.1.2.exe` | **Portable.** One file you can run from anywhere, even a USB stick. No install needed. |

Send either file to your friends, or attach both to a **GitHub Release** (repo → Releases → *Draft a new release* → drag the files in).

### 7. Publishing a new version (auto-update)

1. Change `"version"` in `package.json` (for example `1.1.2` → `1.2.0`). It must go **up** or nobody gets the update.
2. Run `npm run dist`.
3. On GitHub: repo → **Releases** → **Draft a new release**.
   - Tag: `v1.2.0` (the same number, with a `v` in front). Do **not** tick "pre-release".
   - Drag these files from the `dist` folder into the release:
     - `Grabbit-Setup-1.2.0.exe`
     - `Grabbit-Setup-1.2.0.exe.blockmap`
     - `latest.yml`  ← this is the file the updater reads; without it nobody is told about the update
     - `Grabbit-Portable-1.2.0.exe` (for friends who use the portable version)
   - Click **Publish release** (not "Save draft").
4. Friends who installed with the **Setup** file get the update by themselves: it downloads in the background, then a "Restart to update" button appears (or it installs the next time they close Grabbit).
5. Friends who use the **Portable** file see a "Download" button instead, because a portable file can't replace itself.

Your friends need to install the first auto-updating version (1.1.2) by hand once. After that, updates come to them.

You only need a new release when Grabbit's own code changes. yt-dlp updates itself inside the app.

---

## What your friends will see

The first time they run it, Windows may show **"Windows protected your PC"**. That's because the app isn't code-signed (certificates cost money). Tell them to click **More info → Run anyway**. It only happens once.

Some antivirus programs also flag yt-dlp by mistake. That's a known false positive with downloader tools.

---

## Troubleshooting the build

| Problem | Fix |
|---|---|
| `Cannot create symbolic link : A required privilege is not held by the client` during `npm run dist` | Turn on **Developer Mode** (Windows Settings → System → For developers), or run VS Code as Administrator once, then build again. |
| Friends don't get the update | Check that the release is **published** (not a draft or pre-release), the tag matches the version (`v1.2.0`), and `latest.yml` is attached. |
| `Could not download the tools` | Check your internet, then run `npm run fetch-bins`. Add `-- --force` to re-download. |
| `'npm' is not recognized` | Restart VS Code (or your PC) after installing Node.js. |
| A video says "unavailable" but plays in the browser | Click **Update yt-dlp** at the bottom of the app. |

## Project layout

```
grabbit/
├─ main.js                 App window, download queue, notifications, settings, updates
├─ preload.js              Safe bridge between the window and the app
├─ src/ytdlp-args.js       Builds yt-dlp commands, reads its output, knows the sites
├─ src/queue.js            The "N at a time" download queue
├─ src/settings-schema.js  Which settings exist and what values are allowed
├─ src/update-config.js    Your GitHub username/repo for auto-update
├─ src/updates.js          Version check used by the Portable version
├─ scripts/set-icon.js     Swaps the app icon (npm run icon)
├─ renderer/               The interface (HTML, CSS, JS)
│  └─ i18n.js              All the text in English, Filipino, Cebuano and Pirate
├─ scripts/fetch-binaries.js  Downloads yt-dlp.exe and deno.exe into bin/
├─ build/icon.png          App icon
├─ test/                   Unit tests (npm test)
└─ package.json            Scripts + electron-builder packaging settings
```

## Where things are saved

- Downloads: `Downloads\Grabbit` by default (change it in the app)
- Settings, history, the updatable yt-dlp copy and temp files: `%APPDATA%\Grabbit`

## Changing the app icon

Grabbit uses one picture in two places, and one command swaps both.

**1. Make the picture.** A **square PNG**, ideally **512×512 or 1024×1024** (256×256 is the minimum). A transparent background is fine. Keep the design simple and bold, because Windows also shows it very small (taskbar, shortcuts). If you have a `.jpg` or `.ico`, open it in an editor (Paint, Photoshop, Canva, Figma...) and export it as PNG. Renaming the file does not work.

**2. Swap it in.** Open the VS Code terminal in the project folder and run:

```
npm run icon -- C:\Users\you\Pictures\my-icon.png
```

(Tip: after typing `npm run icon -- ` you can drag the picture from File Explorer into the terminal to paste its full path.) The command checks the picture, tells you if something is wrong (not a PNG, not square, too small), and copies it to the two places below.

**3. See it.**
- `npm start` shows the new logo in the top-left corner of the app and in the window/taskbar icon.
- `npm run dist` builds the installer and portable `.exe` with the new icon.

| File | Where it shows up |
|---|---|
| `build/icon.png` | The `.exe` files, the installer, desktop and Start menu shortcuts, taskbar and window icon |
| `renderer/assets/icon.png` | The logo in the top-left corner inside the app (the app rounds its corners itself) |

If you'd rather do it by hand, just replace those two files with your picture, keeping the same names.

**If Windows still shows the old icon** after you install the new build, that's Windows' icon cache, not Grabbit. Uninstall the old version first, then install the new one. If it persists, restart "Windows Explorer" in Task Manager (or restart the PC).

**To get the new icon to your friends**, bump `"version"` in `package.json` and publish a new release (see "Publishing a new version"). The auto-updater delivers it.

## Changing the colors

The colors are the first lines of `renderer/styles.css`:

```css
--accent: #ffd500;      /* the main accent: buttons, highlights, progress bars */
--accent-2: #ffe566;    /* a lighter shade of it: hover, links, headings */
--accent-ink: #231c00;  /* the text color on top of the accent (keep it dark for a light accent) */
```

Change those three and restart. Pick a dark `--accent-ink` for a light accent and a light one for a dark accent, so the button text stays readable.

## Changing or fixing a translation

All the text in the window, in all three languages, is in `renderer/i18n.js`. Find the line (they have the same name in each language), edit the text on the right of the colon, and keep any `{placeholders}` as they are. `npm test` checks that no language is missing a line.

## Sign-in help (Instagram and Facebook)

Instagram and Facebook often only let yt-dlp in when you're logged in. In **Settings → Sign-in help** a user picks the browser they're logged in with, and yt-dlp reads that browser's sign-in on their own computer. It is only used for TikTok, Instagram and Facebook, never for YouTube. Firefox works most reliably. Chrome and Edge may fail while the browser is open, or on newer versions that encrypt their cookies in a way yt-dlp can't read.

## A note on use

Grab content you have the right to use: your own uploads, Creative Commons or royalty-free material, or clips used within your local fair-use rules. Downloading may be against the Terms of Service of YouTube, TikTok, Instagram and Facebook.

## License

MIT © 2026 direk james. Bundled tools keep their own licenses (see `LICENSE`).


## Hiligaynon

The Hiligaynon text is a first draft. A native speaker should read it and fix anything that sounds off, in `renderer/i18n.js` (the block that starts with `hil: {`).

## Discord button

Open `src/links.js` and replace `PASTE-YOUR-DISCORD-INVITE-LINK-HERE` with your invite link
(for example `https://discord.gg/abc123`). Until you do, the Discord button is hidden.
In Discord, make the invite "never expires" so it keeps working.

## Enchanting Table language

It shows the English text in a rune-style font (`renderer/fonts/enchant.woff`, an original design
made by `scripts/make-enchant-font.py`, not the Minecraft font). Only letters change; numbers, links
and your video titles stay normal. To use a different font, replace that file with another `.woff`
that has the same letters (check its licence first).
