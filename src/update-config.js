/*
 * Grabbit - where new versions of the app are published
 * Author: direk james
 *
 * >>> BEFORE YOU BUILD: set `owner` to your GitHub username and `repo` to the
 * >>> name of your GitHub repository. Then put the same two values under
 * >>> "build" -> "publish" in package.json (npm test checks that they match).
 *
 * Grabbit looks for new versions in that repository's GitHub Releases.
 */
'use strict';

const PLACEHOLDER = 'direkjames';

const config = {
  owner: PLACEHOLDER,
  repo: 'grabbit',
};

/** False until the owner has been filled in. Auto-update stays off until then. */
function isConfigured(c = config) {
  return Boolean(c.owner) && c.owner !== PLACEHOLDER && Boolean(c.repo);
}

function releasesUrl(c = config) {
  return `https://github.com/${c.owner}/${c.repo}/releases/latest`;
}

module.exports = { config, PLACEHOLDER, isConfigured, releasesUrl };
