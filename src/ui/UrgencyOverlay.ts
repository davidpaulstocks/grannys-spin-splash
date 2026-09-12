/**
 * Final-countdown drama layered over gameplay — a pulsing red vignette
 * plus a big popping number, restored 2026-09-12 from the prototype's own
 * `updateTimer`/`_showBigCountdown` (direct user feedback: the game had
 * lost the "urgency building as the clock counts down" that made the
 * prototype tense). Purely visual — HUDScene stays a leaf with no game
 * logic of its own; the matching tick sound + camera shake are GameScene's
 * job since only it owns the world camera and SFX triggers (CLAUDE.md
 * §7.1 one-way data flow).
 */

import Phaser from 'phaser';

import {
  FINAL_COUNTDOWN_SECONDS,
  TWENTY_SECOND_CALLOUT_AT,
  URGENT_COUNTDOWN_SECONDS,
} from '../config';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { EASE } from '../utils/tween';

/** How thick the vignette bands grow at maximum urgency, in px (prototype: `20+intensity*55`). */
const VIGNETTE_BASE_THICKNESS = 20;
const VIGNETTE_MAX_EXTRA_THICKNESS = 55;
const VIGNETTE_MAX_ALPHA = 0.35;

export class UrgencyOverlay {
  private readonly _scene: Phaser.Scene;
  private readonly _width: number;
  private readonly _height: number;
  private readonly _vignette: Phaser.GameObjects.Graphics;
  private _lastTickedSecond = -1;
  private _shownTwentyCallout = false;

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

    if (seconds === TWENTY_SECOND_CALLOUT_AT && !this._shownTwentyCallout) {
      this._shownTwentyCallout = true;
      this._popCallout('20 SECONDS!', COLOUR_HEX.heatOrange, 48);
    } else if (seconds <= URGENT_COUNTDOWN_SECONDS) {
      this._popCallout(
        seconds === 0 ? "TIME'S UP!" : String(seconds),
        seconds <= FINAL_COUNTDOWN_SECONDS ? '#FF2200' : COLOUR_HEX.heatOrange,
        seconds <= FINAL_COUNTDOWN_SECONDS ? 110 : seconds <= 5 ? 90 : 72,
      );
    }
  }

  private _drawVignette(secondsRemaining: number, seconds: number): void {
    this._vignette.clear();
    if (seconds > URGENT_COUNTDOWN_SECONDS) return;

    const intensity = Phaser.Math.Clamp((URGENT_COUNTDOWN_SECONDS - secondsRemaining) / 10, 0, 1);
    const thickness = VIGNETTE_BASE_THICKNESS + intensity * VIGNETTE_MAX_EXTRA_THICKNESS;
    this._vignette.fillStyle(0xff0000, intensity * VIGNETTE_MAX_ALPHA);
    this._vignette.fillRect(0, 0, this._width, thickness);
    this._vignette.fillRect(0, this._height - thickness, this._width, thickness);
    this._vignette.fillRect(0, 0, thickness, this._height);
    this._vignette.fillRect(this._width - thickness, 0, thickness, this._height);
  }

  /** A big number/message that pops in oversized and shrinks away — the "3! 2! 1!" beat. */
  private _popCallout(label: string, colourHex: string, size: number): void {
    const text = this._scene.add
      .text(this._width / 2, this._height / 2 - 30, label, {
        fontFamily: 'Fredoka, sans-serif',
        fontSize: `${size}px`,
        fontStyle: '700',
        color: colourHex,
        stroke: COLOUR_HEX.ink,
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setDepth(395)
      .setAlpha(0)
      .setScale(2.2);

    this._scene.tweens.add({
      targets: text,
      alpha: { from: 1, to: 0 },
      scaleX: 1,
      scaleY: 1,
      duration: 750,
      ease: EASE.standardOut,
      onComplete: () => text.destroy(),
    });

    const flash = this._scene.add
      .rectangle(0, 0, this._width, this._height, COLOUR.grannyPink, 0)
      .setOrigin(0)
      .setDepth(390);
    this._scene.tweens.add({
      targets: flash,
      alpha: { from: 0.18, to: 0 },
      duration: 350,
      onComplete: () => flash.destroy(),
    });
  }
}
