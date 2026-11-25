/**
 * Kitchen — a bouncy, swung tune in C major, 112 BPM, over the oldest
 * progression there is (I–vi–ii–V). Clarinet has the melody, the double
 * bass walks, a shaker stands in for the whisk and claves and cowbell are
 * the pots and pans. Sixteen musicians for the sixteen spinners.
 *
 * Swung scores keep to eighth notes: only off-beat eighths are delayed, so a
 * sixteenth written between them would land in the wrong place.
 */

import type { Score } from '../orchestra/score.types';
import { drivingFinale, held, line, struck, tuttiFrenzy } from './shared';

/** Triplet swing: the off-beat eighth lands two-thirds of the way through the beat. */
const TRIPLET_SWING = 1 / 6;

export const KITCHEN_SCORE: Score = {
  id: 'kitchen',
  bpm: 112,
  tonic: 'C',
  mode: 'major',
  chords: ['C', 'Am', 'Dm', 'G7', 'C', 'Am', 'F', 'G7'],
  swing: TRIPLET_SWING,

  bed: [
    line('viola_sus', 55, 0.2, ['a+c - a+c -'], true),
    line('bass_pizz', 36, 0.34, ['r . . .']),
    line('shaker', 0, 0.2, ['x? x? x? x?']),
  ],

  seats: [
    // ── Top shelf: the tune and its answers ──────────────────────────────
    held(
      'clarinet',
      'Clarinet',
      'clarinet_sus',
      60,
      0.65,
      [
        "5 . 3 5 1' . 6 5",
        '3 . 1 3 6 . 5 3',
        "4 . 2 4 6 . 1' 6",
        "5 . 7 2' 4' - 2' -",
        "3' . 1' 3' 5' . 3' 1'",
        "1' . 6 1' 3' . 1' 6",
        "6 . 4 6 1' . 6 4",
        "5 - 7 - 2' - - .",
      ],
      {
        light: ["5 1'", '3 6', '4 6', "5 2'", "3' 5'", "1' 3'", "6 1'", '5 7'],
        spray: 'clarinet_stac',
      },
    ),
    struck('glock', 'Glockenspiel', 'glock', 76, 0.5, ['. . d . . . c .'], {
      light: ['. . d . . . . .'],
    }),
    struck('flute', 'Flute', 'flute_stac', 72, 0.5, ['. . . . . . c d', 'b . . . . . . .'], {
      light: ['. . . . . . . d', '. . . .'],
    }),
    struck('trumpet', 'Trumpet', 'trumpet_stac', 60, 0.5, ['. . . .', '. . . . o . o f'], {
      light: ['. . . .', '. . o .'],
    }),

    // ── Second shelf: the bounce ─────────────────────────────────────────
    struck('marimba', 'Marimba', 'marimba', 60, 0.6, ["r . f o . f t' ."], {
      light: ['r . . . f . . .'],
    }),
    struck('pizzicato', 'Pizzicato', 'violin_pizz', 60, 0.65, ['. a+b+c . a+b+c'], {
      light: ['. . . a+c'],
    }),
    struck('xylophone', 'Xylophone', 'xylo', 72, 0.5, ['. . . . d c d .', '. . . .'], {
      light: ['. . . . d . . .', '. . . .'],
    }),
    struck('harp', 'Harp', 'harp', 48, 0.6, ["r f o t' f' t' o f"], {
      light: ["r o t' o"],
    }),

    // ── Third shelf: the warmth ──────────────────────────────────────────
    held('violas', 'Violas', 'viola_sus', 55, 0.42, ['a+b - a+c -'], {
      light: ['b -'],
      spray: 'violin_pizz',
      sprayFloor: 60,
    }),
    held('horn', 'French Horn', 'horn_sus', 50, 0.48, ['b - c -'], {
      light: ['b -'],
      spray: 'trumpet_stac',
      sprayFloor: 60,
    }),
    held('violins', 'Violins', 'violin_sus', 64, 0.5, ['c - c b'], {
      light: ['c -'],
      spray: 'violin_pizz',
    }),
    struck('bassoon', 'Bassoon', 'bassoon_stac', 36, 0.7, ['z . . f . z . .'], {
      light: ['z . . .'],
    }),

    // ── Worktop: the rhythm section ──────────────────────────────────────
    struck('bass', 'Double Bass', 'bass_pizz', 28, 0.78, ['r t f t'], {
      light: ['r . f .'],
      sprayFloor: 40,
    }),
    struck('whisk', 'Whisk', 'shaker', 0, 0.5, ['x x? x x? x x? x x?'], {
      light: ['x . x . x . x .'],
      ornament: line('triangle', 0, 0.4, ['. . . x']),
    }),
    struck('pots', 'Pots & Pans', 'claves', 0, 0.5, ['x . . x . . x .'], {
      light: ['x . . . x . . .'],
      with: [line('bass_drum', 0, 0.7, ['x . . . x . . .'])],
      ornament: line('cowbell', 0, 0.3, ['. . x . . . x .']),
    }),
    struck('cellos', 'Cellos', 'cello_pizz', 48, 0.6, ['. o . f'], {
      light: ['. . . f'],
    }),
  ],

  lineup: [
    'bass',
    'pizzicato',
    'clarinet',
    'whisk',
    'marimba',
    'pots',
    'harp',
    'glock',
    'cellos',
    'flute',
    'violins',
    'bassoon',
    'xylophone',
    'trumpet',
    'horn',
    'violas',
  ],

  finale: drivingFinale(64, 36),
  frenzy: tuttiFrenzy(60, 72, 36),
};
