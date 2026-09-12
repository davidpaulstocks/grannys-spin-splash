/**
 * The little radial burst that plays where a water particle lands
 * (CLAUDE.md's WaterParticle.ts responsibility: "splash on impact"), plus
 * the brighter spark burst a spinner throws off when it levels up
 * (2026-09-12, direct user feedback: spinners needed more "juice, momentum,
 * sparks" — a state upgrade is the single most rewarding gameplay moment
 * and previously had zero VFX beyond the SFX + a flat glow-colour swap).
 * Both are fire-and-forget: tiny shapes tweened out and destroyed on
 * completion, nothing pooled, nothing kept alive.
 */

import Phaser from 'phaser';

import { COLOUR } from '../../utils/colour';
import { DURATION, EASE } from '../../utils/tween';

const DROPLET_COUNT = 6;
const DROPLET_RADIUS = 4;
const BURST_DISTANCE = 18;

const SPARK_COUNT = 10;
const SPARK_LENGTH = 10;
const SPARK_BURST_DISTANCE = 34;

/** Spawns a small radial water-droplet burst centred on (x, y), tinted `colour` (defaults to Water Blue). */
export function spawnSplash(
  scene: Phaser.Scene,
  x: number,
  y: number,
  colour: number = COLOUR.waterBlue,
): void {
  for (let i = 0; i < DROPLET_COUNT; i++) {
    const angle = (i / DROPLET_COUNT) * Math.PI * 2 + Math.random() * 0.4;
    const targetX = x + Math.cos(angle) * BURST_DISTANCE;
    const targetY = y + Math.sin(angle) * BURST_DISTANCE;

    const droplet = scene.add.circle(x, y, DROPLET_RADIUS, colour, 0.9);
    scene.tweens.add({
      targets: droplet,
      x: targetX,
      y: targetY,
      alpha: 0,
      scale: 0.3,
      duration: DURATION.stateChange,
      ease: EASE.standardOut,
      onComplete: () => droplet.destroy(),
    });
  }
}

/**
 * Spawns a bright radiating spark burst centred on (x, y) — thin rotated
 * rectangles instead of the splash's round droplets, so a level-up reads
 * as an energetic "zap" distinct from a plain water hit. Colour defaults
 * to Sunny Gold (CLAUDE.md §5.1 — "Stars, Frenzy, rewards, success").
 */
export function spawnSparks(
  scene: Phaser.Scene,
  x: number,
  y: number,
  colour: number = COLOUR.sunnyGold,
): void {
  for (let i = 0; i < SPARK_COUNT; i++) {
    const angle = (i / SPARK_COUNT) * Math.PI * 2 + Math.random() * 0.3;
    const targetX = x + Math.cos(angle) * SPARK_BURST_DISTANCE;
    const targetY = y + Math.sin(angle) * SPARK_BURST_DISTANCE;

    const spark = scene.add.rectangle(x, y, SPARK_LENGTH, 2, colour, 1);
    spark.setRotation(angle);
    scene.tweens.add({
      targets: spark,
      x: targetX,
      y: targetY,
      alpha: 0,
      scale: 0.4,
      duration: DURATION.stateChange,
      ease: EASE.standardOut,
      onComplete: () => spark.destroy(),
    });
  }
}
