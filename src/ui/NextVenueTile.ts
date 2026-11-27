/**
 * The venue at the end of the tour path, drawn as a button. Open: a
 * thumbnail on a lip that says "GO!" and starts that venue. Locked: dimmed,
 * a padlock and "N more stars"; tapping it only wobbles.
 */

import Phaser from 'phaser';

import type { WorldDef } from '../entities/world/world.types';
import { COLOUR, COLOUR_HEX, shade } from '../utils/colour';
import { EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';
import { attachPress } from './Button';
import { drawLockIcon } from './icons';
import { ensureThumbTexture } from './VenueTile';

export interface NextVenueTileConfig {
  /** Centre of the raised face. */
  readonly x: number;
  readonly y: number;
  readonly venue: WorldDef;
  /** 0 when the venue is open, otherwise the stars it still needs. */
  readonly starsNeeded: number;
  /** Open venues only. */
  readonly onGo: () => void;
}

export const NEXT_VENUE_TILE_WIDTH = 130;
export const NEXT_VENUE_TILE_HEIGHT = 74;
/** How far the lip hangs below the face. */
export const NEXT_VENUE_TILE_LIP = 6;

const RADIUS = 12;
const OUTLINE_PX = 4;
const SHADOW_ALPHA = 0.2;
const SHADOW_DROP = 4;
const FALLBACK_FILL = 0x8a8a9a;
const OPEN_DIM_ALPHA = 0.32;
const LOCKED_DIM_ALPHA = 0.55;
const LIP_SHADE = 0.7;
const NAME_MAX_WIDTH = NEXT_VENUE_TILE_WIDTH - 16;
/** Text offsets from the face's centre. */
const OPEN_NAME_Y = -18;
const OPEN_GO_Y = 12;
const LOCKED_NAME_Y = -22;
const LOCKED_LOCK_Y = 0;
const LOCKED_NEED_Y = 24;
const LOCK_SIZE = 20;
const WOBBLE_PX = 8;
const WOBBLE_MS = 60;

/** Builds the tile centred on its face and returns its container. */
export function createNextVenueTile(
  scene: Phaser.Scene,
  config: NextVenueTileConfig,
): Phaser.GameObjects.Container {
  const open = config.starsNeeded <= 0;
  const left = -NEXT_VENUE_TILE_WIDTH / 2;
  const top = -NEXT_VENUE_TILE_HEIGHT / 2;

  const base = scene.add.graphics();
  base.fillStyle(COLOUR.ink, SHADOW_ALPHA);
  base.fillRoundedRect(
    left,
    top + NEXT_VENUE_TILE_LIP + SHADOW_DROP,
    NEXT_VENUE_TILE_WIDTH,
    NEXT_VENUE_TILE_HEIGHT,
    RADIUS,
  );
  base.fillStyle(shade(open ? COLOUR.waterBlue : FALLBACK_FILL, LIP_SHADE), 1);
  base.fillRoundedRect(
    left,
    top + NEXT_VENUE_TILE_LIP,
    NEXT_VENUE_TILE_WIDTH,
    NEXT_VENUE_TILE_HEIGHT,
    RADIUS,
  );
  base.lineStyle(OUTLINE_PX, COLOUR.ink, 1);
  base.strokeRoundedRect(
    left,
    top + NEXT_VENUE_TILE_LIP,
    NEXT_VENUE_TILE_WIDTH,
    NEXT_VENUE_TILE_HEIGHT,
    RADIUS,
  );

  const parts: Phaser.GameObjects.GameObject[] = [];
  const textureKey = ensureThumbTexture(scene, config.venue.id);
  if (textureKey) {
    parts.push(
      scene.add
        .image(0, 0, textureKey)
        .setDisplaySize(NEXT_VENUE_TILE_WIDTH, NEXT_VENUE_TILE_HEIGHT),
    );
  } else {
    const swatch = scene.add.graphics();
    swatch.fillStyle(FALLBACK_FILL, 1);
    swatch.fillRoundedRect(left, top, NEXT_VENUE_TILE_WIDTH, NEXT_VENUE_TILE_HEIGHT, RADIUS);
    parts.push(swatch);
  }
  const overlay = scene.add.graphics();
  overlay.fillStyle(COLOUR.ink, open ? OPEN_DIM_ALPHA : LOCKED_DIM_ALPHA);
  overlay.fillRoundedRect(left, top, NEXT_VENUE_TILE_WIDTH, NEXT_VENUE_TILE_HEIGHT, RADIUS);
  overlay.lineStyle(OUTLINE_PX, COLOUR.ink, 1);
  overlay.strokeRoundedRect(left, top, NEXT_VENUE_TILE_WIDTH, NEXT_VENUE_TILE_HEIGHT, RADIUS);
  parts.push(overlay);

  const name = scene.add
    .text(
      0,
      open ? OPEN_NAME_Y : LOCKED_NAME_Y,
      config.venue.name,
      textStyle('bodyM', COLOUR_HEX.cloud, COLOUR_HEX.ink),
    )
    .setOrigin(0.5);
  if (name.width > NAME_MAX_WIDTH) name.setScale(NAME_MAX_WIDTH / name.width);
  parts.push(name);
  if (open) {
    parts.push(
      scene.add
        .text(0, OPEN_GO_Y, 'GO!', textStyle('displayM', COLOUR_HEX.sunnyGold, COLOUR_HEX.ink))
        .setOrigin(0.5),
    );
  } else {
    const lock = scene.add.graphics({ x: 0, y: LOCKED_LOCK_Y });
    drawLockIcon(lock, LOCK_SIZE, COLOUR.cloud);
    const need = config.starsNeeded;
    parts.push(
      lock,
      scene.add
        .text(
          0,
          LOCKED_NEED_Y,
          `${need} more ${need === 1 ? 'star' : 'stars'}`,
          textStyle('bodyM', COLOUR_HEX.cloud, COLOUR_HEX.ink),
        )
        .setOrigin(0.5),
    );
  }
  const face = scene.add.container(0, 0, parts);
  const container = scene.add.container(config.x, config.y, [base, face]);
  container.setSize(NEXT_VENUE_TILE_WIDTH, NEXT_VENUE_TILE_HEIGHT + NEXT_VENUE_TILE_LIP);

  if (open) {
    attachPress(
      scene,
      container,
      { onClick: config.onGo },
      NEXT_VENUE_TILE_WIDTH,
      NEXT_VENUE_TILE_HEIGHT + NEXT_VENUE_TILE_LIP,
      NEXT_VENUE_TILE_LIP / 2,
      (pressed) => face.setY(pressed ? NEXT_VENUE_TILE_LIP - 2 : 0),
    );
    return container;
  }
  const zone = scene.add
    .zone(0, NEXT_VENUE_TILE_LIP / 2, NEXT_VENUE_TILE_WIDTH, NEXT_VENUE_TILE_HEIGHT)
    .setInteractive();
  container.add(zone);
  zone.on('pointerup', () => {
    scene.tweens.killTweensOf(face);
    face.setX(0);
    scene.tweens.add({
      targets: face,
      x: WOBBLE_PX,
      duration: WOBBLE_MS,
      ease: EASE.standardOut,
      yoyo: true,
      repeat: 2,
      onComplete: () => face.setX(0),
    });
  });
  return container;
}
