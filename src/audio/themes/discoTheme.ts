/**
 * Disco's theme — the real thing, not a reskin. Key of A minor, but at 120
 * BPM (every other world sits 92-108) — tempo alone makes this the one
 * world that's unmistakably a different genre. The foundation is a genuine
 * four-on-the-floor kick (every beat, not the other worlds' 1-and-3), plus
 * eighth-note hats, a syncopated octave-jumping bass line, an off-beat
 * "chick" wah-guitar comp, punchy string STABS instead of any other
 * world's sustained pad, and falsetto disco oohs. Direct user request:
 * "let's make sure that the one in the disco is actual disco music."
 */

import { filteredNoiseBurst, filteredTone, tone, type VoiceContext } from '../synthPrimitives';
import type { WorldTheme } from './theme.types';

const BEAT_SECONDS = 60 / 120;
const BAR_SECONDS = BEAT_SECONDS * 4;
const EIGHTH = BEAT_SECONDS / 2;
const SIXTEENTH = BEAT_SECONDS / 4;

const A2 = 110;
const C3 = 130.81;
const G3 = 196.0;
const A3 = 220;
const C4 = 261.63;
const E4 = 329.63;
const A4 = 440;
const C5 = 523.25;
const E5 = 659.25;
const A5 = 880;

/** Four-on-the-floor: a kick on every beat, the single most defining disco trait. */
function foundation(c: VoiceContext): void {
  for (let beat = 0; beat < 4; beat++) {
    tone(c, 'sine', A2, beat * BEAT_SECONDS, 0.18, 0.6, 0.003);
  }
}

/** The syncopated octave-jump disco bass line — root, then a jump up an octave on the off-beat. */
function discoBass(c: VoiceContext): void {
  const pattern: readonly [number, number][] = [
    [0, A2],
    [EIGHTH, A3],
    [BEAT_SECONDS, A2],
    [BEAT_SECONDS + EIGHTH, C3],
    [BEAT_SECONDS * 2, A2],
    [BEAT_SECONDS * 2 + EIGHTH, A3],
    [BEAT_SECONDS * 3, G3 / 2],
    [BEAT_SECONDS * 3 + EIGHTH, G3],
  ];
  for (const [t, freq] of pattern) tone(c, 'sawtooth', freq, t, EIGHTH * 0.9, 0.32, 0.004);
}

/** Sixteen eighth-note hats, alternating closed/open for the classic disco hat pattern. */
function discoHats(c: VoiceContext): void {
  for (let i = 0; i < 8; i++) {
    const open = i % 2 === 1;
    filteredNoiseBurst(c, i * EIGHTH, open ? 0.09 : 0.04, open ? 0.22 : 0.3, 'highpass', 8000);
  }
}

/** The "chick" wah-guitar comp — a short square-wave hit through a swept bandpass, on every off-beat. */
function wahGuitar(c: VoiceContext): void {
  for (let i = 0; i < 4; i++) {
    const start = c.at + i * BEAT_SECONDS + EIGHTH;
    const osc = c.ctx.createOscillator();
    const filter = c.ctx.createBiquadFilter();
    const gain = c.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(A3, start);
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(6, start);
    filter.frequency.setValueAtTime(500, start);
    filter.frequency.linearRampToValueAtTime(2200, start + 0.09);
    gain.gain.setValueAtTime(0.001, start);
    gain.gain.linearRampToValueAtTime(0.26, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.14);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(c.dest);
    osc.start(start);
    osc.stop(start + 0.16);
  }
}

/** Punchy string STABS — short, not sustained, unlike every other world's pad. That's what makes disco feel driven. */
function stringStabs(c: VoiceContext): void {
  const hits = [0, BEAT_SECONDS * 1.5, BEAT_SECONDS * 2.5];
  for (const t of hits) {
    filteredTone(c, 'sawtooth', E4, t, 0.22, 0.3, 1800, 0.004);
    filteredTone(c, 'sawtooth', A4, t, 0.22, 0.3, 1800, 0.004, 6);
  }
}

/** A rising sixteenth-note synth flourish — the classic disco run. */
function synthRun(c: VoiceContext): void {
  const line = [A4, C5, E5, A5, E5, C5, A4, E4];
  line.forEach((freq, i) => tone(c, 'square', freq, i * SIXTEENTH, 0.14, 0.15, 0.003));
}

/** A funky clav-like pluck, syncopated. */
function clavPluck(c: VoiceContext): void {
  const hits = [EIGHTH, BEAT_SECONDS + EIGHTH * 1.5, BEAT_SECONDS * 3];
  for (const t of hits) tone(c, 'square', C4, t, 0.12, 0.24, 0.002);
}

/** One sustained string layer for lushness under the punchy stabs. */
function sustainedStrings(c: VoiceContext): void {
  filteredTone(c, 'sawtooth', A3, 0, BAR_SECONDS, 0.09, 1400, 0.6);
  filteredTone(c, 'sawtooth', C4, 0, BAR_SECONDS, 0.09, 1400, 0.6, 5);
}

/** Falsetto disco backing "oohs" — higher and brighter than any other world's vocal-ish voice. */
function falsettoOoh(c: VoiceContext): void {
  const start = c.at;
  for (const freq of [A4, E5]) {
    const osc = c.ctx.createOscillator();
    const band = c.ctx.createBiquadFilter();
    const gain = c.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, start);
    band.type = 'bandpass';
    band.frequency.setValueAtTime(1400, start);
    band.Q.setValueAtTime(2.5, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.linearRampToValueAtTime(0.22, start + 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + BAR_SECONDS * 0.9);
    osc.connect(band);
    band.connect(gain);
    gain.connect(c.dest);
    osc.start(start);
    osc.stop(start + BAR_SECONDS);
  }
}

/** A shaker/tambourine shimmer on the off-beats — distinct in timbre from the hats slot. */
function shaker(c: VoiceContext): void {
  for (let i = 0; i < 4; i++) {
    filteredNoiseBurst(c, i * BEAT_SECONDS + EIGHTH, 0.05, 0.14, 'bandpass', 9000, 4);
  }
}

/** A filter-swept synth drop — Disco's own take on Frenzy's sustained bass. */
function filterDrop(c: VoiceContext): void {
  const start = c.at;
  const osc = c.ctx.createOscillator();
  const filter = c.ctx.createBiquadFilter();
  const gain = c.ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(A2, start);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(3000, start);
  filter.frequency.exponentialRampToValueAtTime(150, start + BEAT_SECONDS * 4);
  gain.gain.setValueAtTime(0.5, start);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.dest);
  osc.start(start);
  osc.stop(start + BEAT_SECONDS * 4 + 0.02);
}

function cinematicHit(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer): void {
  const c: VoiceContext = { ctx, dest, at: ctx.currentTime, bar: 0, noise };
  for (const freq of [A4, C5, E5, A5]) tone(c, 'square', freq, 0, 1.5, 0.4, 0.006);
  tone(c, 'sine', A2, 0, 1.8, 0.85, 0.004);
  filteredNoiseBurst(c, 0, 1.2, 0.28, 'bandpass', 8000, 3);
}

export const DISCO_THEME: WorldTheme = {
  id: 'disco',
  beatSeconds: BEAT_SECONDS,
  barSeconds: BAR_SECONDS,
  /** A minor — matches A2/C3/E3 above. See WorldTheme.padHz. */
  padHz: [110, 130.81, 164.81],
  voices: {
    foundation,
    spinner0: discoBass,
    spinner1: discoHats,
    spinner2: wahGuitar,
    spinner3: stringStabs,
    spinner4: synthRun,
    spinner5: clavPluck,
    spinner6: sustainedStrings,
    spinner7: falsettoOoh,
    spinner8: shaker,
    dropBass: filterDrop,
  },
  cinematicHit,
};
