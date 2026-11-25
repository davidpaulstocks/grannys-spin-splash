/**
 * Disco — a funk and disco band in D minor at 118 BPM. Four on the floor, an
 * octave-jumping bass guitar, hi-hats opening on every off-beat and a
 * chopped rhythm guitar make the groove; soaring strings carry the tune; then
 * electric piano, clavinet, congas and a horn section pile on. Twenty
 * musicians for the wall, plus the mirror ball itself, which shimmers.
 *
 * The first five seats are the groove on their own — bass, kick, hats,
 * guitar, strings — so the first gig already sounds like the dance floor.
 */

import type { Score } from '../orchestra/score.types';
import { held, line, struck } from './shared';

export const DISCO_SCORE: Score = {
  id: 'disco',
  bpm: 118,
  tonic: 'D',
  mode: 'minor',
  chords: ['Dm', 'Dm', 'Bb', 'C', 'Dm', 'Gm', 'Bb', 'C'],
  swing: 0,

  bed: [
    line('ebass', 26, 0.3, ['r . . . r . . .']),
    line('kick', 0, 0.3, ['x x x x']),
    line('viola_sus', 53, 0.16, ['a+c - a+c -'], true),
  ],

  seats: [
    // ── The groove ───────────────────────────────────────────────────────
    struck('bass', 'Bass Guitar', 'ebass', 26, 1.06, ['r o r o r o r o'], {
      light: ['r . r . r . r .'],
      ornament: line('ebass_stac', 38, 0.4, ['. . . r . . . r . . . r . . r r']),
      sprayFloor: 38,
    }),
    struck('kick', 'Kick Drum', 'kick', 0, 1.19, ['x x x x'], {
      light: ['x . x .'],
    }),
    struck(
      'hats',
      'Hi-Hats',
      'hat_closed',
      0,
      0.71,
      ['x? x? x x? x? x? x x? x? x? x x? x? x? x x?'],
      {
        light: ['. x . x . x . x'],
        with: [line('hat_open', 0, 0.3, ['. x . x . x . x'])],
      },
    ),
    held(
      'guitar',
      'Rhythm Guitar',
      'jazz_guitar',
      57,
      0.75,
      ['. a+c . a+c a+c . a+c . . a+c . a+c a+c . a+c .'],
      { light: ['. . a+c . . . a+c .'] },
    ),
    held(
      'strings',
      'Disco Strings',
      'violin_sus',
      62,
      1.24,
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
      { light: ["1' 5", '3 5', "3' 6", "2' 4'", "5' 1'", "6 1'", "3' 1'", "2' 7"] },
    ),

    // ── The band fills out ───────────────────────────────────────────────
    struck('snare', 'Snare & Claps', 'snare_kit', 0, 0.85, ['. x . x'], {
      light: ['. . . x'],
      with: [line('clap', 0, 0.45, ['. x . x'])],
    }),
    struck('epiano', 'Electric Piano', 'epiano', 53, 0.5, ['. a+b+c . . . a+b+c . .'], {
      light: ['. . . a+b+c . . . .'],
    }),
    struck('congas', 'Congas', 'conga', 0, 0.42, ['x . x? x . x x? . x . x? x . x x? .'], {
      light: ['x . . . x . . .'],
    }),
    struck(
      'trumpet',
      'Trumpet',
      'trumpet_stac',
      62,
      0.9,
      ['. . . .', '. . o . . o . . f . o . . . . .'],
      {
        light: ['. . . .', '. . o . . . . .'],
      },
    ),
    struck('clav', 'Clavinet', 'clav', 50, 0.45, ['r . . r o . r . . r . o r . f .'], {
      light: ['r . . . o . . .'],
    }),

    // ── The horn section and the toys ────────────────────────────────────
    struck('sax', 'Saxophone', 'tenor_stac', 50, 0.85, ['. . . .', 'r . r t f . o .'], {
      light: ['. . . .', 'r . . . f . . .'],
    }),
    struck(
      'trombone',
      'Trombone',
      'trombone_stac',
      50,
      0.87,
      ['. . . .', '. . r . . r . . f . r . . . . .'],
      {
        light: ['. . . .', '. . r . . . . .'],
      },
    ),
    struck('cowbell', 'Cowbell', 'cowbell', 0, 0.6, ['x . x . x . x x'], {
      light: ['x . . . x . . .'],
      with: [line('claves', 0, 0.36, ['. . x . . x . .'])],
    }),
    struck('tambourine', 'Tambourine', 'tambourine', 0, 0.55, ['. x . x . x . x'], {
      light: ['. . . x . . . x'],
    }),
    struck(
      'chops',
      'Violins',
      'violin_spic',
      62,
      0.48,
      ['. a+c . . a+c . a+c . . a+c . . a+c . . .'],
      {
        light: ['. a+c . . . a+c . .'],
      },
    ),

    // ── The top of the mix ───────────────────────────────────────────────
    struck('glock', 'Glockenspiel', 'glock', 74, 0.6, ['. . a . . . d .'], {
      light: ['. . . . . . d .'],
    }),
    struck('harp', 'Harp', 'harp', 50, 0.42, ["r f o t' f' t' o f"], {
      light: ["r o t' o"],
      ornament: line('harp', 62, 0.34, ['. . . .', ". . . . . . . . r t f o r' t' f' o'"]),
    }),
    held('violas', 'Violas', 'viola_sus', 53, 0.42, ['a+b - a+c -'], {
      light: ['b -'],
    }),
    struck('flute', 'Flute', 'flute_stac', 74, 0.84, ['. . . . d . c d', '. . . .'], {
      light: ['. . . . d . . .', '. . . .'],
    }),
    held('cellos', 'Cellos', 'cello_sus', 38, 0.5, ['z - - f'], {
      light: ['z -'],
    }),

    // ── The mirror ball ──────────────────────────────────────────────────
    struck('mirrorball', 'Mirror Ball', 'triangle', 0, 0.62, ['x? x x? x x? x x? x'], {
      light: ['. x . x'],
      with: [line('bell_tree', 0, 0.3, ['x . . .', '. . . .', '. . . .', '. . . .'])],
    }),
  ],

  lineup: [
    'bass',
    'kick',
    'hats',
    'guitar',
    'strings',
    'snare',
    'epiano',
    'congas',
    'trumpet',
    'clav',
    'sax',
    'trombone',
    'cowbell',
    'tambourine',
    'chops',
    'glock',
    'harp',
    'violas',
    'flute',
    'cellos',
    'mirrorball',
  ],

  // The last third: driving strings, a tambourine, and a snare pick-up into every bar.
  finale: [
    line('violin_spic', 62, 0.4, ['a c b c a c b c']),
    line('tambourine', 0, 0.3, ['x x? x x? x x? x x?']),
    line('snare_kit', 0, 0.32, ['. . . . . . . . . . . . x? x? x x']),
  ],

  // Frenzy is the breakdown's payoff: crash, the whole horn section hitting together, bells on top.
  frenzy: [
    line('crash', 0, 0.36, ['x . . .', '. . . .']),
    line('kick', 0, 0.85, ['x x x x']),
    line('clap', 0, 0.55, ['. x . x']),
    line('trumpet_stac', 62, 0.5, ['a+c . . a+c . . a+c . a+c . . a+c . a+c . .']),
    line('tenor_stac', 50, 0.5, ['r . . r . . r . r . . r . f . .']),
    line('glock', 74, 0.3, ["a b c d a b c d a' b' c' d a' b' c' d"]),
    line('conga', 0, 0.4, ['x x? x x x? x x x? x x? x x x? x x x?']),
  ],
};
