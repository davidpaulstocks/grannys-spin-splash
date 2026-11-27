/**
 * What the gun's muzzle moment looks like, as data: one row per projectile
 * style says what the flying bits are and how they move, and one row per
 * rarity says how many there are. The colours come from the gun itself.
 */

import type { GunRarity, ProjectileStyle } from '../../entities/gun/gun.types';
import { COLOUR } from '../../utils/colour';

/** The shape of one flying bit. */
export type BitShape = 'drop' | 'bubble' | 'blob' | 'jag' | 'flame' | 'star' | 'shard' | 'band';

export interface MuzzleStyle {
  readonly shape: BitShape;
  /** Multiplies the bits' speed and size. */
  readonly speed: number;
  readonly size: number;
  /** Multiplies how many bits it throws (big bits need fewer). */
  readonly count: number;
  /** Px per second squared added to the bits' vertical speed: positive sags, negative rises. */
  readonly gravity: number;
  /** Colours the bits cycle through instead of the gun's own two (the rainbow). */
  readonly palette?: readonly number[];
}

export const MUZZLE_STYLES: Readonly<Record<ProjectileStyle, MuzzleStyle>> = {
  water: { shape: 'drop', speed: 1, size: 1, count: 1, gravity: 260 },
  bubbles: { shape: 'bubble', speed: 0.8, size: 1.15, count: 1, gravity: -140 },
  slime: { shape: 'blob', speed: 0.65, size: 1.3, count: 0.8, gravity: 620 },
  shark: { shape: 'drop', speed: 1.1, size: 1.1, count: 1, gravity: 220 },
  ice: { shape: 'shard', speed: 1, size: 1, count: 1, gravity: 180 },
  lightning: { shape: 'jag', speed: 1.35, size: 1, count: 1, gravity: 0 },
  flame: { shape: 'flame', speed: 0.95, size: 1.1, count: 0.8, gravity: -260 },
  rainbow: {
    shape: 'band',
    speed: 1,
    size: 1,
    count: 1,
    gravity: 120,
    palette: [
      COLOUR.grannyPink,
      COLOUR.heatOrange,
      COLOUR.sunnyGold,
      COLOUR.mintGreen,
      COLOUR.waterBlue,
    ],
  },
  tornado: { shape: 'drop', speed: 1.2, size: 0.9, count: 1, gravity: 60 },
  dragon: { shape: 'flame', speed: 1.1, size: 1.2, count: 0.55, gravity: -320 },
  trident: { shape: 'drop', speed: 1.15, size: 1.05, count: 1, gravity: 200 },
  laser: { shape: 'star', speed: 1.05, size: 1.1, count: 1, gravity: 0 },
  mega: { shape: 'drop', speed: 1.25, size: 1.35, count: 0.8, gravity: 200 },
};

/** How many flying bits and speed lines each rarity throws. */
export const MUZZLE_COUNTS: Readonly<Record<GunRarity, { bits: number; lines: number }>> = {
  common: { bits: 18, lines: 9 },
  rare: { bits: 26, lines: 11 },
  epic: { bits: 36, lines: 14 },
  legendary: { bits: 48, lines: 18 },
};

/** The burst's clock (ms from the shot). Everything is gone by `MUZZLE_END_MS`. */
export const BLOOM_MS = 230;
export const RING_MS = 460;
export const FLARE_MS = 200;
export const LINE_MS = 440;
export const BIT_MS = 580;
export const MUZZLE_END_MS = 640;
/** Bits and lines launch over this many ms, so it is a spray and not a single puff. */
export const LAUNCH_SPREAD_MS = 160;

/** Sizes (screen px at the 1280 wide layout). */
export const CHARGE_RADIUS_FROM = 8;
export const CHARGE_RADIUS_TO = 118;
export const CHARGE_SPARKS = 7;
export const CHARGE_SPARK_FAR = 210;
export const CHARGE_SPARK_NEAR = 44;
export const BLOOM_CORE_RADIUS = 92;
export const BLOOM_HALO_RADIUS = 270;
export const FLARE_LENGTH = 900;
export const FLARE_THICKNESS = 30;
export const RING_FROM = 22;
export const RING_TO = 380;
export const RING_WIDTH = 11;
/** Speed lines: how far they run (px), how long they are, their width, and the fan's half-angle (radians). */
export const LINE_RUN_PX = 1500;
export const LINE_LENGTH_PX = 280;
export const LINE_WIDTH_PX = 10;
export const FAN_HALF_ANGLE = 0.62;
/** Bits: how far they run (px), their size (px) and spin. */
export const BIT_RUN_PX = 900;
export const BIT_SIZE_PX = 26;
