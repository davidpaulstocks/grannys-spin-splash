/**
 * Renders the selected gun in Granny's hands, turned to the aim (CLAUDE.md
 * §8.2). Every gun ships ONE side-on picture with the nozzle pointing right;
 * this turns it in code, mirroring it top to bottom when it points left so it
 * is never upside-down, and works out where the nozzle is from the picture's
 * single anchor. Exposes the nozzle's world position so GameScene knows where
 * the water leaves.
 */

import Phaser from 'phaser';

import { GUN_LENGTH_PX } from '../../config';
import { SPRITE_KEYS } from '../../assets/keys';
import type { AnchorJSON } from './gun.types';

export class Gun extends Phaser.GameObjects.Container {
  private readonly _sprite: Phaser.GameObjects.Image;
  private readonly _anchor: AnchorJSON;
  private readonly _scale: number;
  private _angle = 0;
  private _flipped = false;

  /** `handScale` makes bigger guns bigger in her hands (1 for the pistol, about 1.4 at the top of the ladder). */
  constructor(scene: Phaser.Scene, gunId: string, handScale = 1) {
    super(scene, 0, 0);
    this._anchor = scene.cache.json.get(SPRITE_KEYS.gunAnchorKey(gunId)) as AnchorJSON;
    this._sprite = scene.add.image(0, 0, SPRITE_KEYS.gun(gunId));
    const { width, height } = this._sprite.frame;
    this._scale = (GUN_LENGTH_PX * handScale) / Math.max(width, height);
    this._sprite.setScale(this._scale);
    this.add(this._sprite);
    scene.add.existing(this);
  }

  /** Repositions to `originX,Y` and turns to point toward `targetX,Y`. */
  updateAim(originX: number, originY: number, targetX: number, targetY: number): void {
    this.setPosition(originX, originY);
    const dx = targetX - originX;
    const dy = targetY - originY;
    if (dx === 0 && dy === 0) return;
    this._angle = Math.atan2(dy, dx);
    // Pointing left: mirror top to bottom so the picture's top stays on top.
    this._flipped = dx < 0;
    this._sprite.setFlipY(this._flipped);
    this._sprite.setRotation(this._angle);
  }

  /** World-space nozzle position at the current turn: where GameScene should spawn water. */
  getNozzleWorldPosition(): { x: number; y: number } {
    const { width, height } = this._sprite.frame;
    const localX = (this._anchor.x - width / 2) * this._scale;
    const localY = (this._anchor.y - height / 2) * this._scale * (this._flipped ? -1 : 1);
    const cos = Math.cos(this._angle);
    const sin = Math.sin(this._angle);
    return {
      x: this.x + localX * cos - localY * sin,
      y: this.y + localX * sin + localY * cos,
    };
  }
}
