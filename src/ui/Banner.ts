/** FRENZY / level-reveal banners with a Back.Out scale-in (CLAUDE.md §5.6, §7.2). */

import Phaser from 'phaser';

import {
  FRENZY_FLASH_DURATION_MS,
  FRENZY_SHAKE_DURATION_MS,
  FRENZY_SHAKE_INTENSITY,
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
): Phaser.GameObjects.Text {
  const banner = scene.add
    .text(x, y, text, textStyle('displayXL', fillHex, COLOUR_HEX.ink))
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

/** Fades a banner out and destroys it. */
export function hideBanner(scene: Phaser.Scene, banner: Phaser.GameObjects.Text): void {
  scene.tweens.add({
    targets: banner,
    alpha: 0,
    duration: DURATION.stateChange,
    onComplete: () => banner.destroy(),
  });
}

/**
 * The full SPLASH FRENZY entrance: banner + camera shake + a full-screen
 * flash (prototype: `shake(500, 0.012)` plus a white flash rect). Bundled
 * here rather than left to GameScene, since "how a Frenzy moment presents
 * itself" is a UI/celebration concern, not scene orchestration.
 */
export function playFrenzyCelebration(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
): Phaser.GameObjects.Text {
  const banner = showBanner(scene, x, y, text);

  scene.cameras.main.shake(FRENZY_SHAKE_DURATION_MS, FRENZY_SHAKE_INTENSITY);

  const flash = scene.add
    .rectangle(0, 0, scene.scale.width, scene.scale.height, COLOUR.cloud, FLASH_ALPHA)
    .setOrigin(0)
    .setDepth(250);
  scene.tweens.add({
    targets: flash,
    alpha: 0,
    duration: FRENZY_FLASH_DURATION_MS,
    ease: EASE.standardOut,
    onComplete: () => flash.destroy(),
  });

  return banner;
}
