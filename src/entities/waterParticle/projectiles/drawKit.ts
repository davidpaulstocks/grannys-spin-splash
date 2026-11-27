/**
 * Small drawing helpers shared by the projectile renderers: polylines in one
 * call, smoothing and rippling a jet, walking along it at even spacing, and a
 * cheap repeatable "random" so a flicker re-draws the same way for a few
 * frames. All of it draws into one shared Graphics, so none of it allocates a
 * game object.
 */

import type Phaser from 'phaser';

import type { JetPoint } from './projectile.types';

/** Shots further apart than this are not the same stretch of jet. */
export const MAX_JOIN_PX = 130;
/** How strongly each point is pulled toward its neighbours: irons per-shot wobble into a curve. */
const SMOOTHING = 0.5;
/** Water under pressure shivers: a ripple that runs down the jet and grows toward the tip. */
const RIPPLE_AMPLITUDE_PX = 5;
const RIPPLE_WAVELENGTH_PX = 70;
const RIPPLE_SPEED = 26;

/** How thin a sparkle's waist is, as a share of its arm; and the star's points and inner radius. */
const SPARKLE_WAIST = 0.18;
const STAR_POINTS = 5;
const STAR_INNER = 0.45;

/** A point on a jet with the direction it runs and its sideways direction. */
export interface Sample {
  x: number;
  y: number;
  /** Unit sideways direction. */
  nx: number;
  ny: number;
  /** Distance from the nozzle, and the fraction of the whole jet that is. */
  along: number;
  t: number;
}

/** Strokes a path through `points` in one go, starting a new path where the shots are too far apart. */
export function polyline(
  gfx: Phaser.GameObjects.Graphics,
  points: readonly JetPoint[],
  width: number,
  colour: number,
  alpha = 1,
  maxGap = MAX_JOIN_PX,
): void {
  gfx.lineStyle(width, colour, alpha);
  let open = false;
  for (let i = 0; i < points.length; i++) {
    const p = points[i] as JetPoint;
    const prev = points[i - 1];
    const gap = prev ? Math.abs(p.x - prev.x) + Math.abs(p.y - prev.y) : 0;
    if (!open || gap > maxGap) {
      if (open) gfx.strokePath();
      gfx.beginPath();
      gfx.moveTo(p.x, p.y);
      open = true;
    } else {
      gfx.lineTo(p.x, p.y);
    }
  }
  if (open) gfx.strokePath();
}

/** One pass of neighbour averaging over the interior points, in place. Ends stay put so the jet stays attached. */
export function smooth(points: JetPoint[]): void {
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1] as JetPoint;
    const here = points[i] as JetPoint;
    const next = points[i + 1] as JetPoint;
    here.x += ((prev.x + next.x) / 2 - here.x) * SMOOTHING;
    here.y += ((prev.y + next.y) / 2 - here.y) * SMOOTHING;
  }
}

/** Pushes each point sideways by a wave travelling down the jet: pinned at the nozzle, widest at the tip. */
export function ripple(points: JetPoint[], time: number, amplitude = RIPPLE_AMPLITUDE_PX): void {
  const first = points[0] as JetPoint;
  const last = points[points.length - 1] as JetPoint;
  const length = Math.hypot(last.x - first.x, last.y - first.y) || 1;
  const normalX = -(last.y - first.y) / length;
  const normalY = (last.x - first.x) / length;
  for (let i = 1; i < points.length; i++) {
    const point = points[i] as JetPoint;
    const along = Math.hypot(point.x - first.x, point.y - first.y);
    const wave = Math.sin(
      (along / RIPPLE_WAVELENGTH_PX) * Math.PI * 2 - (time / 1000) * RIPPLE_SPEED,
    );
    const offset = wave * amplitude * Math.min(1, along / length);
    point.x += normalX * offset;
    point.y += normalY * offset;
  }
}

/**
 * Walks the jet and returns a sample every `step` px, with sideways directions. Stretches between
 * neighbours longer than `maxGap` are skipped as gaps (pass Infinity for a straight beam).
 */
export function sampleAlong(
  points: readonly JetPoint[],
  step: number,
  phase = 0,
  maxGap = MAX_JOIN_PX,
): Sample[] {
  const out: Sample[] = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as JetPoint;
    const b = points[i] as JetPoint;
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  if (total < 1) return out;
  let next = phase % step;
  let walked = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1] as JetPoint;
    const b = points[i] as JetPoint;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len < 0.001 || len > maxGap) {
      walked += len;
      continue;
    }
    while (next <= walked + len) {
      const f = (next - walked) / len;
      out.push({
        x: a.x + (b.x - a.x) * f,
        y: a.y + (b.y - a.y) * f,
        nx: -(b.y - a.y) / len,
        ny: (b.x - a.x) / len,
        along: next,
        t: next / total,
      });
      next += step;
    }
    walked += len;
  }
  return out;
}

/** The jet pushed sideways by `offset(i, t)` px at each point (a copy; the original is untouched). */
export function shifted(
  points: readonly JetPoint[],
  offset: (index: number, t: number) => number,
): JetPoint[] {
  const last = points.length - 1;
  return points.map((p, i) => {
    const a = points[Math.max(0, i - 1)] as JetPoint;
    const b = points[Math.min(last, i + 1)] as JetPoint;
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const o = offset(i, i / Math.max(1, last));
    return { x: p.x - ((b.y - a.y) / len) * o, y: p.y + ((b.x - a.x) / len) * o, seq: p.seq };
  });
}

/** A repeatable pseudo-random number from 0 to 1 for the integers `a` and `b`. */
export function hash01(a: number, b = 0): number {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

/** Straight line from the nozzle to the far end of the jet: for beams that do not arc. */
export function beamLine(points: readonly JetPoint[]): JetPoint[] {
  const first = points[0] as JetPoint;
  const last = points[points.length - 1] as JetPoint;
  return [first, last];
}

/** Length of a two-point line. */
export function lineLength(line: readonly JetPoint[]): number {
  const a = line[0] as JetPoint;
  const b = line[1] as JetPoint;
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/** A four-pointed sparkle (long thin arms, no centre disc) at (x, y), `arm` px from centre to tip. */
export function fillSparkle4(
  gfx: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  arm: number,
  colour: number,
  alpha: number,
): void {
  const waist = arm * SPARKLE_WAIST;
  gfx.fillStyle(colour, alpha);
  gfx.fillTriangle(x - waist, y, x + waist, y, x, y - arm);
  gfx.fillTriangle(x - waist, y, x + waist, y, x, y + arm);
  gfx.fillTriangle(x, y - waist, x, y + waist, x - arm, y);
  gfx.fillTriangle(x, y - waist, x, y + waist, x + arm, y);
}

/** A five-pointed star at (x, y), `radius` px to the points, turned by `rot` radians. */
export function fillStar5(
  gfx: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  rot: number,
  colour: number,
  alpha: number,
): void {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < STAR_POINTS * 2; i++) {
    const r = i % 2 === 0 ? radius : radius * STAR_INNER;
    const a = rot + (i / (STAR_POINTS * 2)) * Math.PI * 2 - Math.PI / 2;
    points.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r });
  }
  gfx.fillStyle(colour, alpha);
  gfx.fillPoints(points, true);
}
