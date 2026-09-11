/** FRENZY / level-reveal banners with a Back.Out scale-in (CLAUDE.md §5.6, §7.2). */

import Phaser from 'phaser';

import { COLOUR_HEX } from '../utils/colour';
import { BOUNCE_OVERSHOOT, DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';

const ENTRANCE_START_SCALE = 0.3;

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
