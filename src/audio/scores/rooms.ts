/**
 * The rooms the bands play in, each described against the concert hall
 * (Garden's, `HALL_ROOM`): a fraction of its reverb, and where the tone
 * control starts. Garden has no entry — it plays in the hall itself.
 */

import { HALL_ROOM } from '../orchestra/OrchestraGraph';
import type { Room } from '../orchestra/score.types';

/** A room with `wetness` times the hall's reverb (both ends of the round) and its own opening brightness. */
function roomLike(wetness: number, toneMinHz: number = HALL_ROOM.toneMinHz): Room {
  return {
    reverbSendMin: HALL_ROOM.reverbSendMin * wetness,
    reverbSendMax: HALL_ROOM.reverbSendMax * wetness,
    toneMinHz,
  };
}

/** Reverb relative to the hall. */
const CLUB_WETNESS = 0.5;
const GARAGE_WETNESS = 0.25;
const BANDSTAND_WETNESS = 2 / 3;
const BALLROOM_WETNESS = 1.2;

/** Opening low-pass cutoffs for the bands that are bright from the first second. */
const GARAGE_TONE_MIN_HZ = 7000;
const BALLROOM_TONE_MIN_HZ = 6000;

/** Kitchen: a small jazz club — about half the hall's reverb. */
export const CLUB_ROOM: Room = roomLike(CLUB_WETNESS);
/** Workshop: dry and punchy, and bright from the first second. */
export const GARAGE_ROOM: Room = roomLike(GARAGE_WETNESS, GARAGE_TONE_MIN_HZ);
/** Funfair: an open bandstand — two thirds of the hall. */
export const BANDSTAND_ROOM: Room = roomLike(BANDSTAND_WETNESS);
/** Disco: big and glossy — a little more than the hall, bright from the start. */
export const BALLROOM_ROOM: Room = roomLike(BALLROOM_WETNESS, BALLROOM_TONE_MIN_HZ);
