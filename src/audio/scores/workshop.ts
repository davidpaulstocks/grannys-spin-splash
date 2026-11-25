/**
 * Workshop — a clockwork march in A minor, 108 BPM. Everything ticks:
 * xylophone and marimba turn like cogs, bassoon and tuba plod underneath,
 * woodblocks keep time and an anvil rings out every other bar. The clarinet
 * has the one long-breathed tune, so there is something to hum over the
 * machinery. Fifteen musicians for the fifteen spinners on the pegboard.
 */

import type { Score } from '../orchestra/score.types';
import { drivingFinale, held, line, struck, tuttiFrenzy } from './shared';

export const WORKSHOP_SCORE: Score = {
  id: 'workshop',
  bpm: 108,
  tonic: 'A',
  mode: 'minor',
  chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'G', 'Em'],
  swing: 0,

  bed: [
    line('viola_sus', 53, 0.2, ['a+c - a+c -'], true),
    line('bass_pizz', 33, 0.36, ['r . . .']),
    line('claves', 0, 0.16, ['x? x? x? x?']),
  ],

  seats: [
    // ── Top row: tune and chimes ─────────────────────────────────────────
    struck('xylophone', 'Xylophone', 'xylo', 64, 0.55, ['r t f t o . f .', "o f t f o . t' ."], {
      light: ['r . . . o . . .'],
    }),
    held(
      'clarinet',
      'Clarinet',
      'clarinet_sus',
      57,
      0.6,
      ['5 - 3 1', '6 - 3 1', '7 - 5 3', '7 - 4 2', "1' - 5 3", "1' - 6 3", "2' - 7 4", '7 - 5 -'],
      {
        light: ['5 -', '6 -', '7 -', '7 -', "1' -", "1' -", "2' -", '7 -'],
        spray: 'clarinet_stac',
      },
    ),
    struck('flute', 'Flute', 'flute_stac', 72, 0.5, ['. d . c . d . b'], {
      light: ['. . . d . . . d'],
    }),
    struck('trumpet', 'Trumpet', 'trumpet_stac', 57, 0.5, ['r! . . . . . . .', '. . . . f f o .'], {
      light: ['r . . .', '. . . .'],
    }),
    struck('glock', 'Glockenspiel', 'glock', 76, 0.52, ['d . . . c . . .', '. . b . d . . .'], {
      light: ['d . . .'],
    }),

    // ── Middle row: the machinery ────────────────────────────────────────
    struck('spiccato', 'Violins', 'violin_spic', 60, 0.55, ['a c b c a c b c'], {
      light: ['a . b . a . b .'],
    }),
    struck('pizzicato', 'Pizzicato', 'violin_pizz', 57, 0.65, ['. a+c . a+c . b+c . a+c'], {
      light: ['. . . a+c . . . a+c'],
    }),
    struck('marimba', 'Marimba', 'marimba', 57, 0.55, ["r . f r . f o . r . f r . t' o ."], {
      light: ['r . . . o . . .'],
    }),
    held('violas', 'Violas', 'viola_sus', 53, 0.45, ['a+b - a+c -'], {
      light: ['b -'],
      spray: 'violin_pizz',
      sprayFloor: 57,
    }),
    held('horn', 'French Horn', 'horn_sus', 48, 0.5, ['b - c -'], {
      light: ['b -'],
      spray: 'trumpet_stac',
      sprayFloor: 57,
    }),

    // ── Bottom row: the engine room ──────────────────────────────────────
    struck('bassoon', 'Bassoon', 'bassoon_stac', 36, 0.75, ['z . f . z . f z'], {
      light: ['z . . . f . . .'],
    }),
    struck('tuba', 'Tuba', 'tuba_stac', 33, 0.8, ['z . z .'], {
      light: ['z . . .'],
      sprayFloor: 45,
    }),
    struck('woodblocks', 'Woodblocks', 'claves', 0, 0.55, ['x . x? . x . x? x?'], {
      light: ['x . . . x . . .'],
      with: [line('anvil', 0, 0.35, ['. . . .', '. . x .'])],
      ornament: line('triangle', 0, 0.4, ['. x . x']),
    }),
    struck('snare', 'Snare Drum', 'snare', 0, 0.5, ['x . . x? x . x? x? x . . x? x . x x?'], {
      light: ['. x . x'],
      with: [line('bass_drum', 0, 0.75, ['x . x .'])],
    }),
    struck('cellos', 'Cellos', 'cello_pizz', 36, 0.7, ['z . f . o . f .'], {
      light: ['z . . . f . . .'],
    }),
  ],

  finale: drivingFinale(64, 36),
  frenzy: tuttiFrenzy(57, 72, 36),
};
