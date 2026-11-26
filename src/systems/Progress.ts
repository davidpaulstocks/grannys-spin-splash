/**
 * The player's progress on the tour — docs/ENGAGEMENT_DESIGN.md §3–4. Pure
 * functions over `SaveData`, so the rules for stars, passing a gig and
 * opening a venue can be unit-tested without a scene or storage.
 *
 * Stars are the rating: never spent, and their total opens venues. Coins are
 * the one currency (the save's `vault`).
 */

import { GIGS_PER_VENUE } from '../entities/world/gigs.data';
import type { WorldDef } from '../entities/world/world.types';
import type { SaveData } from '../types/save';

export const MAX_STARS_PER_GIG = 3;
/** Coins paid the first time each star is earned on a gig — replaying for a better rating always pays. */
export const COINS_PER_NEW_STAR = 200;

/** Best stars on each of a venue's gigs, always `GIGS_PER_VENUE` long. */
export function venueStars(save: SaveData, venueId: string): readonly number[] {
  const stored = save.gigStars[venueId] ?? [];
  return Array.from({ length: GIGS_PER_VENUE }, (_, i) => stored[i] ?? 0);
}

/** Stars held in one venue, 0 to `GIGS_PER_VENUE * MAX_STARS_PER_GIG` — the "n / 24" on a venue tile. */
export function venueStarTotal(save: SaveData, venueId: string): number {
  return venueStars(save, venueId).reduce((sum, stars) => sum + stars, 0);
}

/** Best coin total on each of a venue's gigs, always `GIGS_PER_VENUE` long; 0 where never played. */
export function venueBests(save: SaveData, venueId: string): readonly number[] {
  const stored = save.gigBest[venueId] ?? [];
  return Array.from({ length: GIGS_PER_VENUE }, (_, i) => stored[i] ?? 0);
}

export function totalStars(save: SaveData): number {
  return Object.values(save.gigStars)
    .flat()
    .reduce((sum, stars) => sum + stars, 0);
}

export function isVenueOpen(save: SaveData, venue: WorldDef): boolean {
  return totalStars(save) >= venue.starsToOpen;
}

/** How many more stars a venue needs before it opens; 0 once it is open. */
export function starsToGo(save: SaveData, venue: WorldDef): number {
  return Math.max(0, venue.starsToOpen - totalStars(save));
}

/** A gig can be played once the one before it has been passed (one star or more). */
export function isGigOpen(save: SaveData, venueId: string, gig: number): boolean {
  return gig <= 0 || (venueStars(save, venueId)[gig - 1] ?? 0) > 0;
}

/** The gig PLAY should start: the first one not yet passed, or the Grand Concert once all are. */
export function currentGig(save: SaveData, venueId: string): number {
  const unpassed = venueStars(save, venueId).findIndex((stars) => stars === 0);
  return unpassed === -1 ? GIGS_PER_VENUE - 1 : unpassed;
}

export interface GigResult {
  readonly save: SaveData;
  /** Stars earned on this gig for the first time, 0–3. */
  readonly newStars: number;
  /** Coins those new stars paid. Already added to the returned save's vault. */
  readonly starCoins: number;
  /** This gig's best coin total before this play, 0 if never played. */
  readonly previousBest: number;
  /** True when this play beat `previousBest`. */
  readonly isNewBest: boolean;
}

/** Banks a finished gig: keeps the best rating, pays for any newly earned stars, and adds the gig's coins. */
export function recordGig(
  save: SaveData,
  venueId: string,
  gig: number,
  stars: number,
  coinsEarned: number,
): GigResult {
  const best = venueStars(save, venueId);
  const earned = Math.min(MAX_STARS_PER_GIG, Math.max(0, Math.floor(stars)));
  const previous = best[gig] ?? 0;
  const newStars = Math.max(0, earned - previous);
  const starCoins = newStars * COINS_PER_NEW_STAR;
  const updated = best.map((value, i) => (i === gig ? Math.max(value, earned) : value));
  const bests = venueBests(save, venueId);
  const previousBest = bests[gig] ?? 0;
  const score = Math.max(0, Math.floor(coinsEarned));
  const isNewBest = score > previousBest;
  return {
    save: {
      ...save,
      vault: save.vault + Math.max(0, coinsEarned) + starCoins,
      gigStars: { ...save.gigStars, [venueId]: updated },
      gigBest: {
        ...save.gigBest,
        [venueId]: bests.map((value, i) => (i === gig ? Math.max(value, score) : value)),
      },
    },
    newStars,
    starCoins,
    previousBest,
    isNewBest,
  };
}

export interface TourStop {
  readonly venueId: string;
  readonly gig: number;
}

/**
 * Where NEXT goes after a passed gig: the next gig on the ladder, or — after
 * a venue's Grand Concert — the next venue, if its stars have been earned.
 * Null when there is nowhere new to go yet.
 */
export function nextStop(
  save: SaveData,
  venues: readonly WorldDef[],
  venueId: string,
  gig: number,
): TourStop | null {
  if (gig + 1 < GIGS_PER_VENUE) return { venueId, gig: gig + 1 };
  const next = venues[venues.findIndex((venue) => venue.id === venueId) + 1];
  if (!next || !isVenueOpen(save, next)) return null;
  return { venueId: next.id, gig: currentGig(save, next.id) };
}

/** The next venue still locked, and how many more stars it needs — for "3 more stars to open the Workshop". */
export function nextLockedVenue(
  save: SaveData,
  venues: readonly WorldDef[],
): { readonly venue: WorldDef; readonly starsNeeded: number } | null {
  const have = totalStars(save);
  const locked = venues.find((venue) => venue.starsToOpen > have);
  return locked ? { venue: locked, starsNeeded: locked.starsToOpen - have } : null;
}

/**
 * The venue that the stars just earned opened, if any: the lowest venue whose
 * requirement was out of reach before `newStars` and is met now. `save` must
 * already include those stars.
 */
export function venueJustOpened(
  save: SaveData,
  venues: readonly WorldDef[],
  newStars: number,
): WorldDef | null {
  if (newStars <= 0) return null;
  const now = totalStars(save);
  const before = now - newStars;
  return venues.find((venue) => venue.starsToOpen > before && venue.starsToOpen <= now) ?? null;
}

/**
 * Where PLAY on the home screen goes: the first gig not yet passed in the
 * first open venue that has one. Once everything open is passed, the last
 * open venue's Grand Concert — there is always somewhere to play.
 */
export function frontier(save: SaveData, venues: readonly WorldDef[]): TourStop {
  const open = venues.filter((venue) => isVenueOpen(save, venue));
  for (const venue of open) {
    const gig = venueStars(save, venue.id).findIndex((stars) => stars === 0);
    if (gig !== -1) return { venueId: venue.id, gig };
  }
  const last = open[open.length - 1] ?? venues[0];
  return { venueId: last?.id ?? '', gig: GIGS_PER_VENUE - 1 };
}
