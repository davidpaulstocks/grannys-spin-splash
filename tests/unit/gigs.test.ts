import { describe, expect, it } from 'vitest';

import { resolveScore } from '../../src/audio/scores';
import { gigFor, GIGS_PER_VENUE, newMusicianCount } from '../../src/entities/world/gigs.data';
import { WORLD_DEFS } from '../../src/entities/world/world.data';
import { layoutBand } from '../../src/utils/grid';

describe.each(WORLD_DEFS.map((world) => [world.id, world] as const))(
  'gig ladder: %s',
  (id, world) => {
    const gigs = Array.from({ length: GIGS_PER_VENUE }, (_, i) => gigFor(world, i));

    it('grows the band at every gig and ends on the whole wall', () => {
      for (let i = 1; i < gigs.length; i++) {
        expect(gigs[i]?.band).toBeGreaterThan(gigs[i - 1]?.band ?? 0);
        expect(newMusicianCount(world, i)).toBeGreaterThan(0);
      }
      const wall = world.grid.cols * world.grid.rows + (world.featureSpinner ? 1 : 0);
      expect(gigs[GIGS_PER_VENUE - 1]?.band).toBe(wall);
    });

    it('keeps every gig winding down: slower for big bands, never stopped, never faster than designed', () => {
      for (const gig of gigs) {
        expect(gig.decayScale).toBeGreaterThan(0.05);
        expect(gig.decayScale).toBeLessThanOrEqual(1.3);
        expect(gig.holdMs).toBeGreaterThan(0);
      }
      // A bigger band is never given a faster wind-down than a smaller one.
      for (let i = 1; i < gigs.length; i++) {
        expect(gigs[i]?.decayScale).toBeLessThanOrEqual(gigs[i - 1]?.decayScale ?? Infinity);
      }
    });

    it('brings obstacles in through the ladder, none at the first gig', () => {
      for (let i = 1; i < gigs.length; i++) {
        expect(gigs[i]?.obstacles.length).toBeGreaterThanOrEqual(
          gigs[i - 1]?.obstacles.length ?? 0,
        );
      }
      expect(gigs[0]?.obstacles).toHaveLength(0);
      expect(gigs[GIGS_PER_VENUE - 1]?.obstacles).toHaveLength(world.obstacles.length);
    });

    it('has a musician in the score for every spinner, each seated once', () => {
      const score = resolveScore(id);
      expect(new Set(score.lineup).size).toBe(score.lineup.length);
      expect([...score.lineup].sort()).toEqual(score.seats.map((seat) => seat.id).sort());
      expect(score.lineup.length).toBeGreaterThanOrEqual(gigs[GIGS_PER_VENUE - 1]?.band ?? 0);
    });

    it('clamps out-of-range gig numbers to the ladder', () => {
      expect(gigFor(world, -3).index).toBe(0);
      expect(gigFor(world, 99).index).toBe(GIGS_PER_VENUE - 1);
    });
  },
);

describe('band layout', () => {
  it.each([3, 4, 5, 6, 8, 9, 10, 12, 14, 15, 16, 18, 20])(
    'places %i spinners inside the wall, none overlapping',
    (count) => {
      const { positions, cols, rows } = layoutBand(count, 100, 100, 1000, 360);
      expect(positions).toHaveLength(count);
      expect(cols * rows).toBeGreaterThanOrEqual(count);
      for (const p of positions) {
        expect(p.x).toBeGreaterThan(100);
        expect(p.x).toBeLessThan(1100);
        expect(p.y).toBeGreaterThan(100);
        expect(p.y).toBeLessThan(460);
      }
      const keys = new Set(positions.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`));
      expect(keys.size).toBe(count);
    },
  );

  it('centres a short row', () => {
    const { positions } = layoutBand(3, 0, 0, 900, 300);
    expect(positions.map((p) => p.x)).toEqual([150, 450, 750]);
  });
});
