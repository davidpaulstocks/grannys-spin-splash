/**
 * The "what next" card when this gig's stars have just opened a venue: gold
 * ribbon NEW WORLD!, the venue's picture and name large, and one GO THERE
 * button that starts its first gig. It takes the slot the reward card would
 * have, so the screen only ever says one thing next.
 */

import type Phaser from 'phaser';

import { playStarChime } from '../audio/ResultsMusic';
import { spawnConfetti } from '../entities/waterParticle/splashVFX';
import type { WorldDef } from '../entities/world/world.types';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';
import { createButton } from './Button';
import { createPanel } from './Panel';
import { ensureThumbTexture, VENUE_TILE_HEIGHT, VENUE_TILE_WIDTH } from './VenueTile';

export interface NewWorldCardConfig {
  /** Centre of the card. */
  readonly x: number;
  readonly y: number;
  readonly venue: WorldDef;
  readonly onGo: () => void;
}

export interface NewWorldCard {
  readonly container: Phaser.GameObjects.Container;
  /** A little drop-in, chime and confetti; call when the card appears. */
  celebrate(): void;
}

export const NEW_WORLD_CARD_WIDTH = 760;
export const NEW_WORLD_CARD_HEIGHT = 140;

/** Offsets from the card's top-left. */
const PICTURE_X = 24;
const PICTURE_Y = 8;
const TEXT_X = 264;
const NAME_Y = 68;
const SUB_Y = 114;
const NAME_MAX_WIDTH = 236;
const BUTTON_X = NEW_WORLD_CARD_WIDTH - 24 - 110;
const BUTTON_Y = 70;
const BUTTON_MIN_WIDTH = 220;
const PICTURE_FALLBACK = 0x8a8a9a;
const PICTURE_RADIUS = 20;
const DROP_IN_PX = 16;
const CONFETTI_COLOURS = [COLOUR.grannyPink, COLOUR.sunnyGold, COLOUR.waterBlue, COLOUR.mintGreen];

/** Builds the card (a Container, so the scene can fade it in) and returns it. */
export function createNewWorldCard(scene: Phaser.Scene, config: NewWorldCardConfig): NewWorldCard {
  const left = config.x - NEW_WORLD_CARD_WIDTH / 2;
  const top = config.y - NEW_WORLD_CARD_HEIGHT / 2;
  const container = scene.add.container(0, 0);
  container.add(
    createPanel(scene, {
      x: config.x,
      y: config.y,
      width: NEW_WORLD_CARD_WIDTH,
      height: NEW_WORLD_CARD_HEIGHT,
      ribbon: 'NEW WORLD!',
      ribbonColour: COLOUR.sunnyGold,
    }),
  );

  const pictureX = left + PICTURE_X + VENUE_TILE_WIDTH / 2;
  const pictureY = top + PICTURE_Y + VENUE_TILE_HEIGHT / 2;
  const textureKey = ensureThumbTexture(scene, config.venue.id);
  if (textureKey) {
    container.add(scene.add.image(pictureX, pictureY, textureKey));
  } else {
    const swatch = scene.add.graphics();
    swatch.fillStyle(PICTURE_FALLBACK, 1);
    swatch.fillRoundedRect(
      pictureX - VENUE_TILE_WIDTH / 2,
      pictureY - VENUE_TILE_HEIGHT / 2,
      VENUE_TILE_WIDTH,
      VENUE_TILE_HEIGHT,
      PICTURE_RADIUS,
    );
    container.add(swatch);
  }

  const name = scene.add
    .text(
      left + TEXT_X,
      top + NAME_Y,
      config.venue.name,
      textStyle('displayL', COLOUR_HEX.ink, COLOUR_HEX.cloud),
    )
    .setOrigin(0, 0.5);
  if (name.width > NAME_MAX_WIDTH) name.setScale(NAME_MAX_WIDTH / name.width);
  const sub = scene.add
    .text(
      left + TEXT_X,
      top + SUB_Y,
      'is open now!',
      textStyle('bodyL', COLOUR_HEX.grannyPink, COLOUR_HEX.cloud),
    )
    .setOrigin(0, 0.5);
  container.add([name, sub]);
  container.add(
    createButton(scene, {
      x: left + BUTTON_X,
      y: top + BUTTON_Y,
      label: 'GO THERE',
      variant: 'secondary',
      size: 'md',
      minWidth: BUTTON_MIN_WIDTH,
      onClick: config.onGo,
    }),
  );

  return {
    container,
    celebrate: () => {
      container.setY(-DROP_IN_PX);
      scene.tweens.add({
        targets: container,
        y: 0,
        duration: DURATION.celebration,
        ease: EASE.bouncy,
      });
      playStarChime(2);
      spawnConfetti(scene, config.x, config.y, CONFETTI_COLOURS);
    },
  };
}
