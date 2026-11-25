/**
 * Pure music theory for the spinner orchestra — chords, scales and pitch
 * maths, with no Web Audio and no game state, so every rule the scores rely
 * on to "never sound wrong" is unit-testable (tests/unit/theory.test.ts).
 *
 * Pitches are MIDI note numbers (C4 = 60, A4 = 69). Pitch classes are 0–11
 * with C = 0.
 */

export type ChordQuality = 'maj' | 'min' | 'sus4' | 'maj7' | 'min7' | 'dom7';
export type Mode = 'major' | 'minor';

export interface Chord {
  /** Pitch class of the root, 0–11. */
  readonly root: number;
  readonly quality: ChordQuality;
  /** Pitch class of the bass note for a slash chord (`D/F#`); the root when absent. */
  readonly bass: number;
}

const SEMITONES_PER_OCTAVE = 12;

const QUALITY_INTERVALS: Readonly<Record<ChordQuality, readonly number[]>> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  sus4: [0, 5, 7],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
};

const SCALE_INTERVALS: Readonly<Record<Mode, readonly number[]>> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  /** Natural minor. */
  minor: [0, 2, 3, 5, 7, 8, 10],
};

const NOTE_NAMES: Readonly<Record<string, number>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
};

const QUALITY_SUFFIXES: Readonly<Record<string, ChordQuality>> = {
  '': 'maj',
  m: 'min',
  sus4: 'sus4',
  maj7: 'maj7',
  m7: 'min7',
  '7': 'dom7',
};

/** `"F#"` → 6, `"Bb"` → 10. Throws on anything that isn't a note name. */
export function pitchClass(name: string): number {
  const letter = NOTE_NAMES[name[0] ?? ''];
  if (letter === undefined) throw new Error(`Not a note name: "${name}"`);
  let pc = letter;
  for (const accidental of name.slice(1)) {
    if (accidental === '#') pc += 1;
    else if (accidental === 'b') pc -= 1;
    else throw new Error(`Not a note name: "${name}"`);
  }
  return ((pc % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE;
}

/** Parses a chord symbol: `G`, `Em`, `D/F#`, `Cmaj7`, `A7`, `Dsus4`, `Bm7`. */
export function chord(symbol: string): Chord {
  const [body = '', bassName] = symbol.split('/');
  const match = /^([A-G][#b]?)(.*)$/.exec(body);
  if (!match) throw new Error(`Not a chord symbol: "${symbol}"`);
  const quality = QUALITY_SUFFIXES[match[2] ?? ''];
  if (!quality) throw new Error(`Unknown chord quality in "${symbol}"`);
  const root = pitchClass(match[1] ?? '');
  return { root, quality, bass: bassName ? pitchClass(bassName) : root };
}

/** The lowest MIDI note of pitch class `pc` that is at or above `floor`. */
export function pitchAtOrAbove(pc: number, floor: number): number {
  const offset =
    (((pc - floor) % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE;
  return floor + offset;
}

/**
 * A chord tone in root position, stacked up from the first root at or above
 * `floor`. Index 0 root, 1 third, 2 fifth, 3 seventh — or the octave when the
 * chord is a plain triad — and 4 always the octave.
 */
export function stackedTone(ch: Chord, index: number, floor: number): number {
  const root = pitchAtOrAbove(ch.root, floor);
  const intervals = QUALITY_INTERVALS[ch.quality];
  if (index >= 4) return root + SEMITONES_PER_OCTAVE;
  return root + (intervals[index] ?? SEMITONES_PER_OCTAVE);
}

/**
 * The chord's triad voiced inside one octave starting at `floor`, low to
 * high, whatever inversion that takes. Successive chords therefore move by
 * the smallest possible steps — which is what makes a pad sound like one
 * instrument breathing rather than a block chord jumping around.
 */
export function windowVoicing(ch: Chord, floor: number): readonly number[] {
  const triad = QUALITY_INTERVALS[ch.quality].slice(0, 3);
  return triad.map((interval) => pitchAtOrAbove(ch.root + interval, floor)).sort((a, b) => a - b);
}

/** Index 0–2 into {@link windowVoicing}; 3 is the lowest tone an octave up. */
export function windowTone(ch: Chord, index: number, floor: number): number {
  const voicing = windowVoicing(ch, floor);
  if (index >= 3) return (voicing[0] ?? floor) + SEMITONES_PER_OCTAVE;
  return voicing[index] ?? floor;
}

/** The slash-chord bass note, at or above `floor`. */
export function bassTone(ch: Chord, floor: number): number {
  return pitchAtOrAbove(ch.bass, floor);
}

/** Scale degree 1–7 of the key, counted up from the first tonic at or above `floor`. */
export function scaleDegree(tonic: number, mode: Mode, degree: number, floor: number): number {
  const interval = SCALE_INTERVALS[mode][degree - 1];
  if (interval === undefined) throw new Error(`Scale degree out of range: ${degree}`);
  return pitchAtOrAbove(tonic, floor) + interval;
}

/** True when `midi` belongs to the key's scale — used by tests to prove no part leaves the key. */
export function isInScale(midi: number, tonic: number, mode: Mode): boolean {
  const relative =
    (((midi - tonic) % SEMITONES_PER_OCTAVE) + SEMITONES_PER_OCTAVE) % SEMITONES_PER_OCTAVE;
  return SCALE_INTERVALS[mode].includes(relative);
}

/**
 * Playback rate that retunes a recorded sample to `targetMidi`. `sampleCents`
 * is how sharp the recording measured against its nominal note, so real
 * instruments recorded slightly off pitch still land exactly in tune.
 */
export function playbackRateFor(targetMidi: number, sampleMidi: number, sampleCents = 0): number {
  const semitones = targetMidi - sampleMidi - sampleCents / 100;
  return Math.pow(2, semitones / SEMITONES_PER_OCTAVE);
}
