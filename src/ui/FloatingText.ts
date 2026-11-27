/**
 * Punchy floating combat text — "+5 ★", "SHOO!", "REFILLED!" — that pops
 * at the point of action and rises away (CLAUDE.md §2 behavioural
 * reference; restored 2026-09-12 from the prototype's `showFloat`, which
 * playtested as one of the things that made hits feel rewarding). Distinct
 * from `Toast.ts`: toasts are calm menu/unlock notices at a fixed anchor;
 * this is fast, colourful, and spawns wherever the action happened, so it
 * needs its own snappier timing and a scale-in pop instead of a plain fade.
 */

import Phaser from 'phaser';

import { COLOUR_HEX } from '../utils/colour';
import {
  boxesOverlap,
  getStageBounds,
  placeClearOfStage,
  STAGE_AVOID_SHRINK,
  type Box,
} from './stageBounds';
import { textStyle } from '../utils/typography';
import { EASE } from '../utils/tween';

const RISE_DISTANCE = 54;
const POP_DURATION_MS = 120;
const RISE_DURATION_MS = 620;
const HOLD_MS = 80;
/** A text the big message lands on fades out this fast, ms. */
const YIELD_FADE_MS = 120;

/** Floating texts alive right now, so a big message arriving over one can clear it. */
const _live = new Set<Phaser.GameObjects.Text>();

/** Fades out, quickly, every floating text that overlaps `box` — the big message has the stage. */
export function fadeFloatingTextIn(box: Box): void {
  for (const text of _live) {
    if (!text.active || !boxesOverlap(text.getBounds(), box)) continue;
    _live.delete(text);
    text.scene.tweens.killTweensOf(text);
    text.scene.tweens.add({
      targets: text,
      alpha: 0,
      duration: YIELD_FADE_MS,
      onComplete: () => text.destroy(),
    });
  }
}

/**
 * Spawns one piece of floating text at (x, y) in `colourHex`, scales in, rises, and fades — fire-and-forget.
 * Stays near its source, but if a big message is on the stage and the text would land on it,
 * it starts clear of it and a little smaller.
 */
export function spawnFloatingText(
  scene: Phaser.Scene,
  x: number,
  y: number,
  message: string,
  colourHex: string,
): void {
  const text = scene.add
    .text(x, y, message, textStyle('bodyL', colourHex, COLOUR_HEX.ink))
    .setOrigin(0.5)
    .setDepth(170)
    .setScale(0.5)
    .setAlpha(0);
  const place = placeClearOfStage(
    x,
    y,
    text.width / 2,
    text.height / 2,
    RISE_DISTANCE,
    getStageBounds(),
  );
  y = place.y;
  const fullScale = place.moved ? STAGE_AVOID_SHRINK : 1;
  text.setY(y);
  _live.add(text);
  text.once('destroy', () => _live.delete(text));

  scene.tweens.add({
    targets: text,
    scale: fullScale,
    alpha: 1,
    duration: POP_DURATION_MS,
    ease: EASE.bouncy,
    onComplete: () => {
      scene.tweens.add({
        targets: text,
        y: y - RISE_DISTANCE,
        alpha: 0,
        duration: RISE_DURATION_MS,
        delay: HOLD_MS,
        ease: EASE.standardOut,
        onComplete: () => text.destroy(),
      });
    },
  });
}
