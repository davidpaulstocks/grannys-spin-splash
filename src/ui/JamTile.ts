/**
 * A venue's Jam on the tour map: a secondary JAM button once it is open, and
 * until then a flat padlocked plate that says what opens it ("Finish the
 * Garden to jam"). Deliberately never green: the mint button on a screen is
 * the one that plays the next gig.
 */

import type Phaser from 'phaser';

import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { textStyle } from '../utils/typography';
import { createButton } from './Button';
import { drawLockIcon } from './icons';

export interface JamTileConfig {
  /** Centre of the tile. */
  readonly x: number;
  readonly y: number;
  readonly venueName: string;
  readonly unlocked: boolean;
  readonly onPlay: () => void;
}

const OPEN_MIN_WIDTH = 220;
const LOCKED_WIDTH = 360;
const LOCKED_HEIGHT = 52;
const LOCKED_DISC = 0xd8d4c6;
const LOCKED_OUTLINE_PX = 4;
const LOCKED_OUTLINE_ALPHA = 0.4;
const LOCK_ICON_SIZE = 24;
const LOCK_GAP = 12;

/** Builds the tile and returns everything it made, ready to add to a container. */
export function createJamTile(
  scene: Phaser.Scene,
  config: JamTileConfig,
): Phaser.GameObjects.GameObject[] {
  if (config.unlocked) {
    return [
      createButton(scene, {
        x: config.x,
        y: config.y,
        label: 'JAM',
        variant: 'secondary',
        size: 'md',
        minWidth: OPEN_MIN_WIDTH,
        onClick: config.onPlay,
      }),
    ];
  }
  const plate = scene.add.graphics({ x: config.x, y: config.y });
  plate.fillStyle(LOCKED_DISC, 1);
  plate.fillRoundedRect(
    -LOCKED_WIDTH / 2,
    -LOCKED_HEIGHT / 2,
    LOCKED_WIDTH,
    LOCKED_HEIGHT,
    pillRadius(LOCKED_WIDTH, LOCKED_HEIGHT),
  );
  plate.lineStyle(LOCKED_OUTLINE_PX, COLOUR.ink, LOCKED_OUTLINE_ALPHA);
  plate.strokeRoundedRect(
    -LOCKED_WIDTH / 2,
    -LOCKED_HEIGHT / 2,
    LOCKED_WIDTH,
    LOCKED_HEIGHT,
    pillRadius(LOCKED_WIDTH, LOCKED_HEIGHT),
  );
  const label = scene.add
    .text(
      0,
      0,
      `Finish the ${config.venueName} to jam`,
      textStyle('bodyM', COLOUR_HEX.softSlate, COLOUR_HEX.cloud),
    )
    .setOrigin(0, 0.5);
  const total = LOCK_ICON_SIZE + LOCK_GAP + label.width;
  const lock = scene.add.graphics({ x: config.x - total / 2 + LOCK_ICON_SIZE / 2, y: config.y });
  drawLockIcon(lock, LOCK_ICON_SIZE, COLOUR.softSlate);
  label.setPosition(config.x - total / 2 + LOCK_ICON_SIZE + LOCK_GAP, config.y);
  return [plate, lock, label];
}
