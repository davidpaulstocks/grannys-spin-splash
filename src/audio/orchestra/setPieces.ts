/**
 * The orchestra's three set pieces — moments scored outside the written
 * parts because they answer the game rather than the bar line: the lean-in
 * before Splash Frenzy, the fanfare when it lands, and the closing chord at
 * the final whistle. They are written in terms of palette roles
 * (`orchestra/palette.ts`), so each band plays them on its own instruments.
 */

import type { Conductor } from './Conductor';
import type { OrchestraGraph } from './OrchestraGraph';
import { resolvePalette } from './palette';
import type { PaletteRole } from './score.types';

type StingerOptions = Parameters<Conductor['stinger']>[5];

/**
 * A player for one set piece: plays `role` through the score's palette,
 * moving a pitched role's floor by the palette's octave shift and putting the
 * lead through the amp when the band's lead is a guitar.
 */
function palettePlayer(conductor: Conductor, ctx: BaseAudioContext, graph: OrchestraGraph) {
  const palette = resolvePalette(conductor.score);
  return (role: PaletteRole, step: number, at: number, options: StingerOptions): void => {
    conductor.stinger(ctx, graph, palette.instruments[role], step, at, {
      ...options,
      ...(options.floor === undefined ? {} : { floor: options.floor + palette.shift(role) }),
      ...(role === 'lead' && palette.leadDrive > 0 ? { drive: palette.leadDrive } : {}),
    });
  };
}

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
  const play = palettePlayer(conductor, ctx, graph);
  play('roll', step, at, { gain: 0.4 });
  play('swell', step, at, { gain: 0.3 });
}

/** SPLASH FRENZY lands: crash, bell tree, timpani, a held horn and a trumpet fanfare climbing the chord. */
export function playFanfare(
  conductor: Conductor,
  ctx: BaseAudioContext,
  graph: OrchestraGraph,
  step: number,
  at: number,
): void {
  const play = palettePlayer(conductor, ctx, graph);
  play('crash', step, at, { gain: 0.5 });
  play('shimmer', step, at, { gain: 0.4 });
  play('boom', step, at, { tone: 0, floor: TIMPANI_FLOOR, gain: 0.7 });
  play('sustain', step, at, {
    tone: 0,
    floor: 48,
    gain: 0.4,
    holdSeconds: 1.2,
  });
  RISING_TONES.forEach((tone, i) => {
    play('lead', step, at + i * conductor.stepSeconds, {
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
  const play = palettePlayer(conductor, ctx, graph);
  const home = { tonic: true } as const;
  play('boom', step, at, { ...home, tone: 0, floor: TIMPANI_FLOOR, gain: 0.6 });
  play('thump', step, at, { gain: 0.6 });
  play('crash', step, at, { gain: 0.3 });
  play('bass', step, at, { ...home, tone: 0, floor: 31, gain: 0.6 });
  play('pluck', step, at, { ...home, tone: 0, floor: 43, gain: 0.45 });
  play('chime', step, at, { ...home, tone: 4, floor: 79, gain: 0.3 });
  RISING_TONES.forEach((tone, i) => {
    play('pad', step, at, {
      ...home,
      tone,
      floor: 60,
      gain: 0.28,
      holdSeconds: CLOSING_HOLD_SECONDS,
    });
    play('pluck', step, at + HARP_ROLL_SECONDS * (i + 1), {
      ...home,
      tone,
      floor: 67,
      gain: 0.35,
    });
  });
}

/**
 * Short musical answers to things the player does — a spinner levelling up, a
 * combo climbing, a pickup. Voiced by the orchestra, in the current chord, so
 * feedback is part of the music instead of a beep on top of it.
 */
export type Accent =
  | 'wake'
  | 'spin'
  | 'full'
  | 'combo'
  | 'powerup'
  | 'golden'
  | 'goldenMissed'
  | 'refill'
  | 'cheer';

/** How far up the chord a combo accent reaches, by combo level 1–5. */
const COMBO_TONES = [0, 1, 2, 4, 4] as const;

export function playAccent(
  conductor: Conductor,
  ctx: BaseAudioContext,
  graph: OrchestraGraph,
  accent: Accent,
  step: number,
  at: number,
  level = 1,
): void {
  const sixteenth = conductor.stepSeconds;
  const play = palettePlayer(conductor, ctx, graph);
  const run = (
    role: 'pluck' | 'chime' | 'knock' | 'tap',
    tones: readonly number[],
    floor: number,
    gain: number,
    spacing = sixteenth,
  ): void => {
    tones.forEach((tone, i) => {
      play(role, step, at + i * spacing, { tone, floor, gain });
    });
  };

  switch (accent) {
    case 'wake':
      run('pluck', [0], 67, 0.3);
      break;
    case 'spin':
      run('pluck', [0, 2], 67, 0.32);
      break;
    case 'full':
      run('chime', [0, 2, 4], 72, 0.3);
      play('ting', step, at, { gain: 0.3 });
      break;
    case 'combo':
      run(
        'tap',
        [COMBO_TONES[Math.min(level, COMBO_TONES.length) - 1] ?? 0],
        72 + (level >= 5 ? 12 : 0),
        0.34,
      );
      break;
    case 'powerup':
      run('pluck', [0, 1, 2, 4], 60, 0.4, sixteenth / 2);
      run('pluck', [0, 1, 2, 4], 72, 0.36, sixteenth / 2);
      break;
    case 'golden':
      play('shimmer', step, at, { gain: 0.4 });
      run('chime', [2, 4], 79, 0.3);
      break;
    case 'goldenMissed':
      run('knock', [2, 0], 55, 0.3);
      break;
    case 'refill':
      run('pluck', [0, 1, 2, 4], 67, 0.34, sixteenth / 2);
      break;
    case 'cheer':
      play('ting', step, at, { gain: 0.34 });
      run('chime', [4], 72, 0.24);
      break;
  }
}
