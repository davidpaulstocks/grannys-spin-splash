/**
 * Funfair's theme — a carnival calliope. Key of G major, a bouncy 108 BPM
 * with an "oom-pah" foundation (low note on 1&3, higher on 2&4 — the
 * classic polka/carousel bounce) instead of any other world's straight
 * pulse. Bright detuned square/triangle organ voices with light vibrato
 * stand in for a calliope; a top carousel-bell voice completes the ride.
 */

import {
  filteredNoiseBurst,
  filteredTone,
  tone,
  type VoiceContext,
} from '../synthPrimitives';
import type { WorldTheme } from './theme.types';

const BEAT_SECONDS = 60 / 108;
const BAR_SECONDS = BEAT_SECONDS * 4;

const G3 = 196.0;
const B3 = 246.94;
const D4 = 293.66;
const G4 = 392.0;
const B4 = 493.88;
const D5 = 587.33;
const G5 = 783.99;

/** Oom-pah: low root on 1&3, a higher chord stab on 2&4 — the carousel bounce. */
function foundation(c: VoiceContext): void {
  tone(c, 'sine', G3 / 2, 0, 0.28, 0.55, 0.02);
  tone(c, 'sine', G3 / 2, BEAT_SECONDS * 2, 0.28, 0.45, 0.02);
  tone(c, 'triangle', G4, BEAT_SECONDS, 0.2, 0.28, 0.01);
  tone(c, 'triangle', G4, BEAT_SECONDS * 3, 0.2, 0.24, 0.01);
}

/** Calliope organ stab — a bright detuned square pair, one note per beat. */
function calliopeStab(c: VoiceContext): void {
  const line = [G4, B4, D5, B4];
  line.forEach((freq, i) => {
    const t = i * BEAT_SECONDS;
    tone(c, 'square', freq, t, 0.32, 0.28, 0.004);
    tone(c, 'square', freq, t, 0.3, 0.16, 0.004, 10);
  });
}

/** A carousel top-bell, bright and short. */
function carouselBell(c: VoiceContext): void {
  const freq = c.bar % 2 === 0 ? G5 : D5;
  tone(c, 'sine', freq, 0, 0.9, 0.32, 0.006);
  tone(c, 'sine', freq * 2, 0, 0.35, 0.1, 0.004);
}

/** Bunting/flags flapping — light, quick noise ticks, playful not menacing. */
function buntingFlutter(c: VoiceContext): void {
  for (let i = 0; i < 6; i++) {
    filteredNoiseBurst(c, i * (BEAT_SECONDS * 0.66), 0.05, 0.16, 'bandpass', 3200, 2);
  }
}

function calliopePad(c: VoiceContext): void {
  for (const freq of [G3, B3, D4]) {
    filteredTone(c, 'square', freq, 0, BAR_SECONDS, 0.08, 1400, 0.4);
  }
}

function ticketBoothArpeggio(c: VoiceContext): void {
  const line = [G4, B4, D5, G5, D5, B4, G4, D4];
  line.forEach((freq, i) => tone(c, 'triangle', freq, i * (BEAT_SECONDS / 2), 0.18, 0.18, 0.004));
}

/** A vibrato-heavy sustained organ note — the calliope's held chord. */
function organSwell(c: VoiceContext): void {
  const start = c.at;
  const osc = c.ctx.createOscillator();
  const vibrato = c.ctx.createOscillator();
  const vibratoDepth = c.ctx.createGain();
  const gain = c.ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(D4, start);
  vibrato.frequency.setValueAtTime(6, start);
  vibratoDepth.gain.setValueAtTime(8, start);
  vibrato.connect(vibratoDepth);
  vibratoDepth.connect(osc.frequency);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(0.16, start + 0.5);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + BAR_SECONDS);
  osc.connect(gain);
  gain.connect(c.dest);
  vibrato.start(start);
  osc.start(start);
  vibrato.stop(start + BAR_SECONDS + 0.02);
  osc.stop(start + BAR_SECONDS + 0.02);
}

function crowdOoh(c: VoiceContext): void {
  filteredTone(c, 'sine', B4, 0, BAR_SECONDS, 0.1, 2000, 0.9);
  filteredTone(c, 'sine', D4, 0, BAR_SECONDS, 0.08, 2000, 0.9, -6);
}

/** A quick fairground whistle-toot. */
function whistleToot(c: VoiceContext): void {
  tone(c, 'square', G5, BEAT_SECONDS * 1.5, 0.18, 0.16, 0.003);
  tone(c, 'square', D5, BEAT_SECONDS * 3.5, 0.16, 0.14, 0.003);
}

function dropBass(c: VoiceContext): void {
  for (let i = 0; i < 4; i++) {
    filteredTone(
      c,
      'sawtooth',
      G3 / 2,
      i * BEAT_SECONDS,
      BEAT_SECONDS,
      0.5,
      210 + (i % 2) * 480,
      0.02,
    );
  }
}

function cinematicHit(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer): void {
  const c: VoiceContext = { ctx, dest, at: ctx.currentTime, bar: 0, noise };
  for (const freq of [G4, B4, D5, G5]) tone(c, 'square', freq, 0, 1.7, 0.42, 0.008);
  filteredNoiseBurst(c, 0, 1.1, 0.24, 'bandpass', 3800, 2);
}

export const FUNFAIR_THEME: WorldTheme = {
  id: 'funfair',
  beatSeconds: BEAT_SECONDS,
  barSeconds: BAR_SECONDS,
  voices: {
    foundation,
    spinner0: calliopeStab,
    spinner1: carouselBell,
    spinner2: buntingFlutter,
    spinner3: calliopePad,
    spinner4: ticketBoothArpeggio,
    spinner5: organSwell,
    spinner6: crowdOoh,
    spinner7: whistleToot,
    spinner8: carouselBell,
    dropBass,
  },
  cinematicHit,
};
