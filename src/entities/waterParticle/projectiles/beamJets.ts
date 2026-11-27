/**
 * The beam-family projectiles, which do not arc like water: the Galaxy
 * Blaster's laser, the Blizzard Blaster's icy beam with drifting snowflakes
 * and the Thunder Soaker's lightning bolt, which jags a new way every few
 * frames. The hit logic still follows the arcing shots; only what is drawn
 * runs straight from the nozzle to the far end of the jet.
 */

import { COLOUR } from '../../../utils/colour';
import { beamLine, hash01, lineLength, polyline, sampleAlong } from './drawKit';
import type { JetPoint, JetRenderer } from './projectile.types';
import { strokeRibbon } from './waterJets';

const LASER_GLOW_SCALE = 3.4;
const LASER_EDGE_SCALE = 2.1;
const LASER_CORE_SCALE = 1.2;
const LASER_RING_SPACING_PX = 56;
const LASER_RING_SPEED = 0.45;
const LASER_RING_RADIUS = 11;
const LASER_STAR_COUNT = 5;
const LASER_STAR_ARM = 5;
const LASER_STAR_FLICKER_MS = 110;

const ICE_FLAKE_SPACING_PX = 30;
const ICE_FLAKE_ARM = 7;
const ICE_FLAKE_DRIFT_PX = 16;
const ICE_RIM_SHADE_EXTRA = 3;
const ICE_CORE_FRACTION = 0.4;

const BOLT_STEP_PX = 20;
const BOLT_AMPLITUDE_PX = 13;
const BOLT_REDRAW_MS = 55;
const BOLT_GLOW_WIDTH = 15;
const BOLT_WIDTH = 7;
const BOLT_CORE_WIDTH = 3;
const BOLT_FORK_LENGTH = 38;

/** A little four-armed sparkle. */
function cross(
  f: Parameters<JetRenderer>[0],
  x: number,
  y: number,
  arm: number,
  colour: number,
  alpha: number,
): void {
  f.gfx.lineStyle(2, colour, alpha);
  f.gfx.lineBetween(x - arm, y, x + arm, y);
  f.gfx.lineBetween(x, y - arm, x, y + arm);
}

/** Galaxy Blaster: a straight glowing beam (pink edge, mint core), rings pulsing along it and little stars. */
export const drawLaser: JetRenderer = (f) => {
  for (const stream of f.streams) {
    const line = beamLine(stream);
    f.gfx.lineStyle(f.size * LASER_GLOW_SCALE, f.accent, 0.28);
    f.gfx.lineBetween(
      (line[0] as JetPoint).x,
      (line[0] as JetPoint).y,
      (line[1] as JetPoint).x,
      (line[1] as JetPoint).y,
    );
    polyline(f.gfx, line, f.size * LASER_EDGE_SCALE, f.accent, 0.95, Infinity);
    polyline(f.gfx, line, f.size * LASER_CORE_SCALE, f.colour, 1, Infinity);
    polyline(f.gfx, line, f.size * 0.35, 0xffffff, 0.9, Infinity);
    const length = lineLength(line);
    const phase = (f.time * LASER_RING_SPEED) % LASER_RING_SPACING_PX;
    for (const s of sampleAlong(line, LASER_RING_SPACING_PX, phase, Infinity)) {
      f.gfx.lineStyle(2, f.accent, 0.9 * (1 - 0.6 * s.t));
      f.gfx.strokeCircle(s.x, s.y, LASER_RING_RADIUS * (0.8 + 0.4 * s.t));
    }
    const tick = Math.floor(f.time / LASER_STAR_FLICKER_MS);
    for (let k = 0; k < LASER_STAR_COUNT; k++) {
      const along = hash01(k, tick) * length;
      const side = (hash01(k + 9, tick) - 0.5) * f.size * 5;
      const u = length > 0 ? along / length : 0;
      const a0 = line[0] as JetPoint;
      const a1 = line[1] as JetPoint;
      const nx = length > 0 ? -(a1.y - a0.y) / length : 0;
      const ny = length > 0 ? (a1.x - a0.x) / length : 0;
      cross(
        f,
        a0.x + (a1.x - a0.x) * u + nx * side,
        a0.y + (a1.y - a0.y) * u + ny * side,
        LASER_STAR_ARM,
        0xffffff,
        0.9,
      );
    }
  }
};

/** Blizzard Blaster: an icy white-blue beam with snowflakes drifting off it. */
export const drawIce: JetRenderer = (f) => {
  for (const stream of f.streams) {
    const pts = stream.map((p) => ({ ...p }));
    strokeRibbon(f.gfx, pts, f.accent, 0.5, f.size, ICE_RIM_SHADE_EXTRA * 3, 1);
    strokeRibbon(f.gfx, pts, f.colour, 1, f.size, 0, 1);
    strokeRibbon(f.gfx, pts, 0xffffff, 0.85, f.size, 0, ICE_CORE_FRACTION);
    const drift = (f.time * 0.05) % ICE_FLAKE_SPACING_PX;
    for (const s of sampleAlong(pts, ICE_FLAKE_SPACING_PX, drift)) {
      const id = Math.floor(s.along / ICE_FLAKE_SPACING_PX + f.time / 400);
      const off = (hash01(id) - 0.5) * 2 * (f.size * 2 + ICE_FLAKE_DRIFT_PX * s.t);
      const arm = ICE_FLAKE_ARM * (0.7 + 0.5 * hash01(id, 3));
      const twinkle = 0.5 + 0.5 * Math.sin(f.time * 0.012 + id);
      const x = s.x + s.nx * off;
      const y = s.y + s.ny * off;
      cross(f, x, y, arm, f.accent, 0.4 + 0.6 * twinkle);
      f.gfx.lineStyle(2, f.accent, 0.4 + 0.6 * twinkle);
      f.gfx.lineBetween(x - arm * 0.7, y - arm * 0.7, x + arm * 0.7, y + arm * 0.7);
      f.gfx.lineBetween(x - arm * 0.7, y + arm * 0.7, x + arm * 0.7, y - arm * 0.7);
    }
  }
};

/** Thunder Soaker: a jagged yellow bolt from the nozzle that takes a new zigzag every few frames. */
export const drawLightning: JetRenderer = (f) => {
  const seed = Math.floor(f.time / BOLT_REDRAW_MS);
  for (const stream of f.streams) {
    const line = beamLine(stream);
    const samples = sampleAlong(line, BOLT_STEP_PX, BOLT_STEP_PX, Infinity);
    const first = line[0] as JetPoint;
    const last = line[1] as JetPoint;
    const bolt: JetPoint[] = [{ x: first.x, y: first.y }];
    samples.forEach((s, i) => {
      const jag = (hash01(i, seed) - 0.5) * 2 * BOLT_AMPLITUDE_PX;
      bolt.push({ x: s.x + s.nx * jag, y: s.y + s.ny * jag });
    });
    bolt.push({ x: last.x, y: last.y });
    polyline(f.gfx, bolt, BOLT_GLOW_WIDTH, f.colour, 0.3);
    polyline(f.gfx, bolt, BOLT_WIDTH, f.colour, 1);
    polyline(f.gfx, bolt, BOLT_CORE_WIDTH, COLOUR.cloud, 1);
    // One short fork off a different joint each redraw.
    const at = bolt[1 + Math.floor(hash01(seed, 7) * Math.max(1, bolt.length - 2))] as JetPoint;
    const angle = (hash01(seed, 11) - 0.5) * 2.4;
    const base = Math.atan2(last.y - first.y, last.x - first.x);
    polyline(
      f.gfx,
      [
        at,
        {
          x: at.x + Math.cos(base + angle) * BOLT_FORK_LENGTH,
          y: at.y + Math.sin(base + angle) * BOLT_FORK_LENGTH,
        },
      ],
      BOLT_CORE_WIDTH + 1,
      f.colour,
      0.9,
    );
  }
};
