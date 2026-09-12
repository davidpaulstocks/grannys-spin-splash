/**
 * The bonus Golden Spinner's whole lifecycle — respawn timing, placement
 * clear of the grid, its own update/claim/expiry, and the despawn tween
 * (CLAUDE.md §1). Deliberately *not* part of the fixed wall: it spawns
 * outside the grid, carries its own lifetime, and is excluded from the
 * Frenzy meter and the audio mix, since a temporary bonus shouldn't distort
 * "% of wall at FULL" or steal a spinner's instrument.
 *
 * Same shape as PowerUpSpawner: GameScene ticks it once a frame and acts on
 * what it reports back, rather than owning four more timer fields itself
 * (CLAUDE.md §7.3 rules 1 and 4).
 */

import Phaser from 'phaser';

import { showToast } from '../../ui/Toast';
import { distance } from '../../utils/math';
import { DURATION, EASE } from '../../utils/tween';
import * as SFX from '../../audio/SFX';
import { GOLDEN_LIFETIME_MS, GOLDEN_SPAWN_DELAY_MS } from '../world/world.data';
import type { WallArea } from '../world/wallBuilder';
import { SPINNER_DEFS } from './spinner.data';
import { SpinnerState } from './spinner.types';
import { Spinner } from './Spinner';

/** How far a Golden Spinner must land from every grid spinner, so it never overlaps the wall. */
const GRID_CLEARANCE_PX = 65;
const PLACEMENT_ATTEMPTS = 20;

/** Reported the frame the player takes a Golden Spinner to FULL — GameScene awards and celebrates it. */
export interface GoldenClaim {
  readonly x: number;
  readonly y: number;
  readonly radius: number;
  readonly stars: number;
}

export class GoldenSpinnerSpawner {
  private _spinner: Spinner | null = null;
  private _lifetimeMs = 0;
  private _spawnAt = 0;

  /** Takes the wall it must stay clear of, so placement needs no later hand-off. */
  constructor(
    private readonly _scene: Phaser.Scene,
    private readonly _frequent: boolean,
    private readonly _area: WallArea,
    private readonly _gridSpinners: readonly Spinner[],
  ) {
    this._scheduleNext();
  }

  /** The live Golden Spinner, if one is currently out — GameScene folds it into aim/fire/collision only. */
  get live(): Spinner | null {
    return this._spinner;
  }

  /**
   * Ticks the live Golden Spinner or, if none is out, checks whether it's
   * time to spawn one. Returns a claim only on the frame the player takes it
   * to FULL; an unclaimed one simply expires.
   */
  update(time: number, delta: number): GoldenClaim | null {
    const golden = this._spinner;
    if (!golden) {
      if (time >= this._spawnAt) this._spawn();
      return null;
    }

    const result = golden.update(time, delta);
    if (result?.leveledUp && result.state === SpinnerState.FULL) {
      const claim: GoldenClaim = {
        x: golden.x,
        y: golden.y,
        radius: golden.def.r,
        stars: golden.def.stars,
      };
      this._despawn(false);
      return claim;
    }

    this._lifetimeMs -= delta;
    if (this._lifetimeMs <= 0) this._despawn(true);
    return null;
  }

  /** Clears any live Golden Spinner immediately — call on round end so it can't outlive the run. */
  destroy(): void {
    this._spinner?.destroy();
    this._spinner = null;
  }

  private _spawn(): void {
    const def = SPINNER_DEFS.find((d) => d.type === 'golden');
    if (!def) return;

    const area = this._area;
    let x = area.x;
    let y = area.y;
    for (let tries = 0; tries < PLACEMENT_ATTEMPTS; tries++) {
      x = area.x + Math.random() * area.width;
      y = area.y + Math.random() * area.height;
      if (this._gridSpinners.every((s) => distance(x, y, s.x, s.y) > GRID_CLEARANCE_PX)) break;
    }

    this._spinner = new Spinner(this._scene, x, y, def);
    this._lifetimeMs = GOLDEN_LIFETIME_MS;
    showToast(this._scene, x, y - def.r - 20, 'Golden Spinner appeared!');
    SFX.playGoldenAppear();
  }

  private _despawn(playExpireSfx: boolean): void {
    const golden = this._spinner;
    if (!golden) return;
    this._spinner = null;

    this._scene.tweens.add({
      targets: golden,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: DURATION.celebration,
      ease: EASE.standardIn,
      onComplete: () => golden.destroy(),
    });
    if (playExpireSfx) SFX.playGoldenExpire();
    this._scheduleNext();
  }

  /** Respawn window — shorter (more frequent) in Disco (CLAUDE.md §1's `goldenFrequent`). */
  private _scheduleNext(): void {
    const range = this._frequent ? GOLDEN_SPAWN_DELAY_MS.frequent : GOLDEN_SPAWN_DELAY_MS.normal;
    this._spawnAt = this._scene.time.now + range.min + Math.random() * (range.max - range.min);
  }
}
