/**
 * Funfair — a fairground brass band in F major at 120 BPM. The organ grinds
 * out the carousel tune, tuba goes "oom", clarinets go "pah", a snare keeps
 * the parade moving, and the band behind them is all wind and brass:
 * trumpet, trombone, horn, euphonium, saxophone, piccolo, bassoon. No strings
 * anywhere. Sixteen musicians for the sixteen spinners drifting across the
 * tent.
 */

import type { Bars, Score } from '../orchestra/score.types';
import { BANDSTAND_ROOM } from './rooms';
import { held, line, struck, tuttiFrenzy } from './shared';

const CAROUSEL_TUNE: Bars = [
  "5 3 1 3 5 3 1' .",
  '6 5 3 5 6 5 3 .',
  '5 4 2 4 5 4 7 .',
  "2' 7 5 7 2' - - .",
  "1' 5 3 5 1' 5 3' .",
  "1' 6 4 6 1' 6 4' .",
  "2' 7 5 7 4' 2' 7 .",
  "1' - 5 - 1' - . .",
];

export const FUNFAIR_SCORE: Score = {
  id: 'funfair',
  bpm: 120,
  tonic: 'F',
  mode: 'major',
  chords: ['F', 'F', 'C7', 'C7', 'F', 'Bb', 'C7', 'F'],
  swing: 0,

  bed: [
    line('horn_sus', 53, 0.16, ['a+c - a+c -'], true),
    line('tuba_stac', 34, 0.32, ['z . . .']),
    line('tambourine', 0, 0.14, ['. x? . x?']),
  ],

  seats: [
    // ── The oom-pah and the tune: enough for a parade ────────────────────
    struck('tuba', 'Tuba', 'tuba_stac', 34, 1.61, ['z . f .'], {
      light: ['z . . .'],
      sprayFloor: 41,
    }),
    struck('clarinets', 'Clarinets', 'clarinet_stac', 58, 0.63, ['. b+c . b+c . b+c . b+c'], {
      light: ['. . . b+c . . . b+c'],
    }),
    held('organ', 'Fairground Organ', 'organ', 53, 0.99, CAROUSEL_TUNE, {
      light: ["5 1'", '6 3', '5 7', "2' -", "1' 3'", "1' 4'", "2' 7", "1' -"],
      ornament: line('flute_stac', 65, 0.4, CAROUSEL_TUNE),
    }),
    struck('snare', 'Snare Drum', 'snare', 0, 0.9, ['x? . x . x? x? x .'], {
      light: ['. x . x'],
    }),

    // ── The rest of the bandstand ────────────────────────────────────────
    struck('bassdrum', 'Bass Drum & Cymbal', 'bass_drum', 0, 0.8, ['x . x .'], {
      light: ['x . . .'],
      ornament: line('cymbal_crash', 0, 0.2, ['x . . .', '. . . .', '. . . .', '. . . .']),
    }),
    struck('trumpet', 'Trumpet', 'trumpet_stac', 60, 0.9, ['r . . r f . . .', 'o . . f r . . .'], {
      light: ['r . . . . . . .'],
    }),
    struck('glock', 'Glockenspiel', 'glock', 77, 0.55, ['a . c . d . c .'], {
      light: ['a . . . d . . .'],
    }),
    struck('piccolo', 'Piccolo', 'flute_stac', 72, 0.56, ['. d . c . d . c'], {
      light: ['. . . d . . . d'],
    }),
    struck('trombone', 'Trombone', 'trombone_stac', 48, 0.73, ['r . f . o . f .'], {
      light: ['r . . . f . . .'],
    }),
    struck('xylophone', 'Xylophone', 'xylo', 65, 0.5, ["r t f o t' o f t"], {
      light: ['r . f . o . f .'],
    }),
    struck('sax', 'Saxophone', 'tenor_stac', 53, 0.8, ['r . . t f . . .', '. . f . t . r .'], {
      light: ['r . . . f . . .', '. . . .'],
    }),
    held('horn', 'French Horn', 'horn_sus', 50, 0.45, ['b - c -'], {
      light: ['b -'],
    }),
    struck('bassoon', 'Bassoon', 'bassoon_stac', 41, 0.65, ['. f . f . f . f'], {
      light: ['. . . f . . . f'],
    }),
    held('euphonium', 'Euphonium', 'trombone_sus', 46, 0.46, ['z - - - f - - -'], {
      icon: 'euphonium',
      light: ['z -'],
    }),
    held(
      'clarinet',
      'Solo Clarinet',
      'clarinet_sus',
      60,
      0.5,
      ['. . . . t - f -', '. . t - f - o -'],
      {
        light: ['. . . . t - - -'],
      },
    ),
    struck('guitar', 'Guitar', 'jazz_guitar', 53, 0.42, ['r f o f r f o f'], {
      icon: 'acoustic_guitar',
      light: ['r . o . r . o .'],
    }),
  ],

  lineup: [
    'tuba',
    'clarinets',
    'organ',
    'snare',
    'bassdrum',
    'trumpet',
    'glock',
    'piccolo',
    'trombone',
    'xylophone',
    'sax',
    'horn',
    'bassoon',
    'euphonium',
    'clarinet',
    'guitar',
  ],

  // The last third: the snare rolls into every bar and the brass doubles the off-beats.
  finale: [
    line('snare', 0, 0.36, ['x x? x x? x x x? x']),
    line('trombone_stac', 48, 0.4, ['. a+c . a+c . a+c . a+c']),
    line('tambourine', 0, 0.3, ['x x? x x? x x? x x?']),
  ],
  frenzy: tuttiFrenzy(60, 72, 36),

  // An open bandstand; the brass band's own voices for the fanfare, the closing chord and the chimes.
  room: BANDSTAND_ROOM,
  palette: {
    instruments: {
      roll: 'snare_roll',
      shimmer: 'tambourine',
      ting: 'tambourine',
      boom: 'tuba_stac',
      bass: 'tuba_stac',
      sustain: 'trombone_sus',
      pad: 'horn_sus',
      pluck: 'marimba',
    },
    shifts: { pad: -12 },
  },
};
