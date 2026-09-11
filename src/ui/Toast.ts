/** Floating text notification with fade (CLAUDE.md §7.2) — e.g. "Earn more ★" on a locked item tap. */

import Phaser from 'phaser';

import { COLOUR_HEX } from '../utils/colour';
import { DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';

const RISE_DISTANCE = 24;
const HOLD_MS = 900;

/** Shows a brief message that drifts up and fades — fire-and-forget, cleans up after itself. */
export function showToast(scene: Phaser.Scene, x: number, y: number, message: string): void {
  const text = scene.add
    .text(x, y, message, textStyle('bodyM', COLOUR_HEX.ink, COLOUR_HEX.cloud))
    .setOrigin(0.5)
    .setDepth(300)
    .setAlpha(0);

  scene.tweens.add({
    targets: text,
    y: y - RISE_DISTANCE,
    alpha: 1,
    duration: DURATION.stateChange,
    ease: EASE.standardOut,
    onComplete: () => {
      scene.tweens.add({
        targets: text,
        alpha: 0,
        duration: DURATION.stateChange,
        delay: HOLD_MS,
        ease: EASE.standardIn,
        onComplete: () => text.destroy(),
      });
    },
  });
}
