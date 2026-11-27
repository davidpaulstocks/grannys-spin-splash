/**
 * The rules of Jam, pure: which gig's wall a venue's Jam plays on, how gentle
 * its wind-down is, and which gun the gun button picks next. Jam is the toy
 * with the pressure off, so the wall is the venue's whole band exactly as the
 * Grand Concert lays it out, but the instruments let go more slowly.
 */

import { GUN_DEFS } from '../../entities/gun/gun.data';
import type { GunDef } from '../../entities/gun/gun.types';
import { GIGS_PER_VENUE, gigFor, type GigDef } from '../../entities/world/gigs.data';
import type { WorldDef } from '../../entities/world/world.types';

/** Jam's instruments wind down at this share of the last gig's rate (about half). */
export const JAM_DECAY_FACTOR = 0.5;
/** And hold full speed this many times as long (about twice). */
export const JAM_HOLD_FACTOR = 2;
/** How far through "the round" the music sits all through a jam: past the quiet opening, short of the finale. */
export const JAM_ROUND_PROGRESS = 0.5;

/** The wall a venue's Jam is played on: the last gig's band, feature spinner included, with a gentler wind-down. */
export function jamGig(world: WorldDef): GigDef {
  const last = gigFor(world, GIGS_PER_VENUE - 1);
  return {
    ...last,
    decayScale: last.decayScale * JAM_DECAY_FACTOR,
    holdMs: last.holdMs * JAM_HOLD_FACTOR,
  };
}

/** The guns the player owns, in the order of the gun ladder, ready for the gun button to cycle through. */
export function ownedGunCycle(ownedIds: readonly string[]): readonly GunDef[] {
  return GUN_DEFS.filter((gun) => ownedIds.includes(gun.id)).sort((a, b) => a.order - b.order);
}

/**
 * The gun after `currentId` in the cycle, wrapping round to the first. With
 * one gun, or one the cycle does not hold, it answers the first (or the only)
 * one; with none it answers null.
 */
export function nextGun(cycle: readonly GunDef[], currentId: string): GunDef | null {
  if (cycle.length === 0) return null;
  const at = cycle.findIndex((gun) => gun.id === currentId);
  return cycle[(at + 1) % cycle.length] ?? null;
}
