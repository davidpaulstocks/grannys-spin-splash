/** countInTiming — the count-in lands GO three beats after the "3", at each venue's tempo. */

import { describe, expect, it } from 'vitest';

import {
  COUNT_LABELS,
  GO_INDEX,
  beatMs,
  countInOffsets,
} from '../../src/scenes/game/countInTiming';
import { SCORES } from '../../src/audio/scores';

describe('countInTiming', () => {
  it('says 3, 2, 1, GO! and GO is last', () => {
    expect([...COUNT_LABELS]).toEqual(['3', '2', '1', 'GO!']);
    expect(COUNT_LABELS[GO_INDEX]).toBe('GO!');
  });

  it('is one beat at 96 BPM = 625 ms', () => {
    expect(beatMs(96)).toBe(625);
  });

  it('lands each count one beat apart, GO three beats after the 3', () => {
    const offsets = countInOffsets(120);
    expect(offsets).toEqual([0, 500, 1000, 1500]);
  });

  it('is slower at a slower tempo and quicker at a faster one', () => {
    expect(countInOffsets(96)[GO_INDEX]).toBeGreaterThan(countInOffsets(136)[GO_INDEX] ?? 0);
  });

  it('every venue score gives a count-in that ends within three seconds', () => {
    for (const score of SCORES) {
      const end = countInOffsets(score.bpm)[GO_INDEX] ?? Infinity;
      expect(end).toBeLessThan(3000);
    }
  });
});
