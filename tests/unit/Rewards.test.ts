import { beforeEach, describe, expect, it } from 'vitest';

import { GRANNY_DEFS } from '../../src/entities/granny/granny.data';
import { GUN_DEFS } from '../../src/entities/gun/gun.data';
import { WORLD_DEFS } from '../../src/entities/world/world.data';
import { recordGig, venueBests, venueJustOpened } from '../../src/systems/Progress';
import { formatCount, gunPerk, nextReward, nextVenue } from '../../src/systems/Rewards';
import { SaveManager } from '../../src/systems/SaveManager';
import type { SaveData } from '../../src/types/save';

function fresh(): SaveData {
  localStorage.clear();
  return new SaveManager().load();
}

describe('next reward', () => {
  let save: SaveData;
  beforeEach(() => {
    save = fresh();
  });

  it('is the cheapest thing not owned, across guns and grannies', () => {
    const reward = nextReward({ ...save, vault: 120 });
    const unowned = [
      ...GUN_DEFS.filter((g) => !save.unlockedGuns.includes(g.id)).map((g) => g.cost),
      ...GRANNY_DEFS.filter((g) => !save.unlockedGrannies.includes(g.id)).map((g) => g.unlockCost),
    ];
    expect(reward?.cost).toBe(Math.min(...unowned));
    expect(reward?.canAfford).toBe(reward ? 120 >= reward.cost : false);
    expect(reward?.progress).toBeCloseTo(Math.min(1, 120 / (reward?.cost ?? 1)));
  });

  it('moves on to the granny when every gun is owned', () => {
    const reward = nextReward({ ...save, unlockedGuns: GUN_DEFS.map((g) => g.id) });
    expect(reward?.kind).toBe('granny');
    expect(reward?.perk).toBe('New look');
  });

  it('says it can be afforded and caps progress at 1', () => {
    const reward = nextReward({ ...save, vault: 1_000_000 });
    expect(reward?.canAfford).toBe(true);
    expect(reward?.progress).toBe(1);
  });

  it('is null once everything is owned', () => {
    const all = {
      ...save,
      unlockedGuns: GUN_DEFS.map((g) => g.id),
      unlockedGrannies: GRANNY_DEFS.map((g) => g.id),
    };
    expect(nextReward(all)).toBeNull();
  });

  it('describes a gun by its coin boost and jets', () => {
    const perk = (id: string): string | undefined => {
      const gun = GUN_DEFS.find((g) => g.id === id);
      return gun ? gunPerk(gun) : undefined;
    };
    expect(perk('hose')).toBe('Coins ×1.5');
    expect(perk('splashjr')).toBe('Coins ×2 · Two jets');
    expect(perk('pistol')).toBe('Starter gun');
  });
});

describe('next venue', () => {
  it('names the next locked venue and the stars it still needs', () => {
    const next = nextVenue(fresh());
    expect(next?.venue.id).toBe(WORLD_DEFS.find((w) => w.starsToOpen > 0)?.id);
    expect(next?.starsNeeded).toBe(next?.venue.starsToOpen);
  });
});

describe('formatCount', () => {
  it('separates thousands', () => {
    expect(formatCount(1120)).toBe('1,120');
    expect(formatCount(2000)).toBe('2,000');
  });
});

describe('per-gig best', () => {
  it('starts at zero, records the best and flags a new one', () => {
    const first = recordGig(fresh(), 'garden', 2, 1, 300);
    expect(first.previousBest).toBe(0);
    expect(first.isNewBest).toBe(true);
    expect(venueBests(first.save, 'garden')[2]).toBe(300);

    const worse = recordGig(first.save, 'garden', 2, 1, 200);
    expect(worse.previousBest).toBe(300);
    expect(worse.isNewBest).toBe(false);
    expect(venueBests(worse.save, 'garden')[2]).toBe(300);

    const better = recordGig(worse.save, 'garden', 2, 1, 450);
    expect(better.isNewBest).toBe(true);
    expect(venueBests(better.save, 'garden')[2]).toBe(450);
    expect(venueBests(better.save, 'garden')[1]).toBe(0);
  });

  it('reads an old save with no gigBest as never played', () => {
    const { gigBest: _gone, ...old } = fresh();
    localStorage.setItem('grannySpinSplash.save.v1', JSON.stringify(old));
    expect(venueBests(new SaveManager().load(), 'garden').every((v) => v === 0)).toBe(true);
  });
});

describe('venue just opened', () => {
  it('finds the venue the new stars crossed the line for', () => {
    const venue = WORLD_DEFS.find((w) => w.starsToOpen > 0);
    if (!venue) throw new Error('no locked venue');
    const save = { ...fresh(), gigStars: { garden: [venue.starsToOpen] } };
    expect(venueJustOpened(save, WORLD_DEFS, 1)?.id).toBe(venue.id);
    expect(venueJustOpened(save, WORLD_DEFS, 0)).toBeNull();
    const already = { ...fresh(), gigStars: { garden: [venue.starsToOpen + 5] } };
    expect(venueJustOpened(already, WORLD_DEFS, 1)).toBeNull();
  });
});
