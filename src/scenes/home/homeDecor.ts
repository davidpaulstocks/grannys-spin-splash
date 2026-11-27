/**
 * Home's two pieces of set dressing: the wordmark across the top and Granny
 * bobbing on the left. Split out of HomeScene, which is about the buttons.
 */

import type Phaser from 'phaser';

import { SPRITE_KEYS } from '../../assets/keys';
import { GAME_WIDTH } from '../../config';
import { COLOUR_HEX } from '../../utils/colour';
import { EASE } from '../../utils/tween';
import { textStyle } from '../../utils/typography';

const TITLE_Y = 50;
const TITLE_HEIGHT = 88;

const GRANNY_X = 380;
const GRANNY_Y = 350;
const GRANNY_HEIGHT = 400;
const GRANNY_BOB_PX = 10;
const GRANNY_BOB_MS = 900;

/** The wordmark, or the title in plain type when the picture is missing. */
export function buildTitle(scene: Phaser.Scene): void {
  if (!scene.textures.exists(SPRITE_KEYS.titleWordmark)) {
    scene.add
      .text(
        GAME_WIDTH / 2,
        TITLE_Y,
        "GRANNY'S SPIN SPLASH",
        textStyle('displayL', COLOUR_HEX.grannyPink, COLOUR_HEX.ink),
      )
      .setOrigin(0.5);
    return;
  }
  const wordmark = scene.add.image(GAME_WIDTH / 2, TITLE_Y, SPRITE_KEYS.titleWordmark);
  wordmark.setScale(TITLE_HEIGHT / wordmark.height);
}

/** The chosen granny's front pose, gently bobbing. */
export function buildGranny(scene: Phaser.Scene, grannyId: string): void {
  const key = SPRITE_KEYS.grannyPose(grannyId, 'front');
  if (!scene.textures.exists(key)) return;
  const granny = scene.add.image(GRANNY_X, GRANNY_Y, key);
  granny.setScale(GRANNY_HEIGHT / granny.height);
  scene.tweens.add({
    targets: granny,
    y: GRANNY_Y - GRANNY_BOB_PX,
    duration: GRANNY_BOB_MS,
    ease: EASE.standardOut,
    yoyo: true,
    repeat: -1,
  });
}
