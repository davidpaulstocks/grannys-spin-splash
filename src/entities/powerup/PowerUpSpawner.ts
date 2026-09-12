/**
 * Owns the live power-up pickups — spawn scheduling, lifetime, and
 * collision against water particles (CLAUDE.md §7.3 rule 1: kept separate
 * from GameScene, which was already past the 300-line limit before this
 * feature existed). GameScene stays the one place that knows what an
 * effect actually *does* to gameplay state (§7.1 one-way data flow) —
 * this class only reports which effect a shot just collected, at what
 * point, so GameScene can react and drop a floating-text announcement.
 */

import Phaser from 'phaser';

import { POWERUP_DEFS, type PowerUpEffect } from './powerup.data';
import { PowerUp } from './PowerUp';
import { distance } from '../../utils/math';
import type { Spinner } from '../spinner/Spinner';
import type { WaterParticle } from '../waterParticle/WaterParticle';

/** Random delay range before the next pickup spawns, ms (prototype: `Between(12000, 20000)`). */
const SPAWN_DELAY_MS: readonly [number, number] = [12000, 20000];
/** Never more than this many live at once (prototype: `powerups.length<3`). */
const MAX_LIVE = 3;
/** How far a spawn point must stay from any spinner or other pickup (prototype: `<55`). */
const MIN_CLEARANCE = 55;

export interface SpawnBounds {
  readonly x0: number;
  readonly y0: number;
  readonly x1: number;
  readonly y1: number;
}

export interface PowerUpCollection {
  readonly effect: PowerUpEffect;
  readonly x: number;
  readonly y: number;
}

export class PowerUpSpawner {
  private readonly _scene: Phaser.Scene;
  private _powerups: PowerUp[] = [];
  private _nextSpawnAt = 0;

  constructor(scene: Phaser.Scene) {
    this._scene = scene;
    this._scheduleNext(scene.time.now);
  }

  /** Advances every live pickup and tests it against the water pool; returns any effects collected this frame. */
  update(
    time: number,
    delta: number,
    bounds: SpawnBounds,
    spinners: readonly Spinner[],
    particles: readonly WaterParticle[],
  ): readonly PowerUpCollection[] {
    if (time >= this._nextSpawnAt && this._powerups.length < MAX_LIVE) {
      this._spawn(bounds, spinners);
    }

    const collected: PowerUpCollection[] = [];
    this._powerups = this._powerups.filter((powerup) => {
      const expired = powerup.update(time, delta / 1000);
      if (expired) {
        powerup.destroy();
        return false;
      }
      for (const particle of particles) {
        if (!particle.active) continue;
        if (powerup.tryCollect(particle)) {
          collected.push({ effect: powerup.effect, x: powerup.x, y: powerup.y });
          powerup.destroy();
          return false;
        }
      }
      return true;
    });
    return collected;
  }

  private _spawn(bounds: SpawnBounds, spinners: readonly Spinner[]): void {
    const def = POWERUP_DEFS[Math.floor(Math.random() * POWERUP_DEFS.length)];
    let x = bounds.x0;
    let y = bounds.y0;
    for (let tries = 0; tries < 20; tries++) {
      x = bounds.x0 + Math.random() * (bounds.x1 - bounds.x0);
      y = bounds.y0 + Math.random() * (bounds.y1 - bounds.y0);
      const clear =
        spinners.every((s) => distance(x, y, s.x, s.y) > MIN_CLEARANCE) &&
        this._powerups.every((p) => distance(x, y, p.x, p.y) > MIN_CLEARANCE);
      if (clear) break;
    }
    this._powerups.push(new PowerUp(this._scene, x, y, def));
    this._scheduleNext(this._scene.time.now);
  }

  private _scheduleNext(time: number): void {
    const [min, max] = SPAWN_DELAY_MS;
    this._nextSpawnAt = time + min + Math.random() * (max - min);
  }
}
