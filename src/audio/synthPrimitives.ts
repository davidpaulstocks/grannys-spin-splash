/**
 * Low-level Web Audio building blocks shared by every world's orchestra
 * theme (`src/audio/themes/*.ts`). One theme file composes these into a
 * distinct instrument palette; nothing about registering an oscillator
 * graph should be repeated per theme, or five themes turns into five
 * copies of the same plumbing with the actual musical differences buried
 * inside it.
 */

/**
 * Envelope shape shared by every voice. `SUSTAIN_LEVEL` is the fraction of
 * peak a note holds after its initial decay, and `SUSTAIN_KNEE` is how far
 * into the note that decay finishes — so notes now ring for most of their
 * stated duration instead of ~30% of it.
 */
const SUSTAIN_LEVEL = 0.5;
const SUSTAIN_KNEE = 0.28;
/** Ceiling for tone()'s tame filter, and how many harmonics it lets through. */
const TONE_TAME_HZ = 5200;
const TONE_TAME_HARMONICS = 7;
const NOISE_ATTACK_SECONDS = 0.004;

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
  // Decay to a SUSTAIN floor rather than to silence, then release at the
  // end. The old shape ramped straight to 0.0001 over `duration`, and
  // because that endpoint is fixed the dB span is set by `peak` — so the
  // audible part was a near-constant ~30% of the note no matter what
  // duration the theme asked for (measured: a nominal 0.5s pluck was a
  // 139ms blip). Nothing in the game rang, every pad gated at its bar line,
  // and all ten layers swelled and collapsed in unison once per bar — the
  // "wheezing, pumping" quality. It also left the reverb nothing to work
  // with: convolution on a transient smears it, on a tail it blends it.
  const sustainAt = start + attack + (duration - attack) * SUSTAIN_KNEE;
  gain.gain.exponentialRampToValueAtTime(Math.max(peak * SUSTAIN_LEVEL, 0.0002), sustainAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  // A gentle lowpass on every tone. 13 call sites push raw `square` through
  // this primitive; a square at 880Hz radiates partials at 2.6/4.4/6.2/7.9kHz,
  // and A-weighting makes the 7th harmonic only ~11 dB down perceptually.
  // That is the ice-pick most likely to actually hurt a child's ears.
  const tame = c.ctx.createBiquadFilter();
  tame.type = 'lowpass';
  tame.frequency.setValueAtTime(Math.min(TONE_TAME_HZ, freq * TONE_TAME_HARMONICS), start);
  tame.Q.setValueAtTime(0.4, start);
  osc.connect(tame);
  tame.connect(gain);
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
  // Same sustain stage as tone() — see its comment. 22 call sites pass
  // duration = BAR_SECONDS for pads, and without this every one of them
  // gated to silence well before its own bar line.
  const sustainAt = start + attack + (duration - attack) * SUSTAIN_KNEE;
  gain.gain.exponentialRampToValueAtTime(Math.max(peak * SUSTAIN_LEVEL, 0.0002), sustainAt);
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
  // Decay to a SUSTAIN floor rather than to silence, then release at the
  // end. The old shape ramped straight to 0.0001 over `duration`, and
  // because that endpoint is fixed the dB span is set by `peak` — so the
  // audible part was a near-constant ~30% of the note no matter what
  // duration the theme asked for (measured: a nominal 0.5s pluck was a
  // 139ms blip). Nothing in the game rang, every pad gated at its bar line,
  // and all ten layers swelled and collapsed in unison once per bar — the
  // "wheezing, pumping" quality. It also left the reverb nothing to work
  // with: convolution on a transient smears it, on a tail it blends it.
  const sustainAt = start + attack + (duration - attack) * SUSTAIN_KNEE;
  gain.gain.exponentialRampToValueAtTime(Math.max(peak * SUSTAIN_LEVEL, 0.0002), sustainAt);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  // A gentle lowpass on every tone. 13 call sites push raw `square` through
  // this primitive; a square at 880Hz radiates partials at 2.6/4.4/6.2/7.9kHz,
  // and A-weighting makes the 7th harmonic only ~11 dB down perceptually.
  // That is the ice-pick most likely to actually hurt a child's ears.
  const tame = c.ctx.createBiquadFilter();
  tame.type = 'lowpass';
  tame.frequency.setValueAtTime(
    Math.min(TONE_TAME_HZ, Math.max(startFreq, endFreq) * TONE_TAME_HARMONICS),
    start,
  );
  tame.Q.setValueAtTime(0.4, start);
  osc.connect(tame);
  tame.connect(gain);
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
  // Attack ramp, matching tone(): `setValueAtTime(peak, ...)` is a step
  // discontinuity and every one of these 14 call sites clicked. Kitchen fires
  // twelve of them per bar.
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + NOISE_ATTACK_SECONDS);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.dest);
  // Random offset into the shared noise buffer. Every burst previously
  // started at sample 0 of one fixed 2-second buffer, so e.g. Kitchen's
  // twelve whisk ticks a bar were twelve copies of the same 35ms — which is
  // why the percussion read as a machine loop rather than an instrument.
  src.start(start, Math.random() * Math.max(0, c.noise.duration - duration - 0.05));
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
