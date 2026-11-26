/**
 * The short-lived extras of the note fountain: the fan thrown on a squirt, the
 * strike of a percussion instrument, a speaker ring from a hub and a pop of
 * sparks. Each one is a few visuals handed to the shared pool.
 */

import Phaser from 'phaser';

import type { Spinner } from '../../entities/spinner/Spinner';
import { NOTE_TEXTURE, textureForShape } from '../../ui/noteShapes';
import type { NoteShape } from './noteFountainRules';
import type { NotePool } from './NotePool';

/** Notes and effects sit above the spinners and the jet, below floating text. */
export const NOTE_DEPTH = 160;
export const EFFECT_DEPTH = 158;
const SPARK_LIFE_MS = 380;
const SPARK_SCALE = 0.9;
export const SPARK_DIST_PX = 34;
export const HUB_RING_LIFE_MS = 380;
const IMPACT_LIFE_MS = 480;
const IMPACT_RING_FACTOR = 3;
const IMPACT_BURST_FACTOR = 1.7;
const FAN_MIN = 3;
const FAN_MAX = 5;
const FAN_SPREAD = 0.7;
const FAN_DIST_MIN = 80;
const FAN_DIST_MAX = 120;
const FAN_LIFE_MS = 750;
const FAN_TILT = 0.6;
const RING_TEXTURE_PX = 64;

export class NoteEffects {
  constructor(private readonly _pool: NotePool) {}

  /** A fan of notes thrown from `o` around direction `dir`, one per entry of `shapes` in turn. */
  fan(
    o: Phaser.Math.Vector2,
    dir: Phaser.Math.Vector2,
    shapes: readonly NoteShape[],
    scale: number,
    tint: number,
    priority: number,
  ): void {
    const heading = Math.atan2(dir.y, dir.x);
    const n = Phaser.Math.Between(FAN_MIN, FAN_MAX);
    for (let i = 0; i < n; i++) {
      const across = (i / (n - 1)) * 2 - 1;
      const a = heading + across * FAN_SPREAD;
      this._pool.add({
        texture: textureForShape(shapes[i % shapes.length] ?? 'crotchet'),
        motion: {
          kind: 'rise',
          ox: o.x,
          oy: o.y,
          dx: Math.cos(a),
          dy: Math.sin(a),
          dist: Phaser.Math.Between(FAN_DIST_MIN, FAN_DIST_MAX),
          amp: 0,
          rot: across * FAN_TILT,
          scale,
        },
        lifeMs: FAN_LIFE_MS,
        tint,
        depth: NOTE_DEPTH,
        priority,
        size: scale,
      });
    }
  }

  /** Percussion strikes instead of singing: a ring and a small starburst at the hub. */
  impact(spinner: Spinner, tint: number, priority: number, scale: number): void {
    this.ring(spinner, IMPACT_RING_FACTOR * scale, IMPACT_LIFE_MS, tint, priority);
    this._pool.add({
      texture: NOTE_TEXTURE.burst,
      motion: {
        kind: 'burst',
        ox: spinner.x,
        oy: spinner.y,
        dx: 0,
        dy: 0,
        dist: 0,
        amp: 0,
        rot: Math.random() * Math.PI,
        scale: ((spinner.def.r * IMPACT_BURST_FACTOR) / RING_TEXTURE_PX) * scale,
      },
      lifeMs: IMPACT_LIFE_MS,
      tint,
      depth: NOTE_DEPTH,
      priority,
      size: scale,
    });
  }

  /** A soft ring pulsing out from a hub, like a speaker. */
  ring(spinner: Spinner, factor: number, life: number, tint: number, priority: number): void {
    this._pool.add({
      texture: NOTE_TEXTURE.ring,
      motion: {
        kind: 'ring',
        ox: spinner.x,
        oy: spinner.y,
        dx: 0,
        dy: 0,
        dist: 0,
        amp: 0,
        rot: 0,
        scale: (spinner.def.r * factor) / RING_TEXTURE_PX,
      },
      lifeMs: life,
      tint,
      depth: EFFECT_DEPTH,
      priority,
      size: 0,
    });
  }

  sparks(at: Phaser.Types.Math.Vector2Like, count: number, tint: number, priority: number): void {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      this._pool.add({
        texture: NOTE_TEXTURE.spark,
        motion: {
          kind: 'spark',
          ox: at.x ?? 0,
          oy: at.y ?? 0,
          dx: Math.cos(a),
          dy: Math.sin(a),
          dist: SPARK_DIST_PX,
          amp: 0,
          rot: a,
          scale: SPARK_SCALE,
        },
        lifeMs: SPARK_LIFE_MS,
        tint,
        depth: NOTE_DEPTH,
        priority,
        size: 0,
      });
    }
  }
}
