/**
 * Disco — D minor, 120 BPM, four on the floor. Soaring strings over an
 * octave-jumping bass, chopped violins where the rhythm guitar would be,
 * off-beat hi-hats, cowbell, and brass stabs every other bar. Twenty
 * musicians for the wall, plus the mirror ball itself, which shimmers.
 */

import type { Score } from '../orchestra/score.types';
import { drivingFinale, held, line, struck, tuttiFrenzy } from './shared';

export const DISCO_SCORE: Score = {
  id: 'disco',
  bpm: 120,
  tonic: 'D',
  mode: 'minor',
  chords: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Gm', 'Bb', 'C'],
  swing: 0,

  bed: [
    line('viola_sus', 53, 0.2, ['a+c - a+c -'], true),
    line('bass_pizz', 26, 0.36, ['r . . . r . . .']),
    line('bass_drum', 0, 0.3, ['x x x x']),
  ],

  seats: [
    // ── Top row: the hooks ───────────────────────────────────────────────
    held(
      'strings',
      'Disco Strings',
      'violin_sus',
      62,
      0.6,
      [
        "1' - - - - 7 5 4",
        '3 - - - 5 - - -',
        "3' - - - - 1' 6 4",
        "2' - - - 4' - - -",
        "5' - - - - 4' 3' 1'",
        "6 - - - 1' - 4' -",
        "3' - - - - 4' 3' 1'",
        "2' - - - 7 - 2' 4'",
      ],
      {
        light: ["1' 5", '3 5', "3' 6", "2' 4'", "5' 1'", "6 1'", "3' 1'", "2' 7"],
      },
    ),
    struck(
      'trumpet',
      'Trumpet',
      'trumpet_stac',
      62,
      0.5,
      ['. . . .', '. . o . . o . . f . o . . . . .'],
      { light: ['. . . .', '. . o . . . . .'] },
    ),
    struck('flute', 'Flute', 'flute_stac', 74, 0.45, ['. . . . d . c d', '. . . .'], {
      light: ['. . . . d . . .', '. . . .'],
    }),
    struck('glock', 'Glockenspiel', 'glock', 74, 0.5, ['. . a . . . d .'], {
      light: ['. . . . . . d .'],
    }),
    struck('xylophone', 'Xylophone', 'xylo', 62, 0.45, ['r . . r . . o . . r . . o . f .'], {
      light: ['r . . . o . . .'],
    }),

    // ── Second row: the groove ───────────────────────────────────────────
    struck(
      'chops',
      'Violins',
      'violin_spic',
      62,
      0.5,
      ['. a+c . . a+c . a+c . . a+c . . a+c . . .'],
      { light: ['. a+c . . . a+c . .'] },
    ),
    struck('pizzicato', 'Pizzicato', 'violin_pizz', 57, 0.6, ['. b . c . b . c'], {
      light: ['. . . c . . . c'],
    }),
    struck('marimba', 'Marimba', 'marimba', 50, 0.5, ['r . f o . f o .'], {
      light: ['r . . . o . . .'],
    }),
    struck('harp', 'Harp', 'harp', 50, 0.55, ["r f o t' f' t' o f"], {
      light: ["r o t' o"],
      ornament: line('harp', 62, 0.35, ['. . . .', ". . . . . . . . r t f o r' t' f' o'"]),
    }),
    held('clarinet', 'Clarinet', 'clarinet_sus', 53, 0.5, ['. . . . t - f -', '. . t - f - o -'], {
      light: ['. . . . t - - -'],
    }),

    // ── Third row: the pad ───────────────────────────────────────────────
    held('violas', 'Violas', 'viola_sus', 53, 0.42, ['a+b - a+c -'], {
      light: ['b -'],
    }),
    held('horn', 'French Horn', 'horn_sus', 50, 0.45, ['b - c -'], {
      light: ['b -'],
    }),
    held('organ', 'Organ', 'organ', 53, 0.45, ['. a+b+c . . . a+b+c . .'], {
      light: ['. . . a+b+c . . . .'],
    }),
    held('cellos', 'Cellos', 'cello_sus', 38, 0.5, ['z - - f'], {
      light: ['z -'],
    }),
    struck('bassoon', 'Bassoon', 'bassoon_stac', 38, 0.6, ['. . z . . z . . . . z . z . . .'], {
      light: ['. . z . . . . .'],
    }),

    // ── Bottom row: the floor ────────────────────────────────────────────
    struck('bass', 'Bass', 'bass_pizz', 26, 0.78, ['r o r o r o r o'], {
      light: ['r . r . r . r .'],
      sprayFloor: 38,
    }),
    struck('kick', 'Kick & Snare', 'bass_drum', 0, 0.85, ['x x x x'], {
      light: ['x . x .'],
      with: [line('snare', 0, 0.45, ['. x . x'])],
      spray: 'snare',
    }),
    struck('hats', 'Hi-Hats', 'shaker', 0, 0.5, ['x? x? x x? x? x? x x? x? x? x x? x? x? x x?'], {
      light: ['. x . x . x . x'],
      ornament: line('tambourine', 0, 0.4, ['. x . x . x . x']),
    }),
    struck('cowbell', 'Cowbell', 'cowbell', 0, 0.4, ['x . x . x . x x'], {
      light: ['x . . . x . . .'],
      with: [line('claves', 0, 0.4, ['. . x . . x . .'])],
    }),
    struck('cellopizz', 'Plucked Cellos', 'cello_pizz', 38, 0.6, ['. f . o . f . o'], {
      light: ['. . . o . . . o'],
    }),

    // ── The mirror ball ──────────────────────────────────────────────────
    struck('mirrorball', 'Mirror Ball', 'triangle', 0, 0.45, ['x? x x? x x? x x? x'], {
      light: ['. x . x'],
      with: [line('bell_tree', 0, 0.3, ['x . . .', '. . . .', '. . . .', '. . . .'])],
    }),
  ],

  lineup: [
    'bass',
    'kick',
    'strings',
    'hats',
    'chops',
    'pizzicato',
    'organ',
    'cowbell',
    'trumpet',
    'marimba',
    'harp',
    'glock',
    'cellopizz',
    'clarinet',
    'xylophone',
    'flute',
    'bassoon',
    'violas',
    'horn',
    'cellos',
    'mirrorball',
  ],

  finale: drivingFinale(62, 36),
  frenzy: tuttiFrenzy(62, 74, 36),
};
