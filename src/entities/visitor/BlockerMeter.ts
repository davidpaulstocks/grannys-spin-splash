/**
 * The ring around a parked blocker that shows how close it is to going: a
 * Heat Orange arc that drains as water lands on it.
 */

import type Phaser from 'phaser';

import { COLOUR } from '../../utils/colour';
import { BLOCKER } from './visitorTuning.data';

export class BlockerMeter {
  private readonly _gfx: Phaser.GameObjects.Graphics;

  /** Adds the ring to `container`, centred on its origin and `radius` px out. */
  constructor(
    scene: Phaser.Scene,
    container: Phaser.GameObjects.Container,
    private readonly _radius: number,
  ) {
    this._gfx = scene.add.graphics();
    container.add(this._gfx);
  }

  /** Redraws the ring with `left` (0–1) of it still full; null hides it. */
  draw(left: number | null): void {
    const g = this._gfx;
    g.clear();
    if (left === null) return;
    g.lineStyle(BLOCKER.meterPx, COLOUR.ink, BLOCKER.meterTrackAlpha);
    g.strokeCircle(0, 0, this._radius);
    if (left <= 0) return;
    g.lineStyle(BLOCKER.meterPx, COLOUR.heatOrange, 1);
    g.beginPath();
    g.arc(0, 0, this._radius, -Math.PI / 2, -Math.PI / 2 + Math.min(1, left) * Math.PI * 2, false);
    g.strokePath();
  }
}
