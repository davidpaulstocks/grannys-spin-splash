/**
 * Where the eight gig buttons sit on the results screen's tour path card.
 * Pure numbers (no Phaser): `scenes/results/resultsLayout.ts` and its test
 * use them to prove the row, the next-venue tile and the card's edges clear
 * one another. Offsets are from the card's centre.
 */

import { GIGS_PER_VENUE } from '../entities/world/gigs.data';

export const TOUR_PATH_WIDTH = 760;
export const TOUR_PATH_HEIGHT = 104;

/** A finger-sized gig: 56 across, 12 between (the brief asked for 56 and 8 at least). */
export const PATH_GIG_DIAMETER = 56;
export const PATH_GIG_GAP = 12;
export const PATH_GIG_PITCH = PATH_GIG_DIAMETER + PATH_GIG_GAP;
/** The disc's centre above the card's: leaves room for the pointer over it and the stars under it. */
export const PATH_GIG_Y = -6;
/** Space between the card's left edge and the first disc. */
export const PATH_SIDE_MARGIN = 16;

/** The next-venue tile at the right (NextVenueTile's face is 130 wide; keep this in step with it). */
export const PATH_TILE_X = 299;
export const PATH_TILE_WIDTH = 130;
export const PATH_TILE_FACE_Y = -2;
/** Clear air kept between the last gig's ring and the tile. */
export const PATH_TILE_CLEARANCE = 16;

/** The centre x of gig `index`: left-aligned beside the tile, or centred when there is no tile. */
export function pathGigX(index: number, withTile: boolean): number {
  const span = (GIGS_PER_VENUE - 1) * PATH_GIG_PITCH;
  const first = withTile
    ? -TOUR_PATH_WIDTH / 2 + PATH_SIDE_MARGIN + PATH_GIG_DIAMETER / 2
    : -span / 2;
  return first + index * PATH_GIG_PITCH;
}
