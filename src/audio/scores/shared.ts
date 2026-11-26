/**
 * Builders shared by every world's score: terse constructors for a seat, and
 * the two set-piece arrangements — the finale that drives the last third of a
 * round and the tutti that plays through Splash Frenzy. Each world passes its
 * own registers, so the same gestures land in that world's key and colour.
 */

import type { Bars, InstrumentId, Line, Part } from '../orchestra/score.types';

type SeatExtras = Partial<Omit<Part, 'id' | 'name' | 'instrument' | 'floor' | 'level' | 'bars'>>;

/** A musician whose notes ring out: plucked, struck or tongued short. */
export function struck(
  id: string,
  name: string,
  instrument: InstrumentId,
  floor: number,
  level: number,
  bars: Bars,
  extras: SeatExtras = {},
): Part {
  return { id, name, instrument, floor, level, bars, ...extras };
}

/** A musician who holds notes for their written length: bowed or blown. */
export function held(
  id: string,
  name: string,
  instrument: InstrumentId,
  floor: number,
  level: number,
  bars: Bars,
  extras: SeatExtras = {},
): Part {
  return { id, name, instrument, floor, level, bars, sustain: true, ...extras };
}

/** A bare line, for beds, companions and ornaments. Unpitched lines pass a floor of 0; a guitar line in the finale or frenzy passes a `drive`. */
export function line(
  instrument: InstrumentId,
  floor: number,
  level: number,
  bars: Bars,
  sustain = false,
  drive = 0,
): Line {
  return {
    instrument,
    floor,
    level,
    bars,
    ...(sustain ? { sustain } : {}),
    ...(drive > 0 ? { drive } : {}),
  };
}

/** Driving spiccato strings, a timpani pulse and tambourine: the last ten seconds lean forward. */
export function drivingFinale(stringsFloor: number, timpaniFloor: number): readonly Line[] {
  return [
    line('violin_spic', stringsFloor, 0.4, ['a c b c a c b c']),
    line('timpani', timpaniFloor, 0.5, ['r . . r . . r .']),
    line('tambourine', 0, 0.3, ['x x? x x? x x? x x?']),
  ];
}

/** Trumpet fanfare, glockenspiel runs, snare, bass drum on every beat and timpani: everyone, at once. */
export function tuttiFrenzy(
  brassFloor: number,
  glockFloor: number,
  timpaniFloor: number,
): readonly Line[] {
  return [
    line('trumpet_stac', brassFloor, 0.6, ["r . r r f . . . o . o o f' . . ."]),
    line('glock', glockFloor, 0.34, ["a b c d a b c d a' b' c' d' a' b' c' d'"]),
    line('snare', 0, 0.4, ['x x? x? x x x? x? x x x? x? x x x? x x']),
    line('bass_drum', 0, 0.8, ['x x x x']),
    line('timpani', timpaniFloor, 0.55, ['r . r . f, . r .']),
  ];
}
