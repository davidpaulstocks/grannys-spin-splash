/**
 * The groove badge: a round badge reading x1 to x5 — the multiplier on every
 * coin — with a ring around it filling toward the next level (docs/REWARD_LOOP.md).
 * It bumps when the level goes up; on a drop-out it shakes and flashes Heat
 * Orange; during Splash Frenzy it goes gold and says JACKPOT.
 */

import Phaser from 'phaser';

import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';

const BADGE_RADIUS = 28;
const BADGE_OUTLINE_PX = 4;
const RING_RADIUS = 36;
const RING_PX = 6;
const RING_TRACK_ALPHA = 0.2;
const LABEL_OFFSET_Y = 52;
const BUMP_SCALE = 1.35;
const BUMP_MS = 200;
const SHAKE_PX = 7;
const SHAKE_MS = 45;
const SHAKE_REPEATS = 3;
const DROP_FLASH_MS = 380;
/** Jackpot breathes slowly so the gold badge reads as alive, not just recoloured. */
const JACKPOT_PULSE_HZ = 2;
const JACKPOT_PULSE_DEPTH = 0.07;

export class GrooveBadge {
  private readonly _scene: Phaser.Scene;
  private readonly _box: Phaser.GameObjects.Container;
  private readonly _gfx: Phaser.GameObjects.Graphics;
  private readonly _number: Phaser.GameObjects.Text;
  private readonly _label: Phaser.GameObjects.Text;
  private readonly _x: number;
  private _level = 1;
  private _flashUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this._scene = scene;
    this._x = x;
    this._gfx = scene.add.graphics();
    this._number = scene.add
      .text(0, 0, '×1', textStyle('displayM', COLOUR_HEX.ink, COLOUR_HEX.cloud))
      .setOrigin(0.5);
    this._box = scene.add.container(x, y, [this._gfx, this._number]);
    this._label = scene.add
      .text(
        x,
        y + LABEL_OFFSET_Y,
        'JACKPOT',
        textStyle('bodyM', COLOUR_HEX.sunnyGold, COLOUR_HEX.ink),
      )
      .setOrigin(0.5)
      .setVisible(false);
  }

  /** Call once per frame with the groove's level, its ring (0-1) and whether Splash Frenzy's jackpot is on. */
  update(level: number, ring: number, jackpot: boolean): void {
    const now = this._scene.time.now;
    if (level > this._level) this._bump();
    else if (level < this._level) this._drop(now);
    if (level !== this._level) this._number.setText(`×${level}`);
    this._level = level;

    const flashing = now < this._flashUntil;
    const fill = jackpot ? COLOUR.sunnyGold : flashing ? COLOUR.heatOrange : COLOUR.cloud;
    const ringColour = jackpot ? COLOUR.sunnyGold : flashing ? COLOUR.heatOrange : COLOUR.waterBlue;
    const g = this._gfx;
    g.clear();
    g.lineStyle(RING_PX, COLOUR.ink, RING_TRACK_ALPHA);
    g.strokeCircle(0, 0, RING_RADIUS);
    if (ring > 0) {
      g.lineStyle(RING_PX, ringColour, 1);
      g.beginPath();
      g.arc(0, 0, RING_RADIUS, -Math.PI / 2, -Math.PI / 2 + Math.min(1, ring) * Math.PI * 2, false);
      g.strokePath();
    }
    g.fillStyle(fill, 1);
    g.fillCircle(0, 0, BADGE_RADIUS);
    g.lineStyle(BADGE_OUTLINE_PX, COLOUR.ink, 1);
    g.strokeCircle(0, 0, BADGE_RADIUS);

    this._label.setVisible(jackpot);
    if (jackpot && !this._scene.tweens.isTweening(this._box)) {
      const phase = (now / 1000) * JACKPOT_PULSE_HZ * Math.PI * 2;
      this._box.setScale(1 + JACKPOT_PULSE_DEPTH * (0.5 + 0.5 * Math.sin(phase)));
    }
  }

  private _bump(): void {
    this._scene.tweens.killTweensOf(this._box);
    this._box.setScale(BUMP_SCALE).setX(this._x);
    this._scene.tweens.add({ targets: this._box, scale: 1, duration: BUMP_MS, ease: EASE.bouncy });
  }

  private _drop(now: number): void {
    this._flashUntil = now + DROP_FLASH_MS;
    this._scene.tweens.killTweensOf(this._box);
    this._box.setScale(1).setX(this._x);
    this._scene.tweens.add({
      targets: this._box,
      x: this._x + SHAKE_PX,
      duration: SHAKE_MS,
      yoyo: true,
      repeat: SHAKE_REPEATS,
      ease: EASE.standardOut,
      onComplete: () => this._box.setX(this._x),
    });
  }
}
