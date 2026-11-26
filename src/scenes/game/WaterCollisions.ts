/**
 * Where the water meets the wall: tests every pooled particle against the
 * visitors first, then its candidate spinner(s), and applies the hit —
 * power, splash, sound and the Frenzy flourish. Coins are not paid here:
 * they come from the pay clock (RewardLoop.ts).
 */

import type Phaser from 'phaser';

import { audioOrchestra } from '../../audio/AudioOrchestra';
import * as SFX from '../../audio/SFX';
import { waterSound } from '../../audio/WaterSound';
import { GAME_WIDTH } from '../../config';
import type { GunDef } from '../../entities/gun/gun.types';
import { MAX_SPINNER_SPEED } from '../../entities/spinner/spinner.data';
import type { Spinner } from '../../entities/spinner/Spinner';
import { FIRE_DENSITY_SCALE } from '../../entities/waterParticle/WaterCannon';
import type { WaterParticle } from '../../entities/waterParticle/WaterParticle';
import { spawnSplash } from '../../entities/waterParticle/splashVFX';
import type { FrenzyController } from './FrenzyController';
import type { VisitorDirector } from './VisitorDirector';
import type { PowerUpEffects } from './PowerUpEffects';

/** How hard a spinner kicks when water lands on it. */
const HIT_PULSE = 0.3;

/** What a collision pass reads from the rest of the scene. */
export interface WaterCollisionDeps {
  readonly scene: Phaser.Scene;
  readonly pool: Phaser.GameObjects.Group;
  /** Visitors that stop or take water before it reaches the wall. */
  readonly visitors: VisitorDirector;
  /** The fixed grid only — a hit's musical "seat" is its index here. */
  readonly spinners: readonly Spinner[];
  /** The grid plus a live Golden Spinner, if any — for collision only. */
  readonly activeSpinners: () => readonly Spinner[];
  readonly gun: GunDef;
  readonly frenzy: FrenzyController;
  readonly powerups: PowerUpEffects;
}

export class WaterCollisions {
  constructor(private readonly _d: WaterCollisionDeps) {}

  /** Tests every pooled particle against visitors first, then its candidate spinner(s); applies the hits. */
  update(): void {
    const d = this._d;
    const particles = d.pool.getChildren() as WaterParticle[];
    const activeSpinners = d.activeSpinners();
    for (const particle of particles) {
      if (!particle.active) continue;
      if (d.visitors.tryBlock(particle)) continue;

      const hitX = particle.x;
      const hitY = particle.y;
      const hitSpinner = particle.checkCollision(particle.getCandidates(activeSpinners));
      if (!hitSpinner) continue;

      // Golden Splash power-up: the next landed hit jumps straight to FULL
      // instead of its normal power — still routed through hit() so a
      // whirligig keeps its usual deflect chance (prototype: the effect
      // only ever fires from inside the "not deflected" branch).
      const usingGoldenSplash = d.powerups.goldenSplashPending;
      // FIRE_DENSITY_SCALE: each of the N denser particles carries 1/N the
      // power, so a shot that lands all of them still delivers the exact
      // total the tuned balance expects — see the constant's doc comment.
      const power = usingGoldenSplash ? MAX_SPINNER_SPEED : d.gun.power / FIRE_DENSITY_SCALE;
      const landed = hitSpinner.hit(power);
      hitSpinner.pulse(HIT_PULSE);
      spawnSplash(d.scene, hitX, hitY, d.gun.particleColour);
      if (!landed) {
        SFX.playDeflect(); // whirligig
        continue;
      }
      if (usingGoldenSplash) d.powerups.consumeGoldenSplash();

      waterSound.splash((hitX / GAME_WIDTH) * 2 - 1);
      // The squirt plays the instrument (CLAUDE.md §9): the musician seated
      // at this spinner answers on the next sixteenth. A Golden Spinner has
      // no seat, so it is skipped.
      const seat = d.spinners.indexOf(hitSpinner);
      if (seat >= 0) audioOrchestra.onSpinnerHit(seat);
      if (d.frenzy.active) d.frenzy.celebrateHit(hitSpinner);
    }
  }
}
