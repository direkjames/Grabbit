/*
 * Grabbit - version helpers for the "is there a newer Grabbit?" check
 * Author: direk james
 *
 * Used for the Portable version, which can't replace itself: it only asks
 * GitHub for the latest release and tells the user. (The installed version
 * uses electron-updater instead.)
 */
'use strict';

/** "v1.2.3" -> [1, 2, 3]. Anything after a "-" (pre-release tag) is ignored. */
function parseVersion(text) {
  const m = String(text || '').trim().replace(/^v/i, '').match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!m) return null;
  return [Number(m[1]), Number(m[2] || 0), Number(m[3] || 0)];
}

/** True when `latest` is a higher version than `current`. */
function isNewer(latest, current) {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

/** The latest published (non-draft, non-pre-release) version from GitHub, or throws. */
async function fetchLatestVersion(owner, repo, fetchImpl = fetch) {
  const res = await fetchImpl(`https://api.github.com/repos/${owner}/${repo}/releases/latest`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Grabbit-update-check' },
  });
  if (res.status === 404) return null; // no release published yet
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`);
  const data = await res.json();
  return typeof data.tag_name === 'string' ? data.tag_name.replace(/^v/i, '') : null;
}

module.exports = { parseVersion, isNewer, fetchLatestVersion };
