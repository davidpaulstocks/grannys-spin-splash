/**
 * The fire-family projectiles. Inferno is thin flickering tongues of flame
 * with a gold heart; the Dragon Drencher is a big roaring breath, a wide cone
 * with fireballs travelling along it, so the two never read alike.
 */

import { COLOUR, shade } from '../../../utils/colour';
import { hash01, sampleAlong, smooth } from './drawKit';
import type { JetPoint, JetRenderer } from './projectile.types';

const FLICKER_SPEED = 0.03;
const FLICKER_AMOUNT = 0.22;
const INFERNO_WIDTH_SCALE = 0.95;
const INFERNO_TONGUE_SPACING_PX = 26;
const INFERNO_TONGUE_LENGTH_PX = 26;
const INFERNO_TONGUE_BASE_PX = 5;

const DRAGON_WIDTH_SCALE = 2.3;
const DRAGON_BALL_SPACING_PX = 82;
const DRAGON_BALL_SPEED = 0.42;
const DRAGON_BALL_RADIUS = 17;
const DRAGON_TONGUE_SPACING_PX = 34;
const DRAGON_TONGUE_LENGTH_PX = 44;
const DRAGON_TONGUE_BASE_PX = 9;
const HOT_CORE = 0xfff1b8;

/** Width wobble that makes a ribbon lick like a flame: bigger where the flame is further from the gun. */
function flickerScale(time: number, index: number): number {
  return 1 + FLICKER_AMOUNT * Math.sin(time * FLICKER_SPEED + index * 1.3);
}

/** Strokes a flame ribbon in layers (outer to core), each layer flickering a little differently. */
function flameLayers(f: Parameters<JetRenderer>[0], pts: JetPoint[], scale: number): void {
  const layers: readonly (readonly [number, number, number])[] = [
    [shade(f.colour, 0.75), 1, 1],
    [f.colour, 1, 0.72],
    [f.accent, 1, 0.46],
    [HOT_CORE, 0.95, 0.2],
  ];
  layers.forEach(([colour, alpha, fraction], layer) => {
    const last = pts.length - 1;
    for (let i = 0; i < last; i++) {
      const a = pts[i] as JetPoint;
      const b = pts[i + 1] as JetPoint;
      if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > 130) continue;
      const t = i / last;
      const width =
        f.size * scale * (1.6 + 1.6 * t) * fraction * flickerScale(f.time, i + layer * 5);
      f.gfx.lineStyle(width, colour, alpha * (1 - 0.35 * t));
      f.gfx.lineBetween(a.x, a.y, b.x, b.y);
      // Rounded joints: a thick line has square ends, which would stair-step a flame.
      f.gfx.fillStyle(colour, alpha * (1 - 0.35 * t));
      f.gfx.fillCircle(b.x, b.y, width / 2);
    }
  });
}

/** Little teardrop tongues licking off the sides of a flame. */
function tongues(
  f: Parameters<JetRenderer>[0],
  pts: JetPoint[],
  spacing: number,
  length: number,
  base: number,
  colour: number,
): void {
  const drift = (f.time * 0.07) % spacing;
  for (const s of sampleAlong(pts, spacing, drift)) {
    const id = Math.floor(s.along / spacing + f.time / 130);
    const side = hash01(id) < 0.5 ? -1 : 1;
    const out = f.size * (0.6 + s.t * 1.4) * side;
    const len = length * (0.5 + 0.8 * hash01(id, 5)) * (0.7 + 0.5 * Math.sin(f.time * 0.02 + id));
    const bx = s.x + s.nx * out;
    const by = s.y + s.ny * out;
    // Flames lick forward along the jet and outward.
    const dx = s.ny * -1;
    const dy = s.nx;
    f.gfx.fillStyle(colour, 0.85);
    f.gfx.fillTriangle(
      bx - s.nx * base,
      by - s.ny * base,
      bx + s.nx * base,
      by + s.ny * base,
      bx + dx * len + s.nx * side * base * 0.5,
      by + dy * len + s.ny * side * base * 0.5,
    );
  }
}

/** Inferno: thin orange flame tongues with a gold core, flickering. */
export const drawFlame: JetRenderer = (f) => {
  for (const stream of f.streams) {
    const pts = stream.map((p) => ({ ...p }));
    smooth(pts);
    flameLayers(f, pts, INFERNO_WIDTH_SCALE);
    tongues(
      f,
      pts,
      INFERNO_TONGUE_SPACING_PX,
      INFERNO_TONGUE_LENGTH_PX,
      INFERNO_TONGUE_BASE_PX,
      f.colour,
    );
  }
};

/** Dragon Drencher: a roaring cone of fire with fireballs rolling along it. */
export const drawDragon: JetRenderer = (f) => {
  for (const stream of f.streams) {
    const pts = stream.map((p) => ({ ...p }));
    smooth(pts);
    flameLayers(f, pts, DRAGON_WIDTH_SCALE);
    tongues(
      f,
      pts,
      DRAGON_TONGUE_SPACING_PX,
      DRAGON_TONGUE_LENGTH_PX,
      DRAGON_TONGUE_BASE_PX,
      f.accent,
    );
    const phase = (f.time * DRAGON_BALL_SPEED) % DRAGON_BALL_SPACING_PX;
    for (const s of sampleAlong(pts, DRAGON_BALL_SPACING_PX, phase)) {
      const r = DRAGON_BALL_RADIUS * (0.55 + 0.9 * s.t);
      f.gfx.fillStyle(shade(f.colour, 0.8), 0.9);
      f.gfx.fillCircle(s.x, s.y, r);
      f.gfx.fillStyle(f.colour, 1);
      f.gfx.fillCircle(s.x, s.y, r * 0.72);
      f.gfx.fillStyle(f.accent, 1);
      f.gfx.fillCircle(s.x, s.y, r * 0.46);
      f.gfx.fillStyle(COLOUR.cloud, 0.95);
      f.gfx.fillCircle(s.x, s.y, r * 0.2);
    }
  }
};
