/**
 * The water-family projectiles: plain water (the starter guns, Hydro Blaster
 * and the baseline everything else departs from), the MEGA CANNON's enormous
 * gold-cored jet, Rainbow Rocket's five colour bands, the Shark Soaker's
 * toothed jet, Turbo Tornado's spiral of six strands and Neptune's Trident
 * with its whirlpool. Each draws from the shots in flight into one Graphics.
 */

import type Phaser from 'phaser';

import { COLOUR, shade } from '../../../utils/colour';
import { MAX_JOIN_PX, polyline, ripple, sampleAlong, shifted, smooth } from './drawKit';
import type { JetPoint, JetRenderer } from './projectile.types';

/** Ribbon width at the nozzle and at the tip, as multiples of the gun's own particle size. */
const WIDTH_AT_NOZZLE = 2.6;
const WIDTH_AT_TIP = 1.5;
const RIM_EXTRA_PX = 4;
const RIM_SHADE = 0.62;
const CORE_WIDTH_FRACTION = 0.36;
const CORE_ALPHA = 0.6;
/** The far end of the jet thins out to spray rather than ending in a hard cap. */
const TIP_ALPHA = 0.75;

const MEGA_WIDTH_SCALE = 1.5;
const MEGA_GOLD_FRACTION = 0.5;
const MEGA_RING_COUNT = 4;
const MEGA_RING_SPACING_PX = 90;
const MEGA_RING_SPEED = 0.55;
const MEGA_RING_WIDTH_PX = 5;

const RAINBOW_BANDS = [
  COLOUR.grannyPink,
  COLOUR.heatOrange,
  COLOUR.sunnyGold,
  COLOUR.mintGreen,
  COLOUR.waterBlue,
] as const;
const RAINBOW_BAND_WIDTH_FRACTION = 0.62;

const TOOTH_SPACING_PX = 20;
const TOOTH_SIZE_PX = 9;
const TOOTH_BASE_PX = 4;
const CHOMP_SPEED = 0.014;
const CHOMP_WAVE = 0.07;

const TORNADO_STRANDS = 6;
const TORNADO_TWIST_PER_PX = 0.055;
const TORNADO_SPIN_SPEED = 0.014;
const TORNADO_RADIUS_NEAR = 6;
const TORNADO_RADIUS_FAR = 20;
const TORNADO_STRAND_WIDTH = 3;
const TORNADO_CORE_ALPHA = 0.35;

const TRIDENT_GOLD_ALPHA = 0.9;
const WHIRL_ARMS = 3;
const WHIRL_RADIUS_PX = 20;
const WHIRL_SPEED = 0.012;
const WHIRL_ARC = 1.4;

/** One tapering ribbon: rim, body and (optionally) a bright core, all following the same points. */
export function strokeRibbon(
  gfx: Phaser.GameObjects.Graphics,
  points: readonly JetPoint[],
  colour: number,
  alpha: number,
  size: number,
  extraPx: number,
  widthFraction: number,
  widthScale = 1,
): void {
  const last = points.length - 1;
  for (let i = 0; i < last; i++) {
    const a = points[i] as JetPoint;
    const b = points[i + 1] as JetPoint;
    if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > MAX_JOIN_PX) continue;
    const t = i / last;
    const width =
      (size * widthScale * (WIDTH_AT_NOZZLE + (WIDTH_AT_TIP - WIDTH_AT_NOZZLE) * t) + extraPx) *
      widthFraction;
    const fade = alpha * (1 - (1 - TIP_ALPHA) * t);
    gfx.lineStyle(width, colour, fade);
    gfx.lineBetween(a.x, a.y, b.x, b.y);
    // Thick lines have square ends; a disc at each joint rounds the bends.
    gfx.fillStyle(colour, fade);
    gfx.fillCircle(b.x, b.y, width / 2);
  }
}

/** Smoothed, rippled copy of a stream: the body every water-family style starts from. */
function flowing(points: readonly JetPoint[], time: number): JetPoint[] {
  const copy = points.map((p) => ({ ...p }));
  smooth(copy);
  ripple(copy, time);
  return copy;
}

/** Plain water: a darker rim, the body, a bright core. */
export const drawWater: JetRenderer = (f) => {
  const rim = shade(f.colour, RIM_SHADE);
  for (const stream of f.streams) {
    const pts = flowing(stream, f.time);
    strokeRibbon(f.gfx, pts, rim, 1, f.size, RIM_EXTRA_PX, 1);
    strokeRibbon(f.gfx, pts, f.colour, 1, f.size, 0, 1);
    strokeRibbon(f.gfx, pts, 0xffffff, CORE_ALPHA, f.size, 0, CORE_WIDTH_FRACTION);
  }
};

/** The MEGA CANNON: a huge jet with a gold core and shockwave rings running up it. */
export const drawMega: JetRenderer = (f) => {
  const rim = shade(f.colour, RIM_SHADE);
  for (const stream of f.streams) {
    const pts = flowing(stream, f.time);
    strokeRibbon(f.gfx, pts, rim, 1, f.size, RIM_EXTRA_PX, 1, MEGA_WIDTH_SCALE);
    strokeRibbon(f.gfx, pts, f.colour, 1, f.size, 0, 1, MEGA_WIDTH_SCALE);
    strokeRibbon(f.gfx, pts, f.accent, 0.9, f.size, 0, MEGA_GOLD_FRACTION, MEGA_WIDTH_SCALE);
    strokeRibbon(f.gfx, pts, 0xffffff, CORE_ALPHA, f.size, 0, 0.2, MEGA_WIDTH_SCALE);
    const phase = (f.time * MEGA_RING_SPEED) % MEGA_RING_SPACING_PX;
    for (const s of sampleAlong(pts, MEGA_RING_SPACING_PX, phase).slice(0, MEGA_RING_COUNT)) {
      const half = f.size * (WIDTH_AT_NOZZLE - (WIDTH_AT_NOZZLE - WIDTH_AT_TIP) * s.t) * 0.9;
      f.gfx.lineStyle(MEGA_RING_WIDTH_PX, f.accent, 0.85 * (1 - s.t));
      f.gfx.lineBetween(s.x - s.nx * half, s.y - s.ny * half, s.x + s.nx * half, s.y + s.ny * half);
    }
  }
};

/** Rainbow Rocket: five parallel bands of colour that ripple together. */
export const drawRainbow: JetRenderer = (f) => {
  const band = f.size * RAINBOW_BAND_WIDTH_FRACTION;
  for (const stream of f.streams) {
    const pts = flowing(stream, f.time);
    const mid = (RAINBOW_BANDS.length - 1) / 2;
    RAINBOW_BANDS.forEach((colour, k) => {
      const offset = (k - mid) * band;
      polyline(
        f.gfx,
        shifted(pts, () => offset),
        band + 1,
        colour,
        1,
      );
    });
  }
};

/** Shark Soaker: water in a darker edge, with white teeth that chomp in a wave along the jet. */
export const drawShark: JetRenderer = (f) => {
  for (const stream of f.streams) {
    const pts = flowing(stream, f.time);
    strokeRibbon(f.gfx, pts, f.accent, 1, f.size, RIM_EXTRA_PX * 2, 1);
    strokeRibbon(f.gfx, pts, f.colour, 1, f.size, 0, 1);
    for (const s of sampleAlong(pts, TOOTH_SPACING_PX, TOOTH_SPACING_PX)) {
      const half = f.size * (WIDTH_AT_NOZZLE - (WIDTH_AT_NOZZLE - WIDTH_AT_TIP) * s.t) * 0.5;
      const bite = 0.5 + 0.5 * Math.sin(f.time * CHOMP_SPEED - s.along * CHOMP_WAVE);
      const tooth = TOOTH_SIZE_PX * (0.4 + 0.6 * bite);
      // The jet's direction is the sideways direction turned a quarter.
      const dx = s.ny;
      const dy = -s.nx;
      for (const side of [-1, 1] as const) {
        const bx = s.x + s.nx * half * side;
        const by = s.y + s.ny * half * side;
        f.gfx.fillStyle(0xffffff, 0.95);
        f.gfx.fillTriangle(
          bx - dx * TOOTH_BASE_PX,
          by - dy * TOOTH_BASE_PX,
          bx + dx * TOOTH_BASE_PX,
          by + dy * TOOTH_BASE_PX,
          bx - s.nx * side * tooth,
          by - s.ny * side * tooth,
        );
      }
    }
  }
};

/** Turbo Tornado: six thin strands twisting round each other along the middle of the jet. */
export const drawTornado: JetRenderer = (f) => {
  const stream = f.streams.reduce((best, s) => (s.length > best.length ? s : best));
  const pts = flowing(stream, f.time);
  const colours = [f.colour, f.accent];
  strokeRibbon(f.gfx, pts, f.colour, TORNADO_CORE_ALPHA, f.size, 0, 1, 1.2);
  const lengthSoFar = cumulative(pts);
  for (let k = 0; k < TORNADO_STRANDS; k++) {
    const phase = (k / TORNADO_STRANDS) * Math.PI * 2 + f.time * TORNADO_SPIN_SPEED;
    const strand = shifted(pts, (i, t) => {
      const radius = TORNADO_RADIUS_NEAR + (TORNADO_RADIUS_FAR - TORNADO_RADIUS_NEAR) * t;
      return Math.sin(phase + (lengthSoFar[i] as number) * TORNADO_TWIST_PER_PX) * radius;
    });
    polyline(f.gfx, strand, TORNADO_STRAND_WIDTH, colours[k % 2] as number, 0.9);
  }
};

/** Distance of each point from the first, along the jet. */
function cumulative(points: readonly JetPoint[]): number[] {
  const out = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as JetPoint;
    const b = points[i] as JetPoint;
    out.push((out[i - 1] as number) + Math.hypot(b.x - a.x, b.y - a.y));
  }
  return out;
}

/** Neptune's Trident: three jets from the three prongs, gold-edged, and a whirlpool where they meet. */
export const drawTrident: JetRenderer = (f) => {
  const rim = f.accent;
  let tipX = 0;
  let tipY = 0;
  for (const stream of f.streams) {
    const pts = flowing(stream, f.time);
    strokeRibbon(f.gfx, pts, rim, TRIDENT_GOLD_ALPHA, f.size, RIM_EXTRA_PX, 1);
    strokeRibbon(f.gfx, pts, f.colour, 1, f.size, 0, 1);
    strokeRibbon(f.gfx, pts, 0xffffff, CORE_ALPHA, f.size, 0, CORE_WIDTH_FRACTION);
    const tip = pts[pts.length - 1] as JetPoint;
    tipX += tip.x / f.streams.length;
    tipY += tip.y / f.streams.length;
  }
  for (let k = 0; k < WHIRL_ARMS; k++) {
    const start = f.time * WHIRL_SPEED + (k / WHIRL_ARMS) * Math.PI * 2;
    f.gfx.lineStyle(3, f.accent, 0.85);
    f.gfx.beginPath();
    f.gfx.arc(tipX, tipY, WHIRL_RADIUS_PX * (0.6 + 0.2 * k), start, start + WHIRL_ARC);
    f.gfx.strokePath();
  }
};
