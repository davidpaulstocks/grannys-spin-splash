/**
 * The tiny notation every orchestral part is written in, and its compiler.
 *
 * A bar is a string of space-separated tokens, evenly dividing the bar:
 * 4 tokens are quarter notes, 8 are eighths, 16 are sixteenths. Parts never
 * name absolute pitches — they name a note's *role* in the harmony — so one
 * written part stays consonant across the whole chord progression, and no
 * combination of musicians can clash.
 *
 * | Token       | Meaning                                                    |
 * |-------------|------------------------------------------------------------|
 * | `.`         | rest                                                       |
 * | `-`         | hold the previous note (sustained instruments)             |
 * | `r t f s o` | root, third, fifth, seventh (octave on triads), octave     |
 * | `a b c d`   | low, middle, high tone of the close voicing; `d` = `a` + 8ve |
 * | `z`         | the chord's bass note (differs from the root on `D/F#`)    |
 * | `1`–`7`     | scale degree of the key — for written melodies             |
 * | `x`         | unpitched hit (percussion)                                 |
 *
 * Suffixes: `'` up an octave, `,` down an octave (repeatable), `!` accent,
 * `?` ghost note. Join tones with `+` to sound them together: `a+c`.
 */

export const STEPS_PER_BAR = 16;

export type ToneKind = 'stack' | 'window' | 'bass' | 'degree' | 'hit';

export interface PatternEvent {
  /** Sixteenth-note position within the bar, 0–15. */
  readonly step: number;
  readonly kind: ToneKind;
  /** Chord-tone index (stack/window), scale degree 1–7 (degree), or 0. */
  readonly index: number;
  /** Semitone offset from octave marks. */
  readonly transpose: number;
  /** Relative loudness: 1 normal, accent louder, ghost softer. */
  readonly velocity: number;
  /** Length in sixteenths, up to the next token that isn't a hold. */
  readonly lengthSteps: number;
}

const ACCENT_VELOCITY = 1.3;
const GHOST_VELOCITY = 0.55;
const SEMITONES_PER_OCTAVE = 12;

const STACK_LETTERS = 'rtfso';
const WINDOW_LETTERS = 'abcd';

const TOKEN_PATTERN = /^([rtfsoabcdzx1-7])([',]*)([!?]?)$/;

function parseTone(letter: string): { kind: ToneKind; index: number } {
  if (letter === 'x') return { kind: 'hit', index: 0 };
  if (letter === 'z') return { kind: 'bass', index: 0 };
  const stack = STACK_LETTERS.indexOf(letter);
  if (stack >= 0) return { kind: 'stack', index: stack };
  const window = WINDOW_LETTERS.indexOf(letter);
  if (window >= 0) return { kind: 'window', index: window };
  return { kind: 'degree', index: Number(letter) };
}

/** Compiles one bar of notation into timed events. Throws on malformed input so a typo fails the test suite, not the mix. */
export function compileBar(bar: string): readonly PatternEvent[] {
  const tokens = bar.trim().split(/\s+/);
  if (STEPS_PER_BAR % tokens.length !== 0) {
    throw new Error(`A bar needs 1, 2, 4, 8 or 16 tokens, got ${tokens.length}: "${bar}"`);
  }
  const stepsPerToken = STEPS_PER_BAR / tokens.length;
  const events: PatternEvent[] = [];

  tokens.forEach((token, i) => {
    if (token === '.' || token === '-') return;
    let held = 1;
    while (tokens[i + held] === '-') held++;

    // `a+c` sounds two tones together — pads and stabs need real chords.
    for (const voice of token.split('+')) {
      const match = TOKEN_PATTERN.exec(voice);
      if (!match) throw new Error(`Unknown token "${token}" in bar "${bar}"`);
      const [, letter = '', octaves = '', dynamic = ''] = match;

      let transpose = 0;
      for (const mark of octaves) {
        transpose += mark === "'" ? SEMITONES_PER_OCTAVE : -SEMITONES_PER_OCTAVE;
      }
      events.push({
        step: i * stepsPerToken,
        ...parseTone(letter),
        transpose,
        velocity: dynamic === '!' ? ACCENT_VELOCITY : dynamic === '?' ? GHOST_VELOCITY : 1,
        lengthSteps: held * stepsPerToken,
      });
    }
  });
  return events;
}

/** Compiles a whole part: one event list per written bar. */
export function compileBars(bars: readonly string[]): readonly (readonly PatternEvent[])[] {
  return bars.map(compileBar);
}

const STEPS_PER_BEAT = 4;

/**
 * The default "just waking up" version of a part: only the notes that fall on
 * a beat, each lengthened to fill the beat. A musician who has barely started
 * plays the outline of their line; the detail arrives as the spinner speeds up.
 */
export function thinToBeats(events: readonly PatternEvent[]): readonly PatternEvent[] {
  return events
    .filter((event) => event.step % STEPS_PER_BEAT === 0)
    .map((event) => ({ ...event, lengthSteps: Math.max(event.lengthSteps, STEPS_PER_BEAT) }));
}
