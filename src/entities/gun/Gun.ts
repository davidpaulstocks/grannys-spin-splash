/**
 * Renders the selected gun at whichever of its 8 fixed angles is nearest
 * the current aim direction, anchored near Granny's hands (CLAUDE.md
 * §8.2, §14's 2026-09-11 camera re-plan). Each angle is a separately
 * pre-rotated sprite — see the 2026-09-11 backlog note in world.data.ts's
 * neighbourhood — not a single texture rotated at runtime, so no
 * per-frame trig on the sprite itself, only on picking which of the 8
 * frames to show. Exposes the nozzle's world position (from anchor.json)
 * so GameScene knows where to spawn water particles from.
 */

import Phaser from 'phaser';

import { GUN_LENGTH_PX } from '../../config';
import { SPRITE_KEYS } from '../../assets/keys';
import type { AnchorJSON, GunAngle } from './gun.types';

const ANGLES: readonly GunAngle[] = [0, 45, 90, 135, 180, 225, 270, 315];

/** Shortest signed distance between two angles in degrees, wrapping correctly across the 0/360 seam. */
function angleDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export class Gun extends Phaser.GameObjects.Container {
  private readonly _gunId: string;
  private readonly _sprite: Phaser.GameObjects.Image;
  private readonly _anchors: AnchorJSON;
  private _angle: GunAngle = 0;

  constructor(scene: Phaser.Scene, gunId: string) {
    super(scene, 0, 0);
    this._gunId = gunId;
    this._anchors = scene.cache.json.get(SPRITE_KEYS.gunAnchorKey(gunId)) as AnchorJSON;
    this._sprite = scene.add.image(0, 0, SPRITE_KEYS.gunAngle(gunId, 0));
    this.add(this._sprite);
    scene.add.existing(this);
    this._applyAngle(0);
  }

  /** Repositions to `originX,Y` and snaps to the nearest of the 8 angles pointing toward `targetX,Y`. */
  updateAim(originX: number, originY: number, targetX: number, targetY: number): void {
    this.setPosition(originX, originY);
    const dx = targetX - originX;
    const dy = targetY - originY;
    if (dx === 0 && dy === 0) return;
    // Screen space is y-down; flip to the math (y-up, CCW-positive) convention the angle set uses.
    let deg = (Math.atan2(-dy, dx) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    const nearest = ANGLES.reduce((best, a) =>
      angleDistance(deg, a) < angleDistance(deg, best) ? a : best,
    );
    if (nearest !== this._angle) this._applyAngle(nearest);
  }

  /** World-space nozzle position for the currently-shown angle — where GameScene should spawn water particles. */
  getNozzleWorldPosition(): { x: number; y: number } {
    const anchor = this._anchors[`${this._angle}`];
    const frame = this._sprite.frame;
    const scale = this._sprite.scaleX;
    const offsetX = (anchor.x - frame.width / 2) * scale;
    const offsetY = (anchor.y - frame.height / 2) * scale;
    return { x: this.x + offsetX, y: this.y + offsetY };
  }

  private _applyAngle(angle: GunAngle): void {
    this._angle = angle;
    this._sprite.setTexture(SPRITE_KEYS.gunAngle(this._gunId, angle));
    const { width, height } = this._sprite.frame;
    this._sprite.setScale(GUN_LENGTH_PX / Math.max(width, height));
  }
}
