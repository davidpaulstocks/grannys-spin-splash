/**
 * Pirate Ship — a sea-shanty band in D minor at 104 BPM with a lilt (a little
 * swing on the off-beats). The stomp is on one and three, the snare and
 * tambourine answer on two and four, and the tune is call and answer: the
 * fiddle sings a two-bar phrase and the tin whistle answers it, twice round
 * the eight-bar form. Over the stomp sit a double bass, a squeezebox
 * (the fairground organ's reeds), a strummed guitar, tuba and cello on the
 * roots, a cannon drum on the timpani, a ship's bell on the glockenspiel and
 * the rest of the crew. Eighteen musicians for the eighteen spinners of the
 * Grand Concert.
 *
 * Written only for instruments already recorded (the orchestra's sprite), so
 * the band costs no download.
 *
 * Line-up: bass, squeezebox and fiddle first (a root, a harmony and a tune),
 * then the stomp and the snare, so five already sound like a shanty.
 */

import type { Bars, Score } from '../orchestra/score.types';
import { DECK_ROOM } from './rooms';
import { drivingFinale, held, line, struck, tuttiFrenzy } from './shared';

/** A lilt: off-beat eighths a twelfth of a bar late (triplet swing is 1/6). */
const SHANTY_SWING = 1 / 12;

/** The fiddle's half of the call and answer: the phrase is bars 1, 2, 5 and 6; bars 3, 4, 7 and 8 hold a chord tone under the whistle's answer. */
const FIDDLE_TUNE: Bars = [
  '1 - 1 2 3 - 5 -',
  '6 - 5 3 2 - 1 -',
  '3 - - - 5 - - -',
  '6 - 5 - 3 - - -',
  '1 - 1 2 3 - 5 -',
  '6 - 7 6 5 - 3 -',
  '5 - - - 6 - - -',
  '5 - 3 - 1 - - -',
];

/** The tin whistle's answer, in the gaps the fiddle leaves: bars 3, 4, 7 and 8. */
const WHISTLE_ANSWER: Bars = [
  '. . . . . . . .',
  '. . . . . . . .',
  '5 . 5 6 5 . 3 .',
  '6 . 5 . 3 . 2 .',
  '. . . . . . . .',
  '. . . . . . . .',
  '6 . 6 7 6 . 5 .',
  '3 . 2 . 1 . . .',
];

export const SHIP_SCORE: Score = {
  id: 'ship',
  bpm: 104,
  tonic: 'D',
  mode: 'minor',
  chords: ['Dm', 'C', 'Dm', 'C', 'Dm', 'Bb', 'C', 'Dm'],
  swing: SHANTY_SWING,

  bed: [
    line('horn_sus', 50, 0.14, ['a+c - a+c -'], true),
    line('bass_pizz', 31, 0.32, ['z . . .']),
    line('shaker', 0, 0.16, ['x? x? x? x?']),
  ],

  seats: [
    // ── The opening trio and the stomp: a root, a harmony, a tune ────────
    struck('bass', 'Double Bass', 'bass_pizz', 31, 0.9, ['z . . . f . . .', 'z . . . f . z .'], {
      light: ['z . . .'],
      ornament: line('cello_pizz', 43, 0.4, ['z . . . f . . .']),
      sprayFloor: 43,
    }),
    held('squeezebox', 'Squeezebox', 'organ', 53, 0.75, ['a+c - b+c - a+c - b+c -'], {
      light: ['a -'],
    }),
    held('fiddle', 'Fiddle', 'violin_sus', 62, 0.85, FIDDLE_TUNE, {
      light: ['1 -', '6 -', '3 -', '6 -', '1 -', '6 -', '5 -', '5 -'],
      ornament: line('violin_pizz', 55, 0.4, ['a . c . b . c .']),
    }),
    struck('stomp', 'Stomping Drum', 'bass_drum', 0, 1.15, ['x . . . x . . .'], {
      light: ['x . . .'],
    }),
    struck('snare', 'Snare & Tambourine', 'snare', 0, 0.85, ['. . x . . . x .'], {
      light: ['. . x .'],
      with: [line('tambourine', 0, 0.4, ['. x . x . x . x'])],
      spray: 'tambourine',
    }),

    // ── The crew joins in ────────────────────────────────────────────────
    held('whistle', 'Tin Whistle', 'flute_stac', 72, 0.7, WHISTLE_ANSWER, {
      icon: 'flute',
      light: ['. .', '. .', '5 .', '6 .', '. .', '. .', '6 .', '3 .'],
    }),
    struck('guitar', 'Guitar', 'jazz_guitar', 50, 0.55, ['r f o f r f o f'], {
      icon: 'acoustic_guitar',
      light: ['r . o . r . o .'],
    }),
    struck('tuba', 'Tuba', 'tuba_stac', 34, 1.1, ['z . f .'], {
      light: ['z . . .'],
      sprayFloor: 41,
    }),
    struck(
      'cannon',
      'Cannon Drum',
      'timpani',
      36,
      0.9,
      ['r . . . . . . .', '. . . . . . . .', 'r . . . . . . .', '. . . . . . f f'],
      {
        icon: 'bass_drum',
        light: ['r . . .', '. . . .', 'r . . .', '. . . .'],
      },
    ),
    struck('shaker', 'Shaker', 'shaker', 0, 0.5, ['x? x x? x x? x x? x'], {
      light: ['x . x .'],
    }),
    held('clarinet', 'Clarinet', 'clarinet_sus', 55, 0.55, ['. . . . t - f -', '. . t - f - o -'], {
      light: ['. . . . t - - -'],
    }),
    struck('bell', "Ship's Bell", 'glock', 77, 0.55, ['d . . . . . . .', '. . . . d . . .'], {
      light: ['d . . . . . . .'],
    }),
    struck('cello', 'Cello', 'cello_pizz', 43, 0.65, ['r . f . o . f .'], {
      light: ['r . . . f . . .'],
    }),
    held('trombone', 'Trombone', 'trombone_sus', 46, 0.5, ['z - - - f - - -'], {
      light: ['z -'],
    }),
    held('horn', 'French Horn', 'horn_sus', 50, 0.5, ['b - c -'], {
      light: ['b -'],
    }),
    struck(
      'cymbal',
      'Cymbal',
      'cymbal_crash',
      0,
      0.5,
      ['x . . .', '. . . .', '. . . .', '. . . .'],
      {
        light: ['x . . .', '. . . .', '. . . .', '. . . .'],
      },
    ),
    struck('harp', 'Harp', 'harp', 55, 0.5, ["r f o t' f' t' o f"], {
      light: ["r o t' o"],
    }),
    struck('trumpet', 'Trumpet', 'trumpet_stac', 60, 0.8, ['r . . r f . . .', 'o . . f r . . .'], {
      light: ['r . . . . . . .'],
    }),
  ],

  lineup: [
    'bass',
    'squeezebox',
    'fiddle',
    'stomp',
    'snare',
    'whistle',
    'guitar',
    'tuba',
    'cannon',
    'shaker',
    'clarinet',
    'bell',
    'cello',
    'trombone',
    'horn',
    'cymbal',
    'harp',
    'trumpet',
  ],

  // The last third: spiccato fiddles, the cannon drum and tambourine drive it home.
  finale: drivingFinale(67, 36),
  frenzy: tuttiFrenzy(60, 72, 36),

  // An open deck; the shanty band's own drums and bells play the lean-in, the fanfare, the closing chord and the chimes.
  room: DECK_ROOM,
  palette: {
    instruments: {
      roll: 'snare_roll',
      shimmer: 'sleighbells',
      ting: 'tambourine',
      boom: 'timpani',
      thump: 'bass_drum',
      bass: 'bass_pizz',
      sustain: 'horn_sus',
      pad: 'violin_sus',
      lead: 'flute_stac',
      pluck: 'harp',
      chime: 'glock',
      tap: 'xylo',
    },
  },
};
