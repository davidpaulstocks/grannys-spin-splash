/**
 * A readable, held instructional caption for the first-run "mini scripted
 * moments" tutorial (2026-09-12, direct user request — see
 * TutorialSequence.ts for when each one fires). Toast.ts's 900ms hold is
 * tuned for a fleeting combat callout a player glances at mid-action; a
 * first-time 7-year-old actually reading an instruction over a busy
 * spinner wall needs longer and a solid panel behind the text, not bare
 * stroked text drifting past. Same panel language as ControlsLegend.ts.
 */

import Phaser from 'phaser';

import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';

const PADDING_X = 28;
const PADDING_Y = 16;
const RISE_DISTANCE = 16;
/** Long enough for a beginner reader; short enough it's gone well before the next scripted moment could fire. */
const HOLD_MS = 3200;

/** Shows a held caption that fades in, holds, fades out, and destroys itself — fire-and-forget. */
export function showTutorialCaption(
  scene: Phaser.Scene,
  x: number,
  y: number,
  message: string,
): void {
  const label = scene.add
    .text(0, 0, message, textStyle('bodyL', COLOUR_HEX.ink, COLOUR_HEX.cloud))
    .setOrigin(0.5);

  const width = label.width + PADDING_X * 2;
  const height = label.height + PADDING_Y * 2;
  const radius = pillRadius(width, height);

  const bg = scene.add.graphics();
  bg.fillStyle(COLOUR.cloud, 0.94);
  bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
  bg.lineStyle(3, COLOUR.ink, 1);
  bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);

  const container = scene.add
    .container(x, y - RISE_DISTANCE, [bg, label])
    .setDepth(300)
    .setAlpha(0);

  scene.tweens.add({
    targets: container,
    y,
    alpha: 1,
    duration: DURATION.stateChange,
    ease: EASE.standardOut,
    onComplete: () => {
      scene.tweens.add({
        targets: container,
        alpha: 0,
        duration: DURATION.stateChange,
        delay: HOLD_MS,
        ease: EASE.standardIn,
        onComplete: () => container.destroy(),
      });
    },
  });
}
