/** distance, clamp, lerp, and the auto-aim snap resolver (CLAUDE.md §6.4). */

import type { AimResult, AimTarget } from '../types/input';

export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * The corner radius for a fully-rounded "pill" shape (CLAUDE.md §5.4:
 * "999px (pill) for chips/CTAs"). That 999 is a CSS `border-radius`
 * convention — browsers silently clamp it to `min(width,height)/2`.
 * Phaser's `Graphics.fillRoundedRect`/`strokeRoundedRect` do NOT clamp:
 * passing a literal 999 on a small box builds a degenerate, wildly
 * oversized arc path that's pathologically expensive to fill — confirmed
 * live (Sprint 2): it took a single 96×56 button from a ~2ms render to
 * ~250ms. Always compute the radius through this function instead.
 */
export function pillRadius(width: number, height: number): number {
  return Math.min(width, height) / 2;
}

/**
 * Snaps a raw pointer/touch position to the nearest spinner within
 * `snapRadius`, so every shot lands even with a sloppy aim (CLAUDE.md §6.4).
 */
export function resolveAim(
  rawX: number,
  rawY: number,
  targets: readonly AimTarget[],
  snapRadius: number,
): AimResult {
  let nearest: AimTarget | null = null;
  let nearestDist = snapRadius;
  for (const t of targets) {
    const d = distance(rawX, rawY, t.x, t.y);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = t;
    }
  }
  return nearest
    ? { x: nearest.x, y: nearest.y, target: nearest, snapped: true }
    : { x: rawX, y: rawY, target: null, snapped: false };
}
