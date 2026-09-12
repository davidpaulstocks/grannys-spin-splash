/**
 * One-shot sound effects (CLAUDE.md §7.2, story 4.5) — synthesised via Web
 * Audio, not audio files, so none of this needs the Sprint 4 audio-source
 * decision (CLAUDE.md §9.3, still pending) to ship. Ported from the
 * reference prototype's `AudioManager` per CLAUDE.md §2's explicit
 * instruction ("lift these one-shot SFX synth recipes... copy them as a
 * starting point") — the exact envelopes/frequencies are kept because
 * "they sound right", only the multiplayer (P2) and obstacle/powerup
 * variants are dropped since those systems don't exist yet.
 */

import { audioBus } from './AudioBus';

/** Every one-shot ramps in over this long — see playHit's note on step discontinuities. */
const SFX_ATTACK_SECONDS = 0.006;

/**
 * The one primitive every SFX below is built from: a decaying tone
 * starting at `startFreq`, optionally sweeping to `endFreq`, scheduled at
 * `startTime` on the shared audio clock (so a single SFX call can
 * schedule several staggered notes without re-deriving `currentTime`
 * itself, e.g. playUpgrade's chord or playFrenzy's fanfare run).
 */
function scheduleTone(
  startTime: number,
  type: OscillatorType,
  startFreq: number,
  durationSeconds: number,
  volume: number,
  endFreq: number | null = null,
): void {
  const ctx = audioBus.context;
  const master = audioBus.master;
  if (!ctx || !master) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, startTime);
  if (endFreq)
    osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + durationSeconds * 0.8);
  // Short attack rather than a step to full volume: `setValueAtTime` is a
  // discontinuity, i.e. an audible click on every one-shot in the game.
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + SFX_ATTACK_SECONDS);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationSeconds);
  osc.connect(gain);
  gain.connect(master);
  osc.start(startTime);
  osc.stop(startTime + durationSeconds + 0.02);
}

/** Plays a single tone right now — the common case, one note, no staggering. */
function playTone(
  type: OscillatorType,
  startFreq: number,
  durationSeconds: number,
  volume: number,
  endFreq: number | null = null,
): void {
  if (!audioBus.ready) return;
  audioBus.resume();
  const ctx = audioBus.context;
  if (!ctx) return;
  scheduleTone(ctx.currentTime, type, startFreq, durationSeconds, volume, endFreq);
}

/**
 * Plays a sequence of notes, each `stepSeconds` after the last, starting
 * now — the shape behind playUpgrade's chord, playRefill/playFrenzy's
 * runs, and playPump's double-click.
 */
function playSequence(
  notes: readonly { readonly freq: number; readonly type?: OscillatorType }[],
  stepSeconds: number,
  durationSeconds: number,
  volume: number,
  endFreqFor?: (freq: number) => number,
): void {
  if (!audioBus.ready) return;
  audioBus.resume();
  const ctx = audioBus.context;
  if (!ctx) return;
  const t0 = ctx.currentTime;
  notes.forEach(({ freq, type = 'sine' }, i) => {
    scheduleTone(
      t0 + i * stepSeconds,
      type,
      freq,
      durationSeconds,
      volume,
      endFreqFor?.(freq) ?? null,
    );
  });
}

/** A water hit landing on a spinner — pitch rises with the spinner's current speed. */
/**
 * How often a landed hit is actually audible, and how loud.
 *
 * The cannon fires every `interval / FIRE_DENSITY_SCALE` ms — 55ms for the
 * Drip Pistol, and 61 hits/second for a twin-stream Soaker 3000 — and each
 * hit was a 0.18s raw sawtooth at 0.12 with ZERO attack, connected straight
 * to master and so bypassing the orchestra's limiter entirely. Measured by
 * audit: 3-11 of them overlapping continuously, summing to ~-24.5 dBFS
 * against an orchestra sitting near -31 dBFS. **The music was ~6 dB quieter
 * than a permanent wall of sawtooth transients** — and once the tank was
 * sized to last the whole round, the player fires almost constantly, so it
 * never let up. That, more than the synthesis itself, is why the ASMR
 * soundtrack "did not feel good": it was inaudible underneath its own SFX.
 *
 * So: one audible hit at most every HIT_MIN_INTERVAL_MS, much quieter, with
 * a real attack ramp so it reads as a splash rather than a click. The
 * per-hit feedback the user asked for earlier is preserved visually (splash
 * VFX, floating stars) and is unchanged.
 */
const HIT_MIN_INTERVAL_MS = 90;
const HIT_VOLUME = 0.035;
let _lastHitAt = -Infinity;

export function playHit(spinnerSpeed = 50): void {
  const now = performance.now();
  if (now - _lastHitAt < HIT_MIN_INTERVAL_MS) return;
  _lastHitAt = now;
  const freq = 60 + spinnerSpeed * 3.5;
  playTone('triangle', freq, 0.14, HIT_VOLUME, freq * 1.8);
}

/** Combo level increments (1–5) — a short rising chime per level. */
export function playCombo(comboLevel: number): void {
  const notes = [0, 262, 330, 392, 523, 660];
  const freq = notes[Math.min(comboLevel, 5)];
  if (!freq) return;
  playTone('triangle', freq, 0.28, 0.16, freq * 1.4);
}

/** A spinner levels up a state tier (SLOW/MEDIUM/FULL) — a short ascending chord, one extra note per tier. */
export function playUpgrade(stateOrdinal: number): void {
  const roots = [0, 330, 523, 784];
  const root = roots[stateOrdinal] ?? 440;
  const multipliers = [1, 1.26, 1.5, 2].slice(0, stateOrdinal + 1);
  playSequence(
    multipliers.map((m) => ({ freq: root * m })),
    0.075,
    0.45,
    0.17,
  );
}

/** Water tank hits empty and starts its pump-refill wait — two quick low clicks. */
export function playPump(): void {
  playSequence(
    [
      { freq: 180, type: 'square' },
      { freq: 180, type: 'square' },
    ],
    0.14,
    0.11,
    0.22,
    () => 55,
  );
}

/** Pump-refill completes — a bright 4-note ascending chime. */
export function playRefill(): void {
  playSequence(
    [523, 659, 784, 1047].map((freq) => ({ freq })),
    0.09,
    0.35,
    0.14,
  );
}

/** Whirligig deflects a hit instead of landing it — a short muted thud. */
export function playDeflect(): void {
  playTone('sine', 300, 0.15, 0.1, 180);
}

/** SPLASH FRENZY triggers — a 10-note fanfare run. */
export function playFrenzy(): void {
  const freqs = [523, 659, 784, 1047, 1319, 1047, 784, 1047, 1319, 1568];
  playSequence(
    freqs.map((freq, i) => ({ freq, type: i % 2 === 0 ? 'sine' : 'triangle' }) as const),
    0.11,
    0.1,
    0.2,
  );
}

/** A Golden Spinner appears — three quick bright chimes (prototype: 880/1047/1319 sine). */
export function playGoldenAppear(): void {
  playSequence([{ freq: 880 }, { freq: 1047 }, { freq: 1319 }], 0.06, 0.2, 0.15);
}

/** A Golden Spinner expires unclaimed — a short falling tone. */
export function playGoldenExpire(): void {
  playTone('sine', 440, 0.5, 0.12, 220);
}

/**
 * Countdown tick — one per second in the final 10s of a round (CLAUDE.md
 * §2's "urgency" reference, restored 2026-09-12 from the prototype's own
 * `playTick`: sine 660Hz normally, 880Hz for the final 3 seconds).
 */
export function playTick(urgent: boolean): void {
  playTone('sine', urgent ? 880 : 660, urgent ? 0.12 : 0.07, 0.1);
}

/** A power-up pickup is collected — a bright ascending triad, distinct from playRefill's 4-note run. */
export function playPowerup(): void {
  playSequence([{ freq: 392 }, { freq: 587 }, { freq: 784 }], 0.08, 0.3, 0.18);
}

/**
 * A soft encouragement ping under an "encouragement toast" (2026-09-12,
 * direct user request: "well done, or let's go... a little sound effect,
 * without disrupting from the actual orchestra sound, which is the hero").
 * Deliberately the quietest thing in this file (0.09 vs everything else's
 * 0.1-0.2) and a single short sine note, not a run — the orchestra is
 * meant to fill the room at these moments, this only needs to be felt,
 * not competed with.
 */
export function playEncouragement(): void {
  playTone('sine', 880, 0.22, 0.09, 1180);
}
