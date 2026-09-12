/**
 * The instruments the ASMR orchestra is built from (CLAUDE.md §9.1's layer
 * table). Each voice knows only how to schedule its own notes for one bar
 * into a destination node; AudioOrchestra.ts owns the clock, the per-layer
 * gains and the mix. Module-internal to that file.
 *
 * Synthesised rather than sampled, so the headline feature ships without
 * waiting on §9.3's stem-sourcing decision — that decision stays open and
 * swapping in real OGG stems later replaces this file alone, since
 * `updateMix()` never looks at how a layer makes its sound.
 *
 * Everything is written to §9.3's own brief: 96 BPM, a 2.5 s bar, key of A
 * minor. Every voice must work alone and stacked, so each occupies its own
 * register and rhythmic slot — the bass never plays above A3, the bell and
 * arpeggio never share an onset, the sustained pads have slow attacks so
 * they swell under the plucked layers instead of masking them.
 */

/** 96 BPM → 0.625 s per beat, 4 beats per bar (CLAUDE.md §9.3's brief). */
export const BEAT_SECONDS = 0.625;
export const BAR_SECONDS = BEAT_SECONDS * 4;

/** A natural minor, the octaves each voice draws from. */
const A1 = 55;
const A2 = 110;
const C3 = 130.81;
const E3 = 164.81;
const A3 = 220;
const C4 = 261.63;
const E4 = 329.63;
const A4 = 440;
const C5 = 523.25;
const E5 = 659.25;

export interface VoiceContext {
  readonly ctx: AudioContext;
  readonly dest: AudioNode;
  /** Audio-clock time this bar begins at. */
  readonly at: number;
  /** Monotonic bar counter — voices use it to vary across bars. */
  readonly bar: number;
  readonly noise: AudioBuffer;
}

function tone(
  c: VoiceContext,
  type: OscillatorType,
  freq: number,
  offset: number,
  duration: number,
  peak: number,
  attack = 0.01,
  detune = 0,
): void {
  const start = c.at + offset;
  const osc = c.ctx.createOscillator();
  const gain = c.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.detune.setValueAtTime(detune, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(c.dest);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Same envelope but through a lowpass — how every sustained/pad-like voice stays soft rather than buzzy. */
function filteredTone(
  c: VoiceContext,
  type: OscillatorType,
  freq: number,
  offset: number,
  duration: number,
  peak: number,
  cutoff: number,
  attack: number,
  detune = 0,
): void {
  const start = c.at + offset;
  const osc = c.ctx.createOscillator();
  const filter = c.ctx.createBiquadFilter();
  const gain = c.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  osc.detune.setValueAtTime(detune, start);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(cutoff, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.dest);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

function noiseBurst(
  c: VoiceContext,
  offset: number,
  duration: number,
  peak: number,
  highpass: number,
): void {
  const start = c.at + offset;
  const src = c.ctx.createBufferSource();
  const filter = c.ctx.createBiquadFilter();
  const gain = c.ctx.createGain();
  src.buffer = c.noise;
  src.loop = true;
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(highpass, start);
  gain.gain.setValueAtTime(peak, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.dest);
  src.start(start);
  src.stop(start + duration + 0.02);
}

/** Layer 1 — the always-on rhythmic floor. Never tied to a spinner (CLAUDE.md §9.1.1). */
function foundation(c: VoiceContext): void {
  for (const beat of [0, 2]) {
    const start = c.at + beat * BEAT_SECONDS;
    const osc = c.ctx.createOscillator();
    const gain = c.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(A2, start);
    osc.frequency.exponentialRampToValueAtTime(45, start + 0.12);
    gain.gain.setValueAtTime(0.9, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.3);
    osc.connect(gain);
    gain.connect(c.dest);
    osc.start(start);
    osc.stop(start + 0.34);
  }
  filteredTone(c, 'sine', A1, 0, BAR_SECONDS, 0.4, 240, 0.08);
}

function hihat(c: VoiceContext): void {
  for (let i = 0; i < 8; i++) {
    noiseBurst(
      c,
      i * (BEAT_SECONDS / 2),
      i % 2 === 0 ? 0.05 : 0.03,
      i % 2 === 0 ? 0.3 : 0.18,
      7000,
    );
  }
}

function pluck(c: VoiceContext): void {
  const line = [A3, C4, E4, C4];
  line.forEach((freq, i) => tone(c, 'triangle', freq, i * BEAT_SECONDS, 0.42, 0.5, 0.004));
}

function bell(c: VoiceContext): void {
  const freq = c.bar % 2 === 0 ? E5 : C5;
  tone(c, 'sine', freq, 0, 1.6, 0.42, 0.01);
  tone(c, 'sine', freq * 2.01, 0, 0.9, 0.14, 0.01);
}

function pad(c: VoiceContext): void {
  for (const freq of [A2, C3, E3]) {
    filteredTone(c, 'sawtooth', freq, 0, BAR_SECONDS, 0.12, 700, 0.7);
    filteredTone(c, 'sawtooth', freq, 0, BAR_SECONDS, 0.12, 700, 0.7, 7);
  }
}

function arpeggio(c: VoiceContext): void {
  const line = [A4, C5, E5, C5, A4, E5, C5, E5];
  line.forEach((freq, i) => tone(c, 'square', freq, i * (BEAT_SECONDS / 2), 0.16, 0.16, 0.004));
}

/** The "oohs" — a sine through a vocal-ish bandpass rather than a sample. */
function vocalOoh(c: VoiceContext): void {
  const start = c.at;
  for (const freq of [A3, E4]) {
    const osc = c.ctx.createOscillator();
    const band = c.ctx.createBiquadFilter();
    const gain = c.ctx.createGain();
    const vibrato = c.ctx.createOscillator();
    const vibratoDepth = c.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    vibrato.frequency.setValueAtTime(5, start);
    vibratoDepth.gain.setValueAtTime(4, start);
    vibrato.connect(vibratoDepth);
    vibratoDepth.connect(osc.frequency);
    band.type = 'bandpass';
    band.frequency.setValueAtTime(760, start);
    band.Q.setValueAtTime(3, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.34, start + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + BAR_SECONDS);
    osc.connect(band);
    band.connect(gain);
    gain.connect(c.dest);
    vibrato.start(start);
    osc.start(start);
    vibrato.stop(start + BAR_SECONDS + 0.02);
    osc.stop(start + BAR_SECONDS + 0.02);
  }
}

function strings(c: VoiceContext): void {
  for (const freq of [A3, E4]) {
    filteredTone(c, 'sawtooth', freq, 0, BAR_SECONDS, 0.16, 1500, 0.9);
    filteredTone(c, 'sawtooth', freq, 0, BAR_SECONDS, 0.16, 1500, 0.9, -6);
  }
}

/** Brass swell — a filter sweep is what makes it read as a swell rather than a held chord. */
function brass(c: VoiceContext): void {
  const start = c.at;
  const osc = c.ctx.createOscillator();
  const filter = c.ctx.createBiquadFilter();
  const gain = c.ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(A3, start);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(320, start);
  filter.frequency.linearRampToValueAtTime(2600, start + BAR_SECONDS * 0.7);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(0.3, start + BAR_SECONDS * 0.55);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + BAR_SECONDS);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.dest);
  osc.start(start);
  osc.stop(start + BAR_SECONDS + 0.02);
}

function choir(c: VoiceContext): void {
  for (const freq of [A4, C5, E5]) {
    for (const detune of [-9, 0, 9]) {
      filteredTone(c, 'triangle', freq, 0, BAR_SECONDS, 0.07, 2200, 1.0, detune);
    }
  }
}

/** Frenzy-exclusive (CLAUDE.md §9.1.1) — sustains for the bonus window, never mapped to a spinner. */
function dropBass(c: VoiceContext): void {
  for (let i = 0; i < 4; i++) {
    filteredTone(
      c,
      'sawtooth',
      A1,
      i * BEAT_SECONDS,
      BEAT_SECONDS,
      0.55,
      180 + (i % 2) * 420,
      0.02,
    );
  }
}

export type VoiceId =
  | 'foundation'
  | 'hihat'
  | 'pluck'
  | 'bell'
  | 'pad'
  | 'arpeggio'
  | 'vocalOoh'
  | 'strings'
  | 'brass'
  | 'choir'
  | 'dropBass';

export const VOICES: Readonly<Record<VoiceId, (c: VoiceContext) => void>> = {
  foundation,
  hihat,
  pluck,
  bell,
  pad,
  arpeggio,
  vocalOoh,
  strings,
  brass,
  choir,
  dropBass,
};

/**
 * The layers a spinner's own charge level can drive, in CLAUDE.md §9.1's
 * order. `foundation` is excluded (always on) and so is `dropBass`
 * (Frenzy-exclusive) — see §9.1.1.
 */
export const SPINNER_VOICES: readonly VoiceId[] = [
  'hihat',
  'pluck',
  'bell',
  'pad',
  'arpeggio',
  'vocalOoh',
  'strings',
  'brass',
  'choir',
];

/** Frenzy's one-shot cinematic hit — fired directly, not scheduled as a looping layer. */
export function playCinematicHit(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer): void {
  const c: VoiceContext = { ctx, dest, at: ctx.currentTime, bar: 0, noise };
  noiseBurst(c, 0, 1.4, 0.5, 400);
  tone(c, 'sine', A2, 0, 1.8, 0.9, 0.005);
  tone(c, 'sine', A1, 0, 2.2, 0.8, 0.005);
}
