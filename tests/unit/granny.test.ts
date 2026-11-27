import { describe, expect, it, vi } from 'vitest';

import {
  GRANNY_ART_READY,
  GRANNY_DEFS,
  GRANNY_LADDER_DEFS,
} from '../../src/entities/granny/granny.data';
import { NO_TALENTS, shooHits, talentsFor } from '../../src/entities/granny/talents';
import { gigFor } from '../../src/entities/world/gigs.data';
import { WORLD_DEFS } from '../../src/entities/world/world.data';
import { bankGig } from '../../src/scenes/game/bankGig';
import { SpinnerState } from '../../src/entities/spinner/spinner.types';
import { bowBonus, planBows } from '../../src/scenes/game/bigFinishRules';
import { saveManager, SaveManager } from '../../src/systems/SaveManager';
import {
  isGrannyJoined,
  joinedMessage,
  joinGrannies,
  joinLine,
  starsUntilJoin,
} from '../../src/systems/GrannyJoining';
import type { SaveData } from '../../src/types/save';

/** config.ts pulls in Phaser (which needs a canvas); the Big Finish rules only want the two canvas sizes. */
vi.mock('../../src/config', () => ({ GAME_WIDTH: 1280, GAME_HEIGHT: 720 }));

function saveWithStars(stars: number): SaveData {
  const base = new SaveManager().load();
  const full = Math.floor(stars / 3);
  const gigStars = Array.from({ length: 8 }, (_, i) => (i < full ? 3 : i === full ? stars % 3 : 0));
  return { ...base, gigStars: { garden: gigStars } };
}

describe('talents', () => {
  it('gives every granny exactly one talent, each moving one multiplier by the stated amount', () => {
    expect(talentsFor('classic').holdFullSpeed).toBeCloseTo(1.2);
    expect(talentsFor('squirt').tankSize).toBeCloseTo(1.3);
    expect(talentsFor('punk').frenzyLength).toBeCloseTo(1.3);
    expect(talentsFor('joy').treatPay).toBe(2);
    expect(talentsFor('priya').shooHits).toBeCloseTo(0.65);
    expect(talentsFor('mei').bigFinish).toBeCloseTo(1.5);
    for (const g of GRANNY_LADDER_DEFS) {
      const changed = Object.entries(talentsFor(g.id)).filter(
        ([key, value]) => value !== NO_TALENTS[key as keyof typeof NO_TALENTS],
      );
      expect(changed, g.id).toHaveLength(1);
    }
  });

  it('is no effect at all for no granny or an unknown one', () => {
    expect(talentsFor(undefined)).toEqual(NO_TALENTS);
    expect(talentsFor('nobody')).toEqual(NO_TALENTS);
  });

  it('takes 35% off the hits a thief or blocker needs for Nani Priya, never below one', () => {
    expect(shooHits(10)).toBe(10);
    expect(shooHits(10, talentsFor('priya'))).toBe(7);
    expect(shooHits(1, talentsFor('priya'))).toBe(1);
  });

  it('makes the Big Finish bow bonus 50% bigger for Grandma Mei and no different otherwise', () => {
    const plain = bowBonus(SpinnerState.FULL, 3, 2, false);
    expect(bowBonus(SpinnerState.FULL, 3, 2, false, talentsFor('mei').bigFinish)).toBe(
      Math.round(plain * 1.5),
    );
    const band = [{ x: 100, state: SpinnerState.FULL }];
    expect(planBows(band, 2, 1).bows[0]?.bonus).toBe(planBows(band, 2, 1, 1).bows[0]?.bonus);
    expect(planBows(band, 2, 1, 1.5).bows[0]?.bonus).toBeGreaterThan(
      planBows(band, 2, 1).bows[0]?.bonus ?? 0,
    );
  });
});

describe('the roster', () => {
  it('offers only the painted grannies', () => {
    expect(GRANNY_ART_READY).toEqual(['classic', 'squirt', 'punk', 'joy', 'priya']);
    expect(GRANNY_DEFS.map((g) => g.id)).toEqual(['classic', 'squirt', 'punk', 'joy', 'priya']);
    expect(GRANNY_LADDER_DEFS.map((g) => g.id)).toEqual([
      'classic',
      'squirt',
      'punk',
      'joy',
      'priya',
      'mei',
    ]);
  });

  it('joins them at 0, 0, 20, 40, 70 and 100 stars', () => {
    expect(GRANNY_LADDER_DEFS.map((g) => g.starsToJoin)).toEqual([0, 0, 20, 40, 70, 100]);
  });
});

describe('joining by stars', () => {
  const punk = GRANNY_DEFS.find((g) => g.id === 'punk');
  if (!punk) throw new Error('no punk');

  it('has her join at 20 stars, never before', () => {
    expect(isGrannyJoined(saveWithStars(19), punk)).toBe(false);
    expect(starsUntilJoin(saveWithStars(19), punk)).toBe(1);
    expect(isGrannyJoined(saveWithStars(20), punk)).toBe(true);
  });

  it('records the grannies a gig has just brought in, once', () => {
    const first = joinGrannies(saveWithStars(21));
    expect(first.joined.map((g) => g.id)).toEqual(['punk']);
    expect(first.save.unlockedGrannies).toContain('punk');
    expect(joinGrannies(first.save).joined).toHaveLength(0);
  });

  it('does not offer the unpainted grannies at any number of stars', () => {
    expect(joinGrannies(saveWithStars(24)).joined.map((g) => g.id)).toEqual(['punk']);
  });

  it('keeps Punk Granny for a save that already owns her, below 20 stars', () => {
    const owner = { ...saveWithStars(3), unlockedGrannies: ['classic', 'squirt', 'punk'] };
    expect(isGrannyJoined(owner, punk)).toBe(true);
    expect(joinGrannies(owner).joined).toHaveLength(0);
  });

  it('says what she is good at when she joins', () => {
    expect(joinLine(punk)).toBe('Joins at 20 stars');
    expect(joinedMessage(punk)).toBe(
      'Punk Granny has joined! Loud: Splash Frenzy lasts 30% longer',
    );
  });
});

describe('banking a gig', () => {
  it('brings Punk Granny into the save and the results when the gig takes the stars past 20', () => {
    localStorage.clear();
    const manager = new SaveManager();
    manager.save(saveWithStars(18));
    const world = WORLD_DEFS[0];
    if (!world) throw new Error('no world');
    const result = bankGig({
      world,
      gig: gigFor(world, 7),
      score: 5000,
      stars: 3,
      peakFullSpinners: 3,
      totalSpinners: 3,
      reachedFrenzy: false,
    });
    expect(result.joinedGrannies).toEqual(['punk']);
    expect(saveManager.load().unlockedGrannies).toContain('punk');
    const again = bankGig({
      world,
      gig: gigFor(world, 7),
      score: 5000,
      stars: 3,
      peakFullSpinners: 3,
      totalSpinners: 3,
      reachedFrenzy: false,
    });
    expect(again.joinedGrannies).toEqual([]);
  });
});
