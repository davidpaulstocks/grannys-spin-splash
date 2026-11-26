/**
 * Granny's request — one small mission at a time, paying coins when it is
 * done (docs/ENGAGEMENT_DESIGN.md §6). One, not three: a seven-year-old
 * should be able to hold the whole of it in their head while playing.
 *
 * Pure functions over `SaveData`. The mission is a position in a fixed list
 * plus progress toward it; finishing one pays its reward and moves to the
 * next, so there is always exactly one on the go.
 */

import type { SaveData } from '../types/save';
import { MAX_STARS_PER_GIG } from './Progress';

export type MissionKind = 'playGigs' | 'earnStars' | 'fullBand' | 'threeStars' | 'collectCoins';

export interface MissionDef {
  readonly id: string;
  readonly kind: MissionKind;
  readonly target: number;
  /** Coins paid on completion. */
  readonly reward: number;
  /** Shown to the player, imperative and short. */
  readonly text: string;
}

/**
 * Ordered easy to hard. The first few are things a new player does anyway,
 * so the first rewards arrive quickly and teach that missions pay.
 */
export const MISSIONS: readonly MissionDef[] = [
  { id: 'play2', kind: 'playGigs', target: 2, reward: 1000, text: 'Play 2 gigs' },
  { id: 'stars4', kind: 'earnStars', target: 4, reward: 1400, text: 'Earn 4 new stars' },
  { id: 'full2', kind: 'fullBand', target: 2, reward: 1600, text: 'Get the FULL BAND twice' },
  { id: 'coins250', kind: 'collectCoins', target: 5000, reward: 1600, text: 'Collect 5,000 coins' },
  { id: 'three2', kind: 'threeStars', target: 2, reward: 2000, text: 'Get three stars on 2 gigs' },
  { id: 'play5', kind: 'playGigs', target: 5, reward: 1600, text: 'Play 5 gigs' },
  { id: 'stars6', kind: 'earnStars', target: 6, reward: 2000, text: 'Earn 6 new stars' },
  { id: 'full3', kind: 'fullBand', target: 3, reward: 2000, text: 'Get the FULL BAND 3 times' },
  {
    id: 'coins500',
    kind: 'collectCoins',
    target: 15000,
    reward: 2400,
    text: 'Collect 15,000 coins',
  },
  { id: 'three3', kind: 'threeStars', target: 3, reward: 2400, text: 'Get three stars on 3 gigs' },
];

/** Once the list has been played through, the harder half repeats forever. */
const REPEAT_FROM = 5;

/** What a finished gig contributes toward a mission. */
export interface GigOutcome {
  readonly stars: number;
  readonly newStars: number;
  readonly coins: number;
}

/** The mission the player is on. */
export function currentMission(save: SaveData): MissionDef {
  const index = save.mission.index;
  const wrapped =
    index < MISSIONS.length
      ? index
      : REPEAT_FROM + ((index - MISSIONS.length) % (MISSIONS.length - REPEAT_FROM));
  return MISSIONS[wrapped] ?? (MISSIONS[0] as MissionDef);
}

function contribution(kind: MissionKind, outcome: GigOutcome): number {
  switch (kind) {
    case 'playGigs':
      return 1;
    case 'earnStars':
      return outcome.newStars;
    case 'fullBand':
      return outcome.stars >= MAX_STARS_PER_GIG ? 1 : 0;
    case 'threeStars':
      return outcome.stars >= MAX_STARS_PER_GIG ? 1 : 0;
    case 'collectCoins':
      return Math.max(0, outcome.coins);
  }
}

export interface MissionUpdate {
  readonly save: SaveData;
  /** The mission that was on the go when the gig ended, and how far along it now is (capped at its target). */
  readonly mission: MissionDef;
  readonly progress: number;
  /** True when this gig finished it. Its reward is already in the returned save's vault. */
  readonly completed: boolean;
}

/** Counts a finished gig toward the current mission, paying out and moving on if that completes it. */
export function applyGigToMission(save: SaveData, outcome: GigOutcome): MissionUpdate {
  const mission = currentMission(save);
  const progress = Math.min(
    mission.target,
    save.mission.progress + contribution(mission.kind, outcome),
  );
  if (progress < mission.target) {
    return {
      save: { ...save, mission: { ...save.mission, progress } },
      mission,
      progress,
      completed: false,
    };
  }
  return {
    save: {
      ...save,
      vault: save.vault + mission.reward,
      mission: { index: save.mission.index + 1, progress: 0 },
    },
    mission,
    progress,
    completed: true,
  };
}
