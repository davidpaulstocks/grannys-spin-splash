/** Every world's score, by world id. A world without its own score borrows Garden's. */

import type { Score } from '../orchestra/score.types';
import { DISCO_SCORE } from './disco';
import { FUNFAIR_SCORE } from './funfair';
import { GARDEN_SCORE } from './garden';
import { KITCHEN_SCORE } from './kitchen';
import { WORKSHOP_SCORE } from './workshop';

export const SCORES: readonly Score[] = [
  GARDEN_SCORE,
  WORKSHOP_SCORE,
  KITCHEN_SCORE,
  FUNFAIR_SCORE,
  DISCO_SCORE,
];

const BY_ID: ReadonlyMap<string, Score> = new Map(SCORES.map((score) => [score.id, score]));

export function resolveScore(worldId: string): Score {
  return BY_ID.get(worldId) ?? GARDEN_SCORE;
}

/**
 * The names of the musicians at positions `from` (inclusive) to `to`
 * (exclusive) in a venue's line-up — who joins when the band grows from
 * `from` players to `to`.
 */
export function musiciansJoining(worldId: string, from: number, to: number): readonly string[] {
  const score = resolveScore(worldId);
  const names = new Map(score.seats.map((seat) => [seat.id, seat.name]));
  return score.lineup.slice(from, to).map((id) => names.get(id) ?? id);
}
