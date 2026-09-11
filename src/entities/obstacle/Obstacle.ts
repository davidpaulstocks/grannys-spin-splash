/**
 * Cat / Umbrella / Duck — each blocks water in its own way (CLAUDE.md §1,
 * §4). Behaviour ported from the reference prototype's `buildObstacles`/
 * `_updateCat`/`_updateUmbrella`/`_updateDuck` (`game prototype/
 * granny-spin-splash.html`):
 *
 * - **Cat** sits on a random spinner and caps its speed at
 *   {@link CAT_SPEED_CAP} the whole time it's there — landing a shot near
 *   the cat (not the spinner itself) shoos it off for
 *   {@link CAT_FLEE_SECONDS}, freeing that spinner, after which it picks a
 *   new spinner to sit on.
 * - **Umbrella** toggles open/closed on a timer; while open it blocks any
 *   shot passing beneath it.
 * - **Duck** just paddles back and forth, deflecting anything that hits it.
 *
 * Drawing lives in obstacleRenderers.ts; this class owns position + state.
 */

import Phaser from 'phaser';

import { distance } from '../../utils/math';
import { drawCat, drawDuck, drawUmbrella } from './obstacleRenderers';
import type { ObstacleKind } from './obstacle.types';
import type { Spinner } from '../spinner/Spinner';
import type { WaterParticle } from '../waterParticle/WaterParticle';

/** Cat-only: the sat-on spinner's speed can never climb past this while the cat is there. */
const CAT_SPEED_CAP = 30;
/** Cat-only: how long it stays away (fleeing at CAT_FLEE_SPEED) before returning to sit on a new spinner. */
const CAT_FLEE_SECONDS = 10;
const CAT_FLEE_SPEED = 200;
const CAT_SHOO_RADIUS = 26;
/** Vertical offset above its spinner where the cat sits (and where a shot has to land to shoo it). */
const CAT_PERCH_OFFSET = 22;

/** Umbrella-only: open/closed dwell time ranges, seconds. */
const UMBRELLA_OPEN_SECONDS: readonly [number, number] = [2, 3.5];
const UMBRELLA_CLOSED_SECONDS: readonly [number, number] = [1.5, 2.5];
const UMBRELLA_BLOCK_RADIUS = 46;

/** Duck-only: paddle speed and hit radius. */
const DUCK_SPEED = 70;
const DUCK_BLOCK_RADIUS = 24;

function randomRange([min, max]: readonly [number, number]): number {
  return min + Math.random() * (max - min);
}

interface SpawnBounds {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

/** Picks a random point in `bounds` that isn't too close to any spinner — used by umbrella/duck placement. */
function randomFreePoint(
  bounds: SpawnBounds,
  spinners: readonly Spinner[],
): { x: number; y: number } {
  let x = bounds.x0;
  let y = bounds.y0;
  for (let tries = 0; tries < 20; tries++) {
    x = bounds.x0 + Math.random() * (bounds.x1 - bounds.x0);
    y = bounds.y0 + Math.random() * (bounds.y1 - bounds.y0);
    if (spinners.every((s) => distance(x, y, s.x, s.y) > 70)) break;
  }
  return { x, y };
}

export class Obstacle extends Phaser.GameObjects.Container {
  readonly kind: ObstacleKind;
  private readonly _gfx: Phaser.GameObjects.Graphics;

  // Cat-only state.
  private _catTarget: Spinner | null = null;
  private _catFleeing = false;
  private _catFleeDir: 1 | -1 = 1;
  private _catReturnTimer = 0;

  // Umbrella-only state.
  private _umbrellaOpen = false;
  private _umbrellaTimer = randomRange(UMBRELLA_CLOSED_SECONDS);

  // Duck-only state.
  private _duckVx = DUCK_SPEED;

  constructor(
    scene: Phaser.Scene,
    kind: ObstacleKind,
    bounds: SpawnBounds,
    spinners: readonly Spinner[],
  ) {
    super(scene, 0, 0);
    this.kind = kind;
    this._gfx = scene.add.graphics();
    this.add(this._gfx);
    scene.add.existing(this);

    if (kind === 'cat') {
      this._catTarget = spinners[Math.floor(Math.random() * spinners.length)] ?? null;
      this._sitOnTarget();
    } else if (kind === 'umbrella') {
      const p = randomFreePoint(bounds, spinners);
      this.setPosition(p.x, p.y);
    } else {
      const p = randomFreePoint(bounds, spinners);
      this.setPosition(p.x, p.y);
      this._duckVx = (Math.random() > 0.5 ? 1 : -1) * DUCK_SPEED;
    }

    this._redraw();
  }

  /** Per-frame behaviour — caps its spinner's speed (cat), toggles (umbrella), or paddles (duck). */
  override update(
    dt: number,
    spinners: readonly Spinner[],
    playFieldX0: number,
    playFieldX1: number,
  ): void {
    if (this.kind === 'cat') this._updateCat(dt, spinners);
    else if (this.kind === 'umbrella') this._updateUmbrella(dt);
    else this._updateDuck(dt, playFieldX0, playFieldX1);
  }

  /** Tests one water particle against this obstacle; recycles it and reacts if blocked. Returns true if blocked. */
  tryBlock(particle: WaterParticle): boolean {
    if (this.kind === 'cat') {
      if (this._catFleeing || !this._catTarget) return false;
      if (distance(particle.x, particle.y, this.x, this.y) >= CAT_SHOO_RADIUS) return false;
      particle.blockAndRecycle();
      this._startFleeing();
      return true;
    }
    if (this.kind === 'umbrella') {
      if (!this._umbrellaOpen) return false;
      if (
        particle.y >= this.y ||
        distance(particle.x, particle.y, this.x, this.y) >= UMBRELLA_BLOCK_RADIUS
      ) {
        return false;
      }
      particle.blockAndRecycle();
      return true;
    }
    if (distance(particle.x, particle.y, this.x, this.y) >= DUCK_BLOCK_RADIUS) return false;
    particle.blockAndRecycle();
    return true;
  }

  private _sitOnTarget(): void {
    if (!this._catTarget) return;
    this.setPosition(
      this._catTarget.x,
      this._catTarget.y - this._catTarget.def.r - CAT_PERCH_OFFSET,
    );
  }

  private _startFleeing(): void {
    this._catFleeing = true;
    this._catReturnTimer = CAT_FLEE_SECONDS;
    this._catFleeDir = Math.random() > 0.5 ? 1 : -1;
  }

  private _updateCat(dt: number, spinners: readonly Spinner[]): void {
    if (!this._catFleeing) {
      if (this._catTarget) {
        this._catTarget.currentSpeed = Math.min(this._catTarget.currentSpeed, CAT_SPEED_CAP);
        this._sitOnTarget();
      }
      return;
    }
    this.x += this._catFleeDir * CAT_FLEE_SPEED * dt;
    this._catReturnTimer -= dt;
    if (this._catReturnTimer <= 0) {
      this._catFleeing = false;
      this._catTarget = spinners[Math.floor(Math.random() * spinners.length)] ?? null;
      this._sitOnTarget();
      this._redraw();
    }
  }

  private _updateUmbrella(dt: number): void {
    this._umbrellaTimer -= dt;
    if (this._umbrellaTimer <= 0) {
      this._umbrellaOpen = !this._umbrellaOpen;
      this._umbrellaTimer = this._umbrellaOpen
        ? randomRange(UMBRELLA_OPEN_SECONDS)
        : randomRange(UMBRELLA_CLOSED_SECONDS);
      this._redraw();
    }
  }

  private _updateDuck(dt: number, x0: number, x1: number): void {
    this.x += this._duckVx * dt;
    if (this.x < x0 || this.x > x1) {
      this._duckVx *= -1;
      this._redraw();
    }
  }

  private _redraw(): void {
    if (this.kind === 'cat') drawCat(this._gfx, this._catFleeing);
    else if (this.kind === 'umbrella') drawUmbrella(this._gfx, this._umbrellaOpen);
    else drawDuck(this._gfx, this._duckVx > 0);
  }
}
