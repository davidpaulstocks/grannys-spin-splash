/**
 * Free aim with a soft snap (pure, no Phaser). The aim point is the pointer
 * unless it is inside an instrument's capture radius, where it snaps to that
 * instrument's centre. See `AIM_CAPTURE_SCALE` in config.ts for the reason.
 */

import type { AimResult, AimTarget } from '../types/input';
import { distance } from './math';

/** An instrument as the aim sees it: centre and body radius. */
export interface SoftAimTarget extends AimTarget {
  readonly r: number;
}

/** How wide an instrument's grab is: the larger of radius x scale and radius + extra. */
export function captureRadius(r: number, scale: number, extra: number): number {
  return Math.max(r * scale, r + extra);
}

/**
 * Resolves pointer + instruments to a snapped instrument or the free point.
 * `currentId` is the previous snap: it is kept until the pointer is `margin`
 * beyond its capture radius, and when two captures overlap the nearer centre
 * wins, with the current one kept unless another is nearer by more than
 * `margin`.
 */
export function resolveSoftAim(
  pointer: { readonly x: number; readonly y: number },
  targets: readonly SoftAimTarget[],
  currentId: number | null,
  scale: number,
  extra: number,
  margin: number,
): AimResult {
  let nearest: SoftAimTarget | null = null;
  let nearestDist = Infinity;
  let current: SoftAimTarget | null = null;
  let currentDist = Infinity;
  for (const t of targets) {
    const d = distance(pointer.x, pointer.y, t.x, t.y);
    const cap = captureRadius(t.r, scale, extra);
    if (d <= cap && d < nearestDist) {
      nearest = t;
      nearestDist = d;
    }
    if (t.id === currentId && d <= cap + margin) {
      current = t;
      currentDist = d;
    }
  }
  const chosen = current && currentDist <= nearestDist + margin ? current : nearest;
  return chosen
    ? { x: chosen.x, y: chosen.y, target: chosen, snapped: true }
    : { x: pointer.x, y: pointer.y, target: null, snapped: false };
}
