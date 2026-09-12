/**
 * The ASMR orchestra — CLAUDE.md §9, the game's headline feature. Holds one
 * GainNode per musical layer, keeps every layer scheduled on the same audio
 * clock so they can never drift apart, and mixes purely by moving those
 * gains. Instruments themselves live in orchestraVoices.ts.
 *
 * Mixing follows §9.1.1's refined model rather than §9.1's original
 * population thresholds: each spinner IS an instrument, and a spinner's own
 * `currentSpeed / MAX_SPINNER_SPEED` is that layer's gain, continuously.
 * Soak one spinner and its instrument swells in real time; let it decay and
 * the instrument fades back out, which is where the ASMR payoff actually
 * comes from — no separate fade logic needed.
 *
 * §9.2's reference implementation loads N looping AudioBufferSourceNodes and
 * starts them all silently at one shared time. Synthesised voices reach the
 * same guarantee more directly: every bar for every layer is scheduled from
 * the same `_nextBarTime`, so layers are sample-aligned by construction and
 * a silent layer costs nothing until its gain comes up.
 */

import { audioBus } from './AudioBus';
import {
  BAR_SECONDS,
  playCinematicHit,
  SPINNER_VOICES,
  VOICES,
  type VoiceId,
} from './orchestraVoices';

/** How far ahead of the audio clock bars are scheduled, and how often we top that up. */
const LOOKAHEAD_SECONDS = 0.4;
const SCHEDULER_INTERVAL_MS = 100;

/** §9.2's gain tween: 250ms to settle. `setTargetAtTime` reaches ~95% in 3 time constants. */
const GAIN_SMOOTHING_SECONDS = 0.25 / 3;

/** Headroom so nine simultaneous layers plus SFX don't clip the master bus. */
const LAYER_HEADROOM = 0.36;

/** The foundation never reacts to spinners — it's the rhythmic floor (§9.1.1). */
const FOUNDATION_GAIN = 0.5;
const DROP_BASS_GAIN = 0.7;

const NOISE_SECONDS = 2;

export interface OrchestraSpinnerSnapshot {
  /** 0..1 — this spinner's charge as a fraction of MAX_SPINNER_SPEED. */
  readonly charge: number;
}

export class AudioOrchestra {
  private _ctx: AudioContext | null = null;
  private _layers = new Map<VoiceId, GainNode>();
  private _noise: AudioBuffer | null = null;
  private _timer: ReturnType<typeof setInterval> | null = null;
  private _nextBarTime = 0;
  private _bar = 0;
  private _running = false;

  /**
   * Builds the layer graph and starts the scheduler. Safe to call on every
   * run start — a second call while already running is ignored. Requires
   * `audioBus.init()` to have happened on a user gesture first; without a
   * context this no-ops and the game is simply silent.
   */
  start(): void {
    if (this._running) return;
    audioBus.resume();
    const ctx = audioBus.context;
    const master = audioBus.master;
    if (!ctx || !master) return;

    this._ctx = ctx;
    this._noise ??= this._createNoise(ctx);
    if (this._layers.size === 0) {
      for (const id of Object.keys(VOICES) as VoiceId[]) {
        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.connect(master);
        this._layers.set(id, gain);
      }
    }
    this._setGain('foundation', FOUNDATION_GAIN);
    this._nextBarTime = ctx.currentTime + 0.08;
    this._bar = 0;
    this._running = true;
    this._scheduleAhead();
    this._timer = setInterval(() => this._scheduleAhead(), SCHEDULER_INTERVAL_MS);
  }

  /** Stops the scheduler and silences every layer. Call on round end, pause, and scene shutdown. */
  stop(): void {
    this._running = false;
    if (this._timer !== null) {
      clearInterval(this._timer);
      this._timer = null;
    }
    for (const gain of this._layers.values()) gain.gain.value = 0;
  }

  /**
   * Drives the mix from live spinner state — call once per frame. Each
   * spinner's charge sets its assigned layer's gain directly (§9.1.1);
   * where more spinners than layers share one instrument, the loudest
   * wins, so doubling up reinforces that instrument instead of the last
   * spinner in the array silencing the others.
   */
  updateMix(spinners: readonly OrchestraSpinnerSnapshot[]): void {
    if (!this._running || spinners.length === 0) return;
    const targets = new Map<VoiceId, number>();
    spinners.forEach((spinner, i) => {
      const id = SPINNER_VOICES[i % SPINNER_VOICES.length];
      targets.set(id, Math.max(targets.get(id) ?? 0, Math.min(1, Math.max(0, spinner.charge))));
    });
    for (const id of SPINNER_VOICES) {
      this._setGain(id, (targets.get(id) ?? 0) * LAYER_HEADROOM);
    }
  }

  /** SPLASH FRENZY: the drop bass sustains for the bonus window and the cinematic hit fires once. */
  onFrenzyStart(): void {
    if (!this._running || !this._ctx || !this._noise) return;
    this._setGain('dropBass', DROP_BASS_GAIN);
    const master = audioBus.master;
    if (master) playCinematicHit(this._ctx, master, this._noise);
  }

  onFrenzyEnd(): void {
    this._setGain('dropBass', 0);
  }

  private _setGain(id: VoiceId, value: number): void {
    const gain = this._layers.get(id);
    if (!gain || !this._ctx) return;
    gain.gain.setTargetAtTime(value, this._ctx.currentTime, GAIN_SMOOTHING_SECONDS);
  }

  /**
   * Schedules every layer's next bar(s) up to the lookahead horizon. Layers
   * whose gain is 0 are skipped — an inaudible layer would still cost a
   * dozen oscillators per bar, and because bar boundaries are derived from
   * `_nextBarTime` rather than from when a layer started, one that comes
   * back in lands exactly on the shared grid anyway.
   */
  private _scheduleAhead(): void {
    const ctx = this._ctx;
    const noise = this._noise;
    if (!this._running || !ctx || !noise) return;

    while (this._nextBarTime < ctx.currentTime + LOOKAHEAD_SECONDS) {
      for (const [id, gain] of this._layers) {
        if (gain.gain.value < 0.001) continue;
        VOICES[id]({ ctx, dest: gain, at: this._nextBarTime, bar: this._bar, noise });
      }
      this._nextBarTime += BAR_SECONDS;
      this._bar++;
    }
  }

  private _createNoise(ctx: AudioContext): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * NOISE_SECONDS);
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }
}

/** Shared instance — one orchestra for the whole game, like the audio bus it plays through. */
export const audioOrchestra = new AudioOrchestra();
