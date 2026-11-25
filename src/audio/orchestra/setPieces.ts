/**
 * The orchestra's three set pieces — moments scored outside the written
 * parts because they answer the game rather than the bar line: the lean-in
 * before Splash Frenzy, the fanfare when it lands, and the closing chord at
 * the final whistle.
 */

import type { Conductor } from './Conductor';
import type { OrchestraGraph } from './OrchestraGraph';

/** Timpani sit around their two recorded drums; this floor keeps retuning small. */
const TIMPANI_FLOOR = 36;
/** Root, third, fifth, octave — the stacked chord-tone indices of a rising fanfare. */
const RISING_TONES = [0, 1, 2, 4] as const;
/** The harp rolls the closing chord rather than striking it flat. */
const HARP_ROLL_SECONDS = 0.05;
const CLOSING_HOLD_SECONDS = 1.4;

/** The wall is nearly full: a timpani roll and a cymbal swell lean into the drop. */
export function playAnticipation(
  conductor: Conductor,
  ctx: BaseAudioContext,
  graph: OrchestraGraph,
  step: number,
  at: number,
): void {
  conductor.stinger(ctx, graph, 'timpani_roll', step, at, { gain: 0.4 });
  conductor.stinger(ctx, graph, 'cymbal_swell', step, at, { gain: 0.3 });
}

/** SPLASH FRENZY lands: crash, bell tree, timpani, a held horn and a trumpet fanfare climbing the chord. */
export function playFanfare(
  conductor: Conductor,
  ctx: BaseAudioContext,
  graph: OrchestraGraph,
  step: number,
  at: number,
): void {
  conductor.stinger(ctx, graph, 'cymbal_crash', step, at, { gain: 0.5 });
  conductor.stinger(ctx, graph, 'bell_tree', step, at, { gain: 0.4 });
  conductor.stinger(ctx, graph, 'timpani', step, at, { tone: 0, floor: TIMPANI_FLOOR, gain: 0.7 });
  conductor.stinger(ctx, graph, 'horn_sus', step, at, {
    tone: 0,
    floor: 48,
    gain: 0.4,
    holdSeconds: 1.2,
  });
  RISING_TONES.forEach((tone, i) => {
    conductor.stinger(ctx, graph, 'trumpet_stac', step, at + i * conductor.stepSeconds, {
      tone,
      floor: 60,
      gain: 0.5,
    });
  });
}

/** The final whistle: the whole orchestra resolves on the home chord and is left to ring. */
export function playClosingChord(
  conductor: Conductor,
  ctx: BaseAudioContext,
  graph: OrchestraGraph,
  step: number,
  at: number,
): void {
  const home = { tonic: true } as const;
  conductor.stinger(ctx, graph, 'timpani', step, at, {
    ...home,
    tone: 0,
    floor: TIMPANI_FLOOR,
    gain: 0.6,
  });
  conductor.stinger(ctx, graph, 'bass_drum', step, at, { gain: 0.6 });
  conductor.stinger(ctx, graph, 'cymbal_crash', step, at, { gain: 0.3 });
  conductor.stinger(ctx, graph, 'bass_pizz', step, at, { ...home, tone: 0, floor: 31, gain: 0.6 });
  conductor.stinger(ctx, graph, 'harp', step, at, { ...home, tone: 0, floor: 43, gain: 0.45 });
  conductor.stinger(ctx, graph, 'glock', step, at, { ...home, tone: 4, floor: 79, gain: 0.3 });
  RISING_TONES.forEach((tone, i) => {
    conductor.stinger(ctx, graph, 'violin_sus', step, at, {
      ...home,
      tone,
      floor: 60,
      gain: 0.28,
      holdSeconds: CLOSING_HOLD_SECONDS,
    });
    conductor.stinger(ctx, graph, 'harp', step, at + HARP_ROLL_SECONDS * (i + 1), {
      ...home,
      tone,
      floor: 67,
      gain: 0.35,
    });
  });
}
