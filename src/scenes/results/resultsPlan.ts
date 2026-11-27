/**
 * What the results screen's one main button says and where it goes — pure, so
 * every case is unit-tested. The aim is to steer the player to a gig that
 * still has stars to win rather than replaying one that is finished.
 *
 *  - After a miss: TRY AGAIN, the same gig; unless that gig already has all
 *    three stars and another has stars to win, when it points there instead.
 *  - After a pass, when the next gig up the ladder is unplayed (or the next
 *    venue is the way on): NEXT GIG, as before.
 *  - After a replay, when the recommended gig is a different one: "GIG 5",
 *    with a line above saying how many stars are still to win there.
 *  - When this gig is itself the one with stars left: TRY AGAIN, same line.
 *  - When the whole venue has three stars everywhere: PLAY AGAIN.
 */

import { MAX_STARS_PER_GIG, type TourStop } from '../../systems/Progress';
import { starsStillLine } from '../../ui/gigLines';

export interface MainPlanInput {
  readonly passed: boolean;
  /** The gig just played. */
  readonly here: TourStop;
  /** Where the ladder leads after a pass (`nextStop`), or null. */
  readonly onward: TourStop | null;
  /** Best stars on each gig of the venue, now that this play is banked. */
  readonly stars: readonly number[];
  /** `recommendedGig` for the venue now, or null when it is complete. */
  readonly recommended: number | null;
  /** "The Marimba joins!" for the onward gig, or null. */
  readonly joins: string | null;
}

export interface MainPlan {
  readonly label: string;
  readonly target: TourStop;
  /** The line above the button (who joins, or the stars still to win), or null. */
  readonly line: string | null;
  /** Whether the small Retry icon is offered beside the main button (not when the main button already retries). */
  readonly showRetry: boolean;
}

/** The label, destination and line for the results screen's main button. */
export function planMain(input: MainPlanInput): MainPlan {
  const { here, onward, stars, recommended } = input;
  if (!input.passed) {
    const nothingToWinHere = (stars[here.gig] ?? 0) >= MAX_STARS_PER_GIG;
    if (nothingToWinHere && recommended !== null && recommended !== here.gig) {
      return {
        label: `GIG ${recommended + 1}`,
        target: { venueId: here.venueId, gig: recommended },
        line: starsStillLine(recommended, stars[recommended] ?? 0),
        showRetry: true,
      };
    }
    return { label: 'TRY AGAIN', target: here, line: null, showRetry: false };
  }

  const otherVenue = onward !== null && onward.venueId !== here.venueId;
  if (onward && (otherVenue || (stars[onward.gig] ?? 0) === 0)) {
    return { label: 'NEXT GIG', target: onward, line: input.joins, showRetry: true };
  }
  if (recommended !== null && recommended !== here.gig) {
    return {
      label: `GIG ${recommended + 1}`,
      target: { venueId: here.venueId, gig: recommended },
      line: starsStillLine(recommended, stars[recommended] ?? 0),
      showRetry: true,
    };
  }
  if (recommended === here.gig) {
    return {
      label: 'TRY AGAIN',
      target: here,
      line: starsStillLine(here.gig, stars[here.gig] ?? 0),
      showRetry: false,
    };
  }
  return { label: 'PLAY AGAIN', target: here, line: null, showRetry: false };
}
