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

/**
 * Magnetic aim (2026-11-26): the water always goes to a musician. The target
 * is the spinner nearest the pointer with no distance limit, so there are no
 * dead zones between spinners. To stop the choice flickering along the
 * boundary between two spinners, the current target is kept unless another
 * is nearer by more than `margin`. With no targets the raw point comes back
 * unsnapped.
 */
export function resolveMagneticAim(
  pointer: { readonly x: number; readonly y: number },
  targets: readonly AimTarget[],
  currentTargetId: number | null,
  margin: number,
): AimResult {
  let nearest: AimTarget | null = null;
  let nearestDist = Infinity;
  let current: AimTarget | null = null;
  let currentDist = Infinity;
  for (const t of targets) {
    const d = distance(pointer.x, pointer.y, t.x, t.y);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = t;
    }
    if (t.id === currentTargetId) {
      current = t;
      currentDist = d;
    }
  }
  const chosen = current && currentDist <= nearestDist + margin ? current : nearest;
  return chosen
    ? { x: chosen.x, y: chosen.y, target: chosen, snapped: true }
    : { x: pointer.x, y: pointer.y, target: null, snapped: false };
}

/**
 * Pushes `point` away from `pivot` by `gain` (1 = unchanged) and clamps the
 * result to the rectangle `0..width` by `0..height` — the mouse reach assist.
 */
export function scaleAboutPivot(
  point: { readonly x: number; readonly y: number },
  pivot: { readonly x: number; readonly y: number },
  gain: number,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: clamp(pivot.x + (point.x - pivot.x) * gain, 0, width),
    y: clamp(pivot.y + (point.y - pivot.y) * gain, 0, height),
  };
}
