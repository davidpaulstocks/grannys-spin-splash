/**
 * The "on-wall" Frenzy meter — a progress ring around each spinner instead
 * of a separate floating bar, so it reads as part of the wall, not
 * floating UI (CLAUDE.md story 2.6). Ported from the reference
 * prototype's `drawRings`, re-skinned to the production hero palette.
 */

import Phaser from 'phaser';

import { MAX_SPINNER_SPEED } from '../data/spinners';
import { SpinnerState } from '../types/spinner';
import type { HudSpinnerSnapshot } from '../types/hud';
import { COLOUR } from '../utils/colour';

/** Ring sits this many px outside each spinner's own radius. */
const RING_PADDING = 7;
const RING_THICKNESS = 3;
const RING_BACKDROP_ALPHA = 0.15;
const RING_ALPHA = 0.85;

const RING_COLOUR_BY_STATE: Readonly<Partial<Record<SpinnerState, number>>> = {
  [SpinnerState.SLOW]: COLOUR.heatOrange,
  [SpinnerState.MEDIUM]: COLOUR.waterBlue,
  [SpinnerState.FULL]: COLOUR.sunnyGold,
};

export class FrenzyMeterUI {
  private readonly _gfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene) {
    this._gfx = scene.add.graphics();
  }

  /** Redraws every spinner's progress ring. Call once per frame. */
  update(spinners: readonly HudSpinnerSnapshot[]): void {
    this._gfx.clear();
    for (const spinner of spinners) {
      if (spinner.currentSpeed <= 0) continue;

      const pct = spinner.currentSpeed / MAX_SPINNER_SPEED;
      const ringRadius = spinner.r + RING_PADDING;
      const colour = RING_COLOUR_BY_STATE[spinner.currentState] ?? COLOUR.heatOrange;

      this._gfx.lineStyle(RING_THICKNESS, COLOUR.ink, RING_BACKDROP_ALPHA);
      this._gfx.strokeCircle(spinner.x, spinner.y, ringRadius);

      this._gfx.lineStyle(RING_THICKNESS, colour, RING_ALPHA);
      this._gfx.beginPath();
      this._gfx.arc(
        spinner.x,
        spinner.y,
        ringRadius,
        -Math.PI / 2,
        -Math.PI / 2 + pct * Math.PI * 2,
        false,
      );
      this._gfx.strokePath();
    }
  }
}
