/**
 * The visible half of the band: every note the audio plays throws a drawn
 * visual from its instrument, in its section's colour — ribbons from the
 * strings, bold bursts from the brass, spirals from the woodwind, slow drifts
 * from the bass, stair-stepping pairs from the keys, sparkles from the plucked
 * and rings from the percussion. Shapes are in ui/noteShapes.ts, choices in
 * noteFountainRules.ts, movement in noteMotion.ts and the capped pool in
 * NotePool.ts.
 */

import Phaser from 'phaser';

import type { InstrumentFamily } from '../../audio/orchestra/families';
import { FAMILY_PALETTE } from '../../entities/spinner/instrumentBadge';
import type { Spinner } from '../../entities/spinner/Spinner';
import { SpinnerState } from '../../entities/spinner/spinner.types';
import { ensureNoteTextures, NOTE_TEXTURE, textureForShape } from '../../ui/noteShapes';
import { COLOUR } from '../../utils/colour';
import type { MotionParams } from './noteMotion';
import {
  FLOURISH_CHANCE,
  SECTION_STYLE,
  SQUIRT_BURST_GAP_MS,
  noteScale,
  pickShape,
  priorityFor,
  shouldSpawn,
  throwsNotes,
} from './noteFountainRules';
import {
  EFFECT_DEPTH,
  HUB_RING_LIFE_MS,
  NOTE_DEPTH,
  NoteEffects,
  SPARK_DIST_PX,
} from './NoteEffects';
import { NotePool } from './NotePool';

const EDGE_FRACTION = 0.85;
const OUTWARD_WEIGHT = 0.7;
const UP_BIAS = 0.7;
const JITTER = 0.5;
const RISE_PX = 70;
const SPIRAL_RISE_PX = 90;
const SPIRAL_CURL_PX = 14;
const DRIFT_PX = 80;
const DRIFT_RISE = 0.12;
const STAIR_STEP_PX = 14;
const STAIR_UP = 0.85;
const RIBBON_DRIFT_PX = 30;
const STREAK_LIFE_MS = 350;
const STREAK_TURNS = [-0.45, 0, 0.45] as const;
const STREAK_SCALE = 0.9;
const SPARK_COUNT = 4;
const FLOURISH_SPARKS = 3;
const HUB_RING_FACTOR = 2.2;
const IMPACT_SQUIRT_SCALE = 1.3;
const FAN_SCALE = 0.85;
const DEFAULT_FAMILY: InstrumentFamily = 'strings';

const hex = (value: string): number => Phaser.Display.Color.HexStringToColor(value).color;

/** What the fountain needs to know about one note the audio played. */
export interface FountainNote {
  readonly velocity: number;
  readonly spray: boolean;
}

export class NoteFountain {
  private readonly _pool: NotePool;
  private readonly _effects: NoteEffects;
  private readonly _counts = new Map<number, number>();
  private readonly _lastBurst = new Map<number, number>();

  constructor(scene: Phaser.Scene) {
    ensureNoteTextures(scene);
    this._pool = new NotePool(scene);
    this._effects = new NoteEffects(this._pool);
  }

  /** How many visuals are alive right now. */
  get liveCount(): number {
    return this._pool.liveCount;
  }

  /** Moves everything alive to where it should be at `time` (ms). Call once a frame. */
  update(time: number): void {
    this._pool.update(time);
  }

  /**
   * Throws the visual for one note just played by `spinner`. `centre` is the
   * middle of the wall, which everything rises away from; `frenzy` turns the
   * whole fountain Sunny Gold.
   */
  note(
    spinner: Spinner,
    note: FountainNote,
    centre: Phaser.Types.Math.Vector2Like,
    frenzy: boolean,
  ): void {
    const family = spinner.def.family ?? DEFAULT_FAMILY;
    const style = SECTION_STYLE[family];
    const state = spinner.currentState;
    const tint = frenzy ? COLOUR.sunnyGold : hex(FAMILY_PALETTE[family][1] ?? '#FFFFFF');
    const count = (this._counts.get(spinner.id) ?? 0) + 1;
    this._counts.set(spinner.id, count);

    if (note.spray) {
      this._squirt(spinner, note, centre, tint);
      return;
    }
    if (state === SpinnerState.FULL && style.motion !== 'impact') {
      this._effects.ring(spinner, HUB_RING_FACTOR, HUB_RING_LIFE_MS, tint, 1);
    }
    if (!shouldSpawn(state, count, this._pool.liveCount)) return;

    const priority = priorityFor(state, false);
    const scale = noteScale(note.velocity, style);
    if (!throwsNotes(style)) {
      this._effects.impact(spinner, tint, priority, scale);
      return;
    }
    const tex = textureForShape(pickShape(style, state, count, Math.random()));
    const dir = this._direction(spinner, centre);
    const o = this._start(spinner, dir);
    const base: MotionParams = {
      kind: 'rise',
      ox: o.x,
      oy: o.y,
      dx: dir.x,
      dy: dir.y,
      dist: RISE_PX,
      amp: 0,
      rot: 0,
      scale,
    };
    const put = (texture: string, motion: MotionParams, life: number, depth = NOTE_DEPTH): void =>
      this._pool.add({
        texture,
        motion,
        lifeMs: life,
        tint,
        depth,
        priority,
        size: scale,
        ...(texture === NOTE_TEXTURE.ribbon || texture === NOTE_TEXTURE.streak
          ? { originX: 0 }
          : {}),
      });
    const side = dir.x < 0 ? -1 : 1;

    switch (style.motion) {
      case 'ribbon': {
        const ribbon = { ...base, dist: RIBBON_DRIFT_PX };
        put(NOTE_TEXTURE.ribbon, { ...ribbon, kind: 'ribbon' }, style.lifeMs, EFFECT_DEPTH);
        put(tex, { ...ribbon, kind: 'ribbonNote' }, style.lifeMs);
        break;
      }
      case 'burst': {
        put(tex, base, style.lifeMs);
        const back = Math.atan2(-dir.y, -dir.x);
        for (const turn of STREAK_TURNS) {
          const line: MotionParams = {
            ...base,
            kind: 'streak',
            dx: Math.cos(back + turn),
            dy: Math.sin(back + turn),
            dist: SPARK_DIST_PX,
            scale: STREAK_SCALE,
          };
          put(NOTE_TEXTURE.streak, line, STREAK_LIFE_MS, EFFECT_DEPTH);
        }
        break;
      }
      case 'spiral':
        put(
          tex,
          {
            ...base,
            kind: 'spiral',
            dist: SPIRAL_RISE_PX,
            amp: SPIRAL_CURL_PX,
            rot: Math.random() * Math.PI * 2,
          },
          style.lifeMs,
        );
        break;
      case 'drift':
        put(
          tex,
          { ...base, kind: 'sideways', dx: side, dy: DRIFT_RISE, dist: DRIFT_PX, rot: -side * 0.3 },
          style.lifeMs,
        );
        break;
      case 'stairs':
        put(
          tex,
          { ...base, kind: 'stairs', dx: side, dy: -STAIR_UP, dist: 0, amp: STAIR_STEP_PX },
          style.lifeMs,
        );
        break;
      default:
        put(tex, base, style.lifeMs);
        this._effects.sparks(o, SPARK_COUNT, tint, priority);
    }
    if (state === SpinnerState.FULL && Math.random() < FLOURISH_CHANCE) {
      this._effects.sparks(o, FLOURISH_SPARKS, tint, priority);
    }
  }

  /** A fan of notes thrown on the player's own squirt, at most one burst per instrument per quarter second. */
  private _squirt(
    spinner: Spinner,
    note: FountainNote,
    centre: Phaser.Types.Math.Vector2Like,
    tint: number,
  ): void {
    const now = this._pool.now;
    if (now - (this._lastBurst.get(spinner.id) ?? -Infinity) < SQUIRT_BURST_GAP_MS) return;
    this._lastBurst.set(spinner.id, now);
    const style = SECTION_STYLE[spinner.def.family ?? DEFAULT_FAMILY];
    const priority = priorityFor(spinner.currentState, true);
    if (!throwsNotes(style)) {
      this._effects.impact(spinner, tint, priority, IMPACT_SQUIRT_SCALE);
      return;
    }
    const dir = this._direction(spinner, centre);
    const scale = noteScale(note.velocity, style) * FAN_SCALE;
    this._effects.fan(this._start(spinner, dir), dir, style.shapes, scale, tint, priority);
  }

  /** A unit direction away from the wall's centre, leaning upward. */
  private _direction(spinner: Spinner, centre: Phaser.Types.Math.Vector2Like): Phaser.Math.Vector2 {
    const out = new Phaser.Math.Vector2(spinner.x - (centre.x ?? 0), spinner.y - (centre.y ?? 0));
    if (out.lengthSq() < 1) out.set(0, 0);
    else out.normalize();
    return out
      .set(
        out.x * OUTWARD_WEIGHT + (Math.random() - 0.5) * JITTER,
        out.y * OUTWARD_WEIGHT - UP_BIAS,
      )
      .normalize();
  }

  private _start(spinner: Spinner, dir: Phaser.Math.Vector2): Phaser.Math.Vector2 {
    const reach = spinner.def.r * EDGE_FRACTION;
    return new Phaser.Math.Vector2(spinner.x + dir.x * reach, spinner.y + dir.y * reach);
  }
}
