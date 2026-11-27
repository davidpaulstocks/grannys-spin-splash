import { describe, expect, it } from 'vitest';

import {
  ACTIONS_Y,
  COLUMN_BOXES,
  HOME_X,
  ICON_DIAMETER,
  ICON_REACH_BELOW,
  MIN_GAP,
  PILL_HEIGHT,
  PILL_WIDTH,
  PILL_X,
  PILL_Y,
  RETRY_X,
  SCREEN_BOTTOM,
  SCREEN_MARGIN,
  MAIN_MIN_WIDTH,
  CENTRE_X,
} from '../../src/scenes/results/resultsLayout';
import {
  PANEL_INNER_INSET,
  PATH_BOTTOM,
  PATH_TOP,
  pathDiscBoxes,
  pathExtentBoxes,
  pathTileBox,
  PATH_TILE_MIN_GAP,
} from '../../src/scenes/results/resultsLayout';
import { PATH_GIG_DIAMETER, PATH_GIG_GAP } from '../../src/ui/tourPathLayout';
import { coinsToNextStar, nextStarLine } from '../../src/ui/resultsLines';

describe('results layout', () => {
  it('keeps the column inside the screen margins', () => {
    for (const b of COLUMN_BOXES) {
      expect(b.top, b.name).toBeGreaterThanOrEqual(SCREEN_MARGIN);
      expect(b.bottom, b.name).toBeLessThanOrEqual(SCREEN_BOTTOM);
      expect(b.left, b.name).toBeGreaterThanOrEqual(SCREEN_MARGIN);
    }
  });

  it('leaves at least the minimum gap between stacked elements', () => {
    for (let i = 1; i < COLUMN_BOXES.length; i++) {
      const above = COLUMN_BOXES[i - 1];
      const below = COLUMN_BOXES[i];
      if (!above || !below) throw new Error('missing box');
      expect(below.top - above.bottom, below.name).toBeGreaterThanOrEqual(MIN_GAP);
    }
  });

  it('keeps the side buttons clear of the main button, the column and the screen edge', () => {
    const mainLeft = CENTRE_X - MAIN_MIN_WIDTH / 2;
    const columnLeft = COLUMN_BOXES[0]?.left ?? 0;
    expect(RETRY_X - HOME_X - ICON_DIAMETER).toBeGreaterThanOrEqual(MIN_GAP);
    expect(mainLeft - (RETRY_X + ICON_DIAMETER / 2)).toBeGreaterThanOrEqual(MIN_GAP);
    expect(HOME_X - ICON_DIAMETER / 2).toBeGreaterThanOrEqual(SCREEN_MARGIN);
    expect(ACTIONS_Y + ICON_REACH_BELOW).toBeLessThanOrEqual(SCREEN_BOTTOM);
    expect(columnLeft).toBeGreaterThan(PILL_X + PILL_WIDTH / 2 + MIN_GAP);
    expect(PILL_X - PILL_WIDTH / 2).toBeGreaterThanOrEqual(SCREEN_MARGIN);
    expect(PILL_Y - PILL_HEIGHT / 2).toBeGreaterThanOrEqual(SCREEN_MARGIN);
  });
});

describe('tour path gig buttons', () => {
  const left = CENTRE_X - 380;
  const right = CENTRE_X + 380;

  it.each([true, false])('fit the card with the next-venue tile = %s', (withTile) => {
    for (const b of pathExtentBoxes(withTile)) {
      expect(b.top, b.name).toBeGreaterThanOrEqual(PATH_TOP + PANEL_INNER_INSET);
      expect(b.bottom, b.name).toBeLessThanOrEqual(PATH_BOTTOM - PANEL_INNER_INSET);
      expect(b.left, b.name).toBeGreaterThanOrEqual(left + PANEL_INNER_INSET);
      expect(b.right, b.name).toBeLessThanOrEqual(right - PANEL_INNER_INSET);
    }
  });

  it('are at least 56 across with 8 px between neighbours', () => {
    expect(PATH_GIG_DIAMETER).toBeGreaterThanOrEqual(56);
    expect(PATH_GIG_GAP).toBeGreaterThanOrEqual(8);
    for (const withTile of [true, false]) {
      const discs = pathDiscBoxes(withTile);
      for (let i = 1; i < discs.length; i++) {
        const a = discs[i - 1];
        const b = discs[i];
        if (!a || !b) throw new Error('missing disc');
        expect(b.left - a.right).toBeGreaterThanOrEqual(8);
      }
    }
  });

  it('leave clear air before the next-venue tile', () => {
    const last = pathExtentBoxes(true).at(-1);
    if (!last) throw new Error('missing gig');
    expect(pathTileBox().left - last.right).toBeGreaterThanOrEqual(PATH_TILE_MIN_GAP);
    const tile = pathTileBox();
    expect(tile.top).toBeGreaterThanOrEqual(PATH_TOP + PANEL_INNER_INSET);
    expect(tile.bottom).toBeLessThanOrEqual(PATH_BOTTOM - PANEL_INNER_INSET);
    expect(tile.right).toBeLessThanOrEqual(right - PANEL_INNER_INSET);
  });
});

describe('score panel lines', () => {
  const targets = [1000, 2500, 5000] as const;

  it('says how far the first star is after a miss', () => {
    const data = { stars: 0, score: 600, targets };
    expect(coinsToNextStar(data)).toBe(400);
    expect(nextStarLine(data, String)).toBe('400 more coins for your first star');
  });

  it('says what the next star needs after a pass, and nothing after three', () => {
    expect(nextStarLine({ stars: 1, score: 1200, targets }, String)).toBe('1300 more for 2 stars');
    expect(nextStarLine({ stars: 2, score: 2600, targets }, String)).toBe('2400 more for 3 stars');
    expect(nextStarLine({ stars: 3, score: 6000, targets }, String)).toBeNull();
  });
});
