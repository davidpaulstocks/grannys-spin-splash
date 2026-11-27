/** FRENZY / level-reveal banners with a Back.Out scale-in (CLAUDE.md §5.6, §7.2). */

import Phaser from 'phaser';

import {
  FRENZY_FLASH_DURATION_MS,
  FRENZY_SHAKE_DURATION_MS,
  FRENZY_SHAKE_INTENSITY,
  GAME_HEIGHT,
  GAME_WIDTH,
} from '../config';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { BOUNCE_OVERSHOOT, DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';

const ENTRANCE_START_SCALE = 0.3;
const FLASH_ALPHA = 0.8;

/** Creates a celebratory banner text, already tweened in. Caller owns the returned object (position it via x/y first if needed). */
export function showBanner(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  fillHex: string = COLOUR_HEX.sunnyGold,
  tier: 'displayXL' | 'displayL' = 'displayXL',
): Phaser.GameObjects.Text {
  const banner = scene.add
    .text(x, y, text, textStyle(tier, fillHex, COLOUR_HEX.ink))
    .setOrigin(0.5)
    .setScale(ENTRANCE_START_SCALE)
    .setAlpha(0);

  scene.tweens.add({
    targets: banner,
    scale: 1,
    alpha: 1,
    duration: DURATION.celebration,
    ease: EASE.bouncy,
    easeParams: [BOUNCE_OVERSHOOT],
  });

  return banner;
}

/**
 * The SPLASH FRENZY entrance apart from its words: camera shake + a
 * full-screen flash (prototype: `shake(500, 0.012)` plus a white flash rect).
 * The banner itself goes through the stage (`game/stageMessages.ts`) so it
 * never overprints another big message.
 */
export function playFrenzyImpact(scene: Phaser.Scene): void {
  scene.cameras.main.shake(FRENZY_SHAKE_DURATION_MS, FRENZY_SHAKE_INTENSITY);

  const flash = scene.add
    .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLOUR.cloud, FLASH_ALPHA)
    .setOrigin(0)
    .setDepth(250);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: FRENZY_FLASH_DURATION_MS,
    ease: EASE.standardOut,
    onComplete: () => flash.destroy(),
  });
}
