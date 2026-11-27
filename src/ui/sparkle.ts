/**
 * A short burst of little gold stars flying outward and fading: the
 * "something good just happened here" mark for an upgrade or a reveal. They
 * are plain scene objects at `depth`, so an overlay can lift them above itself.
 */

import type Phaser from 'phaser';

import { COLOUR } from '../utils/colour';
import { DURATION, EASE } from '../utils/tween';

const SPARKLE_COUNT = 10;
const STAR_POINTS = 5;
const STAR_INNER = 4;
const STAR_OUTER = 10;
const MIN_DISTANCE = 50;
const DISTANCE_RANGE = 50;
const LIFETIME_MS = DURATION.celebration + 200;
const END_SCALE = 0.3;

/** Throws gold stars outward from (x, y) and removes them when they have faded. */
export function spawnSparkles(
  scene: Phaser.Scene,
  x: number,
  y: number,
  depth = 0,
  colours: readonly number[] = [COLOUR.sunnyGold, COLOUR.cloud],
): void {
  for (let i = 0; i < SPARKLE_COUNT; i++) {
    const angle = (i / SPARKLE_COUNT) * Math.PI * 2 + Math.random() * 0.4;
    const distance = MIN_DISTANCE + Math.random() * DISTANCE_RANGE;
    const star = scene.add
      .star(x, y, STAR_POINTS, STAR_INNER, STAR_OUTER, colours[i % colours.length])
      .setDepth(depth);
    scene.tweens.add({
      targets: star,
      x: x + Math.cos(angle) * distance,
      y: y + Math.sin(angle) * distance,
      scale: END_SCALE,
      alpha: 0,
      angle: 90,
      duration: LIFETIME_MS,
      ease: EASE.standardOut,
      onComplete: () => star.destroy(),
    });
  }
}
