/**
 * "What now?" — the card on the results screen that answers: what is the
 * next gun (or granny) I am saving for, what does it do, how far away is it,
 * and can I have it right now. Out of reach: the picture dimmed with a
 * padlock, a goal ribbon, and a bar of coins toward it. Within reach: a gold
 * NEW GUN! ribbon, the picture in full colour and one GET IT button, which
 * hands the purchase to `onBuy` and then plays the gun reveal. GET IT is a
 * secondary button (never green, never bigger than NEXT GIG). Every line of
 * text is measured to the room it has, so none runs under the button.
 */

import Phaser from 'phaser';

import { formatCount, type NextReward } from '../systems/Rewards';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';
import { createButton } from './Button';
import { equippedGun, revealIfOwned } from './gunPurchase';
import { GUN_LADDER_DEFS } from '../entities/gun/gun.data';
import { addPowerPill, powerText } from './gunRarity';
import { createPanel } from './Panel';
import { addGoalPicture, createRewardBar, fitWidth, wrapFit } from './RewardParts';

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
const PICTURE_X = 104;
const PICTURE_Y = 78;
const PICTURE_MAX_W = 150;
const PICTURE_MAX_H = 90;
const TEXT_X = 200;
const RIGHT_EDGE = NEXT_REWARD_CARD_WIDTH - 40;
const NAME_Y = 50;
const PERK_Y = 84;
const BAR_Y = 116;
const BAR_WIDTH = 330;
const BAR_HEIGHT = 20;
const COUNT_GAP = 14;
const COUNT_MAX_WIDTH = RIGHT_EDGE - (TEXT_X + BAR_WIDTH + COUNT_GAP);
const BUY_X = NEXT_REWARD_CARD_WIDTH - 132;
const BUY_Y = 74;
const BUY_MIN_WIDTH = 190;
const BUY_LEFT_EDGE = BUY_X - BUY_MIN_WIDTH / 2;
const BUTTON_TEXT_GAP = 24;
const AFFORDABLE_TEXT_WIDTH = BUY_LEFT_EDGE - BUTTON_TEXT_GAP - TEXT_X;
const AFFORDABLE_NAME_Y = 46;
const AFFORDABLE_PERK_Y = 92;
const AFFORDABLE_PERK_MAX_H = 56;
const BUY_PULSE_SCALE = 1.05;
const BUY_PULSE_MS = 520;
const BAR_FILL_MS = 600;
/** The POWER pill sits on the bottom edge of the picture's frame. */
const POWER_PILL_DROP = 8;

/** The ribbon: names the goal, or says a gun is ready to take. */
function ribbonFor(reward: NextReward): string {
  if (reward.canAfford) return reward.kind === 'granny' ? 'NEW GRANNY!' : 'NEW GUN!';
  return 'SAVING FOR';
}

/** Builds the card (empty until `show` is called) and returns its handle. */
export function createNextRewardCard(
  scene: Phaser.Scene,
  config: NextRewardCardConfig,
): NextRewardCard {
  const container = scene.add.container(0, 0);
  const left = config.x - HALF_WIDTH;
  const top = config.y - HALF_HEIGHT;

  /** GET IT: the scene buys; if a gun is now owned, the reveal plays over the scene. */
  const getIt = (reward: NextReward): void => {
    const previous = equippedGun();
    config.onBuy(reward);
    if (reward.kind === 'gun') revealIfOwned(scene, reward.id, previous);
  };

  const show = (reward: NextReward | null, fromProgress?: number): void => {
    container.each((child: Phaser.GameObjects.GameObject) => scene.tweens.killTweensOf(child));
    container.removeAll(true);

    const panel = createPanel(scene, {
      x: config.x,
      y: config.y,
      width: NEXT_REWARD_CARD_WIDTH,
      height: NEXT_REWARD_CARD_HEIGHT,
      ribbon: reward ? ribbonFor(reward) : 'ALL UNLOCKED',
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

    container.add(
      addGoalPicture(
        scene,
        left + PICTURE_X,
        top + PICTURE_Y,
        PICTURE_MAX_W,
        PICTURE_MAX_H,
        reward,
        !reward.canAfford,
      ),
    );

    if (reward.kind !== 'granny') {
      const gun = GUN_LADDER_DEFS.find((g) => g.id === reward.id);
      if (gun) {
        container.add(
          addPowerPill(
            scene,
            left + PICTURE_X,
            top + PICTURE_Y + PICTURE_MAX_H / 2 + POWER_PILL_DROP,
            powerText(gun.id),
            gun.rarity,
          ),
        );
      }
    }

    const textWidth = reward.canAfford ? AFFORDABLE_TEXT_WIDTH : RIGHT_EDGE - TEXT_X;
    const name = scene.add
      .text(
        left + TEXT_X,
        top + (reward.canAfford ? AFFORDABLE_NAME_Y : NAME_Y),
        reward.name,
        textStyle('displayM', COLOUR_HEX.ink, COLOUR_HEX.cloud),
      )
      .setOrigin(0, 0.5);
    fitWidth(name, textWidth);
    const perk = scene.add
      .text(
        left + TEXT_X,
        top + (reward.canAfford ? AFFORDABLE_PERK_Y : PERK_Y),
        reward.perk,
        textStyle('bodyL', COLOUR_HEX.grannyPink, COLOUR_HEX.cloud),
      )
      .setOrigin(0, 0.5);
    wrapFit(perk, textWidth, AFFORDABLE_PERK_MAX_H);
    container.add([name, perk]);

    if (reward.canAfford) {
      const buy = createButton(scene, {
        x: left + BUY_X,
        y: top + BUY_Y,
        label: 'GET IT',
        variant: 'secondary',
        size: 'sm',
        minWidth: BUY_MIN_WIDTH,
        onClick: () => getIt(reward),
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
      return;
    }

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
    fitWidth(count, COUNT_MAX_WIDTH);
    container.add([bar.graphics, count]);
  };

  return { container, show };
}
