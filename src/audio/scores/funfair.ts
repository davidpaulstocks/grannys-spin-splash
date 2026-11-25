/**
 * Funfair — a circus march in F major, 120 BPM. The fairground organ grinds
 * out the tune, tuba goes "oom", clarinets and bassoon go "pah", and a snare
 * drum keeps the parade moving. Sixteen musicians for the sixteen spinners
 * drifting across the tent.
 */

import type { Bars, Score } from '../orchestra/score.types';
import { drivingFinale, held, line, struck, tuttiFrenzy } from './shared';

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
    line('viola_sus', 53, 0.2, ['a+c - a+c -'], true),
    line('tuba_stac', 34, 0.32, ['z . . .']),
    line('tambourine', 0, 0.14, ['. x? . x?']),
  ],

  seats: [
    // ── Top row: the tune ────────────────────────────────────────────────
    held('organ', 'Fairground Organ', 'organ', 53, 0.6, CAROUSEL_TUNE, {
      light: ["5 1'", '6 3', '5 7', "2' -", "1' 3'", "1' 4'", "2' 7", "1' -"],
      ornament: line('flute_stac', 65, 0.4, CAROUSEL_TUNE),
    }),
    struck('piccolo', 'Piccolo', 'flute_stac', 72, 0.45, ['. d . c . d . c'], {
      light: ['. . . d . . . d'],
    }),
    struck('glock', 'Glockenspiel', 'glock', 77, 0.5, ['a . c . d . c .'], {
      light: ['a . . . d . . .'],
    }),
    struck('trumpet', 'Trumpet', 'trumpet_stac', 60, 0.5, ['r . . r f . . .', 'o . . f r . . .'], {
      light: ['r . . . . . . .'],
    }),

    // ── Second row: the whirl ────────────────────────────────────────────
    struck('xylophone', 'Xylophone', 'xylo', 65, 0.5, ["r t f o t' o f t"], {
      light: ['r . f . o . f .'],
    }),
    struck('spiccato', 'Violins', 'violin_spic', 60, 0.5, ['a c b c a c b c'], {
      light: ['a . b . a . b .'],
    }),
    struck('clarinets', 'Clarinets', 'clarinet_stac', 58, 0.55, ['. b+c . b+c . b+c . b+c'], {
      light: ['. . . b+c . . . b+c'],
    }),
    struck('marimba', 'Marimba', 'marimba', 53, 0.5, ['r . o . f . o .'], {
      light: ['r . . . f . . .'],
    }),

    // ── Third row: the band's middle ─────────────────────────────────────
    held('horn', 'French Horn', 'horn_sus', 50, 0.45, ['b - c -'], {
      light: ['b -'],
      spray: 'trumpet_stac',
      sprayFloor: 60,
    }),
    held('violas', 'Violas', 'viola_sus', 53, 0.42, ['a+b - a+c -'], {
      light: ['b -'],
      spray: 'violin_pizz',
      sprayFloor: 60,
    }),
    held('strings', 'Strings', 'violin_sus', 65, 0.5, ['c - c b'], {
      light: ['c -'],
      spray: 'violin_pizz',
    }),
    struck('bassoon', 'Bassoon', 'bassoon_stac', 41, 0.65, ['. f . f . f . f'], {
      light: ['. . . f . . . f'],
    }),

    // ── Bottom row: the parade ───────────────────────────────────────────
    struck('tuba', 'Tuba', 'tuba_stac', 34, 0.85, ['z . f .'], {
      light: ['z . . .'],
      sprayFloor: 41,
    }),
    struck('snare', 'Snare Drum', 'snare', 0, 0.5, ['x? . x . x? x? x .'], {
      light: ['. x . x'],
    }),
    struck('bassdrum', 'Bass Drum & Cymbal', 'bass_drum', 0, 0.8, ['x . x .'], {
      light: ['x . . .'],
      ornament: line('cymbal_crash', 0, 0.2, ['x . . .', '. . . .', '. . . .', '. . . .']),
    }),
    struck('bass', 'Double Bass', 'bass_pizz', 29, 0.8, ['z . t . f . t .'], {
      light: ['z . . . f . . .'],
      sprayFloor: 41,
    }),
  ],

  lineup: [
    'tuba',
    'clarinets',
    'organ',
    'snare',
    'bassdrum',
    'xylophone',
    'glock',
    'piccolo',
    'bass',
    'trumpet',
    'spiccato',
    'marimba',
    'bassoon',
    'horn',
    'strings',
    'violas',
  ],

  finale: drivingFinale(65, 36),
  frenzy: tuttiFrenzy(60, 72, 36),
};
