/**
 * One gig as a small round button, used on the results screen's tour path and
 * on Home's next-gig card so a gig looks and behaves the same in both.
 *
 *  - Open with stars to win: a Sunny Gold face on a lip that presses down.
 *  - Open and done (all three stars): a calm Cloud face with a small tick.
 *  - Locked (the gig before it not yet passed): a flat grey padlocked disc;
 *    tapping it wobbles and says nothing.
 *  - Open gigs have their best stars underneath.
 *  - The recommended gig pulses and has a small pink pointer over it; a
 *    pink ring marks the gig just played (results) or selected (Home).
 *
 * Green is left alone: a screen has one Mint Green button.
 */

import Phaser from 'phaser';

import { MAX_STARS_PER_GIG } from '../systems/Progress';
import { COLOUR, COLOUR_HEX, shade } from '../utils/colour';
import { EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';
import { attachPress } from './Button';
import {
  GIG_LIP,
  GIG_OUTLINE_PX,
  GIG_POINTER_GAP,
  GIG_POINTER_HEIGHT,
  GIG_POINTER_OUTLINE_PX,
  GIG_POINTER_WIDTH,
  GIG_RING_PX,
  GIG_SHADOW_DROP,
  GIG_STAR_DROP,
  GIG_STAR_OUTLINE_PX,
  GIG_STAR_RADIUS,
  GIG_STAR_SPACING,
  gigRingRadius,
} from './gigButtonLayout';
import { drawLockIcon, drawStarIcon } from './icons';

export interface GigButtonConfig {
  /** Centre of the disc. */
  readonly x: number;
  readonly y: number;
  readonly diameter: number;
  /** Zero-based; the face shows `gig + 1`. */
  readonly gig: number;
  /** False for a padlocked gig. */
  readonly open: boolean;
  /** Best stars so far, 0 to 3. */
  readonly stars: number;
  /** The gig the player should go to next: it pulses and gets the pointer. */
  readonly recommended: boolean;
  /** Ringed in pink: the gig just played, or the one selected. */
  readonly marked: boolean;
  /** Open gigs only. */
  readonly onTap: () => void;
}

const PALE = 0xd8d4c6;
const SHADOW_ALPHA = 0.2;
const LIP_SHADE = 0.75;
const LOCKED_OUTLINE_ALPHA = 0.4;
const LOCK_FRACTION = 0.46;
const PULSE_SCALE = 1.08;
const PULSE_MS = 520;
const WOBBLE_PX = 6;
const WOBBLE_MS = 60;
const WOBBLE_REPEATS = 2;
const TICK_OFFSET_FRACTION = 0.68;
const TICK_BADGE_RADIUS = 8;
const TICK_BADGE_OUTLINE_PX = 2;
const TICK_PX = 2.5;
const TICK_HALF = 3.5;

/** Builds one button and returns everything it made, ready to add to a container. */
export function createGigButton(
  scene: Phaser.Scene,
  config: GigButtonConfig,
): Phaser.GameObjects.GameObject[] {
  const parts: Phaser.GameObjects.GameObject[] = [];
  if (config.marked) {
    const ring = scene.add.graphics({ x: config.x, y: config.y });
    ring.lineStyle(GIG_RING_PX, COLOUR.grannyPink, 1);
    ring.strokeCircle(0, 0, gigRingRadius(config.diameter));
    parts.push(ring);
  }
  if (config.open && config.recommended) parts.push(buildPointer(scene, config));
  parts.push(config.open ? buildOpen(scene, config) : buildLocked(scene, config));
  if (config.open) parts.push(buildStars(scene, config));
  return parts;
}

function buildPointer(scene: Phaser.Scene, config: GigButtonConfig): Phaser.GameObjects.Graphics {
  const tipY = -(gigRingRadius(config.diameter) + GIG_RING_PX / 2 + GIG_POINTER_GAP);
  const baseY = tipY - GIG_POINTER_HEIGHT;
  const half = GIG_POINTER_WIDTH / 2;
  const pointer = scene.add.graphics({ x: config.x, y: config.y });
  pointer.fillStyle(COLOUR.grannyPink, 1);
  pointer.fillTriangle(-half, baseY, half, baseY, 0, tipY);
  pointer.lineStyle(GIG_POINTER_OUTLINE_PX, COLOUR.ink, 1);
  pointer.strokeTriangle(-half, baseY, half, baseY, 0, tipY);
  return pointer;
}

function buildOpen(scene: Phaser.Scene, config: GigButtonConfig): Phaser.GameObjects.Container {
  const radius = config.diameter / 2;
  const done = config.stars >= MAX_STARS_PER_GIG;
  const faceColour = done ? COLOUR.cloud : COLOUR.sunnyGold;

  const base = scene.add.graphics();
  base.fillStyle(COLOUR.ink, SHADOW_ALPHA);
  base.fillCircle(0, GIG_LIP + GIG_SHADOW_DROP, radius);
  base.fillStyle(shade(faceColour, LIP_SHADE), 1);
  base.fillCircle(0, GIG_LIP, radius);
  base.lineStyle(GIG_OUTLINE_PX, COLOUR.ink, 1);
  base.strokeCircle(0, GIG_LIP, radius);

  const faceGfx = scene.add.graphics();
  faceGfx.fillStyle(faceColour, 1);
  faceGfx.fillCircle(0, 0, radius);
  faceGfx.lineStyle(GIG_OUTLINE_PX, COLOUR.ink, 1);
  faceGfx.strokeCircle(0, 0, radius);
  const label = scene.add
    .text(0, 0, String(config.gig + 1), textStyle('buttonS', COLOUR_HEX.ink, COLOUR_HEX.ink))
    .setOrigin(0.5);
  const faceParts: Phaser.GameObjects.GameObject[] = [faceGfx, label];
  if (done) faceParts.push(buildTick(scene, radius * TICK_OFFSET_FRACTION));
  const face = scene.add.container(0, 0, faceParts);

  const body = scene.add.container(0, 0, [base, face]);
  const outer = scene.add.container(config.x, config.y, [body]);
  outer.setSize(config.diameter, config.diameter + GIG_LIP);
  outer.once('destroy', () => scene.tweens.killTweensOf(body));
  attachPress(
    scene,
    outer,
    { onClick: config.onTap, expandHitArea: false },
    config.diameter,
    config.diameter + GIG_LIP,
    GIG_LIP / 2,
    (pressed) => face.setY(pressed ? GIG_LIP - 2 : 0),
  );
  if (config.recommended) {
    scene.tweens.add({
      targets: body,
      scale: PULSE_SCALE,
      duration: PULSE_MS,
      ease: EASE.standardOut,
      yoyo: true,
      repeat: -1,
    });
  }
  return outer;
}

/** A small blue badge with a tick, at the disc's upper right: "nothing left to win here". */
function buildTick(scene: Phaser.Scene, offset: number): Phaser.GameObjects.Graphics {
  const badge = scene.add.graphics({ x: offset, y: -offset });
  badge.fillStyle(COLOUR.waterBlue, 1);
  badge.fillCircle(0, 0, TICK_BADGE_RADIUS);
  badge.lineStyle(TICK_BADGE_OUTLINE_PX, COLOUR.ink, 1);
  badge.strokeCircle(0, 0, TICK_BADGE_RADIUS);
  badge.lineStyle(TICK_PX, COLOUR.cloud, 1);
  badge.beginPath();
  badge.moveTo(-TICK_HALF, 0);
  badge.lineTo(-TICK_HALF / 3, TICK_HALF * 0.7);
  badge.lineTo(TICK_HALF, -TICK_HALF * 0.7);
  badge.strokePath();
  return badge;
}

function buildLocked(scene: Phaser.Scene, config: GigButtonConfig): Phaser.GameObjects.Container {
  const radius = config.diameter / 2;
  const disc = scene.add.graphics();
  disc.fillStyle(PALE, 1);
  disc.fillCircle(0, 0, radius);
  disc.lineStyle(GIG_OUTLINE_PX, COLOUR.ink, LOCKED_OUTLINE_ALPHA);
  disc.strokeCircle(0, 0, radius);
  const lock = scene.add.graphics();
  drawLockIcon(lock, config.diameter * LOCK_FRACTION, COLOUR.softSlate);
  const body = scene.add.container(0, 0, [disc, lock]);
  const zone = scene.add.zone(0, 0, config.diameter, config.diameter).setInteractive();
  zone.on('pointerup', () => {
    scene.tweens.killTweensOf(body);
    body.setX(0);
    scene.tweens.add({
      targets: body,
      x: WOBBLE_PX,
      duration: WOBBLE_MS,
      ease: EASE.standardOut,
      yoyo: true,
      repeat: WOBBLE_REPEATS,
      onComplete: () => body.setX(0),
    });
  });
  const outer = scene.add.container(config.x, config.y, [body, zone]);
  outer.once('destroy', () => scene.tweens.killTweensOf(body));
  return outer;
}

function buildStars(scene: Phaser.Scene, config: GigButtonConfig): Phaser.GameObjects.Graphics {
  const row = scene.add.graphics({
    x: config.x,
    y: config.y + config.diameter / 2 + GIG_STAR_DROP,
  });
  for (let s = 0; s < MAX_STARS_PER_GIG; s++) {
    const starX = (s - 1) * GIG_STAR_SPACING;
    row.translateCanvas(starX, 0);
    drawStarIcon(row, GIG_STAR_RADIUS + GIG_STAR_OUTLINE_PX, COLOUR.ink);
    drawStarIcon(row, GIG_STAR_RADIUS, s < config.stars ? COLOUR.sunnyGold : PALE);
    row.translateCanvas(-starX, 0);
  }
  return row;
}
