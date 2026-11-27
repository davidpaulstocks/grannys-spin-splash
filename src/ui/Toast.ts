/** Floating text notification with fade (CLAUDE.md §7.2) — e.g. "Earn more ★" on a locked item tap. */

import Phaser from 'phaser';

import { COLOUR_HEX } from '../utils/colour';
import { DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';
import { getStageBounds, placeClearOfStage } from './stageBounds';

const RISE_DISTANCE = 24;
const HOLD_MS = 900;

/**
 * Shows a brief message that drifts up and fades — fire-and-forget, cleans up after itself.
 * It starts clear of a big message on the wall's stage if one is up; `onDone` runs when it has gone.
 * Returns the text, so a caller can take it away early.
 */
export function showToast(
  scene: Phaser.Scene,
  x: number,
  y: number,
  message: string,
  onDone?: () => void,
): Phaser.GameObjects.Text {
  const text = scene.add
    .text(x, y, message, textStyle('bodyM', COLOUR_HEX.ink, COLOUR_HEX.cloud))
    .setOrigin(0.5)
    .setDepth(300)
    .setAlpha(0);
  y = placeClearOfStage(x, y, text.width / 2, text.height / 2, RISE_DISTANCE, getStageBounds()).y;
  text.setY(y);

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
        onComplete: () => {
          text.destroy();
          onDone?.();
        },
      });
    },
  });
  return text;
}
