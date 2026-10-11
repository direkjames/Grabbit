/*
 * Grabbit - links
 * Author: direk james
 *
 * >>> PASTE YOUR DISCORD INVITE LINK BELOW (between the quotes) <<<
 *
 * It should look like  https://discord.gg/abc123  (or https://discord.com/invite/abc123).
 * Make the invite "never expires" in Discord (Server settings -> Invites) so it keeps working.
 * Until you replace the placeholder, the Discord button stays hidden.
 */
'use strict';

const DISCORD_INVITE = 'https://discord.gg/UdvjM2nkY4';

/** Only a real discord.gg / discord.com/invite link counts. Anything else -> null. */
function discordUrl(link = DISCORD_INVITE) {
  try {
    const u = new URL(String(link).trim());
    const ok = u.protocol === 'https:' && (
      (u.hostname === 'discord.gg' && u.pathname.length > 1) ||
      ((u.hostname === 'discord.com' || u.hostname === 'www.discord.com') && /^\/invite\/[\w-]+/.test(u.pathname)));
    return ok ? u.toString() : null;
  } catch { return null; }
}

module.exports = { DISCORD_INVITE, discordUrl };
