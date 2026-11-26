import { describe, expect, it } from 'vitest';

import { claimDailyGift, dailyGift, dayKey } from '../../src/systems/DailyGift';
import { applyGigToMission, currentMission, MISSIONS } from '../../src/systems/Missions';
import { SaveManager } from '../../src/systems/SaveManager';
import type { SaveData } from '../../src/types/save';

function fresh(): SaveData {
  localStorage.clear();
  return new SaveManager().load();
}

const NOTHING = { stars: 0, newStars: 0, coins: 0 };

describe('missions', () => {
  it('starts on the first mission with no progress', () => {
    const save = fresh();
    expect(currentMission(save).id).toBe(MISSIONS[0]?.id);
    expect(save.mission.progress).toBe(0);
  });

  it('counts a gig toward the mission without completing it early', () => {
    const update = applyGigToMission(fresh(), NOTHING); // "Play 2 gigs"
    expect(update.completed).toBe(false);
    expect(update.progress).toBe(1);
    expect(update.save.vault).toBe(0);
  });

  it('pays the reward and moves on when the mission is done', () => {
    const first = applyGigToMission(fresh(), NOTHING).save;
    const done = applyGigToMission(first, NOTHING);
    expect(done.completed).toBe(true);
    expect(done.mission.id).toBe('play2');
    expect(done.save.vault).toBe(MISSIONS[0]?.reward);
    expect(currentMission(done.save).id).toBe(MISSIONS[1]?.id);
    expect(done.save.mission.progress).toBe(0);
  });

  it('counts only what each kind of mission asks for', () => {
    const onStars: SaveData = { ...fresh(), mission: { index: 1, progress: 0 } }; // earn 4 new stars
    expect(applyGigToMission(onStars, { stars: 3, newStars: 0, coins: 99 }).progress).toBe(0);
    expect(applyGigToMission(onStars, { stars: 3, newStars: 2, coins: 0 }).progress).toBe(2);

    const onFullBand: SaveData = { ...fresh(), mission: { index: 2, progress: 0 } };
    expect(applyGigToMission(onFullBand, { stars: 2, newStars: 2, coins: 0 }).progress).toBe(0);
    expect(applyGigToMission(onFullBand, { stars: 3, newStars: 0, coins: 0 }).progress).toBe(1);

    const onCoins: SaveData = { ...fresh(), mission: { index: 3, progress: 0 } };
    expect(applyGigToMission(onCoins, { stars: 0, newStars: 0, coins: 120 }).progress).toBe(120);
  });

  it('never runs out: past the end of the list the later missions repeat', () => {
    const far: SaveData = { ...fresh(), mission: { index: MISSIONS.length + 7, progress: 0 } };
    const mission = currentMission(far);
    expect(MISSIONS).toContain(mission);
    expect(MISSIONS.indexOf(mission)).toBeGreaterThanOrEqual(5);
  });

  it('gives every mission a positive target and reward and unique id', () => {
    expect(new Set(MISSIONS.map((m) => m.id)).size).toBe(MISSIONS.length);
    for (const mission of MISSIONS) {
      expect(mission.target).toBeGreaterThan(0);
      expect(mission.reward).toBeGreaterThan(0);
    }
  });
});

describe('daily gift', () => {
  const monday = new Date(2026, 10, 23, 9, 0, 0);
  const tuesday = new Date(2026, 10, 24, 20, 0, 0);
  const thursday = new Date(2026, 10, 26, 8, 0, 0);

  it('is available on a first visit and once per day after that', () => {
    const save = fresh();
    expect(dailyGift(save, monday).available).toBe(true);
    const claimed = claimDailyGift(save, monday);
    expect(claimed.vault).toBe(800);
    expect(claimed.daily).toEqual({ lastDay: dayKey(monday), streak: 1 });
    expect(dailyGift(claimed, monday).available).toBe(false);
    expect(claimDailyGift(claimed, monday)).toBe(claimed); // a second claim changes nothing
  });

  it('grows on consecutive days and resets after a missed one', () => {
    const one = claimDailyGift(fresh(), monday);
    const two = claimDailyGift(one, tuesday);
    expect(two.daily.streak).toBe(2);
    expect(two.vault).toBe(800 + 1200);
    const afterGap = dailyGift(two, thursday);
    expect(afterGap.streak).toBe(1);
    expect(afterGap.coins).toBe(800);
  });

  it('stops growing after a week but keeps counting the streak', () => {
    const longStreak: SaveData = {
      ...fresh(),
      daily: { lastDay: dayKey(monday), streak: 30 },
    };
    const gift = dailyGift(longStreak, tuesday);
    expect(gift.streak).toBe(31);
    expect(gift.coins).toBe(800 + 400 * 6);
  });
});
