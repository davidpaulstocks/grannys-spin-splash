import { describe, expect, it } from 'vitest';

import { pickCluster, type ClusterCandidate } from '../../src/entities/visitor/blockerCluster';
import { stealPerTick } from '../../src/entities/visitor/theft';
import { BLOCKER, THIEF } from '../../src/entities/visitor/visitorTuning.data';
import type { WorldDef } from '../../src/entities/world/world.types';
import { WORLD_DEFS } from '../../src/entities/world/world.data';
import { GIGS_PER_VENUE, gigFor, starTargets } from '../../src/entities/world/gigs.data';

const GARDEN: WorldDef = WORLD_DEFS.find((w) => w.id === 'garden') ?? WORLD_DEFS[0];

/** A 4 x 3 wall of instruments 100 px apart, radius 40, the given ones spinning. */
function wall(spinning: readonly number[]): ClusterCandidate[] {
  return Array.from({ length: 12 }, (_, i) => ({
    x: 100 + (i % 4) * 100,
    y: 100 + Math.floor(i / 4) * 100,
    r: 40,
    spinning: spinning.includes(i),
  }));
}

describe('stealPerTick', () => {
  it('is 0.6% of the third star target, rounded', () => {
    expect(stealPerTick(6600)).toBe(40);
    expect(stealPerTick(3840)).toBe(23);
  });

  it('never drops below the floor', () => {
    expect(stealPerTick(100)).toBe(THIEF.minPerTick);
    expect(stealPerTick(0)).toBe(THIEF.minPerTick);
  });
});

describe('pickCluster', () => {
  it('covers two or three instruments', () => {
    for (let seed = 0; seed < 50; seed++) {
      const r = Math.sin(seed * 12.9898) * 0.5 + 0.5;
      const cluster = pickCluster(wall([5]), () => r);
      expect(cluster?.members.length).toBeGreaterThanOrEqual(BLOCKER.clusterSize.min);
      expect(cluster?.members.length).toBeLessThanOrEqual(BLOCKER.clusterSize.max);
    }
  });

  it('is seeded on a spinning instrument when one is', () => {
    const candidates = wall([7]);
    for (const r of [0, 0.3, 0.99]) {
      expect(pickCluster(candidates, () => r)?.members[0]).toBe(candidates[7]);
    }
  });

  it('holds every member whole in its circle', () => {
    const cluster = pickCluster(wall([5]), () => 0.5);
    if (!cluster) throw new Error('no cluster');
    for (const m of cluster.members) {
      expect(Math.hypot(m.x - cluster.x, m.y - cluster.y) + m.r).toBeLessThanOrEqual(
        cluster.radius + 1e-9,
      );
    }
  });

  it('never hides more than half of a small band', () => {
    for (const r of [0, 0.4, 0.99]) {
      expect(pickCluster(wall([0]).slice(0, 3), () => r)?.members).toHaveLength(1);
      expect(pickCluster(wall([0]).slice(0, 4), () => r)?.members).toHaveLength(2);
    }
  });

  it('covers a lone instrument and nothing when there is none', () => {
    expect(pickCluster(wall([]).slice(0, 1), () => 0)?.members).toHaveLength(1);
    expect(pickCluster([], () => 0)).toBeNull();
  });
});

describe('star targets', () => {
  it('are 0.8, 3.0 and 6.0 times par for the whole band at full speed', () => {
    const gig = gigFor(GARDEN, 0);
    const par = gig.band * 4 * gig.seconds * 2;
    const [one, two, three] = starTargets(gig);
    expect(one).toBeCloseTo(par * 0.8, -1);
    expect(two).toBeCloseTo(par * 3.0, -1);
    expect(three).toBeCloseTo(par * 6, -1);
  });

  it('rise through every gig of a venue', () => {
    for (let i = 0; i < GIGS_PER_VENUE; i++) {
      const [a, b, c] = starTargets(gigFor(GARDEN, i));
      expect(a).toBeLessThan(b);
      expect(b).toBeLessThan(c);
    }
  });
});

describe('blocker hits', () => {
  it('start at 28 and grow by two per gig', () => {
    expect(BLOCKER.baseHits + BLOCKER.hitsPerGigIndex * 0).toBe(28);
    expect(BLOCKER.baseHits + BLOCKER.hitsPerGigIndex * 7).toBe(42);
  });
});
