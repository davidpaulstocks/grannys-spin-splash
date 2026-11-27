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

/** The rectangle the aim may live in: the band's footprint, in logical px. */
export interface AimBox {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/**
 * The band's bounding box: every instrument's centre, grown outward by
 * `grow` x its own radius (so a pointer pushed past the top row still lands
 * just inside that row's body). Null when there is nothing to aim at.
 */
export function aimBox(targets: readonly SoftAimTarget[], grow: number): AimBox | null {
  if (targets.length === 0) return null;
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const t of targets) {
    const pad = t.r * grow;
    left = Math.min(left, t.x - pad);
    top = Math.min(top, t.y - pad);
    right = Math.max(right, t.x + pad);
    bottom = Math.max(bottom, t.y + pad);
  }
  return { left, top, right, bottom };
}

/** The point pulled into `box` (a point already inside is returned unchanged). */
export function clampToBox(
  point: { readonly x: number; readonly y: number },
  box: AimBox | null,
): { x: number; y: number } {
  if (!box) return { x: point.x, y: point.y };
  return {
    x: Math.min(box.right, Math.max(box.left, point.x)),
    y: Math.min(box.bottom, Math.max(box.top, point.y)),
  };
}
