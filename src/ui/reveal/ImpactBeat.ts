/**
 * Beat 1 of the gun reveal, the impact: the glow the silhouette stands
 * against, the rays that burst out behind the gun, and the slam itself (a
 * white flash, a camera shake, a shockwave ring in the rarity colour, a
 * second ring for the rarest guns). Everything is added to the overlay's
 * container and tracked, so closing early leaves nothing behind.
 */

import type Phaser from 'phaser';

import { playUpgrade } from '../../audio/SFX';
import type { GunRarity } from '../../entities/gun/gun.types';
import { COLOUR } from '../../utils/colour';
import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { EASE } from '../../utils/tween';
import { rarityColour } from '../gunRarity';
import { spawnSparkles } from '../sparkle';
import type { RevealCtx } from './RevealTracker';
import { RARITY_IMPACT, REVEAL_DEPTH, SECOND_WAVE_DELAY_MS, type Point } from './revealTiming';

const GLOW_RADIUS = 250;
const GLOW_ALPHA = 0.16;
const GLOW_LAYERS = 3;
const GLOW_IN_MS = 260;
const RAY_COUNT = 12;
const RAY_RADIUS = 900;
const RAY_HALF_ANGLE = 0.09;
const RAY_ALPHA = 0.16;
const RAY_BURST_FROM = 0.2;
const RAY_BURST_MS = 420;
const RAY_TURN_MS = 26000;
const FLASH_ALPHA = 0.95;
const FLASH_OVERSCAN = 2;
const FLASH_MS = 320;
const SHOCKWAVE_START_RADIUS = 40;
const SHOCKWAVE_GROWTH = 11;
const SHOCKWAVE_OUTLINE_PX = 10;
const SHOCKWAVE_MS = 620;
const SHAKE_MS = 280;
const UPGRADE_CHORD = 3;

/** The soft rarity-coloured glow behind the gun, so its black silhouette reads against the dark backdrop. */
export function addGlow(ctx: RevealCtx, at: Point, rarity: GunRarity): Phaser.GameObjects.Arc[] {
  const layers: Phaser.GameObjects.Arc[] = [];
  for (let i = 1; i <= GLOW_LAYERS; i++) {
    const layer = ctx.scene.add
      .circle(at.x, at.y, (GLOW_RADIUS * i) / GLOW_LAYERS, rarityColour(rarity), GLOW_ALPHA)
      .setScale(0);
    ctx.root.add(layer);
    layers.push(layer);
  }
  ctx.tracker.tween({ targets: layers, scale: 1, duration: GLOW_IN_MS, ease: EASE.standardOut });
  return layers;
}

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

function shockwave(ctx: RevealCtx, at: Point, rarity: GunRarity): void {
  const colour = rarityColour(rarity);
  const ring = ctx.scene.add
    .circle(at.x, at.y, SHOCKWAVE_START_RADIUS, colour, 0)
    .setStrokeStyle(SHOCKWAVE_OUTLINE_PX, colour, 1);
  ctx.root.add(ring);
  ctx.tracker.tween({
    targets: ring,
    scale: SHOCKWAVE_GROWTH,
    alpha: 0,
    duration: SHOCKWAVE_MS,
    ease: EASE.standardOut,
    onComplete: () => ring.destroy(),
  });
}

/** The slam: flash, shake, shockwave(s), the rays bursting out and sparkles. */
export function playImpactFx(
  ctx: RevealCtx,
  at: Point,
  rarity: GunRarity,
  rays: Phaser.GameObjects.Graphics,
): void {
  const { scene, root, tracker } = ctx;
  const impact = RARITY_IMPACT[rarity];
  const flash = scene.add.rectangle(
    GAME_WIDTH / 2,
    GAME_HEIGHT / 2,
    GAME_WIDTH * FLASH_OVERSCAN,
    GAME_HEIGHT * FLASH_OVERSCAN,
    COLOUR.cloud,
    FLASH_ALPHA,
  );
  root.add(flash);
  tracker.tween({
    targets: flash,
    alpha: 0,
    duration: FLASH_MS,
    ease: EASE.standardOut,
    onComplete: () => flash.destroy(),
  });
  scene.cameras.main.shake(SHAKE_MS, impact.shake);
  playUpgrade(UPGRADE_CHORD);

  rays.setScale(RAY_BURST_FROM);
  tracker.tween({
    targets: rays,
    scale: 1,
    alpha: 1,
    duration: RAY_BURST_MS,
    ease: EASE.standardOut,
  });
  tracker.tween({ targets: rays, angle: 360, duration: RAY_TURN_MS, repeat: -1 });

  shockwave(ctx, at, rarity);
  spawnSparkles(scene, at.x, at.y, REVEAL_DEPTH + 1);
  for (let i = 1; i < impact.shockwaves; i++) {
    tracker.delay(SECOND_WAVE_DELAY_MS * i, () => {
      shockwave(ctx, at, rarity);
      spawnSparkles(scene, at.x, at.y, REVEAL_DEPTH + 1, [rarityColour(rarity), COLOUR.cloud]);
      scene.cameras.main.shake(SHAKE_MS, impact.shake);
    });
  }
}
