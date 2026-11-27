/**
 * Home's "saving for" strip: the next gun (or granny) to save for, small
 * enough to sit in the left column without crowding PLAY. Out of reach: a
 * SAVING FOR ribbon, the picture dimmed with a padlock, its perk and a bar of
 * coins. Within reach: a gold NEW GUN! ribbon, the picture in full colour and
 * one GET IT button that buys it and plays the reveal. Tapping anywhere else
 * on the strip opens the Shop.
 */

import Phaser from 'phaser';

import { formatCount, type NextReward } from '../systems/Rewards';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { textStyle } from '../utils/typography';
import { createButton } from './Button';
import { buyGunWithReveal, previewGunReveal } from './gunPurchase';
import { GUN_LADDER_DEFS } from '../entities/gun/gun.data';
import { powerText } from './gunRarity';
import { createPanel } from './Panel';
import { addGoalPicture, addPictureTap, createRewardBar, fitWidth, wrapFit } from './RewardParts';

export interface SavingForStripConfig {
  /** Centre of the strip. */
  readonly x: number;
  readonly y: number;
  readonly reward: NextReward | null;
  readonly onTap: () => void;
  /** Runs after a purchase made from the strip, once its reveal has closed; Home rebuilds itself here. Defaults to restarting the scene. */
  readonly onBought?: () => void;
}

export const SAVING_FOR_WIDTH = 224;
export const SAVING_FOR_HEIGHT = 156;
const HALF_WIDTH = SAVING_FOR_WIDTH / 2;
const HALF_HEIGHT = SAVING_FOR_HEIGHT / 2;

/** Offsets from the strip's top-left. */
const PICTURE_X = 52;
const PICTURE_Y = 58;
const PICTURE_MAX_W = 80;
const PICTURE_MAX_H = 52;
const NAME_X = 100;
const NAME_Y = 48;
const NAME_MAX_WIDTH = 112;
const PERK_Y = 94;
const POWER_Y = 70;
const PERK_MAX_WIDTH = 196;
const PERK_MAX_HEIGHT = 40;
const BAR_X = 20;
const BAR_Y = 124;
const BAR_WIDTH = 184;
const BAR_HEIGHT = 14;
const NUMBERS_Y = 144;
const AFFORDABLE_PERK_Y = 72;
const GET_IT_Y = 122;
const GET_IT_MIN_WIDTH = 168;

/** The ribbon: gold when the gun can be had now, else the goal. */
function ribbonFor(reward: NextReward): string {
  if (reward.canAfford) return reward.kind === 'granny' ? 'NEW GRANNY!' : 'NEW GUN!';
  return 'SAVING FOR';
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

  // The tap-anywhere zone goes under the GET IT button so the button wins input.
  const zone = scene.add
    .zone(config.x, config.y, SAVING_FOR_WIDTH, SAVING_FOR_HEIGHT)
    .setInteractive({ useHandCursor: true });
  zone.on('pointerup', config.onTap);
  parts.push(zone);

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
    return scene.add.container(0, 0, parts);
  }

  parts.push(
    ...addGoalPicture(
      scene,
      left + PICTURE_X,
      top + PICTURE_Y,
      PICTURE_MAX_W,
      PICTURE_MAX_H,
      reward,
      !reward.canAfford,
    ),
  );
  if (reward.kind === 'gun') {
    parts.push(
      addPictureTap(scene, left + PICTURE_X, top + PICTURE_Y, PICTURE_MAX_W, PICTURE_MAX_H, () =>
        previewGunReveal(scene, reward.id, {
          onClosed: config.onBought ?? (() => scene.scene.restart()),
        }),
      ),
    );
  }
  const name = scene.add
    .text(
      left + NAME_X,
      top + NAME_Y,
      reward.name,
      textStyle('bodyL', COLOUR_HEX.ink, COLOUR_HEX.cloud),
    )
    .setOrigin(0, 0.5);
  fitWidth(name, NAME_MAX_WIDTH);
  const gun =
    reward.kind === 'granny' ? undefined : GUN_LADDER_DEFS.find((g) => g.id === reward.id);
  if (gun) {
    parts.push(
      scene.add
        .text(
          left + NAME_X,
          top + POWER_Y,
          powerText(gun.id),
          textStyle('caption', COLOUR_HEX.ink, COLOUR_HEX.cloud),
        )
        .setOrigin(0, 0.5),
    );
  }
  const perk = scene.add
    .text(
      config.x,
      top + (reward.canAfford ? AFFORDABLE_PERK_Y : PERK_Y),
      reward.perk,
      textStyle('bodyM', COLOUR_HEX.grannyPink, COLOUR_HEX.cloud),
    )
    .setOrigin(0.5)
    .setAlign('center');
  wrapFit(perk, PERK_MAX_WIDTH, PERK_MAX_HEIGHT);
  parts.push(name, perk);

  if (reward.canAfford) {
    parts.push(
      createButton(scene, {
        x: config.x,
        y: top + GET_IT_Y,
        label: 'GET IT',
        variant: 'secondary',
        size: 'sm',
        minWidth: GET_IT_MIN_WIDTH,
        expandHitArea: false,
        onClick: () => {
          if (reward.kind === 'gun') {
            buyGunWithReveal(scene, reward.id, config.onBought ?? (() => scene.scene.restart()));
          } else {
            config.onTap();
          }
        },
      }),
    );
    return scene.add.container(0, 0, parts);
  }

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
      `${formatCount(Math.min(reward.have, reward.cost))} / ${formatCount(reward.cost)}`,
      textStyle('bodyM', COLOUR_HEX.ink, COLOUR_HEX.cloud),
    )
    .setOrigin(0.5);
  fitWidth(numbers, SAVING_FOR_WIDTH - 2 * BAR_X);
  parts.push(bar.graphics, numbers);
  return scene.add.container(0, 0, parts);
}
