import { describe, expect, it } from 'vitest';

import {
  firstAfterPaging,
  firstInView,
  needsPaging,
  slotCentreX,
  STRIP_PAGE_SIZE,
  visibleCount,
} from '../../src/ui/venueStripPaging';

describe('the venue strip paging', () => {
  it('needs no arrows for five venues or fewer', () => {
    expect(needsPaging(5)).toBe(false);
    expect(needsPaging(6)).toBe(true);
    expect(visibleCount(3)).toBe(3);
    expect(visibleCount(10)).toBe(STRIP_PAGE_SIZE);
  });

  it.each([5, 6, 8, 10])('keeps the selected venue in view among %i', (count) => {
    for (let selected = 0; selected < count; selected++) {
      for (let first = 0; first <= Math.max(0, count - STRIP_PAGE_SIZE); first++) {
        const next = firstInView(count, selected, first);
        expect(selected).toBeGreaterThanOrEqual(next);
        expect(selected).toBeLessThan(next + STRIP_PAGE_SIZE);
        expect(next).toBeGreaterThanOrEqual(0);
        expect(next).toBeLessThanOrEqual(Math.max(0, count - STRIP_PAGE_SIZE));
      }
    }
  });

  it('leaves the page alone when the selected venue is already on it', () => {
    expect(firstInView(10, 4, 2)).toBe(2);
  });

  it('pages a screenful at a time and stops at both ends with five on show', () => {
    expect(firstAfterPaging(10, 0, 1)).toBe(5);
    expect(firstAfterPaging(10, 5, 1)).toBe(5);
    expect(firstAfterPaging(6, 0, 1)).toBe(1);
    expect(firstAfterPaging(6, 1, -1)).toBe(0);
    expect(firstAfterPaging(6, 0, -1)).toBe(0);
  });

  it('centres a short row and fills the five slots of a full one', () => {
    expect(slotCentreX(640, 0, 1, 232)).toBe(640);
    expect(slotCentreX(640, 2, 5, 232)).toBe(640);
    expect(slotCentreX(640, 0, 5, 232)).toBe(640 - 2 * 232);
  });
});
