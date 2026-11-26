/**
 * The note fountain's one shared pool: a fixed cap of reusable images, each
 * playing out a pose from noteMotion.ts, and the cap policy that decides what
 * gives way when they are all busy.
 */

import type Phaser from 'phaser';

import { NOTE_TEXTURE, TEXTURE_SUPERSAMPLE } from '../../ui/noteShapes';
import { poseAt, type MotionParams } from './noteMotion';
import { MAX_LIVE_VISUALS, decideCap, hudFade } from './noteFountainRules';

/** Everything needed to start one visual. */
export interface VisualSpec {
  readonly texture: string;
  readonly motion: MotionParams;
  readonly lifeMs: number;
  readonly tint: number;
  readonly depth: number;
  /** How much it matters when the pool is full. */
  readonly priority: number;
  /** Its size, the second tie-break when the pool is full. */
  readonly size: number;
  /** Ribbons and streaks grow from one end. */
  readonly originX?: number;
}

interface Item {
  readonly img: Phaser.GameObjects.Image;
  active: boolean;
  born: number;
  life: number;
  motion: MotionParams;
  priority: number;
  size: number;
}

const EMPTY_MOTION: MotionParams = {
  kind: 'rise',
  ox: 0,
  oy: 0,
  dx: 0,
  dy: 0,
  dist: 0,
  amp: 0,
  scale: 1,
  rot: 0,
};
const CENTRE = 0.5;

export class NotePool {
  private readonly _items: Item[] = [];
  private _time = 0;

  constructor(private readonly _scene: Phaser.Scene) {}

  /** The scene time of the latest update, in ms. */
  get now(): number {
    return this._time;
  }

  /** How many visuals are alive right now. */
  get liveCount(): number {
    return this._items.reduce((n, item) => n + (item.active ? 1 : 0), 0);
  }

  /** Starts a visual, making room by the cap policy; dropped if everything alive matters more. */
  add(spec: VisualSpec): void {
    const item = this._acquire(spec.priority, spec.size);
    if (!item) return;
    item.active = true;
    item.born = this._time;
    item.life = spec.lifeMs;
    item.motion = spec.motion;
    item.priority = spec.priority;
    item.size = spec.size;
    item.img
      .setTexture(spec.texture)
      .setOrigin(spec.originX ?? CENTRE, CENTRE)
      .setTint(spec.tint)
      .setDepth(spec.depth)
      .setVisible(true);
    this._apply(item, 0);
  }

  /** Moves everything alive to where it should be at `time` (ms). Call once a frame. */
  update(time: number): void {
    this._time = time;
    for (const item of this._items) {
      if (!item.active) continue;
      const t = (time - item.born) / item.life;
      if (t >= 1) {
        item.active = false;
        item.img.setVisible(false);
      } else {
        this._apply(item, t);
      }
    }
  }

  private _apply(item: Item, t: number): void {
    const pose = poseAt(item.motion, t);
    item.img
      .setPosition(pose.x, pose.y)
      .setScale(pose.scaleX / TEXTURE_SUPERSAMPLE, pose.scaleY / TEXTURE_SUPERSAMPLE)
      .setRotation(pose.rotation)
      .setAlpha(pose.alpha * hudFade(pose.y));
  }

  private _acquire(priority: number, size: number): Item | null {
    const free = this._items.find((item) => !item.active);
    if (free) return free;
    if (this._items.length < MAX_LIVE_VISUALS) {
      const img = this._scene.add.image(0, 0, NOTE_TEXTURE.crotchet).setVisible(false);
      const item: Item = {
        img,
        active: false,
        born: 0,
        life: 1,
        motion: EMPTY_MOTION,
        priority,
        size,
      };
      this._items.push(item);
      return item;
    }
    const decision = decideCap(
      this._items.map((item) => ({
        priority: item.priority,
        size: item.size,
        age: this._time - item.born,
      })),
      priority,
    );
    return decision.admit ? (this._items[decision.evict] ?? null) : null;
  }
}
