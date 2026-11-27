/**
 * Small pieces shared by every place that shows "what you are saving for":
 * the picture of the gun or granny, and the progress bar toward it.
 */

import type Phaser from 'phaser';

import { SPRITE_KEYS } from '../assets/keys';
import type { NextReward } from '../systems/Rewards';
import { COLOUR, shade } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { EASE } from '../utils/tween';
import { drawLockIcon } from './icons';

/** The gun's 0-degree sprite or the granny's front pose. */
export function rewardTextureKey(reward: Pick<NextReward, 'kind' | 'id'>): string {
  return reward.kind !== 'granny'
    ? SPRITE_KEYS.gunAngle(reward.id, 0)
    : SPRITE_KEYS.grannyPose(reward.id, 'front');
}

/** Adds the reward's picture centred on (x, y), scaled to fit inside `maxWidth` x `maxHeight`; null if the art is missing. */
export function addRewardPicture(
  scene: Phaser.Scene,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
  reward: Pick<NextReward, 'kind' | 'id'>,
): Phaser.GameObjects.Image | null {
  const key = rewardTextureKey(reward);
  if (!scene.textures.exists(key)) return null;
  const image = scene.add.image(x, y, key);
  image.setScale(Math.min(maxWidth / image.width, maxHeight / image.height));
  return image;
}

const LOCKED_TINT = shade(COLOUR.cloud, 0.5);
const LOCKED_ALPHA = 0.85;
const LOCK_SIZE = 20;
const LOCK_PLATE_RADIUS = 18;
const LOCK_CORNER_INSET = 14;

/**
 * The picture of a goal: in full colour when it can be had now, dimmed with a
 * small padlock in its corner while it is still being saved for. Returns every
 * object it made (picture, plate and padlock) so the caller can add them.
 */
export function addGoalPicture(
  scene: Phaser.Scene,
  x: number,
  y: number,
  maxWidth: number,
  maxHeight: number,
  reward: Pick<NextReward, 'kind' | 'id'>,
  locked: boolean,
): Phaser.GameObjects.GameObject[] {
  const image = addRewardPicture(scene, x, y, maxWidth, maxHeight, reward);
  if (!image) return [];
  if (!locked) return [image];
  image.setTint(LOCKED_TINT).setAlpha(LOCKED_ALPHA);
  const plate = scene.add.graphics({
    x: x + maxWidth / 2 - LOCK_CORNER_INSET,
    y: y + maxHeight / 2 - LOCK_CORNER_INSET,
  });
  plate.fillStyle(COLOUR.ink, 0.85);
  plate.fillCircle(0, 0, LOCK_PLATE_RADIUS);
  const lock = scene.add.graphics({ x: plate.x, y: plate.y + 1 });
  drawLockIcon(lock, LOCK_SIZE, COLOUR.cloud);
  return [image, plate, lock];
}

/** Shrinks `text` so it is no wider than `maxWidth`; wide text is made smaller, never cut. */
export function fitWidth(text: Phaser.GameObjects.Text, maxWidth: number): void {
  if (text.width > maxWidth) text.setScale(maxWidth / text.width);
}

/** Wraps `text` at `maxWidth` and, if it still stands taller than `maxHeight`, shrinks it to fit. */
export function wrapFit(text: Phaser.GameObjects.Text, maxWidth: number, maxHeight: number): void {
  text.setWordWrapWidth(maxWidth, true);
  if (text.height > maxHeight) text.setScale(maxHeight / text.height);
}

export interface RewardBarConfig {
  /** Left edge and vertical centre. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface RewardBar {
  readonly graphics: Phaser.GameObjects.Graphics;
  /** Draws the bar filled to `progress` (0 to 1). */
  setProgress(progress: number): void;
  /** Fills the bar from one level to another over `durationMs`. */
  animate(from: number, to: number, durationMs: number): void;
}

const TRACK = 0xd8d4c6;
const OUTLINE_PX = 3;

/** A pill-shaped progress bar: pale track, Sunny Gold fill, Ink outline. */
export function createRewardBar(scene: Phaser.Scene, config: RewardBarConfig): RewardBar {
  const { x, width, height } = config;
  const top = config.y - height / 2;
  const graphics = scene.add.graphics();
  const setProgress = (progress: number): void => {
    const clamped = Math.min(1, Math.max(0, progress));
    graphics.clear();
    graphics.fillStyle(TRACK, 1);
    graphics.fillRoundedRect(x, top, width, height, pillRadius(width, height));
    if (clamped > 0) {
      const fill = Math.max(height, width * clamped);
      graphics.fillStyle(COLOUR.sunnyGold, 1);
      graphics.fillRoundedRect(x, top, fill, height, pillRadius(fill, height));
    }
    graphics.lineStyle(OUTLINE_PX, COLOUR.ink, 1);
    graphics.strokeRoundedRect(x, top, width, height, pillRadius(width, height));
  };
  setProgress(0);
  return {
    graphics,
    setProgress,
    animate: (from, to, durationMs) => {
      setProgress(from);
      scene.tweens.addCounter({
        from,
        to,
        duration: durationMs,
        ease: EASE.standardOut,
        onUpdate: (tween) => setProgress(tween.getValue() ?? to),
        onComplete: () => setProgress(to),
      });
    },
  };
}
