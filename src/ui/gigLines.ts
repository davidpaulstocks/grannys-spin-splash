/**
 * Short words about one gig's stars — pure, so the sums and plurals are tested.
 */

import { GIGS_PER_VENUE } from '../entities/world/gigs.data';
import { MAX_STARS_PER_GIG } from '../systems/Progress';

/** "Gig 3 of 8", or "The Grand Concert" for the last gig. Zero-based `gig`. */
export function gigTitle(gig: number): string {
  return gig === GIGS_PER_VENUE - 1 ? 'The Grand Concert' : `Gig ${gig + 1} of ${GIGS_PER_VENUE}`;
}

/** "2 stars to win", "1 star to win", or "all 3 stars" once the gig is done. */
export function starsToWinLine(best: number): string {
  const left = Math.max(0, MAX_STARS_PER_GIG - best);
  if (left === 0) return `all ${MAX_STARS_PER_GIG} stars`;
  return `${left} ${left === 1 ? 'star' : 'stars'} to win`;
}

/** The line above the main results button when it leads to a gig with stars to win: "2 stars still to win in gig 5". Zero-based `gig`. */
export function starsStillLine(gig: number, best: number): string {
  const left = Math.max(1, MAX_STARS_PER_GIG - best);
  return `${left} ${left === 1 ? 'star' : 'stars'} still to win in gig ${gig + 1}`;
}
