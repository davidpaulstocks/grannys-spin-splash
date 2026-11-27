import { beforeEach, describe, expect, it } from 'vitest';

import { GRANNY_DEFS } from '../../src/entities/granny/granny.data';
import { GUN_DEFS } from '../../src/entities/gun/gun.data';
import { WORLD_DEFS } from '../../src/entities/world/world.data';
import { recordGig, venueBests, venueJustOpened } from '../../src/systems/Progress';
import {
  affordableUpgrade,
  formatCount,
  gunHeadline,
  gunPerk,
  nextReward,
  nextVenue,
  shopHasNews,
} from '../../src/systems/Rewards';
import { SaveManager } from '../../src/systems/SaveManager';
import type { SaveData } from '../../src/types/save';

function fresh(): SaveData {
  localStorage.clear();
  return new SaveManager().load();
}

describe('the goal is always the next thing not owned', () => {
  it('is never an upgrade, even when an upgrade is the cheapest thing to buy', () => {
    const reward = nextReward({ ...fresh(), vault: 23456 });
    expect(reward?.kind).toBe('gun');
    expect(reward?.id).toBe('hose');
    expect(reward?.cost).toBe(6000);
    expect(reward?.canAfford).toBe(true);
  });

  it('goes up the price ladder across guns and grannies as they are bought', () => {
    const base = fresh();
    const afterHose = { ...base, unlockedGuns: [...base.unlockedGuns, 'hose'] };
    const ladder = [
      ...GUN_DEFS.filter((g) => !afterHose.unlockedGuns.includes(g.id)).map((g) => ({
        id: g.id,
        cost: g.cost,
      })),
      ...GRANNY_DEFS.filter((g) => !base.unlockedGrannies.includes(g.id)).map((g) => ({
        id: g.id,
        cost: g.unlockCost,
      })),
    ].sort((a, b) => a.cost - b.cost);
    expect(nextReward(afterHose)?.id).toBe(ladder[0]?.id);
  });

  it('ignores the equipped gun and its level entirely', () => {
    const a = nextReward({ ...fresh(), gunLevels: { pistol: 1 } });
    const b = nextReward({ ...fresh(), gunLevels: { pistol: 4 }, selectedGunId: 'squirter' });
    expect(b?.id).toBe(a?.id);
    expect(b?.kind).not.toBe('upgrade');
  });

  it('is null once every gun and granny is owned', () => {
    expect(
      nextReward({
        ...fresh(),
        unlockedGuns: GUN_DEFS.map((g) => g.id),
        unlockedGrannies: GRANNY_DEFS.map((g) => g.id),
      }),
    ).toBeNull();
  });

  it('words a gun by level, with at most two decimals', () => {
    const hose = GUN_DEFS.find((g) => g.id === 'hose');
    const jr = GUN_DEFS.find((g) => g.id === 'splashjr');
    if (!hose || !jr) throw new Error('missing gun');
    expect(gunPerk(hose, 1)).toBe('Coins ×1.5');
    expect(gunPerk(hose, 3)).toBe('Level 3 · Coins ×1.95');
    expect(gunPerk(hose, 5)).toBe('Level 5 · Coins ×2.4');
    expect(gunPerk(jr, 2)).toBe('Level 2 · Coins ×2.3 · Two jets');
  });

  it('gives the goal card a headline in plain words', () => {
    const headline = (id: string): string | undefined => {
      const gun = GUN_DEFS.find((g) => g.id === id);
      return gun ? gunHeadline(gun) : undefined;
    };
    expect(headline('hose')).toBe('Coins ×1.5 · Wider jet');
    expect(headline('splashjr')).toBe('Coins ×2 · Two jets');
    expect(headline('inferno')).toBe('Coins ×5.5 · Fire jet');
    expect(headline('hydro_blaster')).toBe('Coins ×2.4 · 3 jets');
    expect(headline('pistol')).toBe('Starter gun');
  });
});

describe('affordable upgrade and the SHOP dot', () => {
  it('names the price of the next level only when it can be paid', () => {
    expect(affordableUpgrade({ ...fresh(), vault: 1499 })).toBeNull();
    expect(affordableUpgrade({ ...fresh(), vault: 1500 })).toBe(1500);
  });

  it('is null at the top level and for a gun not owned', () => {
    expect(affordableUpgrade({ ...fresh(), vault: 999999, gunLevels: { pistol: 5 } })).toBeNull();
    expect(affordableUpgrade({ ...fresh(), vault: 999999, selectedGunId: 'hose' })).toBeNull();
  });

  it('lights the dot for a new gun or an upgrade, and not otherwise', () => {
    expect(shopHasNews({ ...fresh(), vault: 100 })).toBe(false);
    expect(shopHasNews({ ...fresh(), vault: 1500 })).toBe(true);
    const maxed = { ...fresh(), gunLevels: { pistol: 5 } };
    expect(shopHasNews({ ...maxed, vault: 5999 })).toBe(false);
    expect(shopHasNews({ ...maxed, vault: 6000 })).toBe(true);
  });
});

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
