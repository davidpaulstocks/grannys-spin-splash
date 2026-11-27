/**
 * The projectiles made of separate things rather than a ribbon: the Bubble
 * Blitz's round, wobbling bubbles and the Slime Slinger's fat goo blobs joined
 * by a stretchy strand. Each blob is one shot in flight, keeping its own size
 * from the shot's launch number.
 */

import { COLOUR, shade } from '../../../utils/colour';
import { hash01, polyline } from './drawKit';
import type { JetPoint, JetRenderer } from './projectile.types';

/** Only every Nth shot becomes a bubble or blob, so they read as separate things. */
const BUBBLE_EVERY = 3;
const BUBBLE_SIZE_MIN = 0.8;
const BUBBLE_SIZE_RANGE = 0.55;
const BUBBLE_WOBBLE_PX = 4;
const BUBBLE_WOBBLE_SPEED = 0.011;
const BUBBLE_BODY_ALPHA = 0.3;
const BUBBLE_RIM_ALPHA = 0.95;
const BUBBLE_SHINE = 0.3;

const SLIME_EVERY = 2;
const SLIME_SIZE_MIN = 0.95;
const SLIME_SIZE_RANGE = 0.5;
const SLIME_WOBBLE = 0.18;
const SLIME_WOBBLE_SPEED = 0.014;
const SLIME_STRAND_FRACTION = 0.55;

/** Shots in launch order group into the same blob every frame, however many are alive. */
function isBlob(point: JetPoint, every: number): boolean {
  return (point.seq ?? 0) % every === 0;
}

/** Bubble Blitz: separate round bubbles, each with a shine, wobbling as they fly. No ribbon. */
export const drawBubbles: JetRenderer = (f) => {
  for (const stream of f.streams) {
    for (const p of stream) {
      if (!isBlob(p, BUBBLE_EVERY)) continue;
      const seq = p.seq ?? 0;
      const r = f.size * (BUBBLE_SIZE_MIN + BUBBLE_SIZE_RANGE * hash01(seq));
      const wob = Math.sin(f.time * BUBBLE_WOBBLE_SPEED + seq) * BUBBLE_WOBBLE_PX;
      const x = p.x + wob;
      const y = p.y + Math.cos(f.time * BUBBLE_WOBBLE_SPEED + seq * 2) * BUBBLE_WOBBLE_PX * 0.6;
      f.gfx.fillStyle(f.colour, BUBBLE_BODY_ALPHA);
      f.gfx.fillCircle(x, y, r);
      f.gfx.lineStyle(2.5, f.accent, BUBBLE_RIM_ALPHA);
      f.gfx.strokeCircle(x, y, r);
      f.gfx.fillStyle(0xffffff, 0.95);
      f.gfx.fillCircle(x - r * 0.38, y - r * 0.38, r * BUBBLE_SHINE);
    }
  }
};

/** Slime Slinger: fat green blobs wobbling in flight, joined by a thin stretchy strand. */
export const drawSlime: JetRenderer = (f) => {
  const dark = shade(f.colour, 0.6);
  for (const stream of f.streams) {
    polyline(f.gfx, stream, f.size * SLIME_STRAND_FRACTION + 3, dark, 1);
    polyline(f.gfx, stream, f.size * SLIME_STRAND_FRACTION, f.colour, 1);
    for (const p of stream) {
      if (!isBlob(p, SLIME_EVERY)) continue;
      const seq = p.seq ?? 0;
      const r = f.size * (SLIME_SIZE_MIN + SLIME_SIZE_RANGE * hash01(seq));
      const squash = 1 + SLIME_WOBBLE * Math.sin(f.time * SLIME_WOBBLE_SPEED + seq * 1.7);
      f.gfx.fillStyle(dark, 1);
      f.gfx.fillEllipse(p.x, p.y, (r * 2 + 4) * squash, (r * 2 + 4) / squash);
      f.gfx.fillStyle(f.colour, 1);
      f.gfx.fillEllipse(p.x, p.y, r * 2 * squash, (r * 2) / squash);
      f.gfx.fillStyle(f.accent, 0.9);
      f.gfx.fillCircle(p.x - r * 0.3, p.y - r * 0.3, r * 0.28);
      f.gfx.fillStyle(COLOUR.cloud, 0.8);
      f.gfx.fillCircle(p.x - r * 0.38, p.y - r * 0.4, r * 0.1);
    }
  }
};
