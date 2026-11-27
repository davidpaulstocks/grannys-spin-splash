/**
 * The count-in's timing, as pure numbers (no Phaser): what is said on each
 * beat and when, at the tempo of the venue's score.
 */

/** The pause after the scene appears before the first count, so the screen is seen before it starts moving. */
export const COUNT_IN_DELAY_MS = 400;

/** What the wall shows, one per beat. The last is the one that starts the gig. */
export const COUNT_LABELS = ['3', '2', '1', 'GO!'] as const;

/** Index of "GO!" in `COUNT_LABELS`. */
export const GO_INDEX = COUNT_LABELS.length - 1;

const MS_PER_MINUTE = 60_000;

/** Milliseconds in one beat at `bpm`. */
export function beatMs(bpm: number): number {
  return MS_PER_MINUTE / bpm;
}

/**
 * When each label lands, in ms after the first one ("3" at 0), so that GO
 * falls three beats after the "3".
 */
export function countInOffsets(bpm: number): readonly number[] {
  const beat = beatMs(bpm);
  return COUNT_LABELS.map((_, i) => i * beat);
}
