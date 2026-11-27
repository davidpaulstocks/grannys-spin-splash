/**
 * Which venues Home's strip shows, and where. The strip holds up to five
 * tiles at once; with more venues than that it pages, and the selected venue
 * is always in view. Pure maths, no Phaser, so it is unit-tested.
 */

/** Tiles on show at once. */
export const STRIP_PAGE_SIZE = 5;

/** The first visible venue for a strip of `count` venues when `selected` must be in view, keeping the current `first` if it already is. */
export function firstInView(count: number, selected: number, first: number): number {
  const last = Math.max(0, count - STRIP_PAGE_SIZE);
  const kept = Math.min(last, Math.max(0, first));
  if (selected >= kept && selected < kept + STRIP_PAGE_SIZE) return kept;
  // Land the selected venue in the middle slot where there is room either side.
  const middle = Math.floor(STRIP_PAGE_SIZE / 2);
  return Math.min(last, Math.max(0, selected - middle));
}

/** The first visible venue after paging one screenful left (-1) or right (+1), clamped so the last page still shows five. */
export function firstAfterPaging(count: number, first: number, direction: -1 | 1): number {
  const last = Math.max(0, count - STRIP_PAGE_SIZE);
  return Math.min(last, Math.max(0, first + direction * STRIP_PAGE_SIZE));
}

/** How many tiles are on show for `count` venues. */
export function visibleCount(count: number): number {
  return Math.min(count, STRIP_PAGE_SIZE);
}

/** Whether the strip needs its arrows. */
export function needsPaging(count: number): boolean {
  return count > STRIP_PAGE_SIZE;
}

/** Horizontal centre of slot `slot` (0-based, left to right) when `shown` tiles are centred on `centreX`. */
export function slotCentreX(centreX: number, slot: number, shown: number, pitch: number): number {
  return centreX + (slot - (shown - 1) / 2) * pitch;
}
