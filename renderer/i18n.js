/*
 * Grabbit - languages (English, Filipino, Cebuano, Hiligaynon, Pirate and Enchanting Table for fun)
 * Author: direk james
 *
 * Every piece of text in the window lives here. English is the master list:
 * a missing line in another language falls back to English. `npm test` checks
 * that Filipino and Cebuano have every line English has.
 *
 * To fix a translation, just edit the text on the right of the colon.
 * Keep the {placeholders} (like {n} or {v}) exactly as they are.
 */
'use strict';

(function () {
  const DICT = {
    // =====================================================================
    en: {
      'tagline': 'Paste a link. Grab the file.',
      'top.help': 'How to use',
      'top.helpTitle': 'How to use Grabbit (F1)',
      'top.discord': 'Discord',
      'top.discordTitle': 'Questions or problems? Join our Discord server',
      'help.discord': `<p><strong>Still stuck?</strong> Questions, bugs or ideas are welcome: click <em>Discord</em> at the top of the window to join the server.</p>`,
      'top.settings': 'Settings',

      'url.label': 'Video link',
      'url.placeholder': 'Paste a link from YouTube, TikTok, Instagram, Facebook, X…',
      'url.paste': 'Paste',
      'url.pasteTitle': 'Paste from clipboard',
      'playlist.text': 'This link is part of a playlist. Grab the <strong>whole playlist</strong>.',
      'playlist.textMulti': 'This post has more than one video. Grab <strong>all of them</strong>.',

      'preview.empty': 'Paste a link to see the video here',
      'preview.emptyMeta': 'YouTube, TikTok, Instagram Reels, Facebook Reels, X (Twitter) and most other video sites work',
      'preview.loading': 'Looking up the link…',
      'preview.loadingMeta': 'This can take a few seconds',
      'preview.notLink': "That doesn't look like a link",
      'preview.playlist': 'Playlist · {n} videos',
      'preview.upTo': 'up to {h}p',
      'site.youtube': 'YouTube',
      'site.tiktok': 'TikTok',
      'site.instagram': 'Instagram',
      'site.facebook': 'Facebook',
      'site.twitter': 'X (Twitter)',

      'format.label': 'Format',
      'format.mp4': 'Video',
      'format.mp3': 'Audio',
      'format.wav': 'Lossless audio',
      'quality.label': 'Quality',
      'q.best': 'Best available',
      'q.2160': '4K (2160p)',
      'q.1440': '1440p',
      'q.1080': '1080p (Full HD)',
      'q.720': '720p',
      'q.480': '480p',
      'q.360': '360p',
      'q.320': '320 kbps (best)',
      'q.256': '256 kbps',
      'q.192': '192 kbps',
      'q.128': '128 kbps (smallest)',
      'q.notAvailable': '{label} (not available)',
      'editor.text': 'Editor-friendly (H.264)',
      'editor.hint': 'Plays nicely in Premiere, CapCut and Vegas. YouTube only offers H.264 up to 1080p.',

      'thumb.save': 'Save the thumbnail as a picture',
      'thumb.saveHint': 'A .jpg file saved next to your download',
      'thumb.embed': 'Add cover art inside the file',
      'thumb.embedHintAudio': 'Shows the thumbnail as the album picture in music players.',
      'thumb.embedHintVideo': 'Some video editors may treat the picture as an extra video track. Leave this off if you plan to edit the video.',

      'trim.text': 'Only grab a part',
      'trim.hint': 'Great for sound effects and short clips',
      'trim.from': 'From',
      'trim.to': 'To',

      'save.label': 'Save to',
      'save.change': 'Change',
      'save.open': 'Open',
      'dialog.chooseFolder': 'Choose where Grabbit saves files',
      'grab.go': 'Grab it',
      'grab.getting': 'Getting ready…',

      'tab.downloads': 'Downloads',
      'tab.history': 'History',
      'jobs.empty': 'Nothing downloading yet.',
      'jobs.emptyHint': 'You can start several grabs. Grabbit runs {n} at a time and the rest wait in line.',
      'hist.empty': 'No finished downloads yet.',
      'hist.clear': 'Clear history',

      'job.starting': 'Starting…',
      'job.queued': 'Waiting in line…',
      'job.cancel': 'Cancel',
      'job.cancelling': 'Cancelling…',
      'job.cancelled': 'Cancelled',
      'job.showFile': 'Show file',
      'job.dismiss': 'Dismiss',
      'job.fileGone': 'File moved or deleted',
      'job.downloading': 'Downloading…',
      'job.cutting': 'Cutting your clip…',
      'job.videoOf': 'Video {i} of {n}',
      'job.videoN': 'Video {i}',
      'job.left': '{eta} left',
      'job.done': 'Done · saved',
      'job.doneN': 'Done · {n} files saved',
      'job.skipped': '{n} skipped (private or unavailable)',
      'pp.join': 'Joining video and audio…',
      'pp.audio': 'Converting audio…',
      'pp.mp4': 'Finishing MP4…',
      'pp.meta': 'Adding title info…',
      'pp.thumb': 'Adding the thumbnail…',
      'pp.save': 'Saving…',
      'pp.finish': 'Finishing up…',

      'err.pasteFirst': 'Paste a link first.',
      'err.notLink': "That doesn't look like a link.",
      'err.live': "Live streams can't be grabbed while they're live.",
      'err.ffmpeg': "ffmpeg is missing, so MP3/WAV conversion and HD video won't work. Reinstall Grabbit.",
      'err.multi': 'This post has more than one video. Tick the box above the preview to grab all of them.',
      'err.profile': "That link is a profile or a collection, not a single video. Paste the link of one video.",
      'e.trimStart': 'Start time should look like 45, 1:30 or 1:02:03.',
      'e.trimEnd': 'End time should look like 45, 1:30 or 1:02:03.',
      'e.trimEmpty': 'Enter a start time, an end time, or both.',
      'e.trimOrder': 'End time must be after the start time.',
      'e.trimPast': 'Start time is past the end of the video.',
      'e.urlEmpty': 'Paste a link first.',
      'e.urlLong': 'That link is too long.',
      'e.urlBad': "That doesn't look like a link.",
      'e.urlProto': 'Only http and https links are supported.',
      'e.noFolder': 'Choose a folder to save into.',
      'e.instagram': "Instagram wouldn't let Grabbit in. Open Settings → Sign-in help, pick the browser where you're logged in to Instagram, then try again.",
      'e.facebook': "Facebook wouldn't let Grabbit in. Open Settings → Sign-in help, pick the browser where you're logged in to Facebook, then try again. Private videos can't be grabbed.",
      'e.tiktok': 'TikTok didn\'t let Grabbit through. Click "Update yt-dlp" at the bottom and try again. Private accounts can\'t be grabbed.',
      'e.twitter': "X wouldn't let Grabbit in. Open Settings → Sign-in help, pick the browser where you're logged in to X, then try again. Protected accounts can't be grabbed.",
      'e.noVideo': "That post doesn't have a video.",
      'e.private': 'This video is private.',
      'e.unavailable': 'Video unavailable. If it plays fine in your browser, click "Update yt-dlp" at the bottom and try again.',
      'e.age': 'This video is age-restricted and needs a signed-in account.',
      'e.bot': 'YouTube is asking for a bot check. Wait a bit, then try again.',
      'e.members': 'This is a members-only video.',
      'e.notStarted': "This video hasn't started yet.",
      'e.unsupported': "That site or link type isn't supported.",
      'e.network': 'Network problem. Check your internet connection and try again.',
      'e.http403': 'Download was blocked (403). Click "Update yt-dlp" at the bottom and try again.',
      'e.diskFull': 'Your drive is full.',
      'e.ytdlpMissing': 'yt-dlp is missing. Reinstall Grabbit.',
      'e.readFail': 'Could not read that link.',
      'e.infoFail': 'Could not read the video info.',
      'e.startFail': 'Could not start yt-dlp. Reinstall Grabbit.',

      'ytdlp.starting': 'yt-dlp: starting…',
      'ytdlp.checking': 'yt-dlp{v}: checking for updates…',
      'ytdlp.updated': 'yt-dlp updated to {v}',
      'ytdlp.ok': 'yt-dlp{v} · up to date',
      'ytdlp.failed': "yt-dlp{v} · couldn't check for updates (offline?)",
      'ytdlp.dev': 'yt-dlp{v} · self-update is off in dev mode',
      'ytdlp.updateBtn': 'Update yt-dlp',

      'upd.checking': 'Checking for a new version…',
      'upd.downloading': 'Downloading Grabbit {v}… {p}%',
      'upd.ready': 'Grabbit {v} is ready',
      'upd.restart': 'Restart to update',
      'upd.latest': 'Grabbit is up to date',
      'upd.error': "Couldn't check for updates (offline?)",
      'upd.dev': 'Updates only work in the installed app',
      'upd.notConfigured': "Automatic updates aren't turned on in this build",
      'upd.portable': 'Grabbit {v} is available',
      'upd.download': 'Download',
      'upd.check': 'Check for updates',
      'upd.confirmBusy': 'Downloads are still running. Restarting now will stop them. Restart anyway?',

      'set.title': 'Settings',
      'set.close': 'Close',
      'set.done': 'Done',
      'set.language': 'Language',
      'set.languageHint': 'Changes the whole app right away.',
      'set.parallel': 'Downloads at the same time',
      'set.parallelHint': 'Extra downloads wait in line. Use 1 if your internet is slow.',
      'set.notify': 'Show a notification when a download finishes',
      'set.notifyHint': 'Only appears while Grabbit is in the background.',
      'set.sound': 'Play a sound when a download finishes',
      'set.soundTest': 'Test sound',
      'set.signin': 'Sign-in help',
      'set.signinNone': 'Off (no sign-in)',
      'set.signinHint': 'Instagram, Facebook and X sometimes need you to be logged in. Pick the browser where you are logged in. Firefox works most reliably. Only used for TikTok, Instagram, Facebook and X, never for YouTube.',
      'set.browser.firefox': 'Firefox',
      'set.browser.chrome': 'Chrome',
      'set.browser.edge': 'Microsoft Edge',
      'set.browser.brave': 'Brave',
      'set.updates': 'Updates',
      'set.version': 'Grabbit version {v}',

      'notify.done': 'Grab finished',
      'notify.failed': "Grab didn't finish",

      'help.title': 'How to use Grabbit',
      'help.done': 'Got it',
      'help.body': `
<h3>Quick start</h3>
<ol class="steps">
  <li><strong>Paste a link.</strong> Copy a video link from your browser, then click <em>Paste</em> (or press Ctrl+V in the box). A preview appears so you know it's the right video.</li>
  <li><strong>Pick a format.</strong> <em>MP4</em> for video, <em>MP3</em> for audio, <em>WAV</em> for lossless audio.</li>
  <li><strong>Choose the quality.</strong> Higher is bigger and sharper. Options the video doesn't have are greyed out.</li>
  <li><strong>Click Grab it.</strong> Watch the progress on the right under <em>Downloads</em>. When it says Done, click <em>Show file</em>.</li>
</ol>

<h3>Which format should I pick?</h3>
<div class="help-grid">
  <div class="help-card"><strong>MP4</strong><span>Video with sound. Best for editing, reference clips and watching offline.</span></div>
  <div class="help-card"><strong>MP3</strong><span>Audio only, smaller files. Good for music and voice. 320 kbps is the best quality.</span></div>
  <div class="help-card"><strong>WAV</strong><span>Audio only, uncompressed. Big files, but ideal for sound editing and sound effects.</span></div>
</div>

<h3>Editor-friendly (H.264)</h3>
<p>Leave this on if you'll edit the video in Premiere, CapCut, Vegas or similar. It picks a video type those programs open without trouble. The catch: YouTube only offers H.264 up to 1080p. Turn it off if you want 1440p or 4K.</p>

<h3>Only grab a part</h3>
<p>Tick <em>Only grab a part</em> to download just a short section, like a sound effect.</p>
<ul>
  <li>Type the times as <code>0:30</code> or <code>1:02:15</code> (hours:minutes:seconds).</li>
  <li><em>From</em> is where it starts and <em>To</em> is where it stops.</li>
  <li>Not available for playlists.</li>
</ul>

<h3>Playlists</h3>
<p>If your link belongs to a playlist, a checkbox appears. Tick it to grab the whole playlist. Everything is saved in its own folder. Private or deleted videos are skipped automatically.</p>

<h3>Thumbnails and cover art</h3>
<p>Two tick boxes sit under the quality options:</p>
<ul>
  <li><em>Save the thumbnail as a picture</em> saves the video's cover picture as a <code>.jpg</code> next to your file. Handy for thumbnails and mood boards.</li>
  <li><em>Add cover art inside the file</em> puts that picture inside the file itself, so music players show it as the album art. It's on by default for MP3. For MP4 it's off, because some video editors treat the picture as an extra video track: only turn it on if you won't edit the video. WAV files can't hold cover art.</li>
</ul>

<h3>TikTok, Instagram Reels, Facebook Reels and X (Twitter)</h3>
<p>Paste the link the same way you do for YouTube. Share links work too (like <code>vm.tiktok.com</code> or <code>fb.watch</code>). Reels and TikToks are vertical, so 1080p means 1080 pixels wide.</p>
<p>On X, paste the link of the post itself (the address of the tweet). If a post has more than one video, a box appears so you can grab all of them.</p>
<p>Instagram, Facebook and X often only let Grabbit in when you're logged in. If you see a message about signing in:</p>
<ol class="steps">
  <li>Log in to Instagram or Facebook in your browser (Firefox works most reliably).</li>
  <li>In Grabbit, open <em>Settings</em> and set <em>Sign-in help</em> to that browser.</li>
  <li>Try the link again. If it still fails, close the browser completely and retry.</li>
</ol>
<p>This only reads the sign-in on your own computer, and it's only used for TikTok, Instagram, Facebook and X. Private accounts and private videos can't be grabbed. Only videos are supported, not photo posts or slideshows. Profile pages don't work either: paste one video at a time.</p>

<h3>Several downloads at once</h3>
<p>You can start as many grabs as you like. Grabbit runs 2 at a time by default and the rest show <em>Waiting in line…</em>. They start by themselves, in order. Change this in <em>Settings → Downloads at the same time</em> (1 to 5). Use 1 if your internet is slow. <em>Cancel</em> takes a waiting item out of the line.</p>

<h3>Settings</h3>
<ul>
  <li><em>Language:</em> English, Filipino, Cebuano, Hiligaynon, Pirate or Enchanting Table. The whole app changes right away.</li>
  <li><em>Notification:</em> a pop-up on your screen when a grab finishes while Grabbit is in the background. The taskbar button flashes too.</li>
  <li><em>Sound:</em> a short chime when a grab finishes. Use <em>Test sound</em> to hear it.</li>
</ul>

<h3>Updates</h3>
<p>Grabbit checks for a new version when it opens.</p>
<ul>
  <li><em>Installed version (Setup):</em> the update downloads quietly, then a <em>Restart to update</em> button appears at the bottom. You can also keep using the app, because it installs the next time you close it.</li>
  <li><em>Portable version:</em> it can't update itself, so a <em>Download</em> button appears when there's a newer version. Download the new file and use it instead of the old one.</li>
</ul>
<p>Settings → Updates also has a <em>Check for updates</em> button. Separately, <em>Update yt-dlp</em> at the bottom keeps the download engine fresh. It's the first thing to try when a video that works in your browser fails in Grabbit.</p>

<h3>Where do my files go?</h3>
<p>By default they go to <code>Downloads\\Grabbit</code>. Click <em>Change</em> to pick another folder, or <em>Open</em> to jump straight to it. Past downloads are listed under the <em>History</em> tab.</p>

<h3>Good to know</h3>
<ul>
  <li>Live streams can't be grabbed until they finish.</li>
  <li>Private, age-restricted or members-only videos may not work.</li>
  <li>Only grab content you have the right to use: your own uploads, royalty-free or Creative Commons material, or what your local fair-use rules allow.</li>
</ul>

<h3>Something not working?</h3>
<ul>
  <li><strong>"Video unavailable" but it plays in your browser:</strong> click <em>Update yt-dlp</em> at the bottom of the window, wait for it to finish, then try again. YouTube changes often and this fixes most problems.</li>
  <li><strong>"That doesn't look like a link":</strong> make sure you copied the whole address, starting with <code>https://</code>.</li>
  <li><strong>Instagram, Facebook or X won't let Grabbit in:</strong> see the TikTok, Instagram, Facebook and X section above for Sign-in help.</li>
  <li><strong>Stuck on "Getting ready…":</strong> Grabbit is checking for updates. Make sure you're online and give it a moment.</li>
  <li><strong>No notification pops up:</strong> in Windows Settings → System → Notifications, check that Grabbit is allowed and that Focus assist / Do not disturb is off.</li>
  <li><strong>Windows says "protected your PC" on first launch:</strong> click <em>More info</em>, then <em>Run anyway</em>. This only happens once.</li>
</ul>

<p class="muted help-foot">Tip: press <kbd>F1</kbd> any time to open this guide, and <kbd>Esc</kbd> to close it.</p>`,
    },

    // =====================================================================
    fil: {
      'tagline': 'I-paste ang link. Kunin ang file.',
      'top.help': 'Paano gamitin',
      'top.helpTitle': 'Paano gamitin ang Grabbit (F1)',
      'top.discord': 'Discord',
      'top.discordTitle': 'May tanong o problema? Sumali sa aming Discord server',
      'help.discord': `<p><strong>Hindi pa rin gumagana?</strong> Welcome ang mga tanong, bug at ideya: i-click ang <em>Discord</em> sa itaas ng window para sumali sa server.</p>`,
      'top.settings': 'Mga Setting',

      'url.label': 'Link ng video',
      'url.placeholder': 'I-paste ang link mula sa YouTube, TikTok, Instagram, Facebook, X…',
      'url.paste': 'I-paste',
      'url.pasteTitle': 'I-paste mula sa clipboard',
      'playlist.text': 'Bahagi ng playlist ang link na ito. Kunin ang <strong>buong playlist</strong>.',
      'playlist.textMulti': 'Mahigit isang video ang post na ito. Kunin ang <strong>lahat ng mga ito</strong>.',

      'preview.empty': 'Mag-paste ng link para makita ang video dito',
      'preview.emptyMeta': 'Gumagana ang YouTube, TikTok, Instagram Reels, Facebook Reels, X (Twitter) at karamihan ng iba pang video site',
      'preview.loading': 'Hinahanap ang link…',
      'preview.loadingMeta': 'Maaaring abutin ng ilang segundo',
      'preview.notLink': 'Mukhang hindi ito link',
      'preview.playlist': 'Playlist · {n} video',
      'preview.upTo': 'hanggang {h}p',
      'site.youtube': 'YouTube',
      'site.tiktok': 'TikTok',
      'site.instagram': 'Instagram',
      'site.facebook': 'Facebook',
      'site.twitter': 'X (Twitter)',

      'format.label': 'Format',
      'format.mp4': 'Video',
      'format.mp3': 'Audio',
      'format.wav': 'Lossless na audio',
      'quality.label': 'Kalidad',
      'q.best': 'Pinakamataas na available',
      'q.2160': '4K (2160p)',
      'q.1440': '1440p',
      'q.1080': '1080p (Full HD)',
      'q.720': '720p',
      'q.480': '480p',
      'q.360': '360p',
      'q.320': '320 kbps (pinakamaganda)',
      'q.256': '256 kbps',
      'q.192': '192 kbps',
      'q.128': '128 kbps (pinakamaliit)',
      'q.notAvailable': '{label} (hindi available)',
      'editor.text': 'Pang-editor (H.264)',
      'editor.hint': 'Maayos gumana sa Premiere, CapCut at Vegas. Hanggang 1080p lang ang H.264 sa YouTube.',

      'thumb.save': 'I-save ang thumbnail bilang larawan',
      'thumb.saveHint': 'Isang .jpg file na ise-save katabi ng download mo',
      'thumb.embed': 'Ilagay ang cover art sa loob ng file',
      'thumb.embedHintAudio': 'Lalabas ang thumbnail bilang album picture sa mga music player.',
      'thumb.embedHintVideo': 'Maaaring ituring ng ilang video editor na dagdag na video track ang larawan. Huwag itong i-on kung ie-edit mo ang video.',

      'trim.text': 'Kumuha lang ng bahagi',
      'trim.hint': 'Bagay para sa sound effects at maiikling clip',
      'trim.from': 'Mula',
      'trim.to': 'Hanggang',

      'save.label': 'I-save sa',
      'save.change': 'Palitan',
      'save.open': 'Buksan',
      'dialog.chooseFolder': 'Piliin kung saan ise-save ng Grabbit ang mga file',
      'grab.go': 'Kunin na',
      'grab.getting': 'Naghahanda…',

      'tab.downloads': 'Mga Download',
      'tab.history': 'Kasaysayan',
      'jobs.empty': 'Wala pang dina-download.',
      'jobs.emptyHint': 'Puwede kang magsimula ng maraming grab. {n} ang sabay na tatakbo sa Grabbit, at maghihintay sa pila ang iba.',
      'hist.empty': 'Wala pang natapos na download.',
      'hist.clear': 'Burahin ang kasaysayan',

      'job.starting': 'Nagsisimula…',
      'job.queued': 'Naghihintay sa pila…',
      'job.cancel': 'Kanselahin',
      'job.cancelling': 'Kinakansela…',
      'job.cancelled': 'Nakansela',
      'job.showFile': 'Ipakita ang file',
      'job.dismiss': 'Alisin',
      'job.fileGone': 'Nalipat o nabura ang file',
      'job.downloading': 'Dina-download…',
      'job.cutting': 'Ginugupit ang clip mo…',
      'job.videoOf': 'Video {i} sa {n}',
      'job.videoN': 'Video {i}',
      'job.left': '{eta} na lang',
      'job.done': 'Tapos · na-save',
      'job.doneN': 'Tapos · {n} file ang na-save',
      'job.skipped': '{n} ang nilaktawan (private o hindi available)',
      'pp.join': 'Pinagsasama ang video at audio…',
      'pp.audio': 'Kino-convert ang audio…',
      'pp.mp4': 'Tinatapos ang MP4…',
      'pp.meta': 'Nilalagay ang title info…',
      'pp.thumb': 'Nilalagay ang thumbnail…',
      'pp.save': 'Sine-save…',
      'pp.finish': 'Tinatapos…',

      'err.pasteFirst': 'Mag-paste muna ng link.',
      'err.notLink': 'Mukhang hindi ito link.',
      'err.live': 'Hindi puwedeng kunin ang live stream habang naka-live pa.',
      'err.ffmpeg': 'Nawawala ang ffmpeg, kaya hindi gagana ang MP3/WAV conversion at HD na video. I-reinstall ang Grabbit.',
      'err.multi': 'Mahigit isang video ang post na ito. I-tick ang kahon sa itaas ng preview para makuha silang lahat.',
      'err.profile': 'Profile o koleksyon ang link na iyan, hindi iisang video. I-paste ang link ng isang video.',
      'e.trimStart': 'Dapat ganito ang itsura ng simula: 45, 1:30 o 1:02:03.',
      'e.trimEnd': 'Dapat ganito ang itsura ng dulo: 45, 1:30 o 1:02:03.',
      'e.trimEmpty': 'Maglagay ng simula, dulo, o pareho.',
      'e.trimOrder': 'Dapat mas huli ang dulo kaysa sa simula.',
      'e.trimPast': 'Lampas na sa haba ng video ang simula.',
      'e.urlEmpty': 'Mag-paste muna ng link.',
      'e.urlLong': 'Masyadong mahaba ang link na iyan.',
      'e.urlBad': 'Mukhang hindi ito link.',
      'e.urlProto': 'http at https na link lang ang sinusuportahan.',
      'e.noFolder': 'Pumili ng folder na pagse-save-an.',
      'e.instagram': 'Hindi pinapasok ng Instagram ang Grabbit. Buksan ang Mga Setting → Tulong sa pag-sign in, piliin ang browser kung saan naka-log in ka sa Instagram, saka subukan ulit.',
      'e.facebook': 'Hindi pinapasok ng Facebook ang Grabbit. Buksan ang Mga Setting → Tulong sa pag-sign in, piliin ang browser kung saan naka-log in ka sa Facebook, saka subukan ulit. Hindi makukuha ang mga private na video.',
      'e.tiktok': 'Hindi pinadaan ng TikTok ang Grabbit. I-click ang "I-update ang yt-dlp" sa ibaba at subukan ulit. Hindi makukuha ang mga private na account.',
      'e.twitter': 'Hindi pinapasok ng X ang Grabbit. Buksan ang Mga Setting → Tulong sa pag-sign in, piliin ang browser kung saan naka-log in ka sa X, saka subukan ulit. Hindi makukuha ang mga protected na account.',
      'e.noVideo': 'Walang video ang post na iyan.',
      'e.private': 'Private ang video na ito.',
      'e.unavailable': 'Hindi available ang video. Kung napapanood mo ito sa browser, i-click ang "I-update ang yt-dlp" sa ibaba at subukan ulit.',
      'e.age': 'May age restriction ang video na ito at kailangan ng naka-sign in na account.',
      'e.bot': 'Humihingi ng bot check ang YouTube. Maghintay sandali, saka subukan ulit.',
      'e.members': 'Para sa mga miyembro lang ang video na ito.',
      'e.notStarted': 'Hindi pa nagsisimula ang video na ito.',
      'e.unsupported': 'Hindi suportado ang site o uri ng link na iyan.',
      'e.network': 'May problema sa network. Tingnan ang koneksyon mo sa internet at subukan ulit.',
      'e.http403': 'Na-block ang download (403). I-click ang "I-update ang yt-dlp" sa ibaba at subukan ulit.',
      'e.diskFull': 'Puno na ang drive mo.',
      'e.ytdlpMissing': 'Nawawala ang yt-dlp. I-reinstall ang Grabbit.',
      'e.readFail': 'Hindi mabasa ang link na iyan.',
      'e.infoFail': 'Hindi mabasa ang info ng video.',
      'e.startFail': 'Hindi masimulan ang yt-dlp. I-reinstall ang Grabbit.',

      'ytdlp.starting': 'yt-dlp: nagsisimula…',
      'ytdlp.checking': 'yt-dlp{v}: tumitingin ng update…',
      'ytdlp.updated': 'Na-update ang yt-dlp sa {v}',
      'ytdlp.ok': 'yt-dlp{v} · up to date',
      'ytdlp.failed': 'yt-dlp{v} · hindi makapag-check ng update (offline?)',
      'ytdlp.dev': 'yt-dlp{v} · naka-off ang self-update sa dev mode',
      'ytdlp.updateBtn': 'I-update ang yt-dlp',

      'upd.checking': 'Tumitingin ng bagong bersyon…',
      'upd.downloading': 'Dina-download ang Grabbit {v}… {p}%',
      'upd.ready': 'Handa na ang Grabbit {v}',
      'upd.restart': 'I-restart para mag-update',
      'upd.latest': 'Up to date na ang Grabbit',
      'upd.error': 'Hindi makapag-check ng update (offline?)',
      'upd.dev': 'Sa naka-install na app lang gumagana ang mga update',
      'upd.notConfigured': 'Hindi naka-on ang automatic update sa build na ito',
      'upd.portable': 'May Grabbit {v} na',
      'upd.download': 'I-download',
      'upd.check': 'Tingnan kung may update',
      'upd.confirmBusy': 'May mga download pang tumatakbo. Titigil ang mga ito kapag nag-restart ngayon. Mag-restart pa rin?',

      'set.title': 'Mga Setting',
      'set.close': 'Isara',
      'set.done': 'Tapos na',
      'set.language': 'Wika',
      'set.languageHint': 'Agad nitong papalitan ang buong app.',
      'set.parallel': 'Dami ng sabay na download',
      'set.parallelHint': 'Maghihintay sa pila ang sobrang download. Gawing 1 kung mabagal ang internet mo.',
      'set.notify': 'Magpakita ng notification kapag tapos na ang download',
      'set.notifyHint': 'Lalabas lang ito kapag nasa background ang Grabbit.',
      'set.sound': 'Tumunog kapag tapos na ang download',
      'set.soundTest': 'Subukan ang tunog',
      'set.signin': 'Tulong sa pag-sign in',
      'set.signinNone': 'Naka-off (walang sign-in)',
      'set.signinHint': 'Minsan kailangang naka-log in ka para sa Instagram, Facebook at X. Piliin ang browser kung saan ka naka-log in. Pinakamaaasahan ang Firefox. Para lang ito sa TikTok, Instagram, Facebook at X, hindi kailanman sa YouTube.',
      'set.browser.firefox': 'Firefox',
      'set.browser.chrome': 'Chrome',
      'set.browser.edge': 'Microsoft Edge',
      'set.browser.brave': 'Brave',
      'set.updates': 'Mga Update',
      'set.version': 'Bersyon ng Grabbit {v}',

      'notify.done': 'Tapos na ang grab',
      'notify.failed': 'Hindi natapos ang grab',

      'help.title': 'Paano gamitin ang Grabbit',
      'help.done': 'Sige',
      'help.body': `
<h3>Mabilis na simula</h3>
<ol class="steps">
  <li><strong>I-paste ang link.</strong> Kopyahin ang link ng video mula sa browser mo, tapos i-click ang <em>I-paste</em> (o pindutin ang Ctrl+V sa kahon). May lalabas na preview para makita mong tama ang video.</li>
  <li><strong>Pumili ng format.</strong> <em>MP4</em> para sa video, <em>MP3</em> para sa audio, <em>WAV</em> para sa lossless na audio.</li>
  <li><strong>Piliin ang kalidad.</strong> Mas mataas, mas malaki at mas malinaw. Kulay abo ang mga opsyong wala sa video.</li>
  <li><strong>I-click ang Kunin na.</strong> Tingnan ang progress sa kanan sa ilalim ng <em>Mga Download</em>. Kapag sinabing Tapos, i-click ang <em>Ipakita ang file</em>.</li>
</ol>

<h3>Aling format ang pipiliin ko?</h3>
<div class="help-grid">
  <div class="help-card"><strong>MP4</strong><span>Video na may tunog. Pinakamainam para sa pag-e-edit, reference clip at panonood offline.</span></div>
  <div class="help-card"><strong>MP3</strong><span>Audio lang, mas maliit ang file. Bagay sa musika at boses. Ang 320 kbps ang pinakamataas na kalidad.</span></div>
  <div class="help-card"><strong>WAV</strong><span>Audio lang, hindi compressed. Malaki ang file, pero perpekto para sa pag-e-edit ng tunog at sound effects.</span></div>
</div>

<h3>Pang-editor (H.264)</h3>
<p>Iwang naka-on ito kung ie-edit mo ang video sa Premiere, CapCut, Vegas o katulad. Pipili ito ng uri ng video na bubuksan ng mga program na iyon nang walang problema. Ang kapalit: hanggang 1080p lang ang H.264 sa YouTube. I-off ito kung gusto mo ng 1440p o 4K.</p>

<h3>Kumuha lang ng bahagi</h3>
<p>I-tick ang <em>Kumuha lang ng bahagi</em> para i-download lang ang maikling parte, gaya ng sound effect.</p>
<ul>
  <li>Isulat ang oras bilang <code>0:30</code> o <code>1:02:15</code> (oras:minuto:segundo).</li>
  <li><em>Mula</em> ang simula at <em>Hanggang</em> ang hinto.</li>
  <li>Hindi ito available sa playlist.</li>
</ul>

<h3>Mga playlist</h3>
<p>Kung bahagi ng playlist ang link mo, lalabas ang isang checkbox. I-tick ito para kunin ang buong playlist. Ise-save ang lahat sa sarili nitong folder. Awtomatikong lalaktawan ang mga private o nabura nang video.</p>

<h3>Thumbnail at cover art</h3>
<p>May dalawang tick box sa ilalim ng mga opsyon sa kalidad:</p>
<ul>
  <li><em>I-save ang thumbnail bilang larawan</em> ay nagse-save ng cover picture ng video bilang <code>.jpg</code> katabi ng file mo. Bagay para sa thumbnail at mood board.</li>
  <li><em>Ilagay ang cover art sa loob ng file</em> ay naglalagay ng larawang iyon sa mismong file, kaya lalabas ito bilang album art sa mga music player. Naka-on ito bilang default para sa MP3. Naka-off ito sa MP4 dahil may mga video editor na itinuturing na dagdag na video track ang larawan: i-on lang ito kung hindi mo ie-edit ang video. Hindi kayang maglaman ng cover art ang WAV.</li>
</ul>

<h3>TikTok, Instagram Reels, Facebook Reels at X (Twitter)</h3>
<p>I-paste ang link gaya ng ginagawa mo sa YouTube. Gumagana rin ang mga share link (tulad ng <code>vm.tiktok.com</code> o <code>fb.watch</code>). Patayo ang mga Reel at TikTok, kaya ang 1080p ay 1080 pixels ang lapad.</p>
<p>Sa X, i-paste ang link ng mismong post (ang address ng tweet). Kung mahigit isang video ang post, may lalabas na kahon para makuha mo silang lahat.</p>
<p>Madalas, kailangang naka-log in ka para makapasok ang Grabbit sa Instagram, Facebook at X. Kung may lumabas na mensahe tungkol sa pag-sign in:</p>
<ol class="steps">
  <li>Mag-log in sa Instagram o Facebook sa browser mo (pinakamaaasahan ang Firefox).</li>
  <li>Sa Grabbit, buksan ang <em>Mga Setting</em> at itakda ang <em>Tulong sa pag-sign in</em> sa browser na iyon.</li>
  <li>Subukan ulit ang link. Kung pumalpak pa rin, isara nang tuluyan ang browser at ulitin.</li>
</ol>
<p>Binabasa lang nito ang sign-in sa sarili mong computer, at ginagamit lang ito para sa TikTok, Instagram, Facebook at X. Hindi makukuha ang mga private na account at video. Video lang ang suportado, hindi ang mga photo post at slideshow. Hindi rin gagana ang profile page: mag-paste ng isang video bawat beses.</p>

<h3>Sabay-sabay na download</h3>
<p>Puwede kang magsimula ng kahit ilang grab. Dalawa ang sabay na tatakbo sa Grabbit bilang default, at <em>Naghihintay sa pila…</em> ang makikita sa iba. Kusa silang magsisimula nang sunud-sunod. Palitan ito sa <em>Mga Setting → Dami ng sabay na download</em> (1 hanggang 5). Gawing 1 kung mabagal ang internet mo. Inaalis ng <em>Kanselahin</em> ang naghihintay na item sa pila.</p>

<h3>Mga Setting</h3>
<ul>
  <li><em>Wika:</em> English, Filipino, Cebuano, Hiligaynon, Pirate o Enchanting Table. Agad na magbabago ang buong app.</li>
  <li><em>Notification:</em> pop-up sa screen mo kapag tapos na ang grab habang nasa background ang Grabbit. Magfa-flash din ang button sa taskbar.</li>
  <li><em>Tunog:</em> maikling tunog kapag tapos na ang grab. Pindutin ang <em>Subukan ang tunog</em> para marinig.</li>
</ul>

<h3>Mga Update</h3>
<p>Tumitingin ang Grabbit ng bagong bersyon sa pagbukas nito.</p>
<ul>
  <li><em>Naka-install na bersyon (Setup):</em> tahimik na magda-download ang update, tapos lalabas ang button na <em>I-restart para mag-update</em> sa ibaba. Puwede mo ring ituloy lang ang paggamit, dahil mag-i-install ito sa susunod na pagsara mo.</li>
  <li><em>Portable na bersyon:</em> hindi ito makakapag-update nang mag-isa, kaya lalabas ang button na <em>I-download</em> kapag may mas bagong bersyon. I-download ang bagong file at iyon na ang gamitin mo sa halip na ang luma.</li>
</ul>
<p>May button ding <em>Tingnan kung may update</em> sa Mga Setting → Mga Update. Hiwalay dito, ang <em>I-update ang yt-dlp</em> sa ibaba ang nagpapanatiling bago sa download engine. Iyon ang unang subukan kapag pumapalpak sa Grabbit ang video na gumagana sa browser mo.</p>

<h3>Saan napupunta ang mga file ko?</h3>
<p>Bilang default, sa <code>Downloads\\Grabbit</code>. I-click ang <em>Palitan</em> para pumili ng ibang folder, o ang <em>Buksan</em> para dumiretso doon. Nasa tab na <em>Kasaysayan</em> ang mga nakaraang download.</p>

<h3>Mabuting malaman</h3>
<ul>
  <li>Hindi puwedeng kunin ang live stream hangga't hindi pa ito tapos.</li>
  <li>Maaaring hindi gumana ang mga private, age-restricted o members-only na video.</li>
  <li>Kumuha lang ng content na may karapatan kang gamitin: sarili mong uploads, royalty-free o Creative Commons na materyal, o ang pinapayagan ng fair-use rules sa lugar mo.</li>
</ul>

<h3>May problema?</h3>
<ul>
  <li><strong>"Hindi available ang video" pero napapanood sa browser:</strong> i-click ang <em>I-update ang yt-dlp</em> sa ibaba ng window, hintaying matapos, saka subukan ulit. Madalas magbago ang YouTube at ito ang nag-aayos sa karamihan ng problema.</li>
  <li><strong>"Mukhang hindi ito link":</strong> siguraduhing nakopya mo ang buong address, na nagsisimula sa <code>https://</code>.</li>
  <li><strong>Hindi pinapasok ng Instagram, Facebook o X ang Grabbit:</strong> tingnan ang bahagi tungkol sa TikTok, Instagram, Facebook at X sa itaas para sa Tulong sa pag-sign in.</li>
  <li><strong>Nakatigil sa "Naghahanda…":</strong> sinusuri ng Grabbit kung may update. Siguraduhing online ka at bigyan ng sandali.</li>
  <li><strong>Hindi lumalabas ang notification:</strong> sa Windows Settings → System → Notifications, tingnan kung pinapayagan ang Grabbit at kung naka-off ang Focus assist / Do not disturb.</li>
  <li><strong>Sinabi ng Windows na "protected your PC" sa unang bukas:</strong> i-click ang <em>More info</em>, tapos <em>Run anyway</em>. Isang beses lang ito mangyayari.</li>
</ul>

<p class="muted help-foot">Tip: pindutin ang <kbd>F1</kbd> anumang oras para buksan ang gabay na ito, at <kbd>Esc</kbd> para isara.</p>`,
    },

    // =====================================================================
    ceb: {
      'tagline': 'I-paste ang link. Kuhaa ang file.',
      'top.help': 'Unsaon paggamit',
      'top.helpTitle': 'Unsaon paggamit ang Grabbit (F1)',
      'top.discord': 'Discord',
      'top.discordTitle': 'Naay pangutana o problema? Apil sa among Discord server',
      'help.discord': `<p><strong>Dili gihapon mugana?</strong> Welcome ang mga pangutana, bug ug ideya: i-click ang <em>Discord</em> sa ibabaw sa window aron moapil sa server.</p>`,
      'top.settings': 'Mga Setting',

      'url.label': 'Link sa video',
      'url.placeholder': 'I-paste ang link gikan sa YouTube, TikTok, Instagram, Facebook, X…',
      'url.paste': 'I-paste',
      'url.pasteTitle': 'I-paste gikan sa clipboard',
      'playlist.text': 'Parte sa playlist kining link. Kuhaa ang <strong>tibuok playlist</strong>.',
      'playlist.textMulti': 'Labaw sa usa ka video kining post. Kuhaa ang <strong>tanan niini</strong>.',

      'preview.empty': 'Mag-paste og link aron makita ang video dinhi',
      'preview.emptyMeta': 'Mogana ang YouTube, TikTok, Instagram Reels, Facebook Reels, X (Twitter) ug kadaghanan sa laing video site',
      'preview.loading': 'Gipangita ang link…',
      'preview.loadingMeta': 'Pwede kini mahurot og pipila ka segundo',
      'preview.notLink': 'Murag dili kini link',
      'preview.playlist': 'Playlist · {n} ka video',
      'preview.upTo': 'hangtod {h}p',
      'site.youtube': 'YouTube',
      'site.tiktok': 'TikTok',
      'site.instagram': 'Instagram',
      'site.facebook': 'Facebook',
      'site.twitter': 'X (Twitter)',

      'format.label': 'Format',
      'format.mp4': 'Video',
      'format.mp3': 'Audio',
      'format.wav': 'Lossless nga audio',
      'quality.label': 'Kalidad',
      'q.best': 'Pinakamaayo nga anaa',
      'q.2160': '4K (2160p)',
      'q.1440': '1440p',
      'q.1080': '1080p (Full HD)',
      'q.720': '720p',
      'q.480': '480p',
      'q.360': '360p',
      'q.320': '320 kbps (pinakamaayo)',
      'q.256': '256 kbps',
      'q.192': '192 kbps',
      'q.128': '128 kbps (pinakagamay)',
      'q.notAvailable': '{label} (wala)',
      'editor.text': 'Pang-editor (H.264)',
      'editor.hint': 'Maayo mogana sa Premiere, CapCut ug Vegas. Hangtod 1080p ra ang H.264 sa YouTube.',

      'thumb.save': 'I-save ang thumbnail isip hulagway',
      'thumb.saveHint': 'Usa ka .jpg file nga ma-save tupad sa imong download',
      'thumb.embed': 'Ibutang ang cover art sulod sa file',
      'thumb.embedHintAudio': 'Ipakita ang thumbnail isip album picture sa mga music player.',
      'thumb.embedHintVideo': 'Pwede nga isipon sa ubang video editor nga dugang video track ang hulagway. Ayaw kini i-on kung i-edit nimo ang video.',

      'trim.text': 'Kuhaa lang ang usa ka bahin',
      'trim.hint': 'Angay para sa sound effects ug mugbo nga clip',
      'trim.from': 'Gikan',
      'trim.to': 'Hangtod',

      'save.label': 'I-save sa',
      'save.change': 'Usba',
      'save.open': 'Ablihi',
      'dialog.chooseFolder': 'Pilia kung asa i-save sa Grabbit ang mga file',
      'grab.go': 'Kuhaa na',
      'grab.getting': 'Nag-andam…',

      'tab.downloads': 'Mga Download',
      'tab.history': 'Kasaysayan',
      'jobs.empty': 'Wala pay gina-download.',
      'jobs.emptyHint': 'Pwede ka magsugod og daghang grab. {n} ang sabay nga modagan sa Grabbit, ug maghulat sa pila ang uban.',
      'hist.empty': 'Wala pay human nga download.',
      'hist.clear': 'Hawani ang kasaysayan',

      'job.starting': 'Nagsugod…',
      'job.queued': 'Naghulat sa pila…',
      'job.cancel': 'Kanselaha',
      'job.cancelling': 'Gikansela…',
      'job.cancelled': 'Nakansela',
      'job.showFile': 'Ipakita ang file',
      'job.dismiss': 'Isira',
      'job.fileGone': 'Nabalhin o nabura ang file',
      'job.downloading': 'Gina-download…',
      'job.cutting': 'Gi-cut ang imong clip…',
      'job.videoOf': 'Video {i} sa {n}',
      'job.videoN': 'Video {i}',
      'job.left': '{eta} na lang',
      'job.done': 'Human · na-save',
      'job.doneN': 'Human · {n} ka file ang na-save',
      'job.skipped': '{n} ang gilaktawan (private o wala)',
      'pp.join': 'Gihiusa ang video ug audio…',
      'pp.audio': 'Gi-convert ang audio…',
      'pp.mp4': 'Gitapos ang MP4…',
      'pp.meta': 'Gibutang ang title info…',
      'pp.thumb': 'Gibutang ang thumbnail…',
      'pp.save': 'Gi-save…',
      'pp.finish': 'Gitapos…',

      'err.pasteFirst': 'Mag-paste una og link.',
      'err.notLink': 'Murag dili kini link.',
      'err.live': 'Dili makuha ang live stream samtang naka-live pa.',
      'err.ffmpeg': 'Nawala ang ffmpeg, mao nga dili mogana ang MP3/WAV conversion ug HD nga video. I-reinstall ang Grabbit.',
      'err.multi': 'Labaw sa usa ka video kining post. I-tick ang kahon sa ibabaw sa preview aron makuha ang tanan.',
      'err.profile': 'Profile o koleksyon kining link, dili usa ka video. I-paste ang link sa usa ka video.',
      'e.trimStart': 'Ang sinugdan kinahanglan murag 45, 1:30 o 1:02:03.',
      'e.trimEnd': 'Ang kataposan kinahanglan murag 45, 1:30 o 1:02:03.',
      'e.trimEmpty': 'Butangi og sinugdan, kataposan, o duha.',
      'e.trimOrder': 'Ang kataposan kinahanglan mas ulahi kaysa sa sinugdan.',
      'e.trimPast': 'Lapas na sa gidugayon sa video ang sinugdan.',
      'e.urlEmpty': 'Mag-paste una og link.',
      'e.urlLong': 'Taas kaayo kana nga link.',
      'e.urlBad': 'Murag dili kini link.',
      'e.urlProto': 'http ug https nga link ra ang suportado.',
      'e.noFolder': 'Pilia kung asa i-save.',
      'e.instagram': 'Wala gipasudla sa Instagram ang Grabbit. Ablihi ang Mga Setting → Tabang sa pag-sign in, pilia ang browser diin naka-log in ka sa Instagram, dayon sulayi ug usab.',
      'e.facebook': 'Wala gipasudla sa Facebook ang Grabbit. Ablihi ang Mga Setting → Tabang sa pag-sign in, pilia ang browser diin naka-log in ka sa Facebook, dayon sulayi ug usab. Dili makuha ang mga private nga video.',
      'e.tiktok': 'Wala gipaagi sa TikTok ang Grabbit. I-click ang "I-update ang yt-dlp" sa ubos ug sulayi ug usab. Dili makuha ang mga private nga account.',
      'e.twitter': 'Wala gipasudla sa X ang Grabbit. Ablihi ang Mga Setting → Tabang sa pag-sign in, pilia ang browser diin naka-log in ka sa X, dayon sulayi ug usab. Dili makuha ang mga protected nga account.',
      'e.noVideo': 'Walay video kana nga post.',
      'e.private': 'Private kini nga video.',
      'e.unavailable': 'Wala ang video. Kung makita nimo kini sa browser, i-click ang "I-update ang yt-dlp" sa ubos ug sulayi ug usab.',
      'e.age': 'May age restriction kini nga video ug kinahanglan og naka-sign in nga account.',
      'e.bot': 'Nangayo og bot check ang YouTube. Paghulat sa makadiyot, dayon sulayi ug usab.',
      'e.members': 'Para sa mga miyembro ra kini nga video.',
      'e.notStarted': 'Wala pa magsugod kini nga video.',
      'e.unsupported': 'Dili suportado ang site o klase sa link.',
      'e.network': 'Naay problema sa network. Tan-awa ang imong internet ug sulayi ug usab.',
      'e.http403': 'Gi-block ang download (403). I-click ang "I-update ang yt-dlp" sa ubos ug sulayi ug usab.',
      'e.diskFull': 'Puno na ang imong drive.',
      'e.ytdlpMissing': 'Nawala ang yt-dlp. I-reinstall ang Grabbit.',
      'e.readFail': 'Dili mabasa kana nga link.',
      'e.infoFail': 'Dili mabasa ang info sa video.',
      'e.startFail': 'Dili masugdan ang yt-dlp. I-reinstall ang Grabbit.',

      'ytdlp.starting': 'yt-dlp: nagsugod…',
      'ytdlp.checking': 'yt-dlp{v}: nagsusi og update…',
      'ytdlp.updated': 'Na-update ang yt-dlp ngadto sa {v}',
      'ytdlp.ok': 'yt-dlp{v} · up to date',
      'ytdlp.failed': 'yt-dlp{v} · wala maka-check og update (offline?)',
      'ytdlp.dev': 'yt-dlp{v} · naka-off ang self-update sa dev mode',
      'ytdlp.updateBtn': 'I-update ang yt-dlp',

      'upd.checking': 'Nagsusi og bag-ong bersyon…',
      'upd.downloading': 'Gina-download ang Grabbit {v}… {p}%',
      'upd.ready': 'Andam na ang Grabbit {v}',
      'upd.restart': 'I-restart aron mag-update',
      'upd.latest': 'Up to date na ang Grabbit',
      'upd.error': 'Wala maka-check og update (offline?)',
      'upd.dev': 'Sa na-install nga app ra mogana ang mga update',
      'upd.notConfigured': 'Dili naka-on ang automatic update niini nga build',
      'upd.portable': 'Naa na ang Grabbit {v}',
      'upd.download': 'I-download',
      'upd.check': 'Susiha kung naay update',
      'upd.confirmBusy': 'Naa pay mga download nga nagdagan. Mohunong kini kung mag-restart karon. Mag-restart gihapon?',

      'set.title': 'Mga Setting',
      'set.close': 'Isira',
      'set.done': 'Human na',
      'set.language': 'Pinulongan',
      'set.languageHint': 'Dayon nga usbon ang tibuok app.',
      'set.parallel': 'Pila ka download ang sabay',
      'set.parallelHint': 'Maghulat sa pila ang sobra nga download. Himoa nga 1 kung hinay ang imong internet.',
      'set.notify': 'Magpakita og notification kung human na ang download',
      'set.notifyHint': 'Makita ra kini kung naa sa background ang Grabbit.',
      'set.sound': 'Mutingog kung human na ang download',
      'set.soundTest': 'Sulayi ang tingog',
      'set.signin': 'Tabang sa pag-sign in',
      'set.signinNone': 'Naka-off (walay sign-in)',
      'set.signinHint': 'Usahay kinahanglan nga naka-log in ka para sa Instagram, Facebook ug X. Pilia ang browser diin naka-log in ka. Ang Firefox ang pinakasaligan. Para ra kini sa TikTok, Instagram, Facebook ug X, dili gayod sa YouTube.',
      'set.browser.firefox': 'Firefox',
      'set.browser.chrome': 'Chrome',
      'set.browser.edge': 'Microsoft Edge',
      'set.browser.brave': 'Brave',
      'set.updates': 'Mga Update',
      'set.version': 'Bersyon sa Grabbit {v}',

      'notify.done': 'Human na ang grab',
      'notify.failed': 'Wala mahuman ang grab',

      'help.title': 'Unsaon paggamit ang Grabbit',
      'help.done': 'Sige',
      'help.body': `
<h3>Dali nga sinugdan</h3>
<ol class="steps">
  <li><strong>I-paste ang link.</strong> Kopyaha ang link sa video gikan sa imong browser, dayon i-click ang <em>I-paste</em> (o pindota ang Ctrl+V sa kahon). Mogawas ang preview aron makita nimo nga husto ang video.</li>
  <li><strong>Pilia ang format.</strong> <em>MP4</em> para sa video, <em>MP3</em> para sa audio, <em>WAV</em> para sa lossless nga audio.</li>
  <li><strong>Pilia ang kalidad.</strong> Mas taas, mas dako ug mas klaro. Abohon ang mga kapilian nga wala sa video.</li>
  <li><strong>I-click ang Kuhaa na.</strong> Tan-awa ang progress sa tuo ilawom sa <em>Mga Download</em>. Kung moingon og Human, i-click ang <em>Ipakita ang file</em>.</li>
</ol>

<h3>Unsang format ang pilion nako?</h3>
<div class="help-grid">
  <div class="help-card"><strong>MP4</strong><span>Video nga naay tingog. Pinakamaayo para sa pag-edit, reference clip ug pagtan-aw offline.</span></div>
  <div class="help-card"><strong>MP3</strong><span>Audio lang, mas gamay ang file. Maayo para sa musika ug tingog. Ang 320 kbps ang pinakamaayong kalidad.</span></div>
  <div class="help-card"><strong>WAV</strong><span>Audio lang, dili compressed. Dako ang file, apan perpekto para sa pag-edit sa tunog ug sound effects.</span></div>
</div>

<h3>Pang-editor (H.264)</h3>
<p>Ayaw tangtanga ang pag-on niini kung i-edit nimo ang video sa Premiere, CapCut, Vegas o susama. Mopili kini og klase sa video nga maablihan sa maong mga program nga walay problema. Ang kapuslanan: hangtod 1080p ra ang H.264 sa YouTube. I-off kini kung gusto nimo og 1440p o 4K.</p>

<h3>Kuhaa lang ang usa ka bahin</h3>
<p>I-tick ang <em>Kuhaa lang ang usa ka bahin</em> aron i-download lang ang mugbo nga parte, sama sa sound effect.</p>
<ul>
  <li>Isulat ang oras nga murag <code>0:30</code> o <code>1:02:15</code> (oras:minuto:segundo).</li>
  <li><em>Gikan</em> ang sinugdan ug <em>Hangtod</em> ang hunonganan.</li>
  <li>Dili kini available sa playlist.</li>
</ul>

<h3>Mga playlist</h3>
<p>Kung parte sa playlist ang imong link, mogawas ang usa ka checkbox. I-tick kini aron kuhaon ang tibuok playlist. I-save ang tanan sa kaugalingong folder niini. Awtomatikong laktawan ang mga private o nabura nga video.</p>

<h3>Thumbnail ug cover art</h3>
<p>Naay duha ka tick box ilawom sa mga kapilian sa kalidad:</p>
<ul>
  <li><em>I-save ang thumbnail isip hulagway</em> mo-save sa cover picture sa video isip <code>.jpg</code> tupad sa imong file. Magamit para sa thumbnail ug mood board.</li>
  <li><em>Ibutang ang cover art sulod sa file</em> mobutang niana nga hulagway sulod mismo sa file, mao nga makita kini isip album art sa mga music player. Naka-on kini sa MP3 pinaagi sa default. Naka-off kini sa MP4 kay ang ubang video editor nagtuo nga dugang video track ang hulagway: i-on lang kini kung dili nimo i-edit ang video. Dili makabutang og cover art ang WAV.</li>
</ul>

<h3>TikTok, Instagram Reels, Facebook Reels ug X (Twitter)</h3>
<p>I-paste ang link sama sa imong ginabuhat sa YouTube. Mogana usab ang mga share link (sama sa <code>vm.tiktok.com</code> o <code>fb.watch</code>). Patindog ang mga Reel ug TikTok, mao nga ang 1080p kay 1080 ka pixel ang gilapdon.</p>
<p>Sa X, i-paste ang link sa mismong post (ang address sa tweet). Kung labaw sa usa ka video ang post, mogawas ang usa ka kahon aron makuha nimo ang tanan.</p>
<p>Kasagaran, kinahanglan nga naka-log in ka aron makasulod ang Grabbit sa Instagram, Facebook ug X. Kung naay mogawas nga mensahe bahin sa pag-sign in:</p>
<ol class="steps">
  <li>Mag-log in sa Instagram o Facebook sa imong browser (ang Firefox ang pinakasaligan).</li>
  <li>Sa Grabbit, ablihi ang <em>Mga Setting</em> ug i-set ang <em>Tabang sa pag-sign in</em> ngadto sa maong browser.</li>
  <li>Sulayi pag-usab ang link. Kung napakyas gihapon, isira hingpit ang browser ug balika.</li>
</ol>
<p>Basahon ra niini ang sign-in sa imong kaugalingong computer, ug gamiton lang kini para sa TikTok, Instagram, Facebook ug X. Dili makuha ang mga private nga account ug video. Video ra ang suportado, dili ang mga photo post ug slideshow. Dili usab mogana ang profile page: mag-paste og usa ka video matag higayon.</p>

<h3>Daghang download sa usa ka higayon</h3>
<p>Pwede ka magsugod og kapila ka grab. Duha ang sabay nga modagan sa Grabbit pinaagi sa default, ug <em>Naghulat sa pila…</em> ang makita sa uban. Kusa silang magsugod nga sunod-sunod. Usba kini sa <em>Mga Setting → Pila ka download ang sabay</em> (1 hangtod 5). Himoa nga 1 kung hinay ang imong internet. Ang <em>Kanselaha</em> mopahawa sa naghulat nga item gikan sa pila.</p>

<h3>Mga Setting</h3>
<ul>
  <li><em>Pinulongan:</em> English, Filipino, Cebuano, Hiligaynon, Pirate o Enchanting Table. Dayon nga mausab ang tibuok app.</li>
  <li><em>Notification:</em> pop-up sa imong screen kung human na ang grab samtang naa sa background ang Grabbit. Mo-flash usab ang button sa taskbar.</li>
  <li><em>Tingog:</em> mugbong tingog kung human na ang grab. Pindota ang <em>Sulayi ang tingog</em> aron madunggan.</li>
</ul>

<h3>Mga Update</h3>
<p>Nagsusi ang Grabbit og bag-ong bersyon inig abli niini.</p>
<ul>
  <li><em>Na-install nga bersyon (Setup):</em> hilom nga ma-download ang update, dayon mogawas ang button nga <em>I-restart aron mag-update</em> sa ubos. Pwede usab nimo nga ipadayon lang ang paggamit, kay ma-install kini sa sunod nimo nga pagsira.</li>
  <li><em>Portable nga bersyon:</em> dili kini maka-update sa kaugalingon, mao nga mogawas ang button nga <em>I-download</em> kung naay mas bag-ong bersyon. I-download ang bag-ong file ug kana na ang gamita puli sa daan.</li>
</ul>
<p>Naay button usab nga <em>Susiha kung naay update</em> sa Mga Setting → Mga Update. Gawas niana, ang <em>I-update ang yt-dlp</em> sa ubos ang nagpabilin nga bag-o sa download engine. Kana ang unang sulayan kung napakyas sa Grabbit ang video nga mogana sa imong browser.</p>

<h3>Asa moadto ang akong mga file?</h3>
<p>Pinaagi sa default, sa <code>Downloads\\Grabbit</code>. I-click ang <em>Usba</em> aron mopili og laing folder, o ang <em>Ablihi</em> aron direkta moadto didto. Ang mga naunang download naa sa tab nga <em>Kasaysayan</em>.</p>

<h3>Maayong mahibaw-an</h3>
<ul>
  <li>Dili makuha ang live stream hangtod dili pa kini human.</li>
  <li>Posibleng dili mogana ang mga private, age-restricted o members-only nga video.</li>
  <li>Pagkuha lang og content nga naa kay katungod gamiton: imong kaugalingong uploads, royalty-free o Creative Commons nga materyal, o unsay gitugotan sa fair-use rules sa inyong lugar.</li>
</ul>

<h3>Naay problema?</h3>
<ul>
  <li><strong>"Wala ang video" apan makita sa browser:</strong> i-click ang <em>I-update ang yt-dlp</em> sa ubos sa bintana, hulata nga mahuman, dayon sulayi pag-usab. Kanunay mausab ang YouTube ug kini ang mag-ayo sa kadaghanang problema.</li>
  <li><strong>"Murag dili kini link":</strong> siguroha nga nakopya nimo ang tibuok address, nga magsugod sa <code>https://</code>.</li>
  <li><strong>Wala gipasudla sa Instagram, Facebook o X ang Grabbit:</strong> tan-awa ang bahin sa TikTok, Instagram, Facebook ug X sa ibabaw para sa Tabang sa pag-sign in.</li>
  <li><strong>Natapok sa "Nag-andam…":</strong> nagsusi ang Grabbit og update. Siguroha nga online ka ug hatagi og makadiyot.</li>
  <li><strong>Dili mogawas ang notification:</strong> sa Windows Settings → System → Notifications, tan-awa kung gitugotan ang Grabbit ug kung naka-off ang Focus assist / Do not disturb.</li>
  <li><strong>Miingon ang Windows og "protected your PC" sa unang abli:</strong> i-click ang <em>More info</em>, dayon <em>Run anyway</em>. Kausa ra kini mahitabo.</li>
</ul>

<p class="muted help-foot">Tip: pindota ang <kbd>F1</kbd> bisan kanus-a aron maablihan kini nga giya, ug <kbd>Esc</kbd> aron maisira.</p>`,
    },

    // =====================================================================
    // Hiligaynon (Ilonggo). First draft: a native speaker should skim it.
    // =====================================================================
    hil: {
      'tagline': 'I-paste ang link. Kuhaa ang file.',
      'top.help': 'Paano gamiton',
      'top.helpTitle': 'Paano gamiton ang Grabbit (F1)',
      'top.discord': 'Discord',
      'top.discordTitle': 'May pamangkot ukon problema? Sakop sa amon Discord server',
      'help.discord': `<p><strong>Indi pa gihapon maayo?</strong> Welcome ang mga pamangkot, bug kag ideya: i-click ang <em>Discord</em> sa ibabaw sang window agud makasakop sa server.</p>`,
      'top.settings': 'Mga Setting',

      'url.label': 'Link sang video',
      'url.placeholder': 'I-paste ang link halin sa YouTube, TikTok, Instagram, Facebook, X…',
      'url.paste': 'I-paste',
      'url.pasteTitle': 'I-paste halin sa clipboard',
      'playlist.text': 'Bahin sang playlist ini nga link. Kuhaa ang <strong>bug-os nga playlist</strong>.',
      'playlist.textMulti': 'Labaw sa isa ka video ini nga post. Kuhaa ang <strong>tanan sini</strong>.',

      'preview.empty': 'Mag-paste sang link agud makita ang video diri',
      'preview.emptyMeta': 'Maga-andar ang YouTube, TikTok, Instagram Reels, Facebook Reels, X (Twitter) kag kadam pa nga video site',
      'preview.loading': 'Ginapangita ang link…',
      'preview.loadingMeta': 'Mahimo ini mag-abot sang pila ka segundo',
      'preview.notLink': 'Daw indi ini link',
      'preview.playlist': 'Playlist · {n} ka video',
      'preview.upTo': 'tubtob {h}p',
      'site.youtube': 'YouTube',
      'site.tiktok': 'TikTok',
      'site.instagram': 'Instagram',
      'site.facebook': 'Facebook',
      'site.twitter': 'X (Twitter)',

      'format.label': 'Format',
      'format.mp4': 'Video',
      'format.mp3': 'Audio',
      'format.wav': 'Lossless nga audio',
      'quality.label': 'Kalidad',
      'q.best': 'Pinakamaayo nga may-ara',
      'q.2160': '4K (2160p)',
      'q.1440': '1440p',
      'q.1080': '1080p (Full HD)',
      'q.720': '720p',
      'q.480': '480p',
      'q.360': '360p',
      'q.320': '320 kbps (pinakamaayo)',
      'q.256': '256 kbps',
      'q.192': '192 kbps',
      'q.128': '128 kbps (pinakagamay)',
      'q.notAvailable': '{label} (wala)',
      'editor.text': 'Pang-editor (H.264)',
      'editor.hint': 'Maayo ini sa Premiere, CapCut kag Vegas. Tubtob 1080p lang ang H.264 sa YouTube.',

      'thumb.save': 'I-save ang thumbnail subong larawan',
      'thumb.saveHint': 'Isa ka .jpg file nga ma-save sa tupad sang imo download',
      'thumb.embed': 'Ibutang ang cover art sa sulod sang file',
      'thumb.embedHintAudio': 'Ipakita ang thumbnail subong album picture sa mga music player.',
      'thumb.embedHintVideo': 'Ang iban nga video editor nagakabig sang larawan subong dugang nga video track. Indi ini i-on kon ieedit mo ang video.',

      'trim.text': 'Kuhaa lang ang isa ka bahin',
      'trim.hint': 'Maayo para sa sound effects kag mubo nga clip',
      'trim.from': 'Halin',
      'trim.to': 'Tubtob',

      'save.label': 'I-save sa',
      'save.change': 'Ilisi',
      'save.open': 'Buksi',
      'dialog.chooseFolder': 'Pilia kon diin i-save sang Grabbit ang mga file',
      'grab.go': 'Kuhaa na',
      'grab.getting': 'Nagahanda…',

      'tab.downloads': 'Mga Download',
      'tab.history': 'Kasaysayan',
      'jobs.empty': 'Wala pa sing ginadownload.',
      'jobs.emptyHint': 'Mahimo ka magsugod sang pila ka grab. {n} ang sabay nga mapadalagan sang Grabbit, kag ang iban magahulat sa pila.',
      'hist.empty': 'Wala pa sing natapos nga download.',
      'hist.clear': 'Hawanon ang kasaysayan',

      'job.starting': 'Nagasugod…',
      'job.queued': 'Nagahulat sa pila…',
      'job.cancel': 'Kanselaha',
      'job.cancelling': 'Ginakansela…',
      'job.cancelled': 'Nakansela',
      'job.showFile': 'Ipakita ang file',
      'job.dismiss': 'Sarahi',
      'job.fileGone': 'Nabalhin ukon nabura ang file',
      'job.downloading': 'Ginadownload…',
      'job.cutting': 'Ginaputol ang imo clip…',
      'job.videoOf': 'Video {i} sa {n}',
      'job.videoN': 'Video {i}',
      'job.left': '{eta} na lang',
      'job.done': 'Tapos na · na-save',
      'job.doneN': 'Tapos na · {n} ka file ang na-save',
      'job.skipped': '{n} ang gintaltal (private ukon wala na)',
      'pp.join': 'Ginahiusa ang video kag audio…',
      'pp.audio': 'Ginaconvert ang audio…',
      'pp.mp4': 'Ginatapos ang MP4…',
      'pp.meta': 'Ginabutang ang title info…',
      'pp.thumb': 'Ginabutang ang thumbnail…',
      'pp.save': 'Ginasave…',
      'pp.finish': 'Ginatapos…',

      'err.pasteFirst': 'Mag-paste anay sang link.',
      'err.notLink': 'Daw indi ini link.',
      'err.live': 'Indi makuha ang live stream samtang naka-live pa.',
      'err.ffmpeg': 'Nawala ang ffmpeg, gani indi maga-andar ang MP3/WAV conversion kag HD nga video. I-reinstall ang Grabbit.',
      'err.multi': 'Labaw sa isa ka video ini nga post. I-tick ang kahon sa ibabaw sang preview agud makuha ang tanan.',
      'err.profile': 'Profile ukon koleksyon ini nga link, indi isa ka video. I-paste ang link sang isa ka video.',
      'e.trimStart': 'Ang sinugdan dapat daw 45, 1:30 ukon 1:02:03.',
      'e.trimEnd': 'Ang katapusan dapat daw 45, 1:30 ukon 1:02:03.',
      'e.trimEmpty': 'Butangi sang sinugdan, katapusan, ukon duha.',
      'e.trimOrder': 'Ang katapusan dapat mas ulihi sang sinugdan.',
      'e.trimPast': 'Lampas na sa kaayuhon sang video ang sinugdan.',
      'e.urlEmpty': 'Mag-paste anay sang link.',
      'e.urlLong': 'Mahaba gid ina nga link.',
      'e.urlBad': 'Daw indi ini link.',
      'e.urlProto': 'http kag https nga link lang ang suportado.',
      'e.noFolder': 'Pilia kon diin i-save.',
      'e.instagram': 'Wala ginpasulod sang Instagram ang Grabbit. Buksi ang Mga Setting → Bulig sa pag-sign in, pilia ang browser nga diin naka-log in ka sa Instagram, kag tilawi liwat.',
      'e.facebook': 'Wala ginpasulod sang Facebook ang Grabbit. Buksi ang Mga Setting → Bulig sa pag-sign in, pilia ang browser nga diin naka-log in ka sa Facebook, kag tilawi liwat. Indi makuha ang mga private nga video.',
      'e.tiktok': 'Wala ginpaagi sang TikTok ang Grabbit. I-click ang "I-update ang yt-dlp" sa idalom kag tilawi liwat. Indi makuha ang mga private nga account.',
      'e.twitter': 'Wala ginpasulod sang X ang Grabbit. Buksi ang Mga Setting → Bulig sa pag-sign in, pilia ang browser nga diin naka-log in ka sa X, kag tilawi liwat. Indi makuha ang mga protected nga account.',
      'e.noVideo': 'Wala sing video ina nga post.',
      'e.private': 'Private ini nga video.',
      'e.unavailable': 'Wala ang video. Kon makita mo ini sa browser, i-click ang "I-update ang yt-dlp" sa idalom kag tilawi liwat.',
      'e.age': 'May age restriction ini nga video kag kinahanglan sang naka-sign in nga account.',
      'e.bot': 'Nagapangayo sang bot check ang YouTube. Hulat anay sang malip-ot, kag tilawi liwat.',
      'e.members': 'Para sa mga miyembro lang ini nga video.',
      'e.notStarted': 'Wala pa makasugod ini nga video.',
      'e.unsupported': 'Indi suportado ang site ukon klase sang link.',
      'e.network': 'May problema sa network. Tan-awa ang imo internet kag tilawi liwat.',
      'e.http403': 'Gin-block ang download (403). I-click ang "I-update ang yt-dlp" sa idalom kag tilawi liwat.',
      'e.diskFull': 'Puno na ang imo drive.',
      'e.ytdlpMissing': 'Nawala ang yt-dlp. I-reinstall ang Grabbit.',
      'e.readFail': 'Indi mabasa ina nga link.',
      'e.infoFail': 'Indi mabasa ang info sang video.',
      'e.startFail': 'Indi masugdan ang yt-dlp. I-reinstall ang Grabbit.',

      'ytdlp.starting': 'yt-dlp: nagasugod…',
      'ytdlp.checking': 'yt-dlp{v}: nagasuri sang update…',
      'ytdlp.updated': 'Na-update ang yt-dlp sa {v}',
      'ytdlp.ok': 'yt-dlp{v} · up to date',
      'ytdlp.failed': 'yt-dlp{v} · wala makasuri sang update (offline?)',
      'ytdlp.dev': 'yt-dlp{v} · naka-off ang self-update sa dev mode',
      'ytdlp.updateBtn': 'I-update ang yt-dlp',

      'upd.checking': 'Nagasuri sang bag-o nga bersyon…',
      'upd.downloading': 'Ginadownload ang Grabbit {v}… {p}%',
      'upd.ready': 'Handa na ang Grabbit {v}',
      'upd.restart': 'I-restart agud mag-update',
      'upd.latest': 'Up to date na ang Grabbit',
      'upd.error': 'Wala makasuri sang update (offline?)',
      'upd.dev': 'Sa na-install nga app lang maga-andar ang mga update',
      'upd.notConfigured': 'Indi naka-on ang automatic update sa sini nga build',
      'upd.portable': 'May-ara na ang Grabbit {v}',
      'upd.download': 'I-download',
      'upd.check': 'Usisaa kon may update',
      'upd.confirmBusy': 'May mga download pa nga nagadalagan. Mahunong ini kon mag-restart subong. Mag-restart gihapon?',

      'set.title': 'Mga Setting',
      'set.close': 'Sarahi',
      'set.done': 'Tapos na',
      'set.language': 'Pinulongan',
      'set.languageHint': 'Dayon nga mag-usab ang bug-os nga app.',
      'set.parallel': 'Pila ka download ang sabay',
      'set.parallelHint': 'Ang sobra nga download magahulat sa pila. Himoa nga 1 kon hinay ang imo internet.',
      'set.notify': 'Magpakita sang notification kon tapos na ang download',
      'set.notifyHint': 'Makita lang ini kon yara sa background ang Grabbit.',
      'set.sound': 'Magtunog kon tapos na ang download',
      'set.soundTest': 'Tilawi ang tunog',
      'set.signin': 'Bulig sa pag-sign in',
      'set.signinNone': 'Naka-off (wala sing sign-in)',
      'set.signinHint': 'Kon minsan kinahanglan nga naka-log in ka para sa Instagram, Facebook kag X. Pilia ang browser nga diin naka-log in ka. Ang Firefox ang pinakasaligan. Para lang ini sa TikTok, Instagram, Facebook kag X, indi gid sa YouTube.',
      'set.browser.firefox': 'Firefox',
      'set.browser.chrome': 'Chrome',
      'set.browser.edge': 'Microsoft Edge',
      'set.browser.brave': 'Brave',
      'set.updates': 'Mga Update',
      'set.version': 'Bersyon sang Grabbit {v}',

      'notify.done': 'Tapos na ang grab',
      'notify.failed': 'Wala natapos ang grab',

      'help.title': 'Paano gamiton ang Grabbit',
      'help.done': 'Sige',
      'help.body': `
<h3>Madali nga pagsugod</h3>
<ol class="steps">
  <li><strong>I-paste ang link.</strong> Kopyaha ang link sang video halin sa imo browser, dayon i-click ang <em>I-paste</em> (ukon pinduta ang Ctrl+V sa kahon). Maggua ang preview agud makita mo nga husto ang video.</li>
  <li><strong>Pilia ang format.</strong> <em>MP4</em> para sa video, <em>MP3</em> para sa audio, <em>WAV</em> para sa lossless nga audio.</li>
  <li><strong>Pilia ang kalidad.</strong> Mas mataas, mas daku kag mas klaro. Ang mga kapilian nga wala sa video ginapaabo.</li>
  <li><strong>I-click ang Kuhaa na.</strong> Tan-awa ang progress sa tuo sa idalom sang <em>Mga Download</em>. Kon nagasiling nga Tapos na, i-click ang <em>Ipakita ang file</em>.</li>
</ol>

<h3>Ano nga format ang pilion ko?</h3>
<div class="help-grid">
  <div class="help-card"><strong>MP4</strong><span>Video nga may tunog. Pinakamaayo para sa pag-edit, reference clip kag pagtan-aw offline.</span></div>
  <div class="help-card"><strong>MP3</strong><span>Audio lang, mas gamay ang file. Maayo para sa musika kag tingog. Ang 320 kbps ang pinakamaayo nga kalidad.</span></div>
  <div class="help-card"><strong>WAV</strong><span>Audio lang, indi compressed. Daku ang file, pero perpekto para sa pag-edit sang tunog kag sound effects.</span></div>
</div>

<h3>Pang-editor (H.264)</h3>
<p>Indi ini kuhaa sa pag-on kon ieedit mo ang video sa Premiere, CapCut, Vegas ukon pareho. Magpili ini sang klase sang video nga mabuksan sang sini nga mga program nga wala sing problema. Ang kapuslanan: tubtob 1080p lang ang H.264 sa YouTube. I-off ini kon gusto mo sang 1440p ukon 4K.</p>

<h3>Kuhaa lang ang isa ka bahin</h3>
<p>I-tick ang <em>Kuhaa lang ang isa ka bahin</em> agud i-download lang ang mubo nga parte, pareho sang sound effect.</p>
<ul>
  <li>Isulat ang oras nga daw <code>0:30</code> ukon <code>1:02:15</code> (oras:minuto:segundo).</li>
  <li><em>Halin</em> ang sinugdan kag <em>Tubtob</em> ang hunungan.</li>
  <li>Indi ini available sa playlist.</li>
</ul>

<h3>Mga playlist</h3>
<p>Kon bahin sang playlist ang imo link, magagua ang isa ka checkbox. I-tick ini agud kuhaon ang bug-os nga playlist. I-save ang tanan sa kaugalingon nga folder sini. Ang mga private ukon nabura nga video awtomatiko nga ginataltal.</p>

<h3>Thumbnail kag cover art</h3>
<p>May duha ka tick box sa idalom sang mga kapilian sa kalidad:</p>
<ul>
  <li><em>I-save ang thumbnail subong larawan</em> mag-save sang cover picture sang video subong <code>.jpg</code> sa tupad sang imo file. Magamit para sa thumbnail kag mood board.</li>
  <li><em>Ibutang ang cover art sa sulod sang file</em> magabutang sina nga larawan sa mismong file, gani makita ini subong album art sa mga music player. Naka-on ini sa MP3 pinaagi sa default. Naka-off ini sa MP4 kay ang iban nga video editor nagahunahuna nga dugang video track ang larawan: i-on lang ini kon indi mo ieedit ang video. Indi makabutang sang cover art ang WAV.</li>
</ul>

<h3>TikTok, Instagram Reels, Facebook Reels kag X (Twitter)</h3>
<p>I-paste ang link pareho sang ginahimo mo sa YouTube. Maga-andar man ang mga share link (pareho sang <code>vm.tiktok.com</code> ukon <code>fb.watch</code>). Patindog ang mga Reel kag TikTok, gani ang 1080p amo ang 1080 ka pixel nga kalapad.</p>
<p>Sa X, i-paste ang link sang mismong post (ang address sang tweet). Kon labaw sa isa ka video ang post, magagua ang isa ka kahon agud makuha mo ang tanan.</p>
<p>Kadaanan, kinahanglan nga naka-log in ka agud makasulod ang Grabbit sa Instagram, Facebook kag X. Kon may magagua nga mensahe parte sa pag-sign in:</p>
<ol class="steps">
  <li>Mag-log in sa Instagram ukon Facebook sa imo browser (ang Firefox ang pinakasaligan).</li>
  <li>Sa Grabbit, buksi ang <em>Mga Setting</em> kag i-set ang <em>Bulig sa pag-sign in</em> sa sina nga browser.</li>
  <li>Tilawi liwat ang link. Kon napaslawan gihapon, sarahi gid ang browser kag balika.</li>
</ol>
<p>Basahon lang sini ang sign-in sa imo kaugalingon nga computer, kag gamiton lang ini para sa TikTok, Instagram, Facebook kag X. Indi makuha ang mga private nga account kag video. Video lang ang suportado, indi ang mga photo post kag slideshow. Indi man maga-andar ang profile page: mag-paste sang isa ka video sa kada higayon.</p>

<h3>Madamo nga download sa isa ka higayon</h3>
<p>Mahimo ka magsugod sang pila ka grab. Duha ang sabay nga mapadalagan sang Grabbit pinaagi sa default, kag <em>Nagahulat sa pila…</em> ang makita sa iban. Kusa sila magasugod nga sunod-sunod. Ilisi ini sa <em>Mga Setting → Pila ka download ang sabay</em> (1 tubtob 5). Himoa nga 1 kon hinay ang imo internet. Ang <em>Kanselaha</em> magaguwa sang nagahulat nga item halin sa pila.</p>

<h3>Mga Setting</h3>
<ul>
  <li><em>Pinulongan:</em> English, Filipino, Cebuano, Hiligaynon, Pirate ukon Enchanting Table. Dayon nga mag-usab ang bug-os nga app.</li>
  <li><em>Notification:</em> pop-up sa imo screen kon tapos na ang grab samtang yara sa background ang Grabbit. Mag-flash man ang button sa taskbar.</li>
  <li><em>Tunog:</em> mubo nga tunog kon tapos na ang grab. Pinduta ang <em>Tilawi ang tunog</em> agud mabatian.</li>
</ul>

<h3>Mga Update</h3>
<p>Nagasuri ang Grabbit sang bag-o nga bersyon pag-abri sini.</p>
<ul>
  <li><em>Na-install nga bersyon (Setup):</em> hilom nga ma-download ang update, dayon magagua ang button nga <em>I-restart agud mag-update</em> sa idalom. Mahimo man nga ipadayon mo lang ang paggamit, kay ma-install ini sa masunod mo nga pagsira.</li>
  <li><em>Portable nga bersyon:</em> indi ini makapa-update sa kaugalingon, gani magagua ang button nga <em>I-download</em> kon may mas bag-o nga bersyon. I-download ang bag-o nga file kag amo na ang gamita sa lugar sang daan.</li>
</ul>
<p>May button man nga <em>Usisaa kon may update</em> sa Mga Setting → Mga Update. Luwas sina, ang <em>I-update ang yt-dlp</em> sa idalom amo ang nagapabilin nga bag-o sang download engine. Amo na ina ang una nga tilawan kon napaslawan ang Grabbit sa video nga maga-andar sa imo browser.</p>

<h3>Diin makadto ang akon mga file?</h3>
<p>Pinaagi sa default, sa <code>Downloads\\Grabbit</code>. I-click ang <em>Ilisi</em> agud magpili sang iban nga folder, ukon ang <em>Buksi</em> agud direkta makadto didto. Ang mga naagi nga download yara sa tab nga <em>Kasaysayan</em>.</p>

<h3>Maayo mahibaluan</h3>
<ul>
  <li>Indi makuha ang live stream hasta indi pa ini tapos.</li>
  <li>Posible nga indi maga-andar ang mga private, age-restricted ukon members-only nga video.</li>
  <li>Magkuha lang sang content nga may katarungan ka nga gamiton: imo kaugalingon nga uploads, royalty-free ukon Creative Commons nga materyal, ukon ang ginatugutan sang fair-use rules sa inyo lugar.</li>
</ul>

<h3>May problema?</h3>
<ul>
  <li><strong>"Wala ang video" pero makita sa browser:</strong> i-click ang <em>I-update ang yt-dlp</em> sa idalom sang bintana, hulata nga matapos, dayon tilawi liwat. Kanunay nagaliwan ang YouTube kag ini ang nagaayo sang kadam nga problema.</li>
  <li><strong>"Daw indi ini link":</strong> siguraduhon nga nakopya mo ang bug-os nga address, nga nagasugod sa <code>https://</code>.</li>
  <li><strong>Wala ginpasulod sang Instagram, Facebook ukon X ang Grabbit:</strong> tan-awa ang bahin sang TikTok, Instagram, Facebook kag X sa ibabaw para sa Bulig sa pag-sign in.</li>
  <li><strong>Natapok sa "Nagahanda…":</strong> nagasuri ang Grabbit sang update. Siguraduhon nga online ka kag hatagi sang malip-ot nga tion.</li>
  <li><strong>Wala nagagua ang notification:</strong> sa Windows Settings → System → Notifications, tan-awa kon gintugutan ang Grabbit kag kon naka-off ang Focus assist / Do not disturb.</li>
  <li><strong>Nagsiling ang Windows sang "protected your PC" sa una nga abri:</strong> i-click ang <em>More info</em>, dayon <em>Run anyway</em>. Makaisa lang ini matabo.</li>
</ul>

<p class="muted help-foot">Tip: pinduta ang <kbd>F1</kbd> bisan san-o agud mabuksan ini nga giya, kag <kbd>Esc</kbd> agud masarhan.</p>`,
    },

    // =====================================================================
    // Pirate (just for fun)
    // =====================================================================
    pirate: {
      'tagline': `Paste a link. Plunder the file.`,
      'top.help': `Ye Pirate Guide`,
      'top.helpTitle': `How to sail Grabbit (F1)`,
      'top.discord': `Crew Chat`,
      'top.discordTitle': `Questions or trouble? Board our Discord ship`,
      'help.discord': `<p><strong>Still stuck?</strong> Questions, bugs or ideas be welcome: click <em>Crew Chat</em> at the top o' the window t' join the crew's Discord.</p>`,
      'top.settings': `Ship Settings`,

      'url.label': `Treasure link`,
      'url.placeholder': `Paste a link from YouTube, TikTok, Instagram, Facebook, X…`,
      'url.paste': `Paste`,
      'url.pasteTitle': `Paste from yer clipboard`,
      'playlist.text': `This link be part o' a playlist. Plunder the <strong>whole armada</strong>.`,
      'playlist.textMulti': `This post holds more than one video. Plunder <strong>the lot of 'em</strong>.`,

      'preview.empty': `Paste a link t' spy the video here`,
      'preview.emptyMeta': `YouTube, TikTok, Instagram Reels, Facebook Reels, X (Twitter) an' most other video ports be fair game`,
      'preview.loading': `Scoutin' the link…`,
      'preview.loadingMeta': `This can take a few ticks o' the glass`,
      'preview.notLink': `That be no link, matey`,
      'preview.playlist': `Playlist · {n} videos`,
      'preview.upTo': `up to {h}p`,
      'site.youtube': `YouTube`,
      'site.tiktok': `TikTok`,
      'site.instagram': `Instagram`,
      'site.facebook': `Facebook`,
      'site.twitter': `X (Twitter)`,

      'format.label': `Format`,
      'format.mp4': `Video`,
      'format.mp3': `Audio`,
      'format.wav': `Pure-as-rum audio`,
      'quality.label': `Quality`,
      'q.best': `Finest on the seven seas`,
      'q.2160': `4K (2160p)`,
      'q.1440': `1440p`,
      'q.1080': `1080p (Full HD)`,
      'q.720': `720p`,
      'q.480': `480p`,
      'q.360': `360p`,
      'q.320': `320 kbps (finest)`,
      'q.256': `256 kbps`,
      'q.192': `192 kbps`,
      'q.128': `128 kbps (smallest)`,
      'q.notAvailable': `{label} (not on the map)`,
      'editor.text': `Editor-friendly (H.264)`,
      'editor.hint': `Sails smooth in Premiere, CapCut an' Vegas. YouTube only offers H.264 up to 1080p.`,

      'thumb.save': `Save the thumbnail as a picture`,
      'thumb.saveHint': `A .jpg file stowed next to yer download`,
      'thumb.embed': `Stitch cover art inside the file`,
      'thumb.embedHintAudio': `Shows the thumbnail as the album picture in music players.`,
      'thumb.embedHintVideo': `Some video editors may mistake the picture fer an extra video track. Leave this off if ye plan t' edit the video.`,

      'trim.text': `Only plunder a part`,
      'trim.hint': `Grand fer sound effects an' short clips`,
      'trim.from': `From`,
      'trim.to': `To`,

      'save.label': `Stow loot in`,
      'save.change': `Change`,
      'save.open': `Open`,
      'dialog.chooseFolder': `Choose where Grabbit stows yer loot`,
      'grab.go': `Plunder it!`,
      'grab.getting': `Hoistin' the sails…`,

      'tab.downloads': `Plunder`,
      'tab.history': `Ship's Log`,
      'jobs.empty': `No plunder yet.`,
      'jobs.emptyHint': `Ye can start several grabs. Grabbit runs {n} at a time an' the rest wait in line.`,
      'hist.empty': `No finished plunder in the log yet.`,
      'hist.clear': `Scuttle the log`,

      'job.starting': `Castin' off…`,
      'job.queued': `Waitin' in line…`,
      'job.cancel': `Abandon`,
      'job.cancelling': `Abandonin'…`,
      'job.cancelled': `Abandoned`,
      'job.showFile': `Show the loot`,
      'job.dismiss': `Dismiss`,
      'job.fileGone': `Loot moved or sunk`,
      'job.downloading': `Plunderin'…`,
      'job.cutting': `Cuttin' yer clip…`,
      'job.videoOf': `Video {i} o' {n}`,
      'job.videoN': `Video {i}`,
      'job.left': `{eta} left`,
      'job.done': `Done · loot stowed`,
      'job.doneN': `Done · {n} files stowed`,
      'job.skipped': `{n} skipped (private or lost at sea)`,
      'pp.join': `Splicin' video an' audio…`,
      'pp.audio': `Convertin' audio…`,
      'pp.mp4': `Finishin' MP4…`,
      'pp.meta': `Addin' title info…`,
      'pp.thumb': `Addin' the thumbnail…`,
      'pp.save': `Stowin'…`,
      'pp.finish': `Finishin' up…`,

      'err.pasteFirst': `Paste a link first, matey.`,
      'err.notLink': `That be no link, matey.`,
      'err.live': `Live streams can't be plundered while they be live.`,
      'err.ffmpeg': `ffmpeg be missin', so MP3/WAV conversion an' HD video won't work. Reinstall Grabbit.`,
      'err.multi': `This post holds more than one video. Tick the box above the preview t' plunder the lot.`,
      'err.profile': `That link be a whole harbour, not a single video. Paste the link o' one video.`,
      'e.trimStart': `The start time should look like 45, 1:30 or 1:02:03.`,
      'e.trimEnd': `The end time should look like 45, 1:30 or 1:02:03.`,
      'e.trimEmpty': `Enter a start time, an end time, or both.`,
      'e.trimOrder': `The end time must come after the start time, ye landlubber.`,
      'e.trimPast': `The start time be past the end o' the video.`,
      'e.urlEmpty': `Paste a link first, matey.`,
      'e.urlLong': `That link be longer than a ship's anchor chain.`,
      'e.urlBad': `That be no link, matey.`,
      'e.urlProto': `Only http an' https links be supported.`,
      'e.noFolder': `Choose a harbour t' stow yer loot in.`,
      'e.instagram': `Instagram barred the gates t' Grabbit. Open Ship Settings → Sign-in help, pick the browser where ye be logged in t' Instagram, then try again.`,
      'e.facebook': `Facebook barred the gates t' Grabbit. Open Ship Settings → Sign-in help, pick the browser where ye be logged in t' Facebook, then try again. Private videos can't be plundered.`,
      'e.tiktok': `TikTok wouldn't let Grabbit through. Click "Update yt-dlp" at the bottom an' try again. Private accounts can't be plundered.`,
      'e.twitter': `X barred the gates t' Grabbit. Open Ship Settings → Sign-in help, pick the browser where ye be logged in t' X, then try again. Protected accounts can't be plundered.`,
      'e.noVideo': `That post has no video, matey.`,
      'e.private': `This video be private.`,
      'e.unavailable': `Video lost at sea. If it plays fine in yer browser, click "Update yt-dlp" at the bottom an' try again.`,
      'e.age': `This video be age-restricted an' needs a signed-in account.`,
      'e.bot': `YouTube be askin' fer a bot check. Wait a bit, then try again.`,
      'e.members': `This be a members-only video.`,
      'e.notStarted': `This video hasn't set sail yet.`,
      'e.unsupported': `That port or link type ain't supported.`,
      'e.network': `Network trouble on the horizon. Check yer internet connection an' try again.`,
      'e.http403': `The download was blocked (403). Click "Update yt-dlp" at the bottom an' try again.`,
      'e.diskFull': `Yer hold be full.`,
      'e.ytdlpMissing': `yt-dlp be missin'. Reinstall Grabbit.`,
      'e.readFail': `Could not read that link.`,
      'e.infoFail': `Could not read the video info.`,
      'e.startFail': `Could not start yt-dlp. Reinstall Grabbit.`,

      'ytdlp.starting': `yt-dlp: castin' off…`,
      'ytdlp.checking': `yt-dlp{v}: checkin' fer updates…`,
      'ytdlp.updated': `yt-dlp updated t' {v}`,
      'ytdlp.ok': `yt-dlp{v} · shipshape`,
      'ytdlp.failed': `yt-dlp{v} · couldn't check fer updates (be ye offline?)`,
      'ytdlp.dev': `yt-dlp{v} · self-update be off in dev mode`,
      'ytdlp.updateBtn': `Update yt-dlp`,

      'upd.checking': `Lookin' fer a new version…`,
      'upd.downloading': `Haulin' in Grabbit {v}… {p}%`,
      'upd.ready': `Grabbit {v} be ready`,
      'upd.restart': `Restart t' update`,
      'upd.latest': `Grabbit be shipshape an' up t' date`,
      'upd.error': `Couldn't check fer updates (be ye offline?)`,
      'upd.dev': `Updates only work in the installed app`,
      'upd.notConfigured': `Automatic updates ain't turned on in this build`,
      'upd.portable': `Grabbit {v} be available`,
      'upd.download': `Download`,
      'upd.check': `Check fer updates`,
      'upd.confirmBusy': `Plunder be still in progress. Restartin' now will stop it. Restart anyway?`,

      'set.title': `Ship Settings`,
      'set.close': `Close`,
      'set.done': `Aye, done`,
      'set.language': `Language`,
      'set.languageHint': `Changes the whole ship right away.`,
      'set.parallel': `Ships sailin' at once`,
      'set.parallelHint': `Extra plunder waits in line. Use 1 if yer internet be slow as a barnacle.`,
      'set.notify': `Show a notification when plunder be finished`,
      'set.notifyHint': `Only appears while Grabbit be in the background.`,
      'set.sound': `Sound the horn when plunder be finished`,
      'set.soundTest': `Test the horn`,
      'set.signin': `Sign-in help`,
      'set.signinNone': `Off (no sign-in)`,
      'set.signinHint': `Instagram, Facebook an' X sometimes need ye t' be logged in. Pick the browser where ye be logged in. Firefox works most reliably. Only used fer TikTok, Instagram, Facebook an' X, never fer YouTube.`,
      'set.browser.firefox': `Firefox`,
      'set.browser.chrome': `Chrome`,
      'set.browser.edge': `Microsoft Edge`,
      'set.browser.brave': `Brave`,
      'set.updates': `Updates`,
      'set.version': `Grabbit version {v}`,

      'notify.done': `Plunder finished!`,
      'notify.failed': `Plunder failed`,

      'help.title': `How to sail Grabbit`,
      'help.done': `Aye aye!`,
      'help.body': `
<h3>Set sail</h3>
<ol class="steps">
  <li><strong>Paste a link.</strong> Copy a video link from yer browser, then click <em>Paste</em> (or press Ctrl+V in the box). A preview appears so ye know it be the right video.</li>
  <li><strong>Pick a format.</strong> <em>MP4</em> fer video, <em>MP3</em> fer audio, <em>WAV</em> fer lossless audio.</li>
  <li><strong>Choose the quality.</strong> Higher be bigger an' sharper. Options the video doesn't have be greyed out.</li>
  <li><strong>Click Plunder it!</strong> Watch the progress on the right under <em>Plunder</em>. When it says Done, click <em>Show the loot</em>.</li>
</ol>

<h3>Which format should I pick, cap'n?</h3>
<div class="help-grid">
  <div class="help-card"><strong>MP4</strong><span>Video with sound. Best fer editin', reference clips an' watchin' offline.</span></div>
  <div class="help-card"><strong>MP3</strong><span>Audio only, smaller files. Good fer shanties an' voices. 320 kbps be the finest quality.</span></div>
  <div class="help-card"><strong>WAV</strong><span>Audio only, uncompressed. Big files, but ideal fer sound editin' an' sound effects.</span></div>
</div>

<h3>Editor-friendly (H.264)</h3>
<p>Leave this on if ye'll edit the video in Premiere, CapCut, Vegas or similar. It picks a video type those programs open without trouble. The catch: YouTube only offers H.264 up to 1080p. Turn it off if ye want 1440p or 4K.</p>

<h3>Only plunder a part</h3>
<p>Tick <em>Only plunder a part</em> t' download just a short section, like a sound effect.</p>
<ul>
  <li>Type the times as <code>0:30</code> or <code>1:02:15</code> (hours:minutes:seconds).</li>
  <li><em>From</em> be where it starts an' <em>To</em> be where it stops.</li>
  <li>Not available fer playlists.</li>
</ul>

<h3>Playlists</h3>
<p>If yer link belongs t' a playlist, a checkbox appears. Tick it t' plunder the whole armada. Everythin' be stowed in its own chest. Private or sunken videos be skipped automatically.</p>

<h3>Thumbnails an' cover art</h3>
<p>Two tick boxes sit under the quality options:</p>
<ul>
  <li><em>Save the thumbnail as a picture</em> saves the video's cover picture as a <code>.jpg</code> next t' yer file. Handy fer thumbnails an' mood boards.</li>
  <li><em>Stitch cover art inside the file</em> puts that picture inside the file itself, so music players show it as the album art. It be on by default fer MP3. Fer MP4 it be off, because some video editors treat the picture as an extra video track: only turn it on if ye won't edit the video. WAV files can't hold cover art.</li>
</ul>

<h3>TikTok, Instagram Reels, Facebook Reels an' X (Twitter)</h3>
<p>Paste the link the same way ye do fer YouTube. Share links work too (like <code>vm.tiktok.com</code> or <code>fb.watch</code>). Reels an' TikToks be vertical, so 1080p means 1080 pixels wide.</p>
<p>On X, paste the link o' the post itself (the address o' the tweet). If a post holds more than one video, a box appears so ye can plunder the lot.</p>
<p>Instagram, Facebook an' X often only let Grabbit in when ye be logged in. If ye see a message about signin' in:</p>
<ol class="steps">
  <li>Log in t' Instagram, Facebook or X in yer browser (Firefox works most reliably).</li>
  <li>In Grabbit, open <em>Ship Settings</em> an' set <em>Sign-in help</em> t' that browser.</li>
  <li>Try the link again. If it still fails, close the browser completely an' retry.</li>
</ol>
<p>This only reads the sign-in on yer own computer, an' it's only used fer TikTok, Instagram, Facebook an' X. Private accounts an' private videos can't be plundered. Only videos be supported, not photo posts or slideshows. Profile pages don't work either: paste one video at a time.</p>

<h3>Several plunders at once</h3>
<p>Ye can start as many grabs as ye like. Grabbit runs 2 at a time by default an' the rest show <em>Waitin' in line…</em>. They start by themselves, in order. Change this in <em>Ship Settings → Ships sailin' at once</em> (1 to 5). Use 1 if yer internet be slow. <em>Abandon</em> takes a waitin' item out o' the line.</p>

<h3>Ship Settings</h3>
<ul>
  <li><em>Language:</em> English, Filipino, Cebuano, Hiligaynon, Pirate (arrr!) or Enchanting Table. The whole ship changes right away.</li>
  <li><em>Notification:</em> a pop-up on yer screen when a grab finishes while Grabbit be in the background. The taskbar button flashes too.</li>
  <li><em>Sound:</em> a short chime when a grab finishes. Use <em>Test the horn</em> t' hear it.</li>
</ul>

<h3>Updates</h3>
<p>Grabbit checks fer a new version when it opens.</p>
<ul>
  <li><em>Installed version (Setup):</em> the update downloads quietly, then a <em>Restart t' update</em> button appears at the bottom. Ye can also keep usin' the app, because it installs the next time ye close it.</li>
  <li><em>Portable version:</em> it can't update itself, so a <em>Download</em> button appears when there be a newer version. Download the new file an' use it instead o' the old one.</li>
</ul>
<p>Ship Settings → Updates also has a <em>Check fer updates</em> button. Separately, <em>Update yt-dlp</em> at the bottom keeps the plunderin' engine fresh. It be the first thing t' try when a video that works in yer browser fails in Grabbit.</p>

<h3>Where does me loot go?</h3>
<p>By default it goes t' <code>Downloads\\Grabbit</code>. Click <em>Change</em> t' pick another harbour, or <em>Open</em> t' jump straight there. Past plunder be listed under the <em>Ship's Log</em> tab.</p>

<h3>Good t' know</h3>
<ul>
  <li>Live streams can't be plundered until they finish.</li>
  <li>Private, age-restricted or members-only videos may not work.</li>
  <li>Only plunder content ye have the right t' use: yer own uploads, royalty-free or Creative Commons material, or what yer local fair-use rules allow.</li>
</ul>

<h3>Somethin' not workin'?</h3>
<ul>
  <li><strong>"Video lost at sea" but it plays in yer browser:</strong> click <em>Update yt-dlp</em> at the bottom o' the window, wait fer it t' finish, then try again. YouTube changes often an' this fixes most problems.</li>
  <li><strong>"That be no link":</strong> make sure ye copied the whole address, startin' with <code>https://</code>.</li>
  <li><strong>Instagram, Facebook or X won't let Grabbit in:</strong> see the TikTok, Instagram, Facebook an' X section above fer Sign-in help.</li>
  <li><strong>Stuck on "Hoistin' the sails…":</strong> Grabbit be checkin' fer updates. Make sure ye be online an' give it a moment.</li>
  <li><strong>No notification pops up:</strong> in Windows Settings → System → Notifications, check that Grabbit be allowed an' that Focus assist / Do not disturb be off.</li>
  <li><strong>Windows says "protected your PC" on first launch:</strong> click <em>More info</em>, then <em>Run anyway</em>. This only happens once.</li>
</ul>

<p class="muted help-foot">Tip: press <kbd>F1</kbd> any time t' open this guide, an' <kbd>Esc</kbd> t' close it.</p>`,
    },
  };

  // Enchanting Table shows the English text in a rune-style font (see styles.css), so it reuses the English lines.
  DICT.enchant = DICT.en;

  let lang = 'en';

  /** Look up a line in the current language (falls back to English), filling in {placeholders}. */
  function t(key, vars) {
    let s = (DICT[lang] && DICT[lang][key]) ?? DICT.en[key] ?? key;
    if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
    return s;
  }

  const has = (key) => Boolean((DICT[lang] && DICT[lang][key]) || DICT.en[key]);

  /** Translate every element in `root` that carries a data-i18n* attribute. */
  function apply(root) {
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.dataset.i18nHtml); });
    root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
    root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  }

  function setLang(next) {
    lang = DICT[next] ? next : 'en';
    if (typeof document !== 'undefined') {
      document.documentElement.lang = (lang === 'pirate' || lang === 'enchant') ? 'en' : lang; // both are English for spell-check and screen readers
      document.documentElement.dataset.script = lang === 'enchant' ? 'enchant' : '';
      apply(document);
    }
  }

  const api = { t, has, setLang, apply, getLang: () => lang, DICT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; // for `npm test`
  if (typeof window !== 'undefined') window.I18N = api;
})();
