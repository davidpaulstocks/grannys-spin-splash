/**
 * Final-countdown drama layered over gameplay — a pulsing red vignette
 * plus a pink pulse each second (the big number moved to the stage, 2026-11-27), restored 2026-09-12 from the prototype's own
 * `updateTimer`/`_showBigCountdown` (direct user feedback: the game had
 * lost the "urgency building as the clock counts down" that made the
 * prototype tense). Purely visual — HUDScene stays a leaf with no game
 * logic of its own; the matching tick sound + camera shake are GameScene's
 * job since only it owns the world camera and SFX triggers (CLAUDE.md
 * §7.1 one-way data flow).
 */

import Phaser from 'phaser';

import { URGENT_COUNTDOWN_SECONDS } from '../config';
import { COLOUR } from '../utils/colour';

/** How thick the vignette bands grow at maximum urgency, in px (prototype: `20+intensity*55`). */
const VIGNETTE_BASE_THICKNESS = 20;
const VIGNETTE_MAX_EXTRA_THICKNESS = 55;
const VIGNETTE_MAX_ALPHA = 0.35;
const FLASH_ALPHA = 0.18;
const FLASH_MS = 350;

export class UrgencyOverlay {
  private readonly _scene: Phaser.Scene;
  private readonly _width: number;
  private readonly _height: number;
  private readonly _vignette: Phaser.GameObjects.Graphics;
  private _lastTickedSecond = -1;

  constructor(scene: Phaser.Scene, width: number, height: number) {
    this._scene = scene;
    this._width = width;
    this._height = height;
    this._vignette = scene.add.graphics().setDepth(380);
  }

  /** Call once per frame with the round's remaining time. */
  update(secondsRemaining: number): void {
    const seconds = Math.max(0, Math.ceil(secondsRemaining));
    this._drawVignette(secondsRemaining, seconds);

    if (seconds === this._lastTickedSecond) return;
    this._lastTickedSecond = seconds;

    if (seconds <= URGENT_COUNTDOWN_SECONDS && seconds > 0) this._pulse();
  }

  private _drawVignette(secondsRemaining: number, seconds: number): void {
    this._vignette.clear();
    // Nothing once the whistle has gone: the Big Finish plays on a clean screen.
    if (secondsRemaining <= 0 || seconds > URGENT_COUNTDOWN_SECONDS) return;

    const intensity = Phaser.Math.Clamp((URGENT_COUNTDOWN_SECONDS - secondsRemaining) / 10, 0, 1);
    const thickness = VIGNETTE_BASE_THICKNESS + intensity * VIGNETTE_MAX_EXTRA_THICKNESS;
    this._vignette.fillStyle(0xff0000, intensity * VIGNETTE_MAX_ALPHA);
    this._vignette.fillRect(0, 0, this._width, thickness);
    this._vignette.fillRect(0, this._height - thickness, this._width, thickness);
    this._vignette.fillRect(0, 0, thickness, this._height);
    this._vignette.fillRect(this._width - thickness, 0, thickness, this._height);
  }

  /** A brief pink wash on each of the last seconds — the number itself is a stage message (CountdownUrgency). */
  private _pulse(): void {
    const flash = this._scene.add
      .rectangle(0, 0, this._width, this._height, COLOUR.grannyPink, 0)
      .setOrigin(0)
      .setDepth(390);
    this._scene.tweens.add({
      targets: flash,
      alpha: { from: FLASH_ALPHA, to: 0 },
      duration: FLASH_MS,
      onComplete: () => flash.destroy(),
    });
  }
}
