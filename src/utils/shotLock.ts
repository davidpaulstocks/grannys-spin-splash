/**
 * What a shot is allowed to hit, decided when it is fired (pure, no Phaser).
 *
 * Water flies from Granny at the bottom centre toward the aim point and is
 * absorbed by the first instrument it touches. A blocker parked between two
 * rows, a thief's host or a treat behind the front row can sit right on the
 * line to a nearer instrument, so a shot aimed at it would be spent on that
 * instrument and never arrive. A shot locked onto a visitor therefore flies
 * over every instrument and is tested only against visitors; a shot locked
 * onto an instrument is tested only against that instrument (it was already
 * so: see `WaterParticle.getCandidates`).
 *
 * A free shot (2026-11-27 free aim: the pointer is outside every capture
 * radius) flies to the pointer and may only hit an instrument whose body
 * contains that aim point, so it is never eaten by one merely on the way.
 */

import { distance } from './math';

/** Hit-test ring: a shot registers within a spinner's radius plus this of its centre, px. */
export const SPINNER_HIT_RING_PADDING = 8;

/** Where a visitor can be aimed at, and how generous the target is. */
export interface LockPoint {
  readonly x: number;
  readonly y: number;
  readonly aimRadius: number;
}

/** What a shot is locked onto when it leaves the gun. */
export type ShotLock = 'visitor' | 'spinner' | 'free';

/**
 * The nearest visitor whose aim ring contains the aim point, or null.
 * `margin` widens every ring (the same generosity the pickups get).
 */
export function pickVisitorLock<T extends LockPoint>(
  aimX: number,
  aimY: number,
  visitors: readonly T[],
  margin: number,
): T | null {
  let best: T | null = null;
  let bestD = Infinity;
  for (const v of visitors) {
    const d = distance(aimX, aimY, v.x, v.y);
    if (d < v.aimRadius + margin && d < bestD) {
      best = v;
      bestD = d;
    }
  }
  return best;
}

/** How a shot should behave: over the wall to a visitor, onto one instrument, or loose. */
export function resolveShotLock(onVisitor: boolean, hasSpinnerTarget: boolean): ShotLock {
  if (onVisitor) return 'visitor';
  return hasSpinnerTarget ? 'spinner' : 'free';
}

/**
 * The instruments a shot of this kind may hit: none for a visitor lock, its
 * target for a spinner lock, and for a free shot only those whose body
 * (`bodyRadius` plus the hit-ring padding) contains the aim point.
 */
export function spinnersForShot<S extends { readonly x: number; readonly y: number }>(
  lock: ShotLock,
  target: S | null,
  all: readonly S[],
  aim: { readonly x: number; readonly y: number },
  bodyRadius: (s: S) => number,
): readonly S[] {
  if (lock === 'visitor') return [];
  if (lock === 'spinner' && target) return [target];
  return all.filter(
    (s) => distance(aim.x, aim.y, s.x, s.y) < bodyRadius(s) + SPINNER_HIT_RING_PADDING,
  );
}
