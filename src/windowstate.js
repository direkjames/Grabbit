/*
 * Grabbit - remember the window's size and place
 * Author: direk james
 *
 * Pure function: given what was saved and the screens that exist right now,
 * decide where the window opens. A saved place that is off every screen
 * (an unplugged monitor) is ignored so the window can't open out of reach.
 * No Electron imports, so `npm test` can check it.
 */
'use strict';

const MIN_VISIBLE_W = 120;
const MIN_VISIBLE_H = 60;

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * @param saved     { x, y, width, height, maximized } from the last run (any part may be missing)
 * @param workAreas array of { x, y, width, height }, one per screen
 * @param defaults  { width, height, minWidth, minHeight }
 * @returns { width, height, x?, y?, maximized }
 */
function fitBounds(saved, workAreas, defaults) {
  const s = saved && typeof saved === 'object' ? saved : {};
  const areas = Array.isArray(workAreas) && workAreas.length ? workAreas : [{ x: 0, y: 0, width: 1920, height: 1080 }];
  const biggest = areas.reduce((a, b) => (b.width * b.height > a.width * a.height ? b : a));

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
  const width = isNum(s.width) ? clamp(Math.round(s.width), defaults.minWidth, Math.max(defaults.minWidth, biggest.width)) : defaults.width;
  const height = isNum(s.height) ? clamp(Math.round(s.height), defaults.minHeight, Math.max(defaults.minHeight, biggest.height)) : defaults.height;
  const out = { width, height, maximized: s.maximized === true };

  if (isNum(s.x) && isNum(s.y)) {
    const visible = areas.some((a) => {
      const w = Math.min(s.x + width, a.x + a.width) - Math.max(s.x, a.x);
      const h = Math.min(s.y + height, a.y + a.height) - Math.max(s.y, a.y);
      return w >= MIN_VISIBLE_W && h >= MIN_VISIBLE_H;
    });
    if (visible) {
      out.x = Math.round(s.x);
      out.y = Math.round(s.y);
    }
  }
  return out;
}

module.exports = { fitBounds };
