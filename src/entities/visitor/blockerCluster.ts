/**
 * Where a blocker parks: a cluster of two or three neighbouring instruments,
 * seeded on one that is spinning if any is. Pure geometry over whatever the
 * caller hands in (the director passes instruments), so it can be tested
 * without a scene.
 */

import { BLOCKER } from './visitorTuning.data';

/** One instrument a blocker could cover. */
export interface ClusterCandidate {
  readonly x: number;
  readonly y: number;
  /** Its radius on screen, px. */
  readonly r: number;
  /** True if it is playing now — a blocker prefers to land on one that is. */
  readonly spinning: boolean;
}

/** The instruments chosen, and the circle that holds them all. */
export interface Cluster<T extends ClusterCandidate> {
  readonly members: readonly T[];
  readonly x: number;
  readonly y: number;
  readonly radius: number;
}

/**
 * Picks a seed (a spinning one when there is one), then its nearest
 * neighbours up to a random 2–3 in all, preferring ones within reach.
 * Returns null when there is nothing to cover.
 */
export function pickCluster<T extends ClusterCandidate>(
  candidates: readonly T[],
  random: () => number,
): Cluster<T> | null {
  if (candidates.length === 0) return null;
  const spinning = candidates.filter((c) => c.spinning);
  const pool = spinning.length > 0 ? spinning : candidates;
  const seed = pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
  if (!seed) return null;
  const { min, max } = BLOCKER.clusterSize;
  const size = Math.min(candidates.length, min + Math.floor(random() * (max - min + 1)));
  const reach = BLOCKER.neighbourReachRadii * seed.r;
  const near = candidates
    .filter((c) => c !== seed)
    .map((c) => ({ c, d: Math.hypot(c.x - seed.x, c.y - seed.y) }))
    .sort((a, b) => a.d - b.d);
  const inReach = near.filter((n) => n.d <= reach).length;
  // Cover at least a pair even when the seed is stranded; past that, only neighbours in reach.
  const take = Math.max(Math.min(inReach, size - 1), Math.min(near.length, min - 1));
  const members: T[] = [seed, ...near.slice(0, take).map((n) => n.c)];
  return enclose(members);
}

/** The smallest circle about the members' centroid that holds every one of them whole. */
export function enclose<T extends ClusterCandidate>(members: readonly T[]): Cluster<T> {
  const n = Math.max(1, members.length);
  const x = members.reduce((sum, m) => sum + m.x, 0) / n;
  const y = members.reduce((sum, m) => sum + m.y, 0) / n;
  const radius = members.reduce((far, m) => Math.max(far, Math.hypot(m.x - x, m.y - y) + m.r), 0);
  return { members, x, y, radius };
}
