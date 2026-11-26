/**
 * "What now?" — the card on the results screen that answers: what is the
 * next thing I can get, what does it do, how far away is it, and can I have
 * it right now. A bar of coins toward it, or a BUY button when it is within
 * reach. BUY is a secondary button (never green, never bigger than NEXT GIG).
 */

import Phaser from 'phaser';

import { formatCount, type NextReward } from '../systems/Rewards';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';
import { createButton } from './Button';
import { createPanel } from './Panel';
import { addRewardPicture, createRewardBar } from './RewardParts';

export interface NextRewardCardConfig {
  /** Centre of the card. */
  readonly x: number;
  readonly y: number;
  readonly onBuy: (reward: NextReward) => void;
}

export interface NextRewardCard {
  /** Everything the card draws, so the scene can fade it in as one. */
  readonly container: Phaser.GameObjects.Container;
  /** Redraws the card for `reward`; the bar fills from `fromProgress` when given. */
  show(reward: NextReward | null, fromProgress?: number): void;
}

export const NEXT_REWARD_CARD_WIDTH = 760;
export const NEXT_REWARD_CARD_HEIGHT = 140;
const HALF_WIDTH = NEXT_REWARD_CARD_WIDTH / 2;
const HALF_HEIGHT = NEXT_REWARD_CARD_HEIGHT / 2;

/** Offsets from the card's top-left. */
const PICTURE_X = 110;
const PICTURE_Y = 78;
const PICTURE_MAX_W = 150;
const PICTURE_MAX_H = 96;
const TEXT_X = 210;
const NAME_Y = 50;
const PERK_Y = 84;
const BAR_Y = 116;
const BAR_WIDTH = 340;
const BAR_HEIGHT = 20;
const COUNT_GAP = 16;
const BUY_X = NEXT_REWARD_CARD_WIDTH - 130;
const BUY_Y = 56;
const BUY_MIN_WIDTH = 190;
const BUY_PULSE_SCALE = 1.05;
const BUY_PULSE_MS = 520;
const BAR_FILL_MS = 600;
const NAME_MAX_WIDTH = 330;

/** Builds the card (empty until `show` is called) and returns its handle. */
export function createNextRewardCard(
  scene: Phaser.Scene,
  config: NextRewardCardConfig,
): NextRewardCard {
  const container = scene.add.container(0, 0);
  const left = config.x - HALF_WIDTH;
  const top = config.y - HALF_HEIGHT;

  const show = (reward: NextReward | null, fromProgress?: number): void => {
    container.each((child: Phaser.GameObjects.GameObject) => scene.tweens.killTweensOf(child));
    container.removeAll(true);

    const panel = createPanel(scene, {
      x: config.x,
      y: config.y,
      width: NEXT_REWARD_CARD_WIDTH,
      height: NEXT_REWARD_CARD_HEIGHT,
      ribbon: reward ? (reward.canAfford ? 'YOU CAN BUY IT!' : 'SAVING FOR') : 'ALL UNLOCKED',
      ribbonColour: reward?.canAfford ? COLOUR.sunnyGold : COLOUR.grannyPink,
    });
    container.add(panel);

    if (!reward) {
      container.add(
        scene.add
          .text(
            config.x,
            top + PERK_Y,
            'You own everything!',
            textStyle('displayM', COLOUR_HEX.ink, COLOUR_HEX.cloud),
          )
          .setOrigin(0.5),
      );
      return;
    }

    const picture = addRewardPicture(
      scene,
      left + PICTURE_X,
      top + PICTURE_Y,
      PICTURE_MAX_W,
      PICTURE_MAX_H,
      reward,
    );
    if (picture) container.add(picture);

    const name = scene.add
      .text(
        left + TEXT_X,
        top + NAME_Y,
        reward.name,
        textStyle('displayM', COLOUR_HEX.ink, COLOUR_HEX.cloud),
      )
      .setOrigin(0, 0.5);
    if (name.width > NAME_MAX_WIDTH) name.setScale(NAME_MAX_WIDTH / name.width);
    const perk = scene.add
      .text(
        left + TEXT_X,
        top + PERK_Y,
        reward.perk,
        textStyle('bodyL', COLOUR_HEX.grannyPink, COLOUR_HEX.cloud),
      )
      .setOrigin(0, 0.5);
    const bar = createRewardBar(scene, {
      x: left + TEXT_X,
      y: top + BAR_Y,
      width: BAR_WIDTH,
      height: BAR_HEIGHT,
    });
    if (fromProgress !== undefined && fromProgress < reward.progress) {
      bar.animate(fromProgress, reward.progress, BAR_FILL_MS);
    } else {
      bar.setProgress(reward.progress);
    }
    const count = scene.add
      .text(
        left + TEXT_X + BAR_WIDTH + COUNT_GAP,
        top + BAR_Y,
        `${formatCount(Math.min(reward.have, reward.cost))} / ${formatCount(reward.cost)}`,
        textStyle('bodyL', COLOUR_HEX.ink, COLOUR_HEX.cloud),
      )
      .setOrigin(0, 0.5);
    container.add([name, perk, bar.graphics, count]);

    if (reward.canAfford) {
      const buy = createButton(scene, {
        x: left + BUY_X,
        y: top + BUY_Y,
        label: 'BUY',
        variant: 'secondary',
        size: 'sm',
        minWidth: BUY_MIN_WIDTH,
        onClick: () => config.onBuy(reward),
      });
      container.add(buy);
      scene.tweens.add({
        targets: buy,
        scale: BUY_PULSE_SCALE,
        duration: BUY_PULSE_MS,
        ease: EASE.standardOut,
        yoyo: true,
        repeat: -1,
      });
    }
  };

  return { container, show };
}
