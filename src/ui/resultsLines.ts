/**
 * The words on the score panel's bottom line — pure, so the sums are tested.
 * Kind and warm: a miss is "Almost!", never a failure.
 */

import { MAX_STARS_PER_GIG } from '../systems/Progress';
import type { GigResultData } from '../types/sceneData';

/** Coins still needed to reach the next star's target, at least 1. */
export function coinsToNextStar(data: Pick<GigResultData, 'stars' | 'score' | 'targets'>): number {
  return Math.max(1, (data.targets[data.stars] ?? 0) - data.score);
}

/**
 * What the next star needs, as a count and a line: "400 more coins for your
 * first star" after a miss, "400 more for 2 stars" after a pass, null when
 * all three are won.
 */
export function nextStarLine(
  data: Pick<GigResultData, 'stars' | 'score' | 'targets'>,
  format: (n: number) => string,
): string | null {
  if (data.stars >= MAX_STARS_PER_GIG) return null;
  const missing = format(coinsToNextStar(data));
  if (data.stars === 0) return `${missing} more coins for your first star`;
  return `${missing} more for ${data.stars + 1} stars`;
}
