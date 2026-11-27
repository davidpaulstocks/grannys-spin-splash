/** The cases the balance bot plays: the first-pass gun at each gig (`FIRST_PASS_GUNS`), and the gun two rungs above it. */

import { GUN_LADDER } from '../entities/gun/gun.data';
import { FIRST_PASS_GUNS } from '../entities/world/gigs.data';
import type { BatchCase } from './botTypes';

/** How many rungs up the ladder the "better gun" comparison goes. */
const BETTER_GUN_RUNGS = 2;

/** The gun `BETTER_GUN_RUNGS` above `gunId` on the ladder. */
export function betterGun(gunId: string): string {
  const at = GUN_LADDER.findIndex((g) => g.id === gunId);
  return GUN_LADDER[Math.min(GUN_LADDER.length - 1, at + BETTER_GUN_RUNGS)]?.id ?? gunId;
}

/** Child, keen and expert with the expected gun, then keen with the better one, for each gig asked for. */
export function casesFor(venue: string, gigs: readonly number[]): BatchCase[] {
  return gigs.flatMap((gig) => {
    const gun = FIRST_PASS_GUNS[venue]?.[gig] ?? 'pistol';
    return [
      { venue, gig, gun, profile: 'child' as const },
      { venue, gig, gun, profile: 'keen' as const },
      { venue, gig, gun, profile: 'expert' as const },
      { venue, gig, gun: betterGun(gun), profile: 'keen' as const },
    ];
  });
}
