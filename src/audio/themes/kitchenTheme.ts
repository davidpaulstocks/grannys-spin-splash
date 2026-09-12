/**
 * Kitchen's theme — bright, glassy, playful. Key of F major, a bouncy 98
 * BPM. Distinguishing voices: `spinner0` is a glassy kalimba/xylophone
 * pluck (bowls and cutlery), `spinner2` is a "sizzle" — soft high-passed
 * noise standing in for a pan on the stove — and the hi-hat-slot is a
 * quick tremolo evoking a whisk against a bowl.
 */

import { filteredNoiseBurst, filteredTone, tone, type VoiceContext } from '../synthPrimitives';
import type { WorldTheme } from './theme.types';

const BEAT_SECONDS = 60 / 98;
const BAR_SECONDS = BEAT_SECONDS * 4;

const F3 = 174.61;
const A3 = 220;
const C4 = 261.63;
const F4 = 349.23;
const A4 = 440;
const C5 = 523.25;
const D5 = 587.33;
const F5 = 698.46;
const A5 = 880;

function foundation(c: VoiceContext): void {
  tone(c, 'sine', F3 / 2, 0, 0.3, 0.5, 0.03);
  tone(c, 'sine', F3 / 2, BEAT_SECONDS * 2, 0.3, 0.4, 0.03);
  filteredTone(c, 'sine', F3 / 2, 0, BAR_SECONDS, 0.2, 260, 0.2);
}

/** Glassy kalimba/xylophone pluck — bowls-and-cutlery imagery. */
function glassPluck(c: VoiceContext): void {
  const line = [C5, F5, A4, F5];
  line.forEach((freq, i) => tone(c, 'triangle', freq, i * BEAT_SECONDS, 0.4, 0.42, 0.003));
}

/** Whisk-against-bowl tremolo — quick alternating high ticks, faster than any other world's hi-hat slot. */
function whiskTremolo(c: VoiceContext): void {
  for (let i = 0; i < 12; i++) {
    filteredNoiseBurst(
      c,
      i * (BEAT_SECONDS / 3),
      0.035,
      i % 3 === 0 ? 0.24 : 0.13,
      'highpass',
      6500,
    );
  }
}

/** A soft stovetop sizzle — sustained, gentle, high-passed noise. */
function sizzle(c: VoiceContext): void {
  filteredNoiseBurst(c, 0, BAR_SECONDS, 0.07, 'highpass', 4500, 0.7);
}

function butterPad(c: VoiceContext): void {
  for (const freq of [F4, A4, C5]) {
    filteredTone(c, 'triangle', freq, 0, BAR_SECONDS, 0.12, 1000, 0.6);
  }
}

function bouncyArpeggio(c: VoiceContext): void {
  const line = [F4, A4, C5, D5, C5, A4, F4, C4];
  line.forEach((freq, i) => tone(c, 'square', freq, i * (BEAT_SECONDS / 2), 0.15, 0.17, 0.004));
}

/** A single bright ping, like a timer or oven bell. */
function timerPing(c: VoiceContext): void {
  const freq = c.bar % 2 === 0 ? A5 : F5;
  tone(c, 'sine', freq, 0, 1.0, 0.3, 0.006);
  tone(c, 'sine', freq * 2, 0, 0.4, 0.1, 0.004);
}

function creamyStrings(c: VoiceContext): void {
  filteredTone(c, 'sawtooth', A3, 0, BAR_SECONDS, 0.14, 1300, 0.7);
  filteredTone(c, 'sawtooth', C4, 0, BAR_SECONDS, 0.14, 1300, 0.7, 6);
}

function kettleOoh(c: VoiceContext): void {
  filteredTone(c, 'sine', A4, 0, BAR_SECONDS, 0.1, 1900, 1.0);
  filteredTone(c, 'sine', F4, 0, BAR_SECONDS, 0.08, 1900, 1.0, -5);
}

/** A quick clink — cutlery/glassware texture, sparse. */
function clink(c: VoiceContext): void {
  tone(c, 'sine', A5 * 1.5, BEAT_SECONDS * 1.5, 0.3, 0.16, 0.002);
  tone(c, 'sine', A5 * 1.5, BEAT_SECONDS * 3.5, 0.25, 0.13, 0.002);
}

function dropBass(c: VoiceContext): void {
  for (let i = 0; i < 4; i++) {
    filteredTone(
      c,
      'sawtooth',
      F3 / 2,
      i * BEAT_SECONDS,
      BEAT_SECONDS,
      0.5,
      200 + (i % 2) * 460,
      0.02,
    );
  }
}

function cinematicHit(ctx: AudioContext, dest: AudioNode, noise: AudioBuffer): void {
  const c: VoiceContext = { ctx, dest, at: ctx.currentTime, bar: 0, noise };
  for (const freq of [C5, F5, A5]) tone(c, 'triangle', freq, 0, 1.6, 0.45, 0.008);
  filteredNoiseBurst(c, 0, 1.0, 0.22, 'highpass', 5000, 1);
}

export const KITCHEN_THEME: WorldTheme = {
  id: 'kitchen',
  beatSeconds: BEAT_SECONDS,
  barSeconds: BAR_SECONDS,
  /** F major — matches F3/A3/C4 above. See WorldTheme.padHz. */
  padHz: [174.61, 220, 261.63],
  voices: {
    foundation,
    spinner0: glassPluck,
    spinner1: whiskTremolo,
    spinner2: sizzle,
    spinner3: butterPad,
    spinner4: bouncyArpeggio,
    spinner5: timerPing,
    spinner6: creamyStrings,
    spinner7: kettleOoh,
    spinner8: clink,
    dropBass,
  },
  cinematicHit,
};
