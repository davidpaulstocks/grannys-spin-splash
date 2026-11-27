/**
 * The one budget for every short-lived impact extra: the shared splash, each
 * projectile's own burst, level-up sparks and confetti. Pieces are reused from
 * a fixed pool instead of being created and destroyed per hit, at most
 * `IMPACT_MAX_LIVE` are alive (and tweening) at once across all of them, and a
 * piece that finds the pool busy is dropped, never queued. One pool per scene,
 * dropped when the scene shuts down (a restarted scene keeps its object, but
 * its display list and so every pooled piece is gone).
 */

import type Phaser from 'phaser';

/** Most impact pieces alive at once, all effects together. Also the most the pool ever holds. */
export const IMPACT_MAX_LIVE = 120;
/** Of those, the most that celebrations (sparks, confetti) may hold, so they never crowd out hit feedback. */
export const IMPACT_CELEBRATION_MAX_LIVE = 60;

export type PieceShape = 'circle' | 'ring' | 'rect' | 'triangle' | 'star';
/** Hit feedback gets the whole budget; celebrations only their share of it. */
export type PieceClass = 'hit' | 'celebration';

/** One piece to play: where it starts, how it looks and where its tween takes it. */
export interface PieceSpec {
  readonly kind: PieceClass;
  readonly shape: PieceShape;
  /** Circle and ring radius, rect width, triangle and star size. */
  readonly size: number;
  /** Rect height, or a ring's stroke width. */
  readonly thickness?: number;
  readonly x: number;
  readonly y: number;
  readonly colour: number;
  readonly alpha: number;
  /** A ring's stroke colour (defaults to `colour`). */
  readonly strokeColour?: number;
  readonly depth?: number;
  readonly rotation?: number;
  readonly startScale?: number;
  readonly to: {
    readonly x?: number;
    readonly y?: number;
    readonly scale?: number;
    readonly rotation?: number;
  };
  readonly duration: number;
  readonly ease: string;
}

/** Phaser's `Scenes.Events.SHUTDOWN`, spelled out so this file never loads Phaser at runtime (and tests can drive it). */
const SCENE_SHUTDOWN = 'shutdown';
const DEFAULT_THICKNESS = 2;
const STAR_POINTS = 4;
const STAR_INNER_RATIO = 0.35;

function keyOf(spec: PieceSpec): string {
  return `${spec.shape}:${spec.size}:${spec.thickness ?? DEFAULT_THICKNESS}`;
}

function create(scene: Phaser.Scene, spec: PieceSpec): Phaser.GameObjects.Shape {
  const { x, y, size, colour } = spec;
  switch (spec.shape) {
    case 'rect':
      return scene.add.rectangle(x, y, size, spec.thickness ?? DEFAULT_THICKNESS, colour, 1);
    case 'triangle':
      return scene.add.triangle(x, y, 0, size, size, size, size / 2, 0, colour, 1);
    case 'star':
      return scene.add.star(x, y, STAR_POINTS, size * STAR_INNER_RATIO, size, colour, 1);
    default:
      return scene.add.circle(x, y, size, colour, 1);
  }
}

export class ImpactPool {
  private readonly _free = new Map<string, Phaser.GameObjects.Shape[]>();
  private _live = 0;
  private _liveCelebration = 0;
  private _total = 0;

  constructor(private readonly _scene: Phaser.Scene) {}

  /** Pieces alive and tweening right now. */
  get live(): number {
    return this._live;
  }

  /** Plays one piece; returns false (and does nothing) when the budget is spent. */
  play(spec: PieceSpec): boolean {
    const celebration = spec.kind === 'celebration';
    if (this._live >= IMPACT_MAX_LIVE) return false;
    if (celebration && this._liveCelebration >= IMPACT_CELEBRATION_MAX_LIVE) return false;
    const key = keyOf(spec);
    const piece = this._take(key, spec);
    this._live++;
    if (celebration) this._liveCelebration++;

    this._style(piece, spec);
    this._scene.tweens.add({
      targets: piece,
      ...spec.to,
      alpha: 0,
      duration: spec.duration,
      ease: spec.ease,
      onComplete: () => {
        piece.setActive(false).setVisible(false);
        this._free.get(key)?.push(piece);
        this._live--;
        if (celebration) this._liveCelebration--;
      },
    });
    return true;
  }

  /** A free piece of this key, else a new one; when the pool is full of other keys, retires one of those first. */
  private _take(key: string, spec: PieceSpec): Phaser.GameObjects.Shape {
    let list = this._free.get(key);
    if (!list) {
      list = [];
      this._free.set(key, list);
    }
    const reused = list.pop();
    if (reused) return reused;
    if (this._total >= IMPACT_MAX_LIVE) this._retireOneFree();
    this._total++;
    return create(this._scene, spec);
  }

  private _retireOneFree(): void {
    for (const list of this._free.values()) {
      const old = list.pop();
      if (!old) continue;
      old.destroy();
      this._total--;
      return;
    }
  }

  private _style(piece: Phaser.GameObjects.Shape, spec: PieceSpec): void {
    piece
      .setPosition(spec.x, spec.y)
      .setScale(spec.startScale ?? 1)
      .setRotation(spec.rotation ?? 0)
      .setDepth(spec.depth ?? 0)
      .setActive(true)
      .setVisible(true)
      .setAlpha(1);
    if (spec.shape === 'ring') {
      piece.setFillStyle(spec.colour, 0);
      piece.setStrokeStyle(
        spec.thickness ?? DEFAULT_THICKNESS,
        spec.strokeColour ?? spec.colour,
        spec.alpha,
      );
    } else {
      piece.setFillStyle(spec.colour, spec.alpha);
    }
  }
}

const _pools = new WeakMap<Phaser.Scene, ImpactPool>();

/** The scene's impact pool, made on first use and forgotten when the scene shuts down. */
export function impactPoolFor(scene: Phaser.Scene): ImpactPool {
  let pool = _pools.get(scene);
  if (!pool) {
    pool = new ImpactPool(scene);
    _pools.set(scene, pool);
    scene.events.once(SCENE_SHUTDOWN, () => _pools.delete(scene));
  }
  return pool;
}
