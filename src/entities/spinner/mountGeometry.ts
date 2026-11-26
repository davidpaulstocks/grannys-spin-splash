/**
 * The pure maths of a spinner's painted instrument — how big it draws, how it
 * lies when asleep, how it bounces on a note. No Phaser, so it is unit-tested.
 */

import { INSTRUMENT_MOUNT } from './spinner.data';

/** The side of the instrument picture, and the radius of the disc behind it, for a spinner of radius `r`. */
export function mountSizes(r: number): { picture: number; disc: number } {
  return { picture: r * INSTRUMENT_MOUNT.pictureFactor, disc: r * INSTRUMENT_MOUNT.discFactor };
}

/** Rotation in degrees: slumped to `side` (+1 or -1) while asleep, upright when awake. */
export function mountTilt(asleep: boolean, side: 1 | -1): number {
  return asleep ? side * INSTRUMENT_MOUNT.sleepTiltDegrees : 0;
}

/** Scale multiplier and upward lift (px) of the picture for a pulse of 0-1 on a spinner of radius `r`. */
export function mountBounce(pulse: number, r: number): { scale: number; lift: number } {
  const p = Math.max(0, Math.min(1, pulse));
  return { scale: 1 + p * INSTRUMENT_MOUNT.pulseScale, lift: p * r * INSTRUMENT_MOUNT.pulseLift };
}

/** Tint colour (0xRRGGBB, grey) that dims a picture: full white when awake. */
export function mountTint(asleep: boolean): number {
  const level = Math.round(255 * (asleep ? INSTRUMENT_MOUNT.sleepBrightness : 1));
  return (level << 16) | (level << 8) | level;
}
