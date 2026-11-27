/** How much a thief takes on one tick: a share of the gig's third star target, never less than a floor. */

import { THIEF } from './visitorTuning.data';

/** Coins stolen per tick in a gig whose three-star target is `thirdStarTarget`. */
export function stealPerTick(thirdStarTarget: number): number {
  return Math.max(THIEF.minPerTick, Math.round(thirdStarTarget * THIEF.starShare));
}
