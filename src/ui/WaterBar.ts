/** Bottom-of-screen water tank bar with a pumping state (CLAUDE.md §7.2, §5.8). */

import Phaser from 'phaser';

import { COLOUR } from '../utils/colour';

const BAR_RADIUS = 16;
/** How fast the "pumping" alpha pulses, in full cycles per second. */
const PUMP_PULSE_HZ = 2;

export class WaterBar {
  private readonly _scene: Phaser.Scene;
  private readonly _x: number;
  private readonly _y: number;
  private readonly _width: number;
  private readonly _height: number;
  private readonly _fillGfx: Phaser.GameObjects.Graphics;
  private readonly _frameGfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    this._scene = scene;
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;

    this._fillGfx = scene.add.graphics();
    this._frameGfx = scene.add.graphics();
    this._frameGfx.lineStyle(4, COLOUR.ink, 1);
    this._frameGfx.strokeRoundedRect(x, y, width, height, BAR_RADIUS);
  }

  /** Call once per frame with the current tank percentage (0–100) and pump state. */
  update(pct: number, isPumping: boolean): void {
    this._fillGfx.clear();
    const clamped = Phaser.Math.Clamp(pct, 0, 100) / 100;
    const alpha = isPumping ? this._pumpPulseAlpha() : 1;

    this._fillGfx.fillStyle(COLOUR.waterBlue, alpha);
    this._fillGfx.fillRoundedRect(
      this._x,
      this._y,
      Math.max(this._height, this._width * clamped),
      this._height,
      BAR_RADIUS,
    );
  }

  private _pumpPulseAlpha(): number {
    const phase = (this._scene.time.now / 1000) * PUMP_PULSE_HZ;
    return 0.4 + 0.4 * Math.abs(Math.sin(phase * Math.PI));
  }
}
