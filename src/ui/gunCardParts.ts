/**
 * Two small pieces of the Shop's gun card: the MAX LEVEL tag that replaces the
 * button at the top level, and the "not yet" wobble of a button that cannot
 * be afforded.
 */

import type Phaser from 'phaser';

import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';

export const ACTION_WIDTH = 190;
const MAX_TAG_HEIGHT = 40;
const PIP_OUTLINE_PX = 3;
const SHAKE_PX = 8;
const SHAKE_MS = 55;

/** The tag that replaces the button at the top level: gold, outlined, not pressable. */
export function maxTag(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const bg = scene.add.graphics();
  const radius = pillRadius(ACTION_WIDTH, MAX_TAG_HEIGHT);
  bg.fillStyle(COLOUR.sunnyGold, 1);
  bg.fillRoundedRect(-ACTION_WIDTH / 2, -MAX_TAG_HEIGHT / 2, ACTION_WIDTH, MAX_TAG_HEIGHT, radius);
  bg.lineStyle(PIP_OUTLINE_PX, COLOUR.ink, 1);
  bg.strokeRoundedRect(
    -ACTION_WIDTH / 2,
    -MAX_TAG_HEIGHT / 2,
    ACTION_WIDTH,
    MAX_TAG_HEIGHT,
    radius,
  );
  const label = scene.add
    .text(0, 0, 'MAX LEVEL', textStyle('buttonS', COLOUR_HEX.ink, COLOUR_HEX.ink))
    .setOrigin(0.5);
  return scene.add.container(x, y, [bg, label]);
}

/** A gentle side-to-side wobble: "not yet". */
export function shake(scene: Phaser.Scene, target: Phaser.GameObjects.Container): void {
  const home = target.x;
  scene.tweens.add({
    targets: target,
    x: { from: home - SHAKE_PX, to: home + SHAKE_PX },
    duration: SHAKE_MS,
    yoyo: true,
    repeat: 2,
    ease: EASE.standardOut,
    onComplete: () => target.setX(home),
  });
}
