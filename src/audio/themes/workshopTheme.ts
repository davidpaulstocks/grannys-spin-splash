/**
 * Workshop's theme — industrial and mechanical. Key of D minor, a driving
 * 100 BPM. Direct user request: "perhaps one of the workshop can be like
 * clanging and like a kind of steel band type sound" — `spinner0` is a
 * literal hammer-on-metal clang, `spinner1` is a steel-drum emulation
 * (bright short tones with a quick downward pitch settle, the classic
 * cheap-and-effective steelpan trick), and the foundation itself carries a
 * metallic edge instead of Garden's soft rounded thud.
 */

import {
  filteredNoiseBurst,
  filteredTone,
  metallicHit,
  pitchBendTone,
  tone,
  type VoiceContext,
} from '../synthPrimitives';
import type { WorldTheme } from './theme.types';

const BEAT_SECONDS = 60 / 100;
const BAR_SECONDS = BEAT_SECONDS * 4;

const D3 = 146.83;
const F3 = 174.61;
const A3 = 220;
const D4 = 293.66;
const F4 = 349.23;
const A4 = 440;
const D5 = 587.33;
const F5 = 698.46;
const A5 = 880;

function foundation(c: VoiceContext): void {
  tone(c, 'square', D3 / 2, 0, 0.22, 0.5, 0.004);
  tone(c, 'square', D3 / 2, BEAT_SECONDS * 2, 0.22, 0.42, 0.004);
  filteredTone(c, 'sawtooth', D3 / 2, 0, BAR_SECONDS, 0.16, 260, 0.2);
}

/** Hammer-on-metal clang — sparse, on the off-beats, so it reads as a strike, not a loop. */
function clang(c: VoiceContext): void {
  metallicHit(c, D5, BEAT_SECONDS * 1, 0.5, 0.42);
  metallicHit(c, A4, BEAT_SECONDS * 3, 0.4, 0.36);
}

/** Steel-drum emulation: bright tone with a quick downward pitch settle, the standard cheap steelpan trick. */
function steelDrum(c: VoiceContext): void {
  const line = [D4, F4, A4, F4];
  line.forEach((freq, i) => {
    const t = i * BEAT_SECONDS;
    pitchBendTone(c, 'sine', freq * 1.01, freq, t, 0.5, 0.42, 0.003);
    pitchBendTone(c, 'triangle', freq * 2.02, freq * 2, t, 0.28, 0.16, 0.003);
  });
}

/** A ratchet-like rhythmic scrape. */
function ratchet(c: VoiceContext): void {
  for (let i = 0; i < 4; i++) {
    filteredNoiseBurst(c, i * BEAT_SECONDS, 0.08, 0.22, 'bandpass', 1400, 3);
  }
}

function gritPad(c: VoiceContext): void {
  for (const freq of [D3, F3, A3]) {
    filteredTone(c, 'sawtooth', freq, 0, BAR_SECONDS, 0.13, 500, 0.5);
  }
}

function drivingArpeggio(c: VoiceContext): void {
  const line = [D4, F4, A4, D5, A4, F4, D4, A3];
  line.forEach((freq, i) => tone(c, 'square', freq, i * (BEAT_SECONDS / 2), 0.14, 0.17, 0.003));
}

/** Grinding texture — sustained lowpass noise, gritty underlay. */
function grind(c: VoiceContext): void {
  filteredNoiseBurst(c, 0, BAR_SECONDS, 0.09, 'lowpass', 900, 1.2);
}

function ironStrings(c: VoiceContext): void {
  filteredTone(c, 'sawtooth', A3, 0, BAR_SECONDS, 0.15, 1100, 0.8);
  filteredTone(c, 'sawtooth', D4, 0, BAR_SECONDS, 0.15, 1100, 0.8, -8);
}

function bellowsSwell(c: VoiceContext): void {
  const start = c.at;
  const osc = c.ctx.createOscillator();
  const filter = c.ctx.createBiquadFilter();
  const gain = c.ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(D4, start);
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(280, start);
  filter.frequency.linearRampToValueAtTime(2400, start + BAR_SECONDS * 0.65);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(0.28, start + BAR_SECONDS * 0.5);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + BAR_SECONDS);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(c.dest);
  osc.start(start);
  osc.stop(start + BAR_SECONDS + 0.02);
}

/** A second, higher metallic voice for texture variety across the wider Workshop grid. */
function anvilTing(c: VoiceContext): void {
  metallicHit(c, A5, 0, 0.4, 0.3);
  metallicHit(c, F5, BEAT_SECONDS * 2, 0.35, 0.26);
}

function dropBass(c: VoiceContext): void {
  for (let i = 0; i < 4; i++) {
    filteredTone(
      c,
      'square',
      D3 / 2,
      i * BEAT_SECONDS,
      BEAT_SECONDS,
      0.5,
      200 + (i % 2) * 500,
      0.015,
    );
  }
}

function cinematicHit(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer): void {
  const c: VoiceContext = { ctx, dest, at: ctx.currentTime, bar: 0, noise };
  metallicHit(c, D5, 0, 1.2, 0.7);
  tone(c, 'sine', D3 / 2, 0, 1.8, 0.85, 0.005);
  filteredNoiseBurst(c, 0, 1.0, 0.35, 'highpass', 300, 1);
}

export const WORKSHOP_THEME: WorldTheme = {
  id: 'workshop',
  beatSeconds: BEAT_SECONDS,
  barSeconds: BAR_SECONDS,
  voices: {
    foundation,
    spinner0: clang,
    spinner1: steelDrum,
    spinner2: ratchet,
    spinner3: gritPad,
    spinner4: drivingArpeggio,
    spinner5: grind,
    spinner6: ironStrings,
    spinner7: bellowsSwell,
    spinner8: anvilTing,
    dropBass,
  },
  cinematicHit,
};
