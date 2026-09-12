/**
 * The live, always-visible star tally during a run (CLAUDE.md §7.2 origin;
 * re-planned 2026-09-12, direct user feedback: "I'm not seeing a point and
 * gold tally add up as I'm playing, I want to see that currency get earned
 * and be excited about how much gold I'm earning" — a direct override of
 * the original story 2.5 design, which hid score during play and only
 * revealed it at game over. Score is now visible throughout the run.
 *
 * The number never simply snaps to the latest value — it visibly counts up
 * (a per-frame catch-up toward the target) and pops with a gold flash on
 * every increase, so a fast run of hits reads as a rising number racing to
 * keep up, not a static counter. That motion is the whole point: a number
 * that just changes value on the tick a player isn't watching doesn't feel
 * like "earning" anything.
 */

import Phaser from 'phaser';

import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { drawStarIcon } from './icons';
import { textStyle } from '../utils/typography';

const PILL_WIDTH = 158;
const PILL_HEIGHT = 56;
const STAR_RADIUS = 15;
/** How quickly the displayed number races to catch up to the real score — higher = snappier. */
const CATCH_UP_RATE = 10;
/** Below this gap the counter just snaps — avoids an endless fractional crawl on the last ~1 point. */
const SNAP_THRESHOLD = 0.5;
const POP_SCALE = 1.22;
const POP_MS = 90;
const SETTLE_MS = 160;

export class ScoreCounter {
  private readonly _text: Phaser.GameObjects.Text;
  private readonly _starGfx: Phaser.GameObjects.Graphics;
  private _displayed = 0;
  private _lastTarget = 0;
  private _lastRendered = -1;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    const radius = pillRadius(PILL_WIDTH, PILL_HEIGHT);
    const bg = scene.add.graphics();
    bg.fillStyle(COLOUR.cloud, 1);
    bg.fillRoundedRect(x - PILL_WIDTH / 2, y - PILL_HEIGHT / 2, PILL_WIDTH, PILL_HEIGHT, radius);
    bg.lineStyle(4, COLOUR.ink, 1);
    bg.strokeRoundedRect(x - PILL_WIDTH / 2, y - PILL_HEIGHT / 2, PILL_WIDTH, PILL_HEIGHT, radius);

    this._starGfx = scene.add.graphics().setPosition(x - PILL_WIDTH / 2 + 26, y);
    drawStarIcon(this._starGfx, STAR_RADIUS, COLOUR.sunnyGold);

    this._text = scene.add
      .text(x - PILL_WIDTH / 2 + 48, y, '0', textStyle('displayM', COLOUR_HEX.ink, COLOUR_HEX.cloud))
      .setOrigin(0, 0.5);
  }

  /** Call once per frame with the round's true current score. */
  update(score: number, deltaMs: number): void {
    if (score !== this._lastTarget) {
      // A fresh target while a pop is mid-flight still deserves its own
      // pop — reset scale first so consecutive quick hits each read as a
      // distinct beat instead of the tween just extending silently.
      this._lastTarget = score;
      this._pop();
    }

    const gap = score - this._displayed;
    if (Math.abs(gap) <= SNAP_THRESHOLD) {
      this._displayed = score;
    } else {
      this._displayed += gap * Math.min(1, (CATCH_UP_RATE * deltaMs) / 1000);
    }

    const rounded = Math.round(this._displayed);
    if (rounded !== this._lastRendered) {
      this._text.setText(String(rounded));
      this._lastRendered = rounded;
    }
  }

  private _pop(): void {
    // Kill any pop still finishing from a hit a moment ago — otherwise a
    // fast combo stacks tweens on the same properties, and the OLDER one's
    // onComplete can fire after the newer one's and stomp the colour back
    // to Ink mid-flash.
    this._text.scene.tweens.killTweensOf(this._text);
    this._text.setScale(POP_SCALE);
    this._text.setColor(COLOUR_HEX.sunnyGold);
    this._text.scene.tweens.add({
      targets: this._text,
      scale: 1,
      duration: POP_MS + SETTLE_MS,
      ease: 'Quad.Out',
      onComplete: () => this._text.setColor(COLOUR_HEX.ink),
    });
  }
}
