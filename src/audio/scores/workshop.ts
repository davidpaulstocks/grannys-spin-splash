/**
 * Workshop — a garage rock band in A minor at 132 BPM, straight eighths,
 * over the four chords every garage band starts with (Am–F–C–G). Drums, bass
 * and a rhythm guitar through a cranked amp make the opening band with an
 * organ; then lead guitar, tambourine, handclaps, cowbell, toms, a pounding
 * piano and a horn section pile in. The anvil and woodblocks are the workshop
 * itself keeping time. Fifteen musicians for the fifteen spinners.
 *
 * The guitars are the jazz band's guitar recordings played through the
 * engine's amp (`drive`): root and fifth together through it are a power
 * chord.
 */

import type { Score } from '../orchestra/score.types';
import { held, line, struck } from './shared';

/** How hard the rhythm and lead guitars hit the amp. */
const RHYTHM_DRIVE = 0.85;
const LEAD_DRIVE = 0.7;

export const WORKSHOP_SCORE: Score = {
  id: 'workshop',
  bpm: 132,
  tonic: 'A',
  mode: 'minor',
  chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'Em'],
  swing: 0,

  bed: [
    line('ebass', 28, 0.3, ['r . . .']),
    line('hat_closed', 0, 0.2, ['x? x? x? x?']),
    line('organ', 48, 0.12, ['a+c - - -'], true),
  ],

  seats: [
    // ── The band: drums, bass, rhythm guitar, organ ──────────────────────
    struck('drums', 'Drum Kit', 'kick', 0, 0.8, ['x . . x x . . .'], {
      light: ['x . . . x . . .'],
      with: [
        line('snare_kit', 0, 0.6, ['. . x . . . x .']),
        line('hat_closed', 0, 0.3, ['x x x x x x x x']),
      ],
      ornament: line('rimshot', 0, 0.4, ['. . . . . . . x']),
      spray: 'snare_kit',
    }),
    struck('bass', 'Bass Guitar', 'ebass', 28, 1.06, ['r r r r r r r f'], {
      light: ['r . r . r . r .'],
      sprayFloor: 40,
    }),
    struck('rhythm', 'Rhythm Guitar', 'jazz_guitar', 40, 0.55, ['r+f r+f . r+f r+f . r+f r+f'], {
      light: ['r+f . . . r+f . . .'],
      drive: RHYTHM_DRIVE,
      ornament: line('jazz_guitar', 52, 0.3, ['o . . o . . o .']),
      sprayFloor: 40,
    }),
    held('organ', 'Organ', 'organ', 53, 0.45, ['a+b+c - - - a+b+c - . .'], {
      light: ['a+c -'],
    }),

    // ── Lead and colour ──────────────────────────────────────────────────
    struck(
      'lead',
      'Lead Guitar',
      'jazz_guitar',
      57,
      0.55,
      [
        "1' . 1' 7 1' . 5 .",
        "6 . 6 5 6 . 1' .",
        "7 . 7 5 7 . 3' .",
        "7 . 7 4 7 . 2' .",
        "1' . 3' 1' 7 . 5 .",
        "1' . 6 5 6 . 3 .",
        "2' . 7 4 7 . 2' .",
        "5 . 7 . 2' . . .",
      ],
      {
        light: ["1' . . . 5 . . .", "6 . . . 1' . . .", "7 . . . 3' . . .", "7 . . . 2' . . ."],
        drive: LEAD_DRIVE,
        sprayFloor: 57,
      },
    ),
    struck('tambourine', 'Tambourine', 'tambourine', 0, 0.59, ['x x? x x? x x? x x?'], {
      light: ['. x . x'],
    }),
    struck('claps', 'Handclaps', 'clap', 0, 0.85, ['. . x . . . x x'], {
      light: ['. x . x'],
    }),
    struck('piano', 'Piano', 'piano', 60, 0.38, ['a+c a+c a+c a+c a+c a+c a+c a+c'], {
      light: ['a+c . a+c . a+c . a+c .'],
      ornament: line('piano', 72, 0.26, ['. . c . . . c .']),
    }),
    struck('cowbell', 'Cowbell', 'cowbell', 0, 0.64, ['x . x . x . x .'], {
      light: ['x . . . x . . .'],
    }),

    // ── The second wave ──────────────────────────────────────────────────
    struck('toms', 'Tom-Toms', 'tom_lo', 0, 0.6, ['. . . .', '. . . . x . x x'], {
      light: ['. . . .', '. . . . . . x .'],
      with: [line('tom_hi', 0, 0.55, ['. . . .', '. . . . . x . .'])],
      spray: 'tom_hi',
    }),
    struck('cymbals', 'Cymbals', 'hat_open', 0, 0.72, ['. . . . . . . x'], {
      light: ['. . . .'],
      with: [line('crash', 0, 0.34, ['x . . .', '. . . .', '. . . .', '. . . .'])],
    }),
    struck('sax', 'Saxophone', 'tenor_stac', 48, 0.9, ['. . . . r . r t', 'f . . . . . . .'], {
      light: ['. . . . r . . .', '. . . .'],
    }),
    struck(
      'horns',
      'Horns',
      'trumpet_stac',
      57,
      0.77,
      ['a+c . . a+c . . . .', '. . . . a+c . a+c .'],
      {
        light: ['a+c . . . . . . .', '. . . .'],
        with: [line('trombone_stac', 45, 0.4, ['r . . r . . . .', '. . . . r . r .'])],
      },
    ),
    struck('clean', 'Second Guitar', 'jazz_guitar', 52, 0.45, ["r f o t' f o t' f"], {
      light: ["r . o . t' . o ."],
    }),

    // ── The workshop itself ──────────────────────────────────────────────
    struck('anvil', 'Anvil & Woodblocks', 'claves', 0, 0.77, ['x . x? . x . x? x?'], {
      light: ['x . . . x . . .'],
      with: [line('anvil', 0, 0.34, ['. . . .', '. . x .'])],
    }),
  ],

  lineup: [
    'drums',
    'bass',
    'rhythm',
    'organ',
    'lead',
    'tambourine',
    'claps',
    'piano',
    'cowbell',
    'toms',
    'cymbals',
    'sax',
    'horns',
    'clean',
    'anvil',
  ],

  // The last third: the hats open up and the snare doubles.
  finale: [
    line('hat_open', 0, 0.3, ['. x . x . x . x']),
    line('snare_kit', 0, 0.34, ['. . x . . x x x']),
    line('piano', 60, 0.3, ['a+c a+c a+c a+c a+c a+c a+c a+c']),
  ],

  // Frenzy is the last chorus: crash on every bar, everyone on the root, drums rolling.
  frenzy: [
    line('crash', 0, 0.4, ['x . . .']),
    line('kick', 0, 0.8, ['x x x x']),
    line('snare_kit', 0, 0.5, ['. x . x . x x x']),
    line('tom_lo', 0, 0.5, ['. . . . . . x x']),
    line('trumpet_stac', 57, 0.5, ['a+c . a+c . a+c a+c . a+c']),
    line('tenor_stac', 48, 0.5, ['r . r . r r . f']),
  ],
};
