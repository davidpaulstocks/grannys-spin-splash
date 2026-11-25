/**
 * Draws the cannon's water as a continuous jet rather than a row of dots.
 *
 * The particles are still the simulation — they carry the physics and the
 * hits — but each stream's particles are joined, nozzle to tip, into one
 * tapering ribbon with a darker rim and a bright core. Because the ribbon
 * follows the particles actually in flight, it bends and whips like a hose
 * when the aim moves, for free.
 */

import Phaser from 'phaser';

import { shade } from '../../utils/colour';
import type { WaterParticle } from './WaterParticle';

/** Ribbon width at the nozzle and at the tip, as multiples of the gun's own particle size. */
const WIDTH_AT_NOZZLE = 2.6;
const WIDTH_AT_TIP = 1.5;
const RIM_EXTRA_PX = 4;
const RIM_SHADE = 0.62;
const CORE_WIDTH_FRACTION = 0.36;
const CORE_ALPHA = 0.6;
/** Particles further apart than this aren't the same continuous stretch of water. */
const MAX_JOIN_PX = 130;
/** How strongly each point is pulled toward its neighbours — irons out per-shot wobble into a curve. */
const SMOOTHING = 0.5;
/**
 * A ripple that runs down the jet, growing toward the tip. Without it a
 * locked-on stream is a perfectly straight bar and reads as a laser; water
 * under pressure shivers.
 */
const RIPPLE_AMPLITUDE_PX = 5;
const RIPPLE_WAVELENGTH_PX = 70;
const RIPPLE_SPEED = 26;
/** The far end of the jet thins out to spray rather than ending in a hard cap. */
const TIP_ALPHA = 0.75;

interface Point {
  x: number;
  y: number;
}

export class WaterJet {
  private readonly _gfx: Phaser.GameObjects.Graphics;
  private readonly _pool: Phaser.GameObjects.Group;

  constructor(scene: Phaser.Scene, pool: Phaser.GameObjects.Group) {
    this._pool = pool;
    this._gfx = scene.add.graphics();
  }

  setDepth(depth: number): void {
    this._gfx.setDepth(depth);
  }

  /**
   * Redraws the jet — call once per frame after the particles have moved.
   * `nozzle` anchors the ribbon to the gun while `firing`; without it the
   * last of the water simply flies on and thins out.
   */
  update(time: number, nozzle: Point, firing: boolean, colour: number, particleSize: number): void {
    const gfx = this._gfx;
    gfx.clear();

    const streams = new Map<number, WaterParticle[]>();
    for (const child of this._pool.getChildren() as WaterParticle[]) {
      if (!child.active || child.stream < 0) continue;
      const list = streams.get(child.stream);
      if (list) list.push(child);
      else streams.set(child.stream, [child]);
    }

    const rim = shade(colour, RIM_SHADE);
    for (const particles of streams.values()) {
      // Newest first: the ribbon runs from the gun outward.
      particles.sort((a, b) => b.seq - a.seq);
      const points: Point[] = particles.map((p) => ({ x: p.x, y: p.y }));
      if (firing) points.unshift({ x: nozzle.x, y: nozzle.y });
      if (points.length < 2) continue;
      smooth(points);
      ripple(points, time);

      this._strokeRibbon(points, rim, 1, particleSize, RIM_EXTRA_PX, 1);
      this._strokeRibbon(points, colour, 1, particleSize, 0, 1);
      this._strokeRibbon(points, 0xffffff, CORE_ALPHA, particleSize, 0, CORE_WIDTH_FRACTION);
    }
  }

  destroy(): void {
    this._gfx.destroy();
  }

  private _strokeRibbon(
    points: readonly Point[],
    colour: number,
    alpha: number,
    particleSize: number,
    extraPx: number,
    widthFraction: number,
  ): void {
    const gfx = this._gfx;
    const last = points.length - 1;
    for (let i = 0; i < last; i++) {
      const a = points[i] as Point;
      const b = points[i + 1] as Point;
      if (Math.abs(a.x - b.x) + Math.abs(a.y - b.y) > MAX_JOIN_PX) continue;
      const t = i / last;
      const width =
        (particleSize * (WIDTH_AT_NOZZLE + (WIDTH_AT_TIP - WIDTH_AT_NOZZLE) * t) + extraPx) *
        widthFraction;
      const fade = alpha * (1 - (1 - TIP_ALPHA) * t);
      gfx.lineStyle(width, colour, fade);
      gfx.lineBetween(a.x, a.y, b.x, b.y);
      // Thick lines have square ends; a disc at each joint rounds the bends.
      gfx.fillStyle(colour, fade);
      gfx.fillCircle(b.x, b.y, width / 2);
    }
  }
}

/** One pass of neighbour averaging over the interior points, in place. Ends stay put so the jet stays attached. */
function smooth(points: Point[]): void {
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1] as Point;
    const here = points[i] as Point;
    const next = points[i + 1] as Point;
    here.x += ((prev.x + next.x) / 2 - here.x) * SMOOTHING;
    here.y += ((prev.y + next.y) / 2 - here.y) * SMOOTHING;
  }
}

/**
 * Pushes each point sideways by a wave travelling down the jet. The wave is
 * pinned at the nozzle and widest at the tip, so the water leaves the gun
 * clean and loosens as it flies.
 */
function ripple(points: Point[], time: number): void {
  const first = points[0] as Point;
  const last = points[points.length - 1] as Point;
  const length = Math.hypot(last.x - first.x, last.y - first.y) || 1;
  const normalX = -(last.y - first.y) / length;
  const normalY = (last.x - first.x) / length;
  for (let i = 1; i < points.length; i++) {
    const point = points[i] as Point;
    const along = Math.hypot(point.x - first.x, point.y - first.y);
    const wave = Math.sin(
      (along / RIPPLE_WAVELENGTH_PX) * Math.PI * 2 - (time / 1000) * RIPPLE_SPEED,
    );
    const offset = wave * RIPPLE_AMPLITUDE_PX * Math.min(1, along / length);
    point.x += normalX * offset;
    point.y += normalY * offset;
  }
}
