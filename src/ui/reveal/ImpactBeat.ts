/**
 * The light and shock of the gun reveal's film: the turning rays in the rarity
 * colour that come up behind the gun as the camera pulls back, and
 * the sound of the shot, and the shockwave ring(s) (a second ring and a sparkle burst
 * for the rarest guns) when the hero shot settles. Everything is added to the
 * overlay's container and tracked, so closing early leaves nothing behind.
 */

import type Phaser from 'phaser';

import { playStarChime } from '../../audio/ResultsMusic';
import { playUpgrade } from '../../audio/SFX';
import type { GunRarity } from '../../entities/gun/gun.types';
import { COLOUR } from '../../utils/colour';
import { EASE } from '../../utils/tween';
import { rarityColour } from '../gunRarity';
import { spawnSparkles } from '../sparkle';
import type { RevealCtx } from './RevealTracker';
import { RARITY_RINGS, REVEAL_DEPTH, SECOND_WAVE_DELAY_MS, type Point } from './revealTiming';

const RAY_COUNT = 12;
const RAY_RADIUS = 900;
const RAY_HALF_ANGLE = 0.09;
const RAY_ALPHA = 0.16;
const RAY_BURST_FROM = 0.2;
const RAY_BURST_MS = 420;
const RAY_TURN_MS = 26000;
const SHOCKWAVE_START_RADIUS = 40;
const SHOCKWAVE_GROWTH = 11;
const SHOCKWAVE_OUTLINE_PX = 10;
const SHOCKWAVE_MS = 620;
const UPGRADE_CHORD = 3;
/** Index in the overlay's container just above the backdrop (0) and the rays (1). */
const RING_INDEX = 2;

/** The turning rays, built hidden: `burstRays` shows them. */
export function addRays(ctx: RevealCtx, at: Point, rarity: GunRarity): Phaser.GameObjects.Graphics {
  const rays = ctx.scene.add.graphics({ x: at.x, y: at.y });
  rays.fillStyle(rarityColour(rarity), RAY_ALPHA);
  for (let i = 0; i < RAY_COUNT; i++) {
    const a = (i / RAY_COUNT) * Math.PI * 2;
    rays.fillTriangle(
      0,
      0,
      Math.cos(a - RAY_HALF_ANGLE) * RAY_RADIUS,
      Math.sin(a - RAY_HALF_ANGLE) * RAY_RADIUS,
      Math.cos(a + RAY_HALF_ANGLE) * RAY_RADIUS,
      Math.sin(a + RAY_HALF_ANGLE) * RAY_RADIUS,
    );
  }
  rays.setAlpha(0);
  ctx.root.add(rays);
  return rays;
}

/** One shockwave ring from `at` in the rarity colour. */
export function shockwave(ctx: RevealCtx, at: Point, rarity: GunRarity): void {
  const colour = rarityColour(rarity);
  const ring = ctx.scene.add
    .circle(at.x, at.y, SHOCKWAVE_START_RADIUS, colour, 0)
    .setStrokeStyle(SHOCKWAVE_OUTLINE_PX, colour, 1);
  // Behind the gun, in front of the rays: the ring is added first and sent just above the backdrop and rays.
  ctx.root.addAt(ring, RING_INDEX);
  ctx.tracker.tween({
    targets: ring,
    scale: SHOCKWAVE_GROWTH,
    alpha: 0,
    duration: SHOCKWAVE_MS,
    ease: EASE.standardOut,
    onComplete: () => ring.destroy(),
  });
}

/** The rays rise and start to turn slowly behind the gun (the pull-back). */
export function burstRays(ctx: RevealCtx, rays: Phaser.GameObjects.Graphics): void {
  rays.setScale(RAY_BURST_FROM);
  ctx.tracker.tween({
    targets: rays,
    scale: 1,
    alpha: 1,
    duration: RAY_BURST_MS,
    ease: EASE.standardOut,
  });
  ctx.tracker.tween({ targets: rays, angle: 360, duration: RAY_TURN_MS, repeat: -1 });
}

/** The sound of the gun firing in the close-up (the flash itself is drawn by the film's muzzle burst). */
export function fireSound(): void {
  playUpgrade(UPGRADE_CHORD);
}

/** The hero shot settling: the shockwave ring, and for the rarest guns a second ring and a sparkle burst. */
export function heroRings(ctx: RevealCtx, at: Point, rarity: GunRarity): void {
  const { scene, tracker } = ctx;
  shockwave(ctx, at, rarity);
  for (let i = 1; i < RARITY_RINGS[rarity]; i++) {
    tracker.delay(SECOND_WAVE_DELAY_MS * i, () => {
      shockwave(ctx, at, rarity);
      spawnSparkles(scene, at.x, at.y, REVEAL_DEPTH + 1, [rarityColour(rarity), COLOUR.cloud]);
      playStarChime(2);
    });
  }
}
