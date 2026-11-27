/**
 * Two of the mythic guns' projectiles that run in ribbons: the Kraken Cannon's three wavy ink-dark
 * tentacle streams (paler suckers down one side, curling more toward the tip) and the Star Pony's
 * twin ribbons in rainbow bands with gold stars riding along them.
 */

import { COLOUR, shade } from '../../../utils/colour';
import { fillStar5, polyline, ripple, sampleAlong, shifted, smooth } from './drawKit';
import type { JetPoint, JetRenderer } from './projectile.types';
import { strokeRibbon } from './waterJets';

const KRAKEN_WIDTH_SCALE = 1;
const KRAKEN_WAVE_PX = 9;
const KRAKEN_WAVELENGTH_PX = 60;
const KRAKEN_WAVE_SPEED = 0.008;
const KRAKEN_CURL_GROWTH = 0.9;
const KRAKEN_SUCKER_SPACING_PX = 24;
const KRAKEN_SUCKER_RADIUS = 4.5;
const KRAKEN_SUCKER_DOT = 0.45;
const KRAKEN_RIM_EXTRA_PX = 3;
const KRAKEN_HIGHLIGHT_FRACTION = 0.3;

const PONY_BANDS = [
  COLOUR.grannyPink,
  COLOUR.heatOrange,
  COLOUR.sunnyGold,
  COLOUR.mintGreen,
  COLOUR.waterBlue,
] as const;
const PONY_BAND_FRACTION = 0.5;
const PONY_STAR_SPACING_PX = 70;
const PONY_STAR_SPEED = 0.2;
const PONY_STAR_RADIUS = 11;
const PONY_STAR_SPIN = 0.004;
const PONY_STAR_GLOW = 1.5;

/** Distance of each point from the first, along the jet. */
function lengths(points: readonly JetPoint[]): number[] {
  const out = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as JetPoint;
    const b = points[i] as JetPoint;
    out.push((out[i - 1] as number) + Math.hypot(b.x - a.x, b.y - a.y));
  }
  return out;
}

/** Kraken Cannon: three dark curling tentacles, each with a row of pale suckers. */
export const drawKraken: JetRenderer = (f) => {
  const rim = shade(f.colour, 0.6);
  f.streams.forEach((stream, s) => {
    const base = stream.map((p) => ({ ...p }));
    smooth(base);
    const along = lengths(base);
    const total = (along[along.length - 1] as number) || 1;
    const pts = shifted(base, (i, t) => {
      const curl = 1 + KRAKEN_CURL_GROWTH * t;
      return (
        Math.sin(
          ((along[i] as number) / KRAKEN_WAVELENGTH_PX) * Math.PI * 2 -
            f.time * KRAKEN_WAVE_SPEED +
            s * 2.1,
        ) *
        KRAKEN_WAVE_PX *
        curl *
        Math.min(1, ((along[i] as number) / total) * 3)
      );
    });
    strokeRibbon(f.gfx, pts, rim, 1, f.size, KRAKEN_RIM_EXTRA_PX, 1, KRAKEN_WIDTH_SCALE);
    strokeRibbon(f.gfx, pts, f.colour, 1, f.size, 0, 1, KRAKEN_WIDTH_SCALE);
    strokeRibbon(
      f.gfx,
      pts,
      shade(f.colour, 1.8),
      0.6,
      f.size,
      0,
      KRAKEN_HIGHLIGHT_FRACTION,
      KRAKEN_WIDTH_SCALE,
    );
    for (const m of sampleAlong(pts, KRAKEN_SUCKER_SPACING_PX, KRAKEN_SUCKER_SPACING_PX)) {
      const side = Math.floor(m.along / KRAKEN_SUCKER_SPACING_PX) % 2 === 0 ? 1 : -1;
      const off = f.size * (0.45 + 0.5 * (1 - m.t)) * side;
      const x = m.x + m.nx * off;
      const y = m.y + m.ny * off;
      f.gfx.fillStyle(f.accent, 0.95);
      f.gfx.fillCircle(x, y, KRAKEN_SUCKER_RADIUS * (1 - 0.4 * m.t));
      f.gfx.fillStyle(rim, 0.9);
      f.gfx.fillCircle(x, y, KRAKEN_SUCKER_RADIUS * KRAKEN_SUCKER_DOT);
    }
  });
};

/** Star Pony: two ribbons of rainbow bands with gold stars riding along them. */
export const drawStarPony: JetRenderer = (f) => {
  const band = f.size * PONY_BAND_FRACTION;
  const mid = (PONY_BANDS.length - 1) / 2;
  f.streams.forEach((stream, s) => {
    const pts = stream.map((p) => ({ ...p }));
    smooth(pts);
    ripple(pts, f.time);
    PONY_BANDS.forEach((colour, k) => {
      const offset = (k - mid) * band;
      polyline(
        f.gfx,
        shifted(pts, () => offset),
        band + 1,
        colour,
        1,
      );
    });
    const phase =
      (f.time * PONY_STAR_SPEED + s * (PONY_STAR_SPACING_PX / 2)) % PONY_STAR_SPACING_PX;
    for (const m of sampleAlong(pts, PONY_STAR_SPACING_PX, phase)) {
      const r = PONY_STAR_RADIUS * (0.7 + 0.5 * m.t);
      const spin = f.time * PONY_STAR_SPIN + m.along;
      fillStar5(f.gfx, m.x, m.y, r * PONY_STAR_GLOW, spin, COLOUR.cloud, 0.45);
      fillStar5(f.gfx, m.x, m.y, r, spin, COLOUR.ink, 1);
      fillStar5(f.gfx, m.x, m.y, r * 0.8, spin, f.accent, 1);
    }
  });
};
