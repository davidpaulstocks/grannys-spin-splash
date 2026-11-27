import { describe, expect, it } from 'vitest';

import {
  DECK_ROLL_PERIOD_MS,
  DECK_ROLL_RANGE_X,
  DECK_ROLL_RANGE_Y,
  deckRollOffset,
} from '../../src/entities/world/deckRoll';

describe('the rolling deck', () => {
  it('starts at the top of its sway and returns after one period', () => {
    expect(deckRollOffset(0).x).toBeCloseTo(0);
    expect(deckRollOffset(DECK_ROLL_PERIOD_MS).x).toBeCloseTo(0);
    expect(deckRollOffset(DECK_ROLL_PERIOD_MS).y).toBeCloseTo(DECK_ROLL_RANGE_Y);
  });

  it('never moves the wall more than a few pixels', () => {
    for (let t = 0; t < DECK_ROLL_PERIOD_MS * 2; t += 50) {
      const { x, y } = deckRollOffset(t);
      expect(Math.abs(x)).toBeLessThanOrEqual(DECK_ROLL_RANGE_X + 1e-9);
      expect(Math.abs(y)).toBeLessThanOrEqual(DECK_ROLL_RANGE_Y + 1e-9);
    }
    expect(DECK_ROLL_RANGE_X).toBeLessThanOrEqual(12);
  });
});
