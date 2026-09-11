/**
 * Player character — sprite-based, viewed from behind (CLAUDE.md §14's
 * 2026-09-11 camera re-plan: the player stands behind Granny looking at
 * the same spinner wall she is, so her body faces away from camera, never
 * toward it). Swaps between the idle `back` pose and the `back_firing`
 * pose based on whether the player is holding fire. The gun itself is a
 * separate, independently-rotating sprite (Gun.ts) anchored near her
 * hands — her own body pose never changes with aim direction.
 */

import Phaser from 'phaser';

import {
  GRANNY_BREATH_CYCLE_MS,
  GRANNY_BREATH_SCALE,
  GRANNY_HEIGHT,
  GRANNY_MOVE_SPEED,
} from '../../config';
import { SPRITE_KEYS } from '../../assets/keys';
import { clamp } from '../../utils/math';
import { EASE } from '../../utils/tween';

/** See getGunGripOrigin()'s doc comment for how this was measured. */
const HAND_HEIGHT_FRACTION = 0.58;

export class Granny extends Phaser.GameObjects.Container {
  private readonly _grannyId: string;
  private readonly _sprite: Phaser.GameObjects.Image;
  private _firing = false;

  constructor(scene: Phaser.Scene, x: number, y: number, grannyId: string) {
    super(scene, x, y);
    this._grannyId = grannyId;
    this._sprite = scene.add
      .image(0, GRANNY_HEIGHT / 2, SPRITE_KEYS.grannyPose(grannyId, 'back'))
      .setOrigin(0.5, 1);
    this.add(this._sprite);
    scene.add.existing(this);
    this._fitSprite();
    this._startIdleBreath(scene);
  }

  /** Swaps between the idle and firing body pose — no-op if already in that state. */
  setFiring(firing: boolean): void {
    if (firing === this._firing) return;
    this._firing = firing;
    this._sprite.setTexture(
      SPRITE_KEYS.grannyPose(this._grannyId, firing ? 'back_firing' : 'back'),
    );
    this._fitSprite();
  }

  /** Scales the current texture so it stands GRANNY_HEIGHT tall, feet anchored at the container's origin. */
  private _fitSprite(): void {
    const { height } = this._sprite.frame;
    this._sprite.setScale(GRANNY_HEIGHT / height);
  }

  /** Slow, continuous scale breathing while idle (CLAUDE.md §5.6) — subtle, never stops during play. */
  private _startIdleBreath(scene: Phaser.Scene): void {
    scene.tweens.add({
      targets: this,
      scaleX: GRANNY_BREATH_SCALE,
      scaleY: GRANNY_BREATH_SCALE,
      duration: GRANNY_BREATH_CYCLE_MS / 2,
      ease: EASE.standardOut,
      yoyo: true,
      repeat: -1,
    });
  }

  /** Moves left/right at a fixed speed, clamped between `minX` and `maxX`. */
  move(dir: -1 | 0 | 1, deltaSeconds: number, minX: number, maxX: number): void {
    if (dir === 0) return;
    this.x = clamp(this.x + dir * GRANNY_MOVE_SPEED * deltaSeconds, minX, maxX);
  }

  /**
   * World-space point near her hands, where Gun.ts anchors the gun sprite
   * (grip end, not the nozzle). HAND_HEIGHT_FRACTION was measured directly
   * against the delivered back_firing art (2026-09-11 live-browser QA
   * pass, pixel-analysed against classic/back_firing.png) — her fists sit
   * ~58% up from her feet given her actual proportions (big poofy hair,
   * short legs), not a generic humanoid guess. `this.y` is her vertical
   * *centre*, not her feet (GRANNY_Y_FROM_BOTTOM's own doc comment), so
   * feet position is derived first rather than offsetting `this.y` directly
   * — that offset-from-centre mistake is what originally put the gun up
   * near her hair.
   */
  getGunGripOrigin(): { x: number; y: number } {
    const feetY = this.y + GRANNY_HEIGHT / 2;
    return { x: this.x, y: feetY - GRANNY_HEIGHT * HAND_HEIGHT_FRACTION };
  }
}
