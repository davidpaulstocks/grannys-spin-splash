/**
 * Where the one big message on the wall is, so the small texts that pop up
 * near their own source ("+12" over an instrument, a visitor's "Shoo!") can
 * keep out of its way (2026-11-27: at the end of a gig words overprinted the
 * Frenzy banner and the finish). The stage (`scenes/game/BigMessageStage.ts`)
 * sets the box while a message is up and clears it after; this module only
 * holds it and does the geometry, with no Phaser dependency.
 */

/** A rectangle in logical px. */
export interface Box {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** Gap kept between a small text and the stage message, px. */
export const STAGE_AVOID_MARGIN = 12;
/** A small text that had to move is drawn this much smaller. */
export const STAGE_AVOID_SHRINK = 0.8;

let _bounds: Box | null = null;

/** The stage calls this when a message goes up (its box) and when the stage empties (null). */
export function setStageBounds(box: Box | null): void {
  _bounds = box;
}

/** The big message's box right now, or null when the stage is empty. */
export function getStageBounds(): Box | null {
  return _bounds;
}

/** True when two boxes overlap, with `margin` px of breathing room added to `b`. */
export function boxesOverlap(a: Box, b: Box, margin = 0): boolean {
  return (
    a.left < b.right + margin &&
    a.right > b.left - margin &&
    a.top < b.bottom + margin &&
    a.bottom > b.top - margin
  );
}

/** Where a small text should start: the same place, or moved clear of the stage box. */
export interface Placement {
  readonly y: number;
  readonly moved: boolean;
}

/**
 * A text centred on (x, y) with half-size (halfW, halfH) that will rise `rise`
 * px. If its path overlaps `stage`, it is moved straight up above the box (or
 * below it when there is no room above), the shorter hop of the two; x is
 * never changed, so it stays over its source.
 */
export function placeClearOfStage(
  x: number,
  y: number,
  halfW: number,
  halfH: number,
  rise: number,
  stage: Box | null,
  screenTop = 0,
): Placement {
  if (!stage) return { y, moved: false };
  const path: Box = { left: x - halfW, right: x + halfW, top: y - rise - halfH, bottom: y + halfH };
  if (!boxesOverlap(path, stage, STAGE_AVOID_MARGIN)) return { y, moved: false };
  const above = stage.top - STAGE_AVOID_MARGIN - halfH;
  const below = stage.bottom + STAGE_AVOID_MARGIN + halfH + rise;
  const aboveFits = above - rise - halfH >= screenTop;
  const pickAbove = aboveFits && (Math.abs(above - y) <= Math.abs(below - y) || y < stage.top);
  return { y: pickAbove ? above : below, moved: true };
}
