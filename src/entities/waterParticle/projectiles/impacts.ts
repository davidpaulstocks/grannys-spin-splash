/**
 * What a shot looks like where it lands, per projectile style: the shared
 * splash (tinted to the gun) plus one small extra burst that fits the
 * projectile: bubbles pop, slime splats and drips, the shark bites, ice
 * bursts into a frosty star, lightning flashes, fire throws embers, rainbow
 * throws colour, the trident whirls, the laser rings and the MEGA CANNON
 * shakes the whole screen's worth of water. The extra runs only when the
 * splash itself was not throttled, so a fast gun costs no more than before.
 */

import type Phaser from 'phaser';

import { COLOUR } from '../../../utils/colour';
import { DURATION, EASE } from '../../../utils/tween';
import type { GunDef, ProjectileStyle } from '../../gun/gun.types';
import { impactPoolFor, type PieceShape } from '../impactPool';
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
  lava: {
    shape: 'circle',
    count: 8,
    distance: 22,
    size: 9,
    drift: 42,
    tones: ['main', 'accent', 'main'],
    flash: 36,
    slow: 2.1,
  },
  glitter: {
    shape: 'star',
    count: 10,
    distance: 34,
    size: 6,
    drift: 8,
    tones: ['main', 'accent', 'white'],
    flash: 16,
  },
  kraken: {
    shape: 'circle',
    count: 6,
    distance: 18,
    size: 9,
    drift: 30,
    tones: ['main', 'accent'],
    flash: 40,
    slow: 2.4,
  },
  starpony: {
    shape: 'star',
    count: 8,
    distance: 32,
    size: 8,
    drift: 6,
    tones: ['accent', 'main', 'white'],
    flash: 14,
  },
  vortex: {
    shape: 'ring',
    count: 4,
    distance: 8,
    size: 12,
    drift: 0,
    tones: ['accent', 'main'],
    flash: 30,
    slow: 1.8,
  },
  phoenix: {
    shape: 'spark',
    count: 12,
    distance: 44,
    size: 13,
    drift: -30,
    tones: ['main', 'accent', 'white'],
    flash: 38,
    slow: 1.7,
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
  if (gun.projectile === 'rainbow' || gun.projectile === 'starpony')
    return RAINBOW_TONES[i % RAINBOW_TONES.length] as number;
  if (which === 'main') return gun.particleColour;
  if (which === 'accent') return gun.accentColour;
  return COLOUR.cloud;
}

/** The pool's piece shape for an extra's shape. */
const PIECE_SHAPE: Readonly<Record<Shape, PieceShape>> = {
  circle: 'circle',
  ring: 'ring',
  spark: 'rect',
  triangle: 'triangle',
  star: 'star',
};
const RING_STROKE = 2.5;
const SPARK_THICKNESS = 2.5;
const PIECE_ALPHA = 0.95;
const FLASH_ALPHA = 0.45;
const FLASH_GROWTH = 1.6;
const RING_PIECE_GROWTH = 2.2;
const PIECE_END_SCALE = 0.4;

/** Plays the landing of a shot from `gun` at (x, y); a `depth` above 0 lifts it over an overlay (the gun reveal). */
export function spawnImpact(
  scene: Phaser.Scene,
  x: number,
  y: number,
  gun: GunDef,
  depth = 0,
): void {
  const splashed = spawnSplash(scene, x, y, gun.particleColour, depth);
  const extra = EXTRAS[gun.projectile];
  if (!splashed || !extra) return;
  const duration = DURATION.stateChange * (extra.slow ?? 1);
  const pool = impactPoolFor(scene);

  if (extra.flash) {
    pool.play({
      kind: 'hit',
      shape: 'circle',
      size: extra.flash,
      x,
      y,
      colour: tone(gun, extra.tones[0] as 'main', 0),
      alpha: FLASH_ALPHA,
      depth,
      to: { scale: gun.projectile === 'mega' ? MEGA_RING_GROWTH : FLASH_GROWTH },
      duration,
      ease: EASE.standardOut,
    });
  }
  for (let i = 0; i < extra.count; i++) {
    const angle = (i / extra.count) * Math.PI * 2 + Math.random() * 0.5;
    const colour = tone(gun, extra.tones[i % extra.tones.length] as 'main', i);
    const reach = extra.distance * (0.7 + Math.random() * 0.5);
    // The shark's bite: teeth start out wide and close in on the point of impact.
    const inward = extra.shape === 'triangle';
    const turns = extra.shape === 'spark' || extra.shape === 'star';
    const played = pool.play({
      kind: 'hit',
      shape: PIECE_SHAPE[extra.shape],
      size: extra.size,
      thickness: extra.shape === 'ring' ? RING_STROKE : SPARK_THICKNESS,
      x: inward ? x + Math.cos(angle) * reach : x,
      y: inward ? y + Math.sin(angle) * reach : y,
      colour,
      alpha: PIECE_ALPHA,
      depth,
      rotation: inward ? angle - Math.PI / 2 : turns ? angle : 0,
      to: {
        x: inward ? x : x + Math.cos(angle) * reach,
        y: (inward ? y : y + Math.sin(angle) * reach) + extra.drift,
        scale: inward
          ? SHARK_TOOTH_END_SCALE
          : extra.shape === 'ring'
            ? RING_PIECE_GROWTH
            : PIECE_END_SCALE,
      },
      duration,
      ease: EASE.standardOut,
    });
    if (!played) break;
  }
}
