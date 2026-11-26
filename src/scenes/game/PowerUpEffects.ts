/**
 * Power-ups (CLAUDE.md §1) — see PowerUpSpawner.ts for spawn/lifetime/
 * collision; this owns the active-effect windows that actually change
 * gameplay, and applies an effect the frame its pickup is collected.
 */

import type Phaser from 'phaser';

import { audioOrchestra } from '../../audio/AudioOrchestra';
import { POWERUP_DEFS, type PowerUpEffect } from '../../entities/powerup/powerup.data';
import type { PowerUpSpawner } from '../../entities/powerup/PowerUpSpawner';
import type { Spinner } from '../../entities/spinner/Spinner';
import type { WorldDef } from '../../entities/world/world.types';
import { wallAreaFor } from '../../entities/world/wallBuilder';
import type { WaterParticle } from '../../entities/waterParticle/WaterParticle';
import { spawnFloatingText } from '../../ui/FloatingText';
import { COLOUR_HEX } from '../../utils/colour';

export class PowerUpEffects {
  private _soakerEndAt = 0;
  private _spinlockEndAt = 0;
  private _doubleStarsEndAt = 0;
  private _goldenSplashPending = false;

  constructor(
    private readonly _scene: Phaser.Scene,
    private readonly _world: WorldDef,
    private readonly _spawner: PowerUpSpawner,
    /** Turbo's instant effect — GameScene binds this to the cannon. */
    private readonly _refillTank: () => void,
  ) {}

  /** Soaker's window: the cannon fires wider while this is true. */
  soakerActive(time: number): boolean {
    return time < this._soakerEndAt;
  }

  /** Double Stars' window: doubles every coin the pay clock pays while it lasts. */
  doubleStarsActive(time: number): boolean {
    return time < this._doubleStarsEndAt;
  }

  /** True while a Golden Splash pickup is waiting for the next landed hit. */
  get goldenSplashPending(): boolean {
    return this._goldenSplashPending;
  }

  /** Spends the pending Golden Splash — called when the boosted hit actually lands. */
  consumeGoldenSplash(): void {
    this._goldenSplashPending = false;
  }

  /** Advances every live power-up pickup and applies the effect of any just collected (CLAUDE.md §1). */
  update(
    time: number,
    delta: number,
    spinners: readonly Spinner[],
    particles: readonly WaterParticle[],
    frenzyActive: boolean,
  ): void {
    const area = wallAreaFor(this._world);
    const bounds = {
      x0: area.x,
      y0: area.y,
      x1: area.x + area.width,
      y1: area.y + area.height,
    };
    const collected = this._spawner.update(time, delta, bounds, spinners, particles);
    for (const { effect, x, y } of collected) this._apply(effect, time, x, y, spinners);

    // Spin Lock's own release — a plain `time >= endAt` check, same shape as
    // Frenzy's window (CLAUDE.md §1). The two share `spinner.locked`; both
    // being active at once is a rare edge case not worth a lock-reason
    // system for — worst case a spinner stays locked a beat longer.
    if (this._spinlockEndAt && time >= this._spinlockEndAt) {
      this._spinlockEndAt = 0;
      if (!frenzyActive) for (const spinner of spinners) spinner.locked = false;
    }
  }

  /**
   * Dispatches on the collected effect (prototype: `applyPowerup`) — each
   * one sets a timed window checked elsewhere (soaker when firing, spinlock
   * as `spinner.locked`, doubleStars on a level-up) except the two instants,
   * which apply immediately.
   */
  private _apply(
    effect: PowerUpEffect,
    time: number,
    x: number,
    y: number,
    spinners: readonly Spinner[],
  ): void {
    const def = POWERUP_DEFS.find((d) => d.effect === effect);
    if (!def) return;
    spawnFloatingText(this._scene, x, y - 30, `${def.name}!`, COLOUR_HEX.sunnyGold);
    audioOrchestra.accent('powerup');
    this._scene.cameras.main.shake(200, 0.007);

    switch (effect) {
      case 'soaker':
        this._soakerEndAt = time + def.duration * 1000;
        return;
      case 'turbo':
        this._refillTank();
        return;
      case 'spinlock':
        this._spinlockEndAt = time + def.duration * 1000;
        for (const spinner of spinners) spinner.locked = true;
        return;
      case 'goldenSplash':
        this._goldenSplashPending = true;
        return;
      case 'doubleStars':
        this._doubleStarsEndAt = time + def.duration * 1000;
        return;
    }
  }
}
