/**
 * Home's daily gift: a gold, breathing button that is only there when there is
 * a gift to take today, so it never becomes furniture. Tapping it claims the
 * gift, floats the coins up and goes away.
 */

import type Phaser from 'phaser';

import { claimDailyGift, dailyGift } from '../systems/DailyGift';
import { saveManager } from '../systems/SaveManager';
import { COLOUR_HEX } from '../utils/colour';
import { EASE } from '../utils/tween';
import { createButton } from './Button';
import { spawnFloatingText } from './FloatingText';

const FLOAT_OFFSET_Y = 46;
const PULSE_SCALE = 1.06;
const PULSE_MS = 520;

export interface DailyGiftButtonConfig {
  readonly x: number;
  readonly y: number;
  /** Called with the new coin total once the gift is claimed. */
  readonly onClaimed: (vault: number) => void;
}

/** Adds the gift button if today's gift is waiting; does nothing otherwise. */
export function createDailyGiftButton(scene: Phaser.Scene, config: DailyGiftButtonConfig): void {
  const gift = dailyGift(saveManager.load(), new Date());
  if (!gift.available) return;
  const button = createButton(scene, {
    x: config.x,
    y: config.y,
    label: `DAILY GIFT  +${gift.coins}`,
    variant: 'reward',
    size: 'sm',
    onClick: () => {
      const claimed = claimDailyGift(saveManager.load(), new Date());
      saveManager.save(claimed);
      config.onClaimed(claimed.vault);
      spawnFloatingText(
        scene,
        config.x,
        config.y + FLOAT_OFFSET_Y,
        `+${gift.coins}`,
        COLOUR_HEX.sunnyGold,
      );
      scene.tweens.killTweensOf(button);
      button.destroy();
    },
  });
  scene.tweens.add({
    targets: button,
    scale: PULSE_SCALE,
    duration: PULSE_MS,
    ease: EASE.standardOut,
    yoyo: true,
    repeat: -1,
  });
}
