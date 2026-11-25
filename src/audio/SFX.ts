/**
 * The few one-shot effects that are deliberately *not* voiced by the
 * orchestra: mechanical or menu sounds that should stay outside the music.
 * Everything a player does to the wall — hits, level-ups, combos, pickups —
 * is answered by the orchestra itself (`AudioOrchestra.accent`) and by
 * `WaterSound`, so feedback is part of the score rather than a beep over it.
 *
 * Synthesised in Web Audio, so none of this costs a download.
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

/** Results-screen flourish as the rank is revealed — a short ascending chord, one extra note per tier. */
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

/** Whirligig deflects a hit instead of landing it — a short muted thud. */
export function playDeflect(): void {
  playTone('sine', 300, 0.15, 0.1, 180);
}

/** Results-screen score count-up tick. */
export function playTick(urgent: boolean): void {
  playTone('sine', urgent ? 880 : 660, urgent ? 0.12 : 0.07, 0.1);
}
