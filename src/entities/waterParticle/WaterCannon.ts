/**
 * The gun's water: fire cadence, stream geometry, the tank, and the pump
 * refill cycle. Everything that makes one gun feel different from another
 * lives here, so GameScene orchestrates a round rather than also being the
 * weapon (CLAUDE.md §7.3 rules 1 and 4).
 *
 * It owns no aiming and no scoring — the scene passes in where the shot is
 * going and what it's locked onto, and collisions are resolved elsewhere
 * against the same shared particle pool.
 */

import Phaser from 'phaser';

import { PUMP_REFILL_MS, SOAKER_EXTRA_WOBBLE } from '../../config';
import * as SFX from '../../audio/SFX';
import type { GunDef } from '../gun/gun.types';
import type { Spinner } from '../spinner/Spinner';
import { WaterParticle } from './WaterParticle';

/**
 * Visual-only stream density (2026-09-12, direct user feedback: "the water
 * guns felt much stronger... like they were blasting strongly" — the
 * prototype fires every 28ms, ~8x denser than this game's tuned 110-220ms
 * gun intervals). Rather than touch the tuned interval/power/drain balance
 * in gun.data.ts, the fire cadence, the per-particle power and the drain are
 * all scaled by the same factor, so total DPS and drain-per-second are
 * mathematically unchanged — only the granularity gets finer, which is what
 * actually reads as a dense continuous stream instead of discrete pulses.
 */
export const FIRE_DENSITY_SCALE = 4;

/**
 * Twin-barrel spacing, px (2026-09-12, direct user feedback: multi-stream
 * guns needed streams "aligning to barrels of gun," not just wobble off one
 * shared point). No gun's anchor.json authors a second nozzle position, so
 * each stream is offset a fixed distance perpendicular to the aim direction
 * — a runtime approximation, not real per-barrel art, but it reads as two
 * barrels rather than one.
 */
const BARREL_SPACING_PX = 7;

/** How many extra particles the opening-shot blast surge fires, as a multiple of the gun's stream count. */
const BLAST_SURGE_STREAM_MULTIPLIER = 3;
/** Blast surge camera nudge — smaller than a combo shake, just enough to read as a kick. */
const BLAST_SURGE_SHAKE_DURATION_MS = 90;
const BLAST_SURGE_SHAKE_INTENSITY = 0.004;

/** How many weak dying spurts fire the instant the tank runs dry (CLAUDE.md's "surprise and delight"). */
const SPLUTTER_COUNT = 3;
/** How far those spurts reach relative to their downward drop — short and weak, not a real shot. */
const SPLUTTER_REACH_FRACTION = 0.35;
const SPLUTTER_SPREAD_PX = 30;
const SPLUTTER_DROP_PX = 40;

/** Perpendicular unit vector to the origin->aim direction — barrel-spacing offsets ride along this. */
function perpendicular(
  originX: number,
  originY: number,
  aimX: number,
  aimY: number,
): { x: number; y: number } {
  const dx = aimX - originX;
  const dy = aimY - originY;
  const dist = Math.max(1, Math.hypot(dx, dy));
  return { x: -dy / dist, y: dx / dist };
}

/** What the scene knows each frame that the cannon doesn't: where the shot goes and whether Super Soaker is up. */
export interface ShotRequest {
  readonly firing: boolean;
  readonly origin: { readonly x: number; readonly y: number };
  readonly aimX: number;
  readonly aimY: number;
  readonly target: Spinner | null;
  readonly soakerActive: boolean;
}

/** Reported the frame the pump cycle changes state, so the scene can drive UI and SFX-adjacent feedback. */
export type PumpEvent = 'started' | 'completed' | null;

export class WaterCannon {
  private _tank: number;
  private _isPumping = false;
  private _pumpEndAt = 0;
  private _nextFireAt = 0;
  /** Rising-edge detector for the opening-shot blast surge — true only the instant firing starts, not while held. */
  private _wasFiring = false;
  private _lastOrigin = { x: 0, y: 0 };

  constructor(
    private readonly _scene: Phaser.Scene,
    private readonly _gun: GunDef,
    private readonly _pool: Phaser.GameObjects.Group,
  ) {
    this._tank = _gun.tank;
  }

  get tank(): number {
    return this._tank;
  }

  get isPumping(): boolean {
    return this._isPumping;
  }

  /** Fills the tank and cancels any pump in progress — the rewarded-ad instant refill (CLAUDE.md story 6.3). */
  refillInstantly(): void {
    this._isPumping = false;
    this._tank = this._gun.tank;
  }

  /** Fires this frame's shot if the player is holding fire and there's water to spend. */
  update(time: number, shot: ShotRequest): void {
    this._lastOrigin = { x: shot.origin.x, y: shot.origin.y };
    const justStartedFiring = shot.firing && !this._wasFiring;
    this._wasFiring = shot.firing;

    const canFire = shot.firing && !this._isPumping && this._tank > 0;
    // Once per press, not once per cadence tick, so holding fire doesn't
    // repeatedly re-trigger the surge.
    if (justStartedFiring && canFire) this._fireBlastSurge(shot);
    if (!canFire || time < this._nextFireAt) return;

    const perp = perpendicular(shot.origin.x, shot.origin.y, shot.aimX, shot.aimY);
    const streams = this._gun.streams;
    for (let i = 0; i < streams; i++) {
      const offset = (i - (streams - 1) / 2) * BARREL_SPACING_PX;
      this._fireStream(
        shot.origin.x + perp.x * offset,
        shot.origin.y + perp.y * offset,
        shot.aimX,
        shot.aimY,
        shot.target,
      );
    }
    // Super Soaker power-up: two extra angled streams alongside the main one
    // for its duration (prototype: `applyPowerup`'s `fx.soaker`).
    if (shot.soakerActive) {
      for (const side of [-1, 1] as const) {
        this._fireStream(
          shot.origin.x,
          shot.origin.y,
          shot.aimX,
          shot.aimY,
          shot.target,
          side * SOAKER_EXTRA_WOBBLE,
        );
      }
    }
    // Drain scales down with interval so drain-per-second is unchanged —
    // see FIRE_DENSITY_SCALE's own doc comment.
    this._tank = Math.max(0, this._tank - this._gun.drain / FIRE_DENSITY_SCALE);
    this._nextFireAt = time + this._gun.interval / FIRE_DENSITY_SCALE;
  }

  /** Starts a pump-refill once the tank hits empty, and completes it once its timer elapses. */
  updatePump(time: number): PumpEvent {
    if (this._tank <= 0 && !this._isPumping) {
      this._isPumping = true;
      this._pumpEndAt = time + PUMP_REFILL_MS;
      SFX.playPump();
      this._fireSplutter();
      return 'started';
    }
    if (this._isPumping && time >= this._pumpEndAt) {
      this._isPumping = false;
      this._tank = this._gun.tank;
      SFX.playRefill();
      return 'completed';
    }
    return null;
  }

  /** Pulls one particle from the pool, styles it to this gun, and fires it — the one place that does both. */
  private _fireStream(
    originX: number,
    originY: number,
    aimX: number,
    aimY: number,
    target: Spinner | null,
    extraWobble = 0,
  ): void {
    const particle = this._pool.get() as WaterParticle | null;
    if (!particle) return;
    particle.setAppearance(this._gun.particleColour, this._gun.sz);
    particle.fire(originX, originY, aimX, aimY, target, extraWobble);
  }

  /**
   * A one-off dense burst the instant firing starts — a satisfying kick
   * rather than the stream just beginning flat. Free: it doesn't drain
   * water beyond the regular shot that follows immediately after.
   */
  private _fireBlastSurge(shot: ShotRequest): void {
    const count = this._gun.streams * BLAST_SURGE_STREAM_MULTIPLIER;
    for (let i = 0; i < count; i++) {
      this._fireStream(
        shot.origin.x,
        shot.origin.y,
        shot.aimX,
        shot.aimY,
        shot.target,
        (Math.random() - 0.5) * 0.3,
      );
    }
    this._scene.cameras.main.shake(BLAST_SURGE_SHAKE_DURATION_MS, BLAST_SURGE_SHAKE_INTENSITY);
  }

  /**
   * A few weak dying dribbles the instant the tank actually runs dry
   * (2026-09-12, direct user feedback — "splutter when tank empty"),
   * instead of the stream cutting off flat. Aimed short and downward, not
   * at the crosshair: this is the gun coughing, not a shot.
   */
  private _fireSplutter(): void {
    for (let i = 0; i < SPLUTTER_COUNT; i++) {
      const particle = this._pool.get() as WaterParticle | null;
      if (!particle) break;
      particle.setAppearance(this._gun.particleColour, this._gun.sz * 0.7);
      const spreadX = (Math.random() - 0.5) * SPLUTTER_SPREAD_PX;
      const dropY = SPLUTTER_DROP_PX + Math.random() * 30;
      particle.fire(
        this._lastOrigin.x,
        this._lastOrigin.y,
        this._lastOrigin.x + spreadX,
        this._lastOrigin.y + dropY * SPLUTTER_REACH_FRACTION,
        null,
      );
    }
  }
}
