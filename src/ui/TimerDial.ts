/** Top-of-screen timer pill with countdown drama under 10s (CLAUDE.md §7.2, §5.8). */

import Phaser from 'phaser';

import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { textStyle } from '../utils/typography';

const PILL_WIDTH = 96;
const PILL_HEIGHT = 56;
/** Below this many seconds remaining, the dial switches to Heat Orange (CLAUDE.md §5.1 — "urgency"). */
const URGENT_THRESHOLD_SECONDS = 10;

export class TimerDial {
  private readonly _text: Phaser.GameObjects.Text;
  private _wasUrgent = false;
  private _lastRenderedSeconds = -1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const radius = pillRadius(PILL_WIDTH, PILL_HEIGHT);
    const bg = scene.add.graphics();
    bg.fillStyle(COLOUR.cloud, 1);
    bg.fillRoundedRect(x - PILL_WIDTH / 2, y - PILL_HEIGHT / 2, PILL_WIDTH, PILL_HEIGHT, radius);
    bg.lineStyle(4, COLOUR.ink, 1);
    bg.strokeRoundedRect(x - PILL_WIDTH / 2, y - PILL_HEIGHT / 2, PILL_WIDTH, PILL_HEIGHT, radius);

    this._text = scene.add
      .text(x, y, '30', textStyle('displayM', COLOUR_HEX.ink, COLOUR_HEX.cloud))
      .setOrigin(0.5);
  }

  /** Call once per frame with the round's remaining time. */
  update(secondsRemaining: number): void {
    const seconds = Math.max(0, Math.ceil(secondsRemaining));

    // setText() re-rasterises the whole string to canvas — skip it when the
    // displayed number hasn't actually changed (most frames, since this
    // ticks once a second, not once a frame).
    if (seconds !== this._lastRenderedSeconds) {
      this._text.setText(String(seconds));
      this._lastRenderedSeconds = seconds;
    }

    const urgent = seconds <= URGENT_THRESHOLD_SECONDS;
    if (urgent !== this._wasUrgent) {
      this._text.setColor(urgent ? COLOUR_HEX.heatOrange : COLOUR_HEX.ink);
      this._wasUrgent = urgent;
    }
  }
}
