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
import { textStyle } from '../utils/typography';
import { EASE } from '../utils/tween';

const RISE_DISTANCE = 54;
const POP_DURATION_MS = 120;
const RISE_DURATION_MS = 620;
const HOLD_MS = 80;

/** Spawns one piece of floating text at (x, y) in `colourHex`, scales in, rises, and fades — fire-and-forget. */
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

  scene.tweens.add({
    targets: text,
    scale: 1,
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
