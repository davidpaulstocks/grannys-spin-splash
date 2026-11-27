import { describe, expect, it } from 'vitest';

import { GIGS_PER_VENUE } from '../../src/entities/world/gigs.data';
import { WORLD_DEFS } from '../../src/entities/world/world.data';
import {
  COINS_PER_NEW_STAR,
  currentGig,
  isGigOpen,
  isJamUnlocked,
  isVenueOpen,
  nextLockedVenue,
  nextStop,
  playGig,
  recommendedGig,
  recordGig,
  starsLeft,
  starsToGo,
  totalStars,
  venueStars,
  venueStarTotal,
} from '../../src/systems/Progress';
import { SaveManager } from '../../src/systems/SaveManager';
import type { SaveData } from '../../src/types/save';

function fresh(): SaveData {
  localStorage.clear();
  return new SaveManager().load();
}

const workshop = WORLD_DEFS.find((w) => w.id === 'workshop');

describe('tour progress', () => {
  it('starts with no stars, gig 1 open and only the first venue open', () => {
    const save = fresh();
    expect(totalStars(save)).toBe(0);
    expect(venueStars(save, 'garden')).toHaveLength(GIGS_PER_VENUE);
    expect(currentGig(save, 'garden')).toBe(0);
    expect(isGigOpen(save, 'garden', 0)).toBe(true);
    expect(isGigOpen(save, 'garden', 1)).toBe(false);
    expect(WORLD_DEFS.filter((w) => isVenueOpen(save, w)).map((w) => w.id)).toEqual(['garden']);
  });

  it('banks a gig: coins, stars, and a one-off payment for each new star', () => {
    const { save, newStars, starCoins } = recordGig(fresh(), 'garden', 0, 2, 40);
    expect(newStars).toBe(2);
    expect(starCoins).toBe(2 * COINS_PER_NEW_STAR);
    expect(save.vault).toBe(40 + 2 * COINS_PER_NEW_STAR);
    expect(venueStars(save, 'garden')[0]).toBe(2);
    expect(currentGig(save, 'garden')).toBe(1);
    expect(isGigOpen(save, 'garden', 1)).toBe(true);
  });

  it('keeps the best rating and only pays for stars not earned before', () => {
    const first = recordGig(fresh(), 'garden', 0, 2, 0).save;
    const worse = recordGig(first, 'garden', 0, 1, 10);
    expect(worse.newStars).toBe(0);
    expect(venueStars(worse.save, 'garden')[0]).toBe(2);
    const better = recordGig(worse.save, 'garden', 0, 3, 10);
    expect(better.newStars).toBe(1);
    expect(better.starCoins).toBe(COINS_PER_NEW_STAR);
  });

  it('does not pass a gig on zero stars', () => {
    const { save } = recordGig(fresh(), 'garden', 0, 0, 12);
    expect(currentGig(save, 'garden')).toBe(0);
    expect(save.vault).toBe(12); // coins are still banked
  });

  it('opens a venue once the tour has enough stars', () => {
    let save = fresh();
    expect(workshop).toBeDefined();
    if (!workshop) return;
    for (let gig = 0; gig < 4; gig++) save = recordGig(save, 'garden', gig, 3, 0).save;
    expect(totalStars(save)).toBe(12);
    expect(isVenueOpen(save, workshop)).toBe(true);
    expect(nextLockedVenue(save, WORLD_DEFS)?.venue.id).toBe('kitchen');
  });

  it('sends NEXT to the next gig, then to the next venue only if it is open', () => {
    let save = fresh();
    expect(nextStop(save, WORLD_DEFS, 'garden', 0)).toEqual({ venueId: 'garden', gig: 1 });
    const last = GIGS_PER_VENUE - 1;
    expect(nextStop(save, WORLD_DEFS, 'garden', last)).toBeNull();
    for (let gig = 0; gig < GIGS_PER_VENUE; gig++) save = recordGig(save, 'garden', gig, 3, 0).save;
    expect(nextStop(save, WORLD_DEFS, 'garden', last)).toEqual({ venueId: 'workshop', gig: 0 });
  });

  it('can reach every venue: the stars each one asks for exist before it', () => {
    WORLD_DEFS.forEach((venue, i) => {
      expect(venue.starsToOpen).toBeLessThanOrEqual(i * GIGS_PER_VENUE * 3);
    });
  });
});

describe('venue tiles on Home', () => {
  it('sums the stars held in one venue only', () => {
    let save = fresh();
    save = recordGig(save, 'garden', 0, 3, 0).save;
    save = recordGig(save, 'garden', 1, 2, 0).save;
    expect(venueStarTotal(save, 'garden')).toBe(5);
    expect(venueStarTotal(save, 'workshop')).toBe(0);
  });

  it('says how many stars a locked venue still needs, and 0 once open', () => {
    const save = recordGig(fresh(), 'garden', 0, 3, 0).save;
    if (!workshop) throw new Error('workshop missing');
    expect(starsToGo(save, workshop)).toBe(workshop.starsToOpen - 3);
    const garden = WORLD_DEFS[0];
    if (!garden) throw new Error('garden missing');
    expect(starsToGo(save, garden)).toBe(0);
  });

  it('picks a venue gig with currentGig: first unpassed, else the Grand Concert', () => {
    let save = fresh();
    expect(currentGig(save, 'workshop')).toBe(0);
    for (let g = 0; g < GIGS_PER_VENUE; g++) save = recordGig(save, 'workshop', g, 1, 0).save;
    expect(currentGig(save, 'workshop')).toBe(GIGS_PER_VENUE - 1);
  });
});

describe('jam unlock', () => {
  it('opens when the last gig has one star, and not before', () => {
    let save = fresh();
    expect(isJamUnlocked(save, 'garden')).toBe(false);
    for (let gig = 0; gig < GIGS_PER_VENUE - 1; gig++)
      save = recordGig(save, 'garden', gig, 3, 0).save;
    expect(isJamUnlocked(save, 'garden')).toBe(false);
    save = recordGig(save, 'garden', GIGS_PER_VENUE - 1, 0, 0).save;
    expect(isJamUnlocked(save, 'garden')).toBe(false);
    save = recordGig(save, 'garden', GIGS_PER_VENUE - 1, 1, 0).save;
    expect(isJamUnlocked(save, 'garden')).toBe(true);
  });

  it('is per venue', () => {
    const save = recordGig(fresh(), 'garden', GIGS_PER_VENUE - 1, 3, 0).save;
    expect(isJamUnlocked(save, 'workshop')).toBe(false);
  });
});

describe('where to go next in a venue', () => {
  /** A garden whose gigs hold exactly these best stars. */
  function garden(stars: readonly number[]): SaveData {
    let save = fresh();
    stars.forEach((value, gig) => {
      save = recordGig(save, 'garden', gig, value, 0).save;
    });
    return save;
  }

  it('recommends gig 1 on a fresh save', () => {
    expect(recommendedGig(fresh(), 'garden')).toBe(0);
  });

  it('recommends the next gig up the ladder while there is one', () => {
    expect(recommendedGig(garden([3, 3, 1]), 'garden')).toBe(3);
    expect(recommendedGig(garden([1]), 'garden')).toBe(1);
  });

  it('recommends the open gig with fewest stars once all are passed, lowest index on a tie', () => {
    expect(recommendedGig(garden([3, 2, 3, 3, 3, 3, 3, 3]), 'garden')).toBe(1);
    expect(recommendedGig(garden([2, 3, 1, 3, 1, 3, 3, 3]), 'garden')).toBe(2);
    expect(recommendedGig(garden([2, 2, 2, 2, 2, 2, 2, 2]), 'garden')).toBe(0);
  });

  it('recommends nothing when every gig has three stars', () => {
    const save = garden(Array(GIGS_PER_VENUE).fill(3));
    expect(recommendedGig(save, 'garden')).toBeNull();
    expect(playGig(save, 'garden')).toBe(GIGS_PER_VENUE - 1);
  });

  it('plays the recommended gig by default', () => {
    expect(playGig(garden([3, 1]), 'garden')).toBe(2);
  });

  it('counts the stars left on a gig', () => {
    const save = garden([3, 1]);
    expect(starsLeft(save, 'garden', 0)).toBe(0);
    expect(starsLeft(save, 'garden', 1)).toBe(2);
    expect(starsLeft(save, 'garden', 2)).toBe(3);
  });
});
