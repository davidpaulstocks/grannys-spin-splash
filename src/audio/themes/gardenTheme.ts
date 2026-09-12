/**
 * Garden's theme — bright, airy, nature-ambient. Key of C major, a relaxed
 * 92 BPM. The distinguishing voice is `spinner0`'s bird chirp (a fast
 * upward pitch-bend, CLAUDE.md's "lovely music... garden has bird sounds"
 * direct request) plus a soft breeze/cricket shimmer texture instead of any
 * of the other worlds' percussive hi-hat — Garden is the calm baseline the
 * other four worlds contrast against.
 */

import {
  filteredNoiseBurst,
  filteredTone,
  pitchBendTone,
  tone,
  type VoiceContext,
} from '../synthPrimitives';
import type { WorldTheme } from './theme.types';

const BEAT_SECONDS = 60 / 92;
const BAR_SECONDS = BEAT_SECONDS * 4;

const C3 = 130.81;
const E3 = 164.81;
const G3 = 196.0;
const C4 = 261.63;
const E4 = 329.63;
const G4 = 392.0;
const A4 = 440;
const C5 = 523.25;
const D5 = 587.33;
const E5 = 659.25;
const G5 = 783.99;

function foundation(c: VoiceContext): void {
  // A soft, rounded low pulse rather than a hard kick — Garden never needs
  // to hit hard, just keep gentle time.
  tone(c, 'sine', C3, 0, 0.5, 0.55, 0.05);
  tone(c, 'sine', C3, BEAT_SECONDS * 2, 0.5, 0.4, 0.05);
  filteredTone(c, 'sine', C3 / 2, 0, BAR_SECONDS, 0.22, 200, 0.3);
}

/** Bird chirp — a fast upward-then-settling pitch bend, sparse (twice a bar) so it reads as a call, not a texture. */
function birdChirp(c: VoiceContext): void {
  const calls = c.bar % 2 === 0 ? [0.1, 2.3] : [0.6, 2.9];
  for (const t of calls) {
    pitchBendTone(c, 'sine', 1800, 2600, t, 0.14, 0.3, 0.005);
    pitchBendTone(c, 'sine', 2600, 2100, t + 0.12, 0.1, 0.22, 0.004);
  }
}

/** A soft droplet pluck — short triangle notes, watering-can/dew imagery. */
function dewPluck(c: VoiceContext): void {
  const line = [C5, G4, E4, G4];
  line.forEach((freq, i) => tone(c, 'triangle', freq, i * BEAT_SECONDS, 0.5, 0.4, 0.006));
}

/** A warm wooden marimba-like knock. */
function woodBell(c: VoiceContext): void {
  const freq = c.bar % 2 === 0 ? C5 : G4;
  tone(c, 'sine', freq, 0, 1.1, 0.36, 0.008);
  tone(c, 'triangle', freq * 2, 0, 0.4, 0.12, 0.004);
}

function gentlePad(c: VoiceContext): void {
  for (const freq of [C4, E4, G4]) {
    filteredTone(c, 'triangle', freq, 0, BAR_SECONDS, 0.11, 900, 0.8);
  }
}

function gentleArpeggio(c: VoiceContext): void {
  const line = [C5, D5, E5, D5, C5, E5, D5, G4];
  line.forEach((freq, i) => tone(c, 'sine', freq, i * (BEAT_SECONDS / 2), 0.2, 0.18, 0.006));
}

/** Wind through leaves — wide, very soft bandpassed noise, present the whole bar. */
function breezePad(c: VoiceContext): void {
  filteredNoiseBurst(c, 0, BAR_SECONDS, 0.06, 'bandpass', 1200, 0.6);
}

function warmStrings(c: VoiceContext): void {
  filteredTone(c, 'sawtooth', E3, 0, BAR_SECONDS, 0.13, 1200, 0.9);
  filteredTone(c, 'sawtooth', G3, 0, BAR_SECONDS, 0.13, 1200, 0.9, 5);
}

function distantOoh(c: VoiceContext): void {
  filteredTone(c, 'sine', A4, 0, BAR_SECONDS, 0.1, 1800, 1.1);
  filteredTone(c, 'sine', E4, 0, BAR_SECONDS, 0.08, 1800, 1.1, -4);
}

/** Cricket shimmer — quick, sparse, high-pitched noise ticks through a narrow band. */
function cricketShimmer(c: VoiceContext): void {
  for (let i = 0; i < 4; i++) {
    filteredNoiseBurst(c, i * (BAR_SECONDS / 4) + 0.2, 0.05, 0.18, 'bandpass', 6000, 8);
  }
}

/** A rising, blooming swell — Garden's own take on Frenzy's sustain, tying into its "BLOOM!" easter egg. */
function bloomSwell(c: VoiceContext): void {
  for (const freq of [C4, E4, G4, C5]) {
    filteredTone(c, 'triangle', freq, 0, BEAT_SECONDS * 4, 0.22, 400, 0.6, 0);
  }
}

function cinematicHit(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer): void {
  const c: VoiceContext = { ctx, dest, at: ctx.currentTime, bar: 0, noise };
  for (const freq of [C5, E5, G5, C5 * 2]) {
    tone(c, 'sine', freq, 0, 2.0, 0.5, 0.01);
  }
  filteredNoiseBurst(c, 0, 1.2, 0.2, 'bandpass', 5000, 4);
}

export const GARDEN_THEME: WorldTheme = {
  id: 'garden',
  beatSeconds: BEAT_SECONDS,
  barSeconds: BAR_SECONDS,
  voices: {
    foundation,
    spinner0: birdChirp,
    spinner1: dewPluck,
    spinner2: woodBell,
    spinner3: gentlePad,
    spinner4: gentleArpeggio,
    spinner5: breezePad,
    spinner6: warmStrings,
    spinner7: distantOoh,
    spinner8: cricketShimmer,
    dropBass: bloomSwell,
  },
  cinematicHit,
};
