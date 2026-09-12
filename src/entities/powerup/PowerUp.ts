/**
 * Floating power-up pickup (CLAUDE.md §1, §4 — one of v1's launch
 * features, extracted from the reference prototype's `spawnPowerup`/
 * `updatePowerups`/`applyPowerup` but never actually wired up until
 * 2026-09-12, when a direct re-read of the prototype for "what made it
 * fun" surfaced that this whole documented feature had shipped as an
 * empty stub). A pulsing coloured badge that drifts nowhere — the player
 * has to shoot it before its lifetime runs out. `GameScene` owns what
 * each effect actually *does* (CLAUDE.md §7.1 one-way data flow); this
 * class only owns its own visual + collection test.
 */

import Phaser from 'phaser';

import { COLOUR } from '../../utils/colour';
import { drawLockIcon, drawStarIcon } from '../../ui/icons';
import { distance } from '../../utils/math';
import type { PowerUpDef, PowerUpEffect } from './powerup.data';
import type { WaterParticle } from '../waterParticle/WaterParticle';

/** How long an unclaimed pickup stays on the wall before vanishing (prototype: `life:14`). */
export const POWERUP_LIFETIME_SECONDS = 14;
/** How close a water particle must land to collect it (prototype: `<22`). */
const PICKUP_RADIUS = 22;
const BADGE_RADIUS = 16;
/** Below this many seconds left, the badge blinks to warn it's about to expire (prototype: `life<3`). */
const BLINK_THRESHOLD_SECONDS = 3;

const POWERUP_COLOUR: Readonly<Record<PowerUpEffect, number>> = {
  soaker: COLOUR.waterBlue,
  turbo: COLOUR.heatOrange,
  spinlock: COLOUR.mintGreen,
  goldenSplash: COLOUR.sunnyGold,
  // The prototype used a purple neither hero colour matches — Granny Pink
  // stands in as the palette-safe "this one's special" accent instead
  // (CLAUDE.md §5.1: five hero colours, no exceptions).
  doubleStars: COLOUR.grannyPink,
};

export class PowerUp extends Phaser.GameObjects.Container {
  readonly effect: PowerUpEffect;
  private readonly _gfx: Phaser.GameObjects.Graphics;
  private readonly _iconGfx: Phaser.GameObjects.Graphics;
  private readonly _label: Phaser.GameObjects.Text;
  private _lifeSeconds = POWERUP_LIFETIME_SECONDS;

  constructor(scene: Phaser.Scene, x: number, y: number, def: PowerUpDef) {
    super(scene, x, y);
    this.effect = def.effect;
    this._gfx = scene.add.graphics();
    this._iconGfx = scene.add.graphics();
    this._label = scene.add
      .text(0, 0, '', {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: '14px',
        fontStyle: '700',
        color: '#1F2138',
      })
      .setOrigin(0.5);
    this.add([this._gfx, this._iconGfx, this._label]);
    scene.add.existing(this);
    this._redraw(0);
  }

  /** Advances its lifetime + pulse animation. Returns true once its life has run out — caller destroys it. */
  override update(time: number, dt: number): boolean {
    this._lifeSeconds -= dt;
    this._redraw(time);
    return this._lifeSeconds <= 0;
  }

  /** Tests one water particle; consumes + recycles it and returns true if this pickup was just collected. */
  tryCollect(particle: WaterParticle): boolean {
    if (distance(particle.x, particle.y, this.x, this.y) >= PICKUP_RADIUS) return false;
    particle.blockAndRecycle();
    return true;
  }

  private _redraw(time: number): void {
    const blinking =
      this._lifeSeconds < BLINK_THRESHOLD_SECONDS && Math.floor(this._lifeSeconds * 5) % 2 === 0;
    this.setVisible(!blinking);
    if (blinking) return;

    const pulse = 0.88 + Math.sin(time * 0.006) * 0.12;
    const r = BADGE_RADIUS * pulse;
    const colour = POWERUP_COLOUR[this.effect];

    this._gfx.clear();
    this._gfx.fillStyle(colour, 0.92);
    this._gfx.fillCircle(0, 0, r);
    this._gfx.fillStyle(COLOUR.cloud, 0.35);
    this._gfx.fillCircle(-r * 0.25, -r * 0.3, r * 0.4);
    this._gfx.lineStyle(2.5, COLOUR.cloud, 0.85);
    this._gfx.strokeCircle(0, 0, r);
    this._gfx.lineStyle(2, COLOUR.cloud, 0.3);
    this._gfx.strokeCircle(0, 0, r + 5);

    this._iconGfx.clear();
    this._label.setText('');
    this._drawIcon(r);
  }

  private _drawIcon(r: number): void {
    switch (this.effect) {
      case 'goldenSplash':
        drawStarIcon(this._iconGfx, r * 0.55, COLOUR.cloud);
        return;
      case 'spinlock':
        drawLockIcon(this._iconGfx, r * 0.85, COLOUR.cloud);
        return;
      case 'doubleStars':
        this._label
          .setText('×2')
          .setColor('#F5F2E8')
          .setFontSize(Math.round(r * 0.95));
        return;
      case 'turbo': {
        // A simple lightning bolt — no icon asset exists for this yet.
        const s = r * 0.6;
        this._iconGfx.fillStyle(COLOUR.cloud, 1);
        this._iconGfx.fillTriangle(-s * 0.15, -s, s * 0.5, 0, -s * 0.1, 0);
        this._iconGfx.fillTriangle(s * 0.1, 0, -s * 0.5, s, s * 0.15, s);
        return;
      }
      case 'soaker': {
        // A small droplet motif.
        const s = r * 0.5;
        this._iconGfx.fillStyle(COLOUR.cloud, 1);
        this._iconGfx.fillCircle(0, s * 0.25, s * 0.6);
        this._iconGfx.fillTriangle(-s * 0.5, s * 0.1, s * 0.5, s * 0.1, 0, -s);
        return;
      }
    }
  }
}
