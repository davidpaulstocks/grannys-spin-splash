/**
 * The shape every world's orchestra theme must fill in (2026-09-12, direct
 * user feedback: "I also want there to be a different orchestra tune for
 * each world! So there's lovely music to unlock in each world" — the
 * original build had exactly one fixed voice set/key/tempo for every
 * world). Slot IDs are deliberately generic (`spinner0`..`spinner8`), not
 * instrument names — `AudioOrchestra.ts`'s mixing logic only ever needs
 * "the layer this grid position drives," never what that layer sounds
 * like, so the same `spinnerIndex % SPINNER_SLOT_COUNT` assignment and the
 * same GainNode graph work unchanged across every theme. Only the voice
 * FUNCTIONS behind each slot, and the tempo they're scheduled at, change
 * per world.
 */

import type { VoiceContext } from '../synthPrimitives';

export const SPINNER_SLOT_COUNT = 9;

export type SpinnerSlot =
  | 'spinner0'
  | 'spinner1'
  | 'spinner2'
  | 'spinner3'
  | 'spinner4'
  | 'spinner5'
  | 'spinner6'
  | 'spinner7'
  | 'spinner8';

export type VoiceSlot = 'foundation' | SpinnerSlot | 'dropBass';

export const SPINNER_SLOTS: readonly SpinnerSlot[] = [
  'spinner0',
  'spinner1',
  'spinner2',
  'spinner3',
  'spinner4',
  'spinner5',
  'spinner6',
  'spinner7',
  'spinner8',
];

export type VoiceFn = (c: VoiceContext) => void;

export interface WorldTheme {
  readonly id: string;
  /** Beats per bar is always 4 (CLAUDE.md §9.3's brief) — only the beat's own length changes per theme's tempo. */
  readonly beatSeconds: number;
  readonly barSeconds: number;
  readonly voices: Readonly<Record<VoiceSlot, VoiceFn>>;
  /**
   * The triad the always-on ambient bed holds, in Hz, low to high
   * (2026-09-12). Measured why it was needed: sampling the orchestra's own
   * output through an AnalyserNode across a live round gave RMS readings
   * swinging between 0 and 0.21 two seconds apart — with only a few spinners
   * charged, the mix is isolated blips over near-silence, because every voice
   * including the "foundation" is rhythmic. An ASMR bed has to be
   * *continuous*, so `AudioOrchestra` holds these three notes on persistent
   * oscillators for the whole round and never schedules them per bar.
   */
  readonly padHz: readonly [number, number, number];
  /** Frenzy's one-shot cinematic hit — fired directly, not scheduled as a looping layer. Themed per world like everything else. */
  readonly cinematicHit: (ctx: AudioContext, dest: AudioNode, noise: AudioBuffer) => void;
}
