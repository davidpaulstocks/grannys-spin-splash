/**
 * What a shot looks like where it lands, per projectile style: the shared
 * splash (tinted to the gun) plus one small extra burst that fits the
 * projectile: bubbles pop, slime splats and drips, the shark bites, ice
 * bursts into a frosty star, lightning flashes, fire throws embers, rainbow
 * throws colour, the trident whirls, the laser rings and the MEGA CANNON
 * shakes the whole screen's worth of water. The extra runs only when the
 * splash itself was not throttled, so a fast gun costs no more than before.
 */

import Phaser from 'phaser';

import { COLOUR } from '../../../utils/colour';
import { DURATION, EASE } from '../../../utils/tween';
import type { GunDef, ProjectileStyle } from '../../gun/gun.types';
import { spawnSplash } from '../splashVFX';

type Shape = 'circle' | 'ring' | 'spark' | 'triangle' | 'star';

interface ImpactExtra {
  readonly shape: Shape;
  readonly count: number;
  readonly distance: number;
  readonly size: number;
  /** Pixels the pieces drift down (positive) or rise (negative) as they fly. */
  readonly drift: number;
  /** Colours of the pieces, taken from the gun: 'main', 'accent' or 'white'. */
  readonly tones: readonly ('main' | 'accent' | 'white')[];
  /** A big soft flash under the burst. */
  readonly flash?: number;
  /** How long it lasts, as a multiple of the shared splash's time. */
  readonly slow?: number;
}

const EXTRAS: Readonly<Partial<Record<ProjectileStyle, ImpactExtra>>> = {
  bubbles: { shape: 'ring', count: 6, distance: 26, size: 6, drift: -8, tones: ['white', 'main'] },
  slime: {
    shape: 'circle',
    count: 5,
    distance: 14,
    size: 7,
    drift: 34,
    tones: ['main', 'accent'],
    flash: 20,
    slow: 2.2,
  },
  shark: { shape: 'triangle', count: 7, distance: 22, size: 7, drift: 0, tones: ['white'] },
  ice: { shape: 'spark', count: 8, distance: 34, size: 12, drift: 0, tones: ['white', 'main'] },
  lightning: {
    shape: 'spark',
    count: 7,
    distance: 32,
    size: 14,
    drift: 0,
    tones: ['main', 'white'],
    flash: 26,
  },
  flame: {
    shape: 'circle',
    count: 5,
    distance: 16,
    size: 4,
    drift: -34,
    tones: ['main', 'accent'],
  },
  dragon: {
    shape: 'circle',
    count: 9,
    distance: 26,
    size: 6,
    drift: -44,
    tones: ['main', 'accent', 'white'],
    flash: 30,
    slow: 1.6,
  },
  rainbow: {
    shape: 'circle',
    count: 6,
    distance: 26,
    size: 5,
    drift: 20,
    tones: ['main', 'accent'],
  },
  trident: {
    shape: 'ring',
    count: 3,
    distance: 6,
    size: 10,
    drift: 0,
    tones: ['accent', 'main'],
    slow: 1.8,
  },
  laser: {
    shape: 'star',
    count: 5,
    distance: 26,
    size: 6,
    drift: 0,
    tones: ['main', 'accent', 'white'],
    flash: 18,
  },
  mega: {
    shape: 'ring',
    count: 9,
    distance: 56,
    size: 10,
    drift: 18,
    tones: ['accent', 'main', 'white'],
    flash: 52,
    slow: 1.6,
  },
};

/** Where each style's rainbow of colours lands (the five palette colours). */
const RAINBOW_TONES = [
  COLOUR.grannyPink,
  COLOUR.heatOrange,
  COLOUR.sunnyGold,
  COLOUR.mintGreen,
  COLOUR.waterBlue,
] as const;
const MEGA_RING_GROWTH = 5;
const SHARK_TOOTH_END_SCALE = 0.3;

function tone(gun: GunDef, which: 'main' | 'accent' | 'white', i: number): number {
  if (gun.projectile === 'rainbow') return RAINBOW_TONES[i % RAINBOW_TONES.length] as number;
  if (which === 'main') return gun.particleColour;
  if (which === 'accent') return gun.accentColour;
  return COLOUR.cloud;
}

function makePiece(
  scene: Phaser.Scene,
  shape: Shape,
  x: number,
  y: number,
  size: number,
  colour: number,
): Phaser.GameObjects.Shape {
  switch (shape) {
    case 'ring': {
      const ring = scene.add.circle(x, y, size, colour, 0);
      return ring.setStrokeStyle(2.5, colour, 0.95);
    }
    case 'spark':
      return scene.add.rectangle(x, y, size, 2.5, colour, 1);
    case 'triangle':
      return scene.add.triangle(x, y, 0, size, size, size, size / 2, 0, colour, 1);
    case 'star':
      return scene.add.star(x, y, 4, size * 0.35, size, colour, 1);
    default:
      return scene.add.circle(x, y, size, colour, 0.95);
  }
}

/** Plays the landing of a shot from `gun` at (x, y). */
export function spawnImpact(scene: Phaser.Scene, x: number, y: number, gun: GunDef): void {
  const splashed = spawnSplash(scene, x, y, gun.particleColour);
  const extra = EXTRAS[gun.projectile];
  if (!splashed || !extra) return;
  const duration = DURATION.stateChange * (extra.slow ?? 1);

  if (extra.flash) {
    const flash = scene.add.circle(x, y, extra.flash, tone(gun, extra.tones[0] as 'main', 0), 0.45);
    scene.tweens.add({
      targets: flash,
      scale: gun.projectile === 'mega' ? MEGA_RING_GROWTH : 1.6,
      alpha: 0,
      duration,
      ease: EASE.standardOut,
      onComplete: () => flash.destroy(),
    });
  }
  for (let i = 0; i < extra.count; i++) {
    const angle = (i / extra.count) * Math.PI * 2 + Math.random() * 0.5;
    const colour = tone(gun, extra.tones[i % extra.tones.length] as 'main', i);
    const piece = makePiece(scene, extra.shape, x, y, extra.size, colour);
    if (extra.shape === 'spark' || extra.shape === 'star') piece.setRotation(angle);
    const reach = extra.distance * (0.7 + Math.random() * 0.5);
    const inward = extra.shape === 'triangle';
    if (inward) {
      // The bite: teeth start out wide and close in on the point of impact.
      piece.setPosition(x + Math.cos(angle) * reach, y + Math.sin(angle) * reach);
      piece.setRotation(angle - Math.PI / 2);
    }
    scene.tweens.add({
      targets: piece,
      x: inward ? x : x + Math.cos(angle) * reach,
      y: (inward ? y : y + Math.sin(angle) * reach) + extra.drift,
      alpha: 0,
      scale: inward ? SHARK_TOOTH_END_SCALE : extra.shape === 'ring' ? 2.2 : 0.4,
      duration,
      ease: EASE.standardOut,
      onComplete: () => piece.destroy(),
    });
  }
}
