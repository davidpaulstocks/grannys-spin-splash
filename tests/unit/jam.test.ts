import { describe, expect, it } from 'vitest';

import { GUN_DEFS } from '../../src/entities/gun/gun.data';
import { GIGS_PER_VENUE, gigFor } from '../../src/entities/world/gigs.data';
import { WORLD_DEFS } from '../../src/entities/world/world.data';
import {
  JAM_DECAY_FACTOR,
  JAM_HOLD_FACTOR,
  jamGig,
  nextGun,
  ownedGunCycle,
} from '../../src/scenes/jam/jamRules';

describe('jam wall', () => {
  it.each(WORLD_DEFS.map((w) => w.id))('%s is the last gig band, wound down gently', (id) => {
    const world = WORLD_DEFS.find((w) => w.id === id);
    if (!world) throw new Error('no world');
    const last = gigFor(world, GIGS_PER_VENUE - 1);
    const jam = jamGig(world);
    expect(jam.band).toBe(last.band);
    expect(jam.feature).toBe(last.feature);
    expect(jam.decayScale).toBeCloseTo(last.decayScale * JAM_DECAY_FACTOR);
    expect(jam.holdMs).toBeCloseTo(last.holdMs * JAM_HOLD_FACTOR);
    expect(jam.decayScale).toBeLessThan(last.decayScale);
    expect(jam.holdMs).toBeGreaterThan(last.holdMs);
  });

  it('is about half the wind-down and twice the hold', () => {
    expect(JAM_DECAY_FACTOR).toBe(0.5);
    expect(JAM_HOLD_FACTOR).toBe(2);
  });
});

describe('gun cycle', () => {
  const first = GUN_DEFS[0];
  const second = GUN_DEFS[1];
  const third = GUN_DEFS[2];

  it('holds only owned guns, in ladder order', () => {
    const cycle = ownedGunCycle([third?.id ?? '', first?.id ?? '', 'not_a_gun']);
    expect(cycle.map((g) => g.id)).toEqual([first?.id, third?.id]);
  });

  it('steps to the next and wraps to the first', () => {
    const cycle = ownedGunCycle([first?.id ?? '', second?.id ?? '', third?.id ?? '']);
    expect(nextGun(cycle, first?.id ?? '')?.id).toBe(second?.id);
    expect(nextGun(cycle, third?.id ?? '')?.id).toBe(first?.id);
  });

  it('stays on a lone gun, starts at the first from an unknown one, and is null with none', () => {
    const lone = ownedGunCycle([first?.id ?? '']);
    expect(nextGun(lone, first?.id ?? '')?.id).toBe(first?.id);
    expect(nextGun(lone, 'zzz')?.id).toBe(first?.id);
    expect(nextGun([], 'zzz')).toBeNull();
  });
});
