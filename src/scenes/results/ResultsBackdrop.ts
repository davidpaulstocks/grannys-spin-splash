/** The results screen's backdrop: the venue's own art, softened, with Granny on the left. */

import type Phaser from 'phaser';

import { SPRITE_KEYS } from '../../assets/keys';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { drawWorldBackground } from '../../entities/world/worldBackgrounds';
import { COLOUR } from '../../utils/colour';
import { EASE } from '../../utils/tween';
import { GRANNY_HEIGHT, GRANNY_X, GRANNY_Y } from './resultsLayout';

const BACKDROP_DIM_ALPHA = 0.5;
const BOUNCE_PX = 14;
const BOUNCE_MS = 420;

/** The gig happened somewhere, and it still looks like there. Granny bounces only when the gig passed. */
export function buildResultsBackdrop(
  scene: Phaser.Scene,
  worldId: string,
  grannyId: string,
  passed: boolean,
): void {
  drawWorldBackground(scene, worldId);
  scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLOUR.cloud, BACKDROP_DIM_ALPHA).setOrigin(0);

  const key = SPRITE_KEYS.grannyPose(grannyId, 'front');
  if (!scene.textures.exists(key)) return;
  const granny = scene.add.image(GRANNY_X, GRANNY_Y, key);
  granny.setScale(GRANNY_HEIGHT / granny.height);
  if (!passed) return;
  scene.tweens.add({
    targets: granny,
    y: GRANNY_Y - BOUNCE_PX,
    duration: BOUNCE_MS,
    ease: EASE.standardOut,
    yoyo: true,
    repeat: -1,
  });
}
