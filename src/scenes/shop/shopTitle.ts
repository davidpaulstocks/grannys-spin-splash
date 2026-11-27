/**
 * The Shop's backdrop and title: the illustrated wreath scaled to frame the
 * whole 1280x720 canvas behind everything, and the wordmark near the top.
 * Falls back to plain styled text when either picture failed to load. CLAUDE.md
 * §3 rule 6 bans studio splash screens, not the game's own title on its menu.
 */

import type Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { SPRITE_KEYS } from '../../assets/keys';
import { COLOUR, COLOUR_HEX } from '../../utils/colour';
import { textStyle } from '../../utils/typography';

const TITLE_CENTRE_Y = 110;
const TITLE_WORDMARK_HEIGHT = 120;
const FALLBACK_TITLE_DROP = 10;

/** Paints the cloud background, the wreath frame and the wordmark. */
export function buildShopTitle(scene: Phaser.Scene): void {
  scene.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLOUR.cloud).setOrigin(0);
  const hasArt =
    scene.textures.exists(SPRITE_KEYS.titleFlourish) &&
    scene.textures.exists(SPRITE_KEYS.titleWordmark);
  if (!hasArt) {
    scene.add
      .text(
        GAME_WIDTH / 2,
        TITLE_CENTRE_Y + FALLBACK_TITLE_DROP,
        "GRANNY'S SPIN SPLASH",
        textStyle('displayXL', COLOUR_HEX.grannyPink, COLOUR_HEX.ink),
      )
      .setOrigin(0.5);
    return;
  }
  const frame = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, SPRITE_KEYS.titleFlourish);
  frame.setScale(Math.max(GAME_WIDTH / frame.width, GAME_HEIGHT / frame.height));
  const wordmark = scene.add.image(GAME_WIDTH / 2, TITLE_CENTRE_Y, SPRITE_KEYS.titleWordmark);
  wordmark.setScale(TITLE_WORDMARK_HEIGHT / wordmark.height);
}
