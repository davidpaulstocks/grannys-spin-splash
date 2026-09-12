/**
 * Low-level Web Audio building blocks shared by every world's orchestra
 * theme (`src/audio/themes/*.ts`). One theme file composes these into a
 * distinct instrument palette; nothing about registering an oscillator
 * graph should be repeated per theme, or five themes turns into five
 * copies of the same plumbing with the actual musical differences buried
 * inside it.
 */

export interface VoiceContext {
  readonly ctx: AudioContext;
  readonly dest: AudioNode;
  /** Audio-clock time this bar begins at. */
  readonly at: number;
  /** Monotonic bar counter — voices use it to vary across bars. */
  readonly bar: number;
  readonly noise: AudioBuffer;
}

/** A single oscillator note with a linear attack and an exponential decay. */
export function tone(
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

/** Same envelope as `tone`, through a lowpass — how every sustained/pad-like voice stays soft rather than buzzy. */
export function filteredTone(
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

/** A pitch that slides from `startFreq` to `endFreq` over the note's duration — bird chirps, sirens, steelpan bends. */
export function pitchBendTone(
  c: VoiceContext,
  type: OscillatorType,
  startFreq: number,
  endFreq: number,
  offset: number,
  duration: number,
  peak: number,
  attack = 0.005,
): void {
  const start = c.at + offset;
  const osc = c.ctx.createOscillator();
  const gain = c.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), start + duration * 0.85);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(c.dest);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Filtered noise burst — hi-hats, clangs, sizzles, snares; the timbre is entirely down to `filterType`/`freq`/`q`. */
export function filteredNoiseBurst(
  c: VoiceContext,
  offset: number,
  duration: number,
  peak: number,
  filterType: BiquadFilterType,
  freq: number,
  q = 1,
): void {
  const start = c.at + offset;
  const src = c.ctx.createBufferSource();
  const filter = c.ctx.createBiquadFilter();
  const gain = c.ctx.createGain();
  src.buffer = c.noise;
  src.loop = true;
  filter.type = filterType;
  filter.frequency.setValueAtTime(freq, start);
  filter.Q.setValueAtTime(q, start);
  gain.gain.setValueAtTime(peak, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.dest);
  src.start(start);
  src.stop(start + duration + 0.02);
}

/** A highpass noise burst — the common case of `filteredNoiseBurst`, kept as a shorthand for plain hi-hat-style ticks. */
export function noiseBurst(
  c: VoiceContext,
  offset: number,
  duration: number,
  peak: number,
  highpass: number,
): void {
  filteredNoiseBurst(c, offset, duration, peak, 'highpass', highpass);
}

/**
 * A short, bright, quickly-decaying metallic hit — two close, slightly
 * detuned oscillators plus a burst of high noise, which is what reads as
 * "clang"/"struck metal" rather than a clean musical note. Used by
 * Workshop's clangs and (softer, lower peak) by its steel-drum voice.
 */
export function metallicHit(
  c: VoiceContext,
  freq: number,
  offset: number,
  duration: number,
  peak: number,
): void {
  tone(c, 'square', freq, offset, duration, peak * 0.8, 0.001, 0);
  tone(c, 'square', freq * 1.503, offset, duration * 0.6, peak * 0.5, 0.001, 6);
  filteredNoiseBurst(c, offset, duration * 0.3, peak * 0.6, 'highpass', 3500);
}
