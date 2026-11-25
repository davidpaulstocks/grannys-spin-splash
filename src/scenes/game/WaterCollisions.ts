/**
 * Where the water meets the wall: tests every pooled particle against the
 * obstacles first, then its candidate spinner(s), and applies the hit —
 * power, splash, sound, Frenzy flourish and the combo with its hot-streak
 * shake.
 */

import type Phaser from 'phaser';

import { audioOrchestra } from '../../audio/AudioOrchestra';
import * as SFX from '../../audio/SFX';
import { waterSound } from '../../audio/WaterSound';
import { GAME_WIDTH } from '../../config';
import type { GunDef } from '../../entities/gun/gun.types';
import type { Obstacle } from '../../entities/obstacle/Obstacle';
import { MAX_SPINNER_SPEED } from '../../entities/spinner/spinner.data';
import type { Spinner } from '../../entities/spinner/Spinner';
import { FIRE_DENSITY_SCALE } from '../../entities/waterParticle/WaterCannon';
import type { WaterParticle } from '../../entities/waterParticle/WaterParticle';
import { spawnSplash } from '../../entities/waterParticle/splashVFX';
import type { ComboTracker } from '../../systems/ComboTracker';
import type { FrenzyController } from './FrenzyController';
import type { PowerUpEffects } from './PowerUpEffects';

/** Combo tiers ≥ this shake (prototype: `if(combo>=4) shake(150, 0.005*(combo-2))`). */
const COMBO_SHAKE_THRESHOLD = 4;

/** How hard a spinner kicks when water lands on it. */
const HIT_PULSE = 0.3;

/** What a collision pass reads from the rest of the scene. */
export interface WaterCollisionDeps {
  readonly scene: Phaser.Scene;
  readonly pool: Phaser.GameObjects.Group;
  readonly obstacles: readonly Obstacle[];
  /** The fixed grid only — a hit's musical "seat" is its index here. */
  readonly spinners: readonly Spinner[];
  /** The grid plus a live Golden Spinner, if any — for collision only. */
  readonly activeSpinners: () => readonly Spinner[];
  readonly gun: GunDef;
  readonly combo: ComboTracker;
  readonly frenzy: FrenzyController;
  readonly powerups: PowerUpEffects;
}

export class WaterCollisions {
  constructor(private readonly _d: WaterCollisionDeps) {}

  /** Tests every pooled particle against obstacles first, then its candidate spinner(s); applies hits/combo/score. */
  update(): void {
    const d = this._d;
    const particles = d.pool.getChildren() as WaterParticle[];
    const activeSpinners = d.activeSpinners();
    for (const particle of particles) {
      if (!particle.active) continue;
      if (d.obstacles.some((o) => o.tryBlock(particle))) continue;

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
      const comboBefore = d.combo.combo;
      const comboAfter = d.combo.registerHit(hitSpinner.id);
      if (comboAfter !== comboBefore) {
        audioOrchestra.accent('combo', comboAfter);
        // Escalating shake on a hot streak (prototype: combo>=4) — never on
        // every single hit, only when the combo itself actually climbs.
        if (comboAfter >= COMBO_SHAKE_THRESHOLD) {
          d.scene.cameras.main.shake(150, 0.005 * (comboAfter - 2));
        }
      }
    }
  }
}
