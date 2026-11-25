import { describe, expect, it } from 'vitest';

import { familyOf } from '../../src/audio/orchestra/families';
import { musicianAt, SCORES } from '../../src/audio/scores';

describe('instrument sections', () => {
  it('puts each instrument in the section a listener would expect', () => {
    expect(familyOf('violin_sus')).toBe('strings');
    expect(familyOf('jazz_bass')).toBe('bass');
    expect(familyOf('tenor_sus')).toBe('woodwind');
    expect(familyOf('trumpet_mute')).toBe('brass');
    expect(familyOf('harp')).toBe('plucked');
    expect(familyOf('piano')).toBe('keys');
    expect(familyOf('ride')).toBe('percussion'); // anything hit or shaken
  });

  it.each(SCORES.map((score) => [score.id, score] as const))(
    '%s: every spinner on the wall has a named musician with a section',
    (id, score) => {
      score.lineup.forEach((seatId, index) => {
        const musician = musicianAt(id, index);
        const seat = score.seats.find((part) => part.id === seatId);
        expect(seat).toBeDefined();
        if (!seat) return;
        expect(musician).toEqual({ name: seat.name, family: familyOf(seat.instrument) });
      });
      expect(musicianAt(id, score.lineup.length)).toBeNull();
    },
  );

  it.each(SCORES.map((score) => score.id))('%s: the opening band is not all one section', (id) => {
    // The first musicians a player meets should look different from each other.
    const opening = [0, 1, 2].map((i) => musicianAt(id, i)?.family);
    expect(new Set(opening).size).toBeGreaterThan(1);
  });
});
