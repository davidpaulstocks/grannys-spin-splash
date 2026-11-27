/**
 * Two of the mythic guns' projectiles, each made of separate things: the Volcano Blaster's heavy
 * lava blobs (a dark rock crust round a glowing middle, embers trailing behind) and the Unicorn
 * Sparkler's stream of glitter (tiny four-point sparkles in four colours over a soft cream core).
 * Each blob or sparkle is one shot in flight, keeping its own size and colour from its launch number.
 */

import { COLOUR, shade } from '../../../utils/colour';
import { fillSparkle4, hash01, polyline } from './drawKit';
import type { JetPoint, JetRenderer } from './projectile.types';

const LAVA_EVERY = 2;
const LAVA_SIZE_MIN = 0.85;
const LAVA_SIZE_RANGE = 0.5;
const LAVA_CRUST_PX = 4;
const LAVA_LUMPS = 3;
const LAVA_LUMP_SCALE = 0.45;
const LAVA_WOBBLE = 0.12;
const LAVA_WOBBLE_SPEED = 0.009;
const LAVA_STRAND_FRACTION = 0.3;
const LAVA_STRAND_ALPHA = 0.55;
const LAVA_EMBERS = 2;
const LAVA_EMBER_PX = 4;
const LAVA_EMBER_RISE_PX = 14;
const LAVA_EMBER_SPEED = 0.004;
const LAVA_HEAT_SHADE = 1.35;

const GLITTER_COLOURS = [
  shade(COLOUR.grannyPink, 1.15),
  COLOUR.sunnyGold,
  COLOUR.mintGreen,
  COLOUR.waterBlue,
] as const;
const GLITTER_CORE_FRACTION = 2.6;
const GLITTER_CORE_ALPHA = 0.4;
const GLITTER_ARM_MIN = 1.7;
const GLITTER_ARM_RANGE = 1.8;
const GLITTER_SCATTER = 3.4;
const GLITTER_TWINKLE_SPEED = 0.014;
const GLITTER_EXTRA_PER_SHOT = 2;

/** Shots in launch order group into the same blob every frame, however many are alive. */
function isBlob(point: JetPoint, every: number): boolean {
  return (point.seq ?? 0) % every === 0;
}

/** Volcano Blaster: glowing lava blobs with dark rock crusts, arcing heavily, embers rising off them. */
export const drawLava: JetRenderer = (f) => {
  const crust = f.accent;
  const hot = shade(f.colour, LAVA_HEAT_SHADE);
  for (const stream of f.streams) {
    polyline(f.gfx, stream, f.size * LAVA_STRAND_FRACTION, f.colour, LAVA_STRAND_ALPHA);
    stream.forEach((p, i) => {
      if (!isBlob(p, LAVA_EVERY)) return;
      const seq = p.seq ?? 0;
      const r = f.size * (LAVA_SIZE_MIN + LAVA_SIZE_RANGE * hash01(seq));
      const squash = 1 + LAVA_WOBBLE * Math.sin(f.time * LAVA_WOBBLE_SPEED + seq * 1.9);
      // The crust: an uneven dark rim, a few lumps stuck on the outside.
      f.gfx.fillStyle(crust, 1);
      f.gfx.fillEllipse(
        p.x,
        p.y,
        (r * 2 + LAVA_CRUST_PX * 2) * squash,
        (r * 2 + LAVA_CRUST_PX * 2) / squash,
      );
      for (let k = 0; k < LAVA_LUMPS; k++) {
        const a = hash01(seq, k) * Math.PI * 2;
        f.gfx.fillCircle(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, r * LAVA_LUMP_SCALE);
      }
      f.gfx.fillStyle(f.colour, 1);
      f.gfx.fillEllipse(p.x, p.y, r * 1.5 * squash, (r * 1.5) / squash);
      f.gfx.fillStyle(hot, 1);
      f.gfx.fillCircle(p.x - r * 0.12, p.y - r * 0.12, r * 0.55);
      f.gfx.fillStyle(COLOUR.sunnyGold, 0.95);
      f.gfx.fillCircle(p.x - r * 0.2, p.y - r * 0.2, r * 0.25);
      // Embers drift up off the blob, toward where it has been.
      const older = stream[i + 1] ?? p;
      for (let e = 0; e < LAVA_EMBERS; e++) {
        const u = (e + 1) / (LAVA_EMBERS + 1);
        const life = (f.time * LAVA_EMBER_SPEED + hash01(seq, e + 7)) % 1;
        f.gfx.fillStyle(e % 2 === 0 ? COLOUR.sunnyGold : f.colour, 1 - life);
        f.gfx.fillCircle(
          p.x + (older.x - p.x) * u + (hash01(seq, e + 3) - 0.5) * r,
          p.y + (older.y - p.y) * u - life * LAVA_EMBER_RISE_PX,
          LAVA_EMBER_PX * (1 - 0.5 * life),
        );
      }
    });
  }
};

/** Unicorn Sparkler: glitter, many tiny four-point sparkles in pink, gold, mint and blue round a soft cream core. */
export const drawGlitter: JetRenderer = (f) => {
  for (const stream of f.streams) {
    polyline(f.gfx, stream, f.size * GLITTER_CORE_FRACTION, COLOUR.cloud, GLITTER_CORE_ALPHA);
    polyline(f.gfx, stream, f.size * 0.5, COLOUR.cloud, 0.55);
    for (const p of stream) {
      const seq = p.seq ?? 0;
      for (let k = 0; k <= GLITTER_EXTRA_PER_SHOT; k++) {
        const id = seq * 3 + k;
        const twinkle = 0.55 + 0.45 * Math.sin(f.time * GLITTER_TWINKLE_SPEED + id * 2.1);
        const arm =
          f.size * (GLITTER_ARM_MIN + GLITTER_ARM_RANGE * hash01(id)) * (0.6 + 0.6 * twinkle);
        const colour = GLITTER_COLOURS[
          Math.floor(hash01(id, 4) * GLITTER_COLOURS.length)
        ] as number;
        const x = p.x + (hash01(id, 1) - 0.5) * f.size * GLITTER_SCATTER;
        const y = p.y + (hash01(id, 2) - 0.5) * f.size * GLITTER_SCATTER;
        fillSparkle4(f.gfx, x, y, arm, colour, 0.95);
      }
    }
  }
};
