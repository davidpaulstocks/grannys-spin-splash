/**
 * Workshop — a garage rock band in A minor at 136 BPM, straight eighths,
 * over the four chords every garage band starts with (Am–F–C–G). The drums
 * carry it: kick on one and three with a pickup, the snare hard on two and
 * four, hats driving in eighths, a crash at the top of the form. The bass
 * locks to the kick, the rhythm guitar chugs palm-muted power chords on the
 * same accents, and the lead guitar plays a short pentatonic hook with gaps
 * for the rhythm section. Those four are the opening band; then organ,
 * tambourine, handclaps, cowbell, toms, cymbals and the anvil, and the soft
 * colours (piano, sax, horns, a clean guitar) last. Fifteen musicians for
 * the fifteen spinners.
 *
 * The guitars are the jazz band's guitar recordings played through the
 * engine's amp (`drive`): root and fifth together through it are a power
 * chord.
 */

import type { Bars, Score } from '../orchestra/score.types';
import { GARAGE_ROOM } from './rooms';
import { held, line, struck } from './shared';

/** How hard the rhythm and lead guitars hit the amp. */
const RHYTHM_DRIVE = 0.85;
const LEAD_DRIVE = 0.7;

/** The drums are the loudest thing in the band; the snare is the loudest thing in the drums. */
const KICK_LEVEL = 1.15;
const SNARE_LEVEL = 1.05;

/** Accented, ghosted power chords locked to the kick: beats 1 and 3, the pickup before 3, and a palm-muted chug between. */
const CHUG: Bars = [
  'r!+f! r+f? r+f? r!+f! r!+f! r+f? r+f? r+f?',
  'r!+f! r+f? r+f? r!+f! r!+f! r+f? r+f? r+f?',
  'r!+f! r+f? r+f? r!+f! r!+f! r+f? r+f? r+f?',
  'r!+f! r+f? r+f? r!+f! r!+f! r+f? r!+f! r+f?',
];

/** The bass: roots in eighths, accented where the kick lands. */
const BASS_EIGHTHS: Bars = [
  'r! r r r! r! r r r',
  'r! r r r! r! r r r',
  'r! r r r! r! r r r',
  'r! r r r! r! r r f',
];

/** The lead guitar's hook: A minor pentatonic, a few notes and then air. Repeats every four bars, with a turnaround at the end. */
const HOOK: Bars = [
  '1 . 1 3 5 . . .',
  '5 . 5 4 3 . . .',
  '1 . 1 3 5 . 7 .',
  '5 . 3 . 1 . . .',
  '1 . 1 3 5 . . .',
  '5 . 5 4 3 . . .',
  '1 . 1 3 5 . 7 .',
  "5 . 7 . 1' . . .",
];

export const WORKSHOP_SCORE: Score = {
  id: 'workshop',
  bpm: 136,
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
    // ── The band: drums, bass, rhythm guitar, lead guitar ────────────────
    struck(
      'drums',
      'Drum Kit',
      'kick',
      0,
      KICK_LEVEL,
      ['x . . x x . . .', 'x . . x x . . .', 'x . . x x . . .', 'x . . x x . x .'],
      {
        icon: 'drum_kit',
        light: ['x . . . x . . .'],
        with: [
          // The backbeat: snare hard on two and four, a fill every fourth bar.
          line('snare_kit', 0, SNARE_LEVEL, [
            '. . x! . . . x! .',
            '. . x! . . . x! .',
            '. . x! . . . x! .',
            '. . x! . . x x! x!',
          ]),
          line('hat_closed', 0, 0.45, ['x x x x x x x x']),
          // A crash at the top of the form, and again at the top of the second half.
          line('crash', 0, 0.5, [
            'x . . .',
            '. . . .',
            '. . . .',
            '. . . .',
            'x? . . .',
            '. . . .',
            '. . . .',
            '. . . .',
          ]),
        ],
        ornament: line('rimshot', 0, 0.4, ['. . . . . . . x']),
        spray: 'snare_kit',
      },
    ),
    struck('bass', 'Bass Guitar', 'ebass', 28, 1.06, BASS_EIGHTHS, {
      light: ['r . r . r . r .'],
      sprayFloor: 40,
    }),
    struck('rhythm', 'Rhythm Guitar', 'jazz_guitar', 40, 0.55, CHUG, {
      light: ['r+f . . . r+f . . .'],
      drive: RHYTHM_DRIVE,
      ornament: line('jazz_guitar', 52, 0.3, ['o . . o o . . .']),
      sprayFloor: 40,
    }),
    struck('lead', 'Lead Guitar', 'jazz_guitar', 57, 0.55, HOOK, {
      light: ["1' . . . 5 . . .", '6 . . . 3 . . .', "1' . . . 5 . . .", '5 . . . 1 . . .'],
      drive: LEAD_DRIVE,
      sprayFloor: 57,
    }),

    // ── The second wave ──────────────────────────────────────────────────
    held('organ', 'Organ', 'organ', 53, 0.45, ['a+b+c - - - a+b+c - . .'], {
      light: ['a+c -'],
    }),
    struck('tambourine', 'Tambourine', 'tambourine', 0, 0.59, ['x x? x x? x x? x x?'], {
      light: ['. x . x'],
    }),
    struck('claps', 'Handclaps', 'clap', 0, 0.85, ['. . x . . . x .'], {
      light: ['. x . x'],
    }),
    struck('cowbell', 'Cowbell', 'cowbell', 0, 0.64, ['x . x . x . x .'], {
      light: ['x . . . x . . .'],
    }),
    struck('toms', 'Tom-Toms', 'tom_lo', 0, 0.6, ['. . . .', '. . . . x . x x'], {
      light: ['. . . .', '. . . . . . x .'],
      with: [line('tom_hi', 0, 0.55, ['. . . .', '. . . . . x . .'])],
      spray: 'tom_hi',
    }),
    struck('cymbals', 'Cymbals', 'hat_open', 0, 0.72, ['. . . . . . . x'], {
      light: ['. . . .'],
      with: [line('crash', 0, 0.34, ['x . . .', '. . . .', '. . . .', '. . . .'])],
    }),

    // ── The workshop itself ──────────────────────────────────────────────
    struck('anvil', 'Anvil & Woodblocks', 'claves', 0, 0.77, ['x . x? . x . x? x?'], {
      light: ['x . . . x . . .'],
      with: [line('anvil', 0, 0.34, ['. . . .', '. . x .'])],
    }),

    // ── The soft colours, last ───────────────────────────────────────────
    struck('piano', 'Piano', 'piano', 60, 0.38, ['a+c a+c a+c a+c a+c a+c a+c a+c'], {
      light: ['a+c . a+c . a+c . a+c .'],
      ornament: line('piano', 72, 0.26, ['. . c . . . c .']),
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
  ],

  lineup: [
    'drums',
    'bass',
    'rhythm',
    'lead',
    'organ',
    'tambourine',
    'claps',
    'cowbell',
    'toms',
    'cymbals',
    'anvil',
    'piano',
    'sax',
    'horns',
    'clean',
  ],

  // The last third: a snare and tom build that climbs every four bars, and the hats open up.
  finale: [
    line('hat_open', 0, 0.4, ['. x . x . x . x']),
    line('snare_kit', 0, 0.6, [
      '. . x . . . x .',
      '. . x . . . x .',
      '. . x . . . x x',
      'x x x x x x x x',
    ]),
    line('tom_lo', 0, 0.6, [
      '. . . . . . . .',
      '. . . . . . . .',
      '. . . . . . x x',
      '. . x x x x x x',
    ]),
    line('tom_hi', 0, 0.55, [
      '. . . . . . . .',
      '. . . . . . . .',
      '. . . . x x . .',
      'x x . . . . . .',
    ]),
  ],

  // Frenzy is the last chorus: a crash on every bar, the kit on four-on-the-floor,
  // and both guitars and the bass in unison on the riff.
  frenzy: [
    line('crash', 0, 0.55, ['x . . .']),
    line('kick', 0, KICK_LEVEL, ['x x x x']),
    line('snare_kit', 0, SNARE_LEVEL, ['. x! . x!']),
    line('hat_open', 0, 0.45, ['. x . x']),
    line('tom_lo', 0, 0.6, ['. . . . . . x x']),
    line('jazz_guitar', 40, 0.55, CHUG, false, RHYTHM_DRIVE),
    line('jazz_guitar', 52, 0.4, CHUG, false, LEAD_DRIVE),
    line('ebass', 28, 1.0, BASS_EIGHTHS),
  ],

  // A dry garage; the band's own kit, organ and guitar play the fanfare, the closing chord and the chimes.
  room: GARAGE_ROOM,
  palette: {
    instruments: {
      roll: 'snare_kit',
      swell: 'hat_open',
      crash: 'crash',
      shimmer: 'hat_open',
      ting: 'hat_closed',
      boom: 'tom_lo',
      thump: 'kick',
      bass: 'ebass',
      sustain: 'organ',
      pad: 'organ',
      lead: 'jazz_guitar',
      pluck: 'piano',
      chime: 'piano',
      tap: 'piano',
      knock: 'jazz_guitar',
    },
    shifts: { pad: -12, lead: -12, pluck: -12, chime: -12, tap: -24 },
    leadDrive: LEAD_DRIVE,
  },
};
