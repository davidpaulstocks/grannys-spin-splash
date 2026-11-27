/**
 * Home's set dressing: the wordmark across the top, Granny bobbing on the
 * left and the one-line tag under her naming her talent. Split out of HomeScene, which is about the buttons.
 */

import type Phaser from 'phaser';

import { SPRITE_KEYS } from '../../assets/keys';
import { GAME_WIDTH } from '../../config';
import { GRANNY_LADDER_DEFS } from '../../entities/granny/granny.data';
import { COLOUR, COLOUR_HEX } from '../../utils/colour';
import { pillRadius } from '../../utils/math';
import { EASE } from '../../utils/tween';
import { textStyle } from '../../utils/typography';

const TITLE_Y = 50;
const TITLE_HEIGHT = 88;

const GRANNY_X = 380;
const GRANNY_Y = 350;
const GRANNY_HEIGHT = 400;
const GRANNY_BOB_PX = 10;
const GRANNY_BOB_MS = 900;

/** The talent tag: a Cloud pill under Granny's feet, between "ALL GIGS" on the left and the gig card on the right. */
const TAG_Y = 560;
const TAG_MAX_WIDTH = 400;
const TAG_HEIGHT = 30;
const TAG_PADDING = 24;
const TAG_OUTLINE_PX = 3;

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

/** "Steady hands: Instruments hold full speed 20% longer", in a small pill under the chosen granny. */
export function buildTalentTag(scene: Phaser.Scene, grannyId: string): void {
  const talent = GRANNY_LADDER_DEFS.find((g) => g.id === grannyId)?.talent;
  if (!talent) return;
  const label = scene.add
    .text(
      GRANNY_X,
      TAG_Y,
      `${talent.name}: ${talent.line}`,
      textStyle('bodyM', COLOUR_HEX.ink, COLOUR_HEX.cloud),
    )
    .setOrigin(0.5);
  const maxText = TAG_MAX_WIDTH - TAG_PADDING;
  if (label.width > maxText) label.setScale(maxText / label.width);
  const width = label.width * label.scaleX + TAG_PADDING;
  const bg = scene.add.graphics();
  bg.fillStyle(COLOUR.cloud, 0.96);
  bg.fillRoundedRect(
    GRANNY_X - width / 2,
    TAG_Y - TAG_HEIGHT / 2,
    width,
    TAG_HEIGHT,
    pillRadius(width, TAG_HEIGHT),
  );
  bg.lineStyle(TAG_OUTLINE_PX, COLOUR.ink, 1);
  bg.strokeRoundedRect(
    GRANNY_X - width / 2,
    TAG_Y - TAG_HEIGHT / 2,
    width,
    TAG_HEIGHT,
    pillRadius(width, TAG_HEIGHT),
  );
  scene.children.bringToTop(label);
}
