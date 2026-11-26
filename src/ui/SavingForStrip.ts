/**
 * Home's "saving for" strip: the same reward the results screen shows, small
 * enough to sit in the left column without crowding PLAY. Tapping anywhere on
 * it opens the Shop. When the reward is affordable the ribbon turns gold and
 * the strip says so, instead of showing the numbers.
 */

import Phaser from 'phaser';

import { formatCount, type NextReward } from '../systems/Rewards';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { textStyle } from '../utils/typography';
import { createPanel } from './Panel';
import { addRewardPicture, createRewardBar } from './RewardParts';

export interface SavingForStripConfig {
  /** Centre of the strip. */
  readonly x: number;
  readonly y: number;
  readonly reward: NextReward | null;
  readonly onTap: () => void;
}

export const SAVING_FOR_WIDTH = 224;
export const SAVING_FOR_HEIGHT = 156;
const HALF_WIDTH = SAVING_FOR_WIDTH / 2;
const HALF_HEIGHT = SAVING_FOR_HEIGHT / 2;

/** Offsets from the strip's top-left. */
const PICTURE_X = 52;
const PICTURE_Y = 56;
const PICTURE_MAX_W = 80;
const PICTURE_MAX_H = 52;
const NAME_X = 100;
const NAME_Y = 48;
const NAME_MAX_WIDTH = 116;
const PERK_Y = 96;
const BAR_X = 20;
const BAR_Y = 124;
const BAR_WIDTH = 184;
const BAR_HEIGHT = 14;
const NUMBERS_Y = 144;

/** The ribbon: gold and "can buy" when affordable, else "saving for". */
function ribbonFor(reward: NextReward): string {
  if (reward.kind === 'upgrade') return reward.canAfford ? 'UPGRADE READY!' : 'SAVING FOR';
  return reward.canAfford ? 'YOU CAN BUY!' : 'SAVING FOR';
}

/** Builds the strip; returns the container so the scene can destroy it. */
export function createSavingForStrip(
  scene: Phaser.Scene,
  config: SavingForStripConfig,
): Phaser.GameObjects.Container {
  const { reward } = config;
  const left = config.x - HALF_WIDTH;
  const top = config.y - HALF_HEIGHT;
  const parts: Phaser.GameObjects.GameObject[] = createPanel(scene, {
    x: config.x,
    y: config.y,
    width: SAVING_FOR_WIDTH,
    height: SAVING_FOR_HEIGHT,
    ribbon: reward ? ribbonFor(reward) : 'YOUR SHOP',
    ribbonColour: reward?.canAfford ? COLOUR.sunnyGold : COLOUR.grannyPink,
  });

  if (!reward) {
    parts.push(
      scene.add
        .text(
          config.x,
          top + PERK_Y,
          'All unlocked!',
          textStyle('bodyL', COLOUR_HEX.ink, COLOUR_HEX.cloud),
        )
        .setOrigin(0.5),
    );
  } else {
    const picture = addRewardPicture(
      scene,
      left + PICTURE_X,
      top + PICTURE_Y,
      PICTURE_MAX_W,
      PICTURE_MAX_H,
      reward,
    );
    if (picture) parts.push(picture);
    const name = scene.add
      .text(
        left + NAME_X,
        top + NAME_Y,
        reward.name,
        textStyle('bodyL', COLOUR_HEX.ink, COLOUR_HEX.cloud),
      )
      .setOrigin(0, 0.5);
    if (name.width > NAME_MAX_WIDTH) name.setScale(NAME_MAX_WIDTH / name.width);
    const perk = scene.add
      .text(
        config.x,
        top + PERK_Y,
        reward.perk,
        textStyle('bodyM', COLOUR_HEX.grannyPink, COLOUR_HEX.cloud),
      )
      .setOrigin(0.5);
    const bar = createRewardBar(scene, {
      x: left + BAR_X,
      y: top + BAR_Y,
      width: BAR_WIDTH,
      height: BAR_HEIGHT,
    });
    bar.setProgress(reward.progress);
    const numbers = scene.add
      .text(
        config.x,
        top + NUMBERS_Y,
        reward.canAfford
          ? reward.kind === 'upgrade'
            ? 'Tap to upgrade!'
            : 'Tap to buy!'
          : `${formatCount(reward.have)} / ${formatCount(reward.cost)}`,
        textStyle(
          'bodyM',
          reward.canAfford ? COLOUR_HEX.grannyPink : COLOUR_HEX.ink,
          COLOUR_HEX.cloud,
        ),
      )
      .setOrigin(0.5);
    parts.push(name, perk, bar.graphics, numbers);
  }

  // Last, so it wins input over everything under it.
  const zone = scene.add
    .zone(config.x, config.y, SAVING_FOR_WIDTH, SAVING_FOR_HEIGHT)
    .setInteractive({ useHandCursor: true });
  zone.on('pointerup', config.onTap);
  parts.push(zone);

  return scene.add.container(0, 0, parts);
}
