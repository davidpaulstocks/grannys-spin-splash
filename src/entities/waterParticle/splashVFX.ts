/**
 * The little radial burst that plays where a water particle lands
 * (CLAUDE.md's WaterParticle.ts responsibility: "splash on impact").
 * Fire-and-forget: each burst is a handful of tiny circles tweened out
 * and destroyed on completion — nothing pooled, nothing kept alive.
 */

import Phaser from 'phaser';

import { COLOUR } from '../../utils/colour';
import { DURATION, EASE } from '../../utils/tween';

const DROPLET_COUNT = 6;
const DROPLET_RADIUS = 4;
const BURST_DISTANCE = 18;

/** Spawns a small radial water-droplet burst centred on (x, y). */
export function spawnSplash(scene: Phaser.Scene, x: number, y: number): void {
  for (let i = 0; i < DROPLET_COUNT; i++) {
    const angle = (i / DROPLET_COUNT) * Math.PI * 2 + Math.random() * 0.4;
    const targetX = x + Math.cos(angle) * BURST_DISTANCE;
    const targetY = y + Math.sin(angle) * BURST_DISTANCE;

    const droplet = scene.add.circle(x, y, DROPLET_RADIUS, COLOUR.waterBlue, 0.9);
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
