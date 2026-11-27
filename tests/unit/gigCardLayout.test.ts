import { describe, expect, it } from 'vitest';

import {
  GIG_CARD_BANDS,
  GIG_CARD_RIBBON_BOTTOM,
  GIG_CARD_WIDTH,
  MISSION_BAND_TOP,
  PICKER_DIAMETER,
  PICKER_EXTENT,
  PICKER_GAP,
  PICKER_WIDTH,
} from '../../src/ui/gigCardLayout';

/** The card's panel outline is 5 px, centred on its edge. */
const INNER = 3;
const FINGER = 44;

describe('home gig card layout', () => {
  it('stacks its bands in order with none overlapping', () => {
    for (let i = 1; i < GIG_CARD_BANDS.length; i++) {
      const above = GIG_CARD_BANDS[i - 1];
      const below = GIG_CARD_BANDS[i];
      if (!above || !below) throw new Error('missing band');
      expect(below.top - above.bottom, below.name).toBeGreaterThanOrEqual(2);
    }
  });

  it('keeps everything between the ribbon and the request band', () => {
    const first = GIG_CARD_BANDS[0];
    const last = GIG_CARD_BANDS.at(-1);
    if (!first || !last) throw new Error('no bands');
    expect(first.top).toBeGreaterThanOrEqual(GIG_CARD_RIBBON_BOTTOM);
    expect(MISSION_BAND_TOP - last.bottom).toBeGreaterThanOrEqual(8);
  });

  it('gives the gig buttons a finger-sized face, gaps, and room across the card', () => {
    expect(PICKER_DIAMETER).toBeGreaterThanOrEqual(FINGER);
    expect(PICKER_GAP).toBeGreaterThanOrEqual(8);
    expect(PICKER_WIDTH / 2 + PICKER_EXTENT.halfWidth - PICKER_DIAMETER / 2).toBeLessThanOrEqual(
      GIG_CARD_WIDTH / 2 - INNER,
    );
  });
});
