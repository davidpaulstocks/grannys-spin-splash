/**
 * Kitchen — a jazz combo, swung, in C major at 116 BPM, over the turnaround
 * every jazz musician learns first (I–vi–ii–V, then iii–vi–ii–V). The first
 * band in the game that is not an orchestra: walking upright bass, ride
 * cymbal, piano and tenor sax, then brushes, vibraphone, guitar and muted
 * trumpet as the gigs grow. Sixteen musicians for the sixteen spinners.
 *
 * The first four seats are a quartet on their own — bass, ride, piano, sax —
 * so the Kitchen's first gig already sounds like a band.
 *
 * Swung scores keep to eighth notes: only off-beat eighths are delayed, so a
 * sixteenth written between them would land in the wrong place.
 */

import type { Score } from '../orchestra/score.types';
import { held, line, struck } from './shared';

/** Triplet swing: the off-beat eighth lands two-thirds of the way through the beat. */
const TRIPLET_SWING = 1 / 6;

export const KITCHEN_SCORE: Score = {
  id: 'kitchen',
  bpm: 116,
  tonic: 'C',
  mode: 'major',
  chords: ['Cmaj7', 'Am7', 'Dm7', 'G7', 'Em7', 'Am7', 'Dm7', 'G7'],
  swing: TRIPLET_SWING,

  bed: [
    line('jazz_bass', 28, 0.3, ['r . . .']),
    line('hat_chick', 0, 0.26, ['. x . x']),
    line('vibes', 55, 0.14, ['a+c . . .']),
  ],

  seats: [
    // ── The quartet ──────────────────────────────────────────────────────
    struck('bass', 'Double Bass', 'jazz_bass', 28, 0.9, ['r t f s'], {
      light: ['r . f .'],
      sprayFloor: 40,
    }),
    struck('ride', 'Ride Cymbal', 'ride', 0, 0.48, ['x . x x x . x x'], {
      light: ['x x x x'],
      with: [line('hat_chick', 0, 0.3, ['. x . x'])],
      ornament: line('ride_bell', 0, 0.22, ['x . . .', '. . . .']),
    }),
    struck('piano', 'Piano', 'piano', 48, 0.56, ['t+s . . t+s . . . .'], {
      light: ['t+s . . . . . . .'],
      ornament: line('piano', 60, 0.3, ['. . . . . . t+s .']),
    }),
    held(
      'sax',
      'Tenor Sax',
      'tenor_sus',
      48,
      0.8,
      [
        "5 - 1' 3' 5' - 3' -",
        "6' - 5' 3' 1' - 6 -",
        "4' - 6' 4' 2' - 1' 2'",
        "7 - 2' 4' 5' - - .",
        "5' - 3' 5' 7' - 5' -",
        "6' - 5' 3' 1' - 3' -",
        "2' - 4' 6' 4' - 2' -",
        "7 - 2' - 5 - - .",
      ],
      {
        light: ["5 1'", "6' 1'", "4' 2'", "7 5'", "5' 7'", "6' 1'", "2' 4'", '7 5'],
        spray: 'tenor_stac',
      },
    ),

    // ── The rhythm section fills out ─────────────────────────────────────
    struck('brushes', 'Brushes', 'brush_snare', 0, 0.42, ['. . x . . x? x .'], {
      light: ['. x . x'],
      with: [line('brush_swirl', 0, 0.3, ['x . x .'])],
    }),
    struck('vibes', 'Vibraphone', 'vibes', 60, 0.38, ['o . . s . f . .', '. . t . f . s .'], {
      light: ['o . . . . . . .'],
    }),
    struck('guitar', 'Jazz Guitar', 'jazz_guitar', 52, 0.4, ['a+c a+c a+c a+c'], {
      light: ['. a+c . a+c'],
    }),
    held(
      'trumpet',
      'Muted Trumpet',
      'trumpet_mute',
      60,
      0.62,
      ['. . . . . . s o', 't - . . . . . .'],
      {
        light: ['. . . . . . . o', '. . . .'],
        spray: 'trumpet_stac',
      },
    ),

    // ── The horns and the colour ─────────────────────────────────────────
    held('trombone', 'Trombone', 'trombone_sus', 43, 0.48, ['t - - - s - - -'], {
      light: ['t -'],
      spray: 'trombone_stac',
    }),
    struck('kick', 'Kick Drum', 'kick_soft', 0, 0.5, ['x? x? x? x?'], {
      light: ['x . . .'],
      with: [line('sidestick', 0, 0.34, ['. . . x'])],
    }),
    held('clarinet', 'Clarinet', 'clarinet_sus', 55, 0.5, ['. . . . t - f -', '. . s - f - t -'], {
      light: ['. . . . t - - -'],
      spray: 'clarinet_stac',
    }),
    struck('snaps', 'Finger Snaps', 'clap', 0, 0.34, ['. x . x'], {
      light: ['. . . x'],
    }),

    // ── The kitchen itself joins in ──────────────────────────────────────
    struck('marimba', 'Marimba', 'marimba', 60, 0.5, ["r . f o . f t' ."], {
      light: ['r . . . f . . .'],
    }),
    struck('whisk', 'Whisk', 'shaker', 0, 0.45, ['x x? x x? x x? x x?'], {
      light: ['x . x . x . x .'],
      ornament: line('triangle', 0, 0.36, ['. . . x']),
    }),
    struck('flute', 'Flute', 'flute_stac', 72, 0.45, ['. . . . . . c d', 'b . . . . . . .'], {
      light: ['. . . . . . . d', '. . . .'],
    }),
    struck('pots', 'Pots & Pans', 'claves', 0, 0.45, ['x . . x . . x .'], {
      light: ['x . . . x . . .'],
      ornament: line('cowbell', 0, 0.28, ['. . x . . . x .']),
    }),
  ],

  lineup: [
    'bass',
    'ride',
    'piano',
    'sax',
    'brushes',
    'vibes',
    'guitar',
    'trumpet',
    'trombone',
    'kick',
    'clarinet',
    'snaps',
    'marimba',
    'whisk',
    'flute',
    'pots',
  ],

  // The last third: the ride goes to straight eighths and the piano stabs every off-beat.
  finale: [
    line('ride', 0, 0.3, ['x x x x x x x x']),
    line('brush_snare', 0, 0.3, ['x? x x? x x? x x? x']),
    line('piano', 60, 0.34, ['. a+c . a+c . a+c . a+c']),
  ],

  // Frenzy is a big-band shout chorus: horns riffing in rhythm over a bell and claps.
  frenzy: [
    line('tenor_stac', 48, 0.55, ['r . r t f . o .']),
    line('trumpet_stac', 60, 0.5, ['. o . o s . f .']),
    line('ride_bell', 0, 0.34, ['x x x x']),
    line('kick_soft', 0, 0.7, ['x x x x']),
    line('clap', 0, 0.5, ['. x . x']),
    line('piano', 48, 0.45, ['t+s . t+s . t+s . t+s .']),
  ],
};
