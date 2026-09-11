/**
 * Player character — a coloured rectangle placeholder for Sprint 1
 * (story 1.3). Sprite-based rendering + firing-pose swap land in Sprint 3
 * (CLAUDE.md §8.1); this class's public shape (x/y, move(), getGunOrigin())
 * is deliberately what Granny.ts keeps once sprites replace the rectangle.
 */

import Phaser from 'phaser';

import { GRANNY_HEIGHT, GRANNY_MOVE_SPEED, GRANNY_WIDTH } from '../../config';
import { COLOUR } from '../../utils/colour';
import { clamp } from '../../utils/math';

export class Granny extends Phaser.GameObjects.Container {
  private readonly _body: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this._body = scene.add.rectangle(0, 0, GRANNY_WIDTH, GRANNY_HEIGHT, COLOUR.grannyPink);
    this._body.setStrokeStyle(4, COLOUR.ink);
    this.add(this._body);
    scene.add.existing(this);
  }

  /** Moves left/right at a fixed speed, clamped between `minX` and `maxX`. */
  move(dir: -1 | 0 | 1, deltaSeconds: number, minX: number, maxX: number): void {
    if (dir === 0) return;
    this.x = clamp(this.x + dir * GRANNY_MOVE_SPEED * deltaSeconds, minX, maxX);
  }

  /** World-space point water particles spawn from — top-centre of the placeholder body. */
  getGunOrigin(): { x: number; y: number } {
    return { x: this.x, y: this.y - GRANNY_HEIGHT / 2 };
  }
}
