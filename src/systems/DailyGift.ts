/**
 * The daily gift — a few coins for coming back, more for coming back on
 * consecutive days (docs/ENGAGEMENT_DESIGN.md §6). Pure functions over
 * `SaveData`; the caller supplies today's date, so the rules are testable
 * without a clock.
 */

import type { SaveData } from '../types/save';

const FIRST_DAY_COINS = 800;
const COINS_PER_STREAK_DAY = 400;
/** The gift stops growing after a week; the streak itself keeps counting. */
const MAX_STREAK_FOR_BONUS = 7;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** A calendar day in the player's own time zone, as `YYYY-MM-DD`. */
export function dayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export interface DailyGiftState {
  /** False when today's gift has already been taken. */
  readonly available: boolean;
  /** What claiming now would pay, and the streak it would set. */
  readonly coins: number;
  readonly streak: number;
}

export function dailyGift(save: SaveData, today: Date): DailyGiftState {
  const todayKey = dayKey(today);
  const yesterdayKey = dayKey(new Date(today.getTime() - MS_PER_DAY));
  const streak = save.daily.lastDay === yesterdayKey ? save.daily.streak + 1 : 1;
  const bonusDays = Math.min(streak, MAX_STREAK_FOR_BONUS) - 1;
  return {
    available: save.daily.lastDay !== todayKey,
    coins: FIRST_DAY_COINS + COINS_PER_STREAK_DAY * bonusDays,
    streak,
  };
}

/** Takes today's gift. Returns the save unchanged if it has already been taken. */
export function claimDailyGift(save: SaveData, today: Date): SaveData {
  const gift = dailyGift(save, today);
  if (!gift.available) return save;
  return {
    ...save,
    vault: save.vault + gift.coins,
    daily: { lastDay: dayKey(today), streak: gift.streak },
  };
}
