/**
 * Garden — a pastoral in G major, 96 BPM. Flute carries the tune over harp
 * and strings; nothing here hits hard. Twelve musicians for the twelve
 * spinners on the fence, seated like an orchestra: tune and sparkle along
 * the top row, harmony and motion in the middle, the foundation at the
 * bottom.
 *
 * At 96 BPM a bar is exactly 2.5 seconds, so a 30-second round is twelve
 * bars: the eight-bar form once through, then its first half again as the
 * finale drives it home.
 */

import type { Score } from '../orchestra/score.types';
import { drivingFinale, held, line, struck, tuttiFrenzy } from './shared';

export const GARDEN_SCORE: Score = {
  id: 'garden',
  bpm: 96,
  tonic: 'G',
  mode: 'major',
  chords: ['G', 'D/F#', 'Em', 'C', 'G', 'Em', 'C', 'D'],
  swing: 0,

  bed: [
    line('viola_sus', 55, 0.2, ['a+c - a+c -'], true),
    line('harp', 43, 0.34, ['r . . .']),
    line('shaker', 0, 0.2, ['x? x? x? x?']),
  ],

  seats: [
    // ── Top row: the tune and the sparkle ────────────────────────────────
    held(
      'flute',
      'Flute',
      'flute_sus',
      67,
      0.8,
      [
        "5 - 3 5 1' - 5 -",
        "7 - 6 5 2' - 5 -",
        "3' - 2' 1' 7 - 6 -",
        "6 - 1' 6 5 - - -",
        "5 - 3 5 1' - 3' -",
        "3' - 1' 7 6 - 5 -",
        "6 - 5 6 1' - 3' -",
        "2' - - 1' 7 - 2' -",
      ],
      {
        light: ["5 1'", "7 2'", "3' 7", '6 5', "5 1'", "3' 6", "6 1'", "2' 7"],
        spray: 'flute_stac',
      },
    ),
    struck('glock', 'Glockenspiel', 'glock', 72, 0.55, [". . f . r' . . t", ". t . . f . r' ."], {
      light: [". . . . r' . . ."],
    }),
    held('violins', 'Violins', 'violin_sus', 62, 0.66, ['c - c b'], {
      light: ['c -'],
      ornament: line('violin_sus', 74, 0.3, ['c - c b'], true),
      spray: 'violin_pizz',
    }),
    held('clarinet', 'Clarinet', 'clarinet_sus', 55, 0.6, ['. . . . t - f -', '. . t - f - o -'], {
      light: ['. . . . t - - -'],
      spray: 'clarinet_stac',
    }),

    // ── Middle row: harmony and motion ───────────────────────────────────
    struck('harp', 'Harp', 'harp', 55, 0.7, ["r f o t' f' t' o f"], {
      light: ["r o t' o"],
      ornament: line('harp', 67, 0.4, ['. . . .', '. . . . . . . . . . . . r t f o']),
    }),
    struck('pizzicato', 'Pizzicato', 'violin_pizz', 62, 0.7, ['. a+c . b . a+c . b+c'], {
      light: ['. . . c . . . c'],
    }),
    held('violas', 'Violas', 'viola_sus', 55, 0.48, ['a+b - a+c -'], {
      light: ['b -'],
      spray: 'violin_pizz',
    }),
    struck('marimba', 'Marimba', 'marimba', 55, 0.6, ["r . f o . t' o f"], {
      light: ['r . . . o . . .'],
      ornament: line('marimba', 67, 0.32, ['r . . f . . o .']),
    }),

    // ── Bottom row: the foundation ───────────────────────────────────────
    struck('bass', 'Double Bass', 'bass_pizz', 31, 0.78, ['z . . . f . . z'], {
      light: ['z . . .'],
      ornament: line('cello_pizz', 43, 0.45, ['z . . . f . . z']),
      sprayFloor: 43,
    }),
    struck('percussion', 'Percussion', 'shaker', 0, 0.5, ['x! x? x x? x! x? x x?'], {
      light: ['x . x . x . x .'],
      with: [line('bass_drum', 0, 0.75, ['x . . . x? . . .'])],
      ornament: line('tambourine', 0, 0.5, ['. x . x']),
      spray: 'tambourine',
    }),
    held('horn', 'French Horn', 'horn_sus', 50, 0.55, ['b - c -'], {
      light: ['b -'],
      spray: 'trumpet_stac',
      sprayFloor: 55,
    }),
    held('cellos', 'Cellos', 'cello_sus', 36, 0.6, ['z - - f'], {
      light: ['z -'],
      spray: 'cello_pizz',
    }),
  ],

  lineup: [
    'harp',
    'bass',
    'flute',
    'percussion',
    'glock',
    'cellos',
    'pizzicato',
    'violins',
    'clarinet',
    'marimba',
    'horn',
    'violas',
  ],

  finale: drivingFinale(67, 36),
  frenzy: tuttiFrenzy(60, 72, 36),
};
