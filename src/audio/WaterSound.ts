/**
 * The sound of the water itself — the "ASMR" half of the game's pitch, which
 * until now had no sound at all beyond a synthesised blip per hit.
 *
 * Three layers, all shaped noise and sine so they cost no download:
 *  - **Spray**: a continuous hiss while the cannon is firing, breathing
 *    slightly so it reads as a live jet rather than a held tone.
 *  - **Splash**: a short soft burst each time water lands, at a slightly
 *    different colour every time.
 *  - **Droplet**: the rising "plip" of a drop, every few splashes.
 *
 * Everything here sits well under the orchestra. It is texture to be felt,
 * not a layer to compete with the music.
 */

import { audioBus } from './AudioBus';

const NOISE_SECONDS = 2;

const SPRAY_LEVEL = 0.05;
const SPRAY_CENTRE_HZ = 3200;
const SPRAY_Q = 0.6;
const SPRAY_HIGHPASS_HZ = 900;
/** The jet's colour drifts a little so it never sounds like a held note. */
const SPRAY_WOBBLE_HZ = 7;
const SPRAY_WOBBLE_DEPTH_HZ = 500;
const SPRAY_ATTACK_SECONDS = 0.04;
const SPRAY_RELEASE_SECONDS = 0.12;

const SPLASH_MIN_INTERVAL_MS = 70;
const SPLASH_LEVEL = 0.07;
const SPLASH_SECONDS = 0.09;
const SPLASH_MIN_HZ = 900;
const SPLASH_RANGE_HZ = 1400;

/** One splash in this many also gets a droplet. */
const DROPLET_EVERY = 3;
const DROPLET_LEVEL = 0.045;
const DROPLET_SECONDS = 0.07;
const DROPLET_MIN_HZ = 700;
const DROPLET_RANGE_HZ = 700;
const DROPLET_RISE = 1.9;

export class WaterSound {
  private _ctx: AudioContext | null = null;
  private _noise: AudioBuffer | null = null;
  private _spray: GainNode | null = null;
  private _firing = false;
  private _lastSplashAt = -Infinity;
  private _splashCount = 0;

  /** Turns the spray on or off. Safe to call every frame; only a change does any work. */
  setFiring(firing: boolean): void {
    if (firing === this._firing) return;
    this._firing = firing;
    const ctx = this._ensure();
    if (!ctx || !this._spray) return;
    this._spray.gain.setTargetAtTime(
      firing ? SPRAY_LEVEL : 0,
      ctx.currentTime,
      (firing ? SPRAY_ATTACK_SECONDS : SPRAY_RELEASE_SECONDS) / 3,
    );
  }

  /** Water has landed. `pan` is −1 (left) to 1 (right), so splashes come from where they happen. */
  splash(pan: number): void {
    const now = performance.now();
    if (now - this._lastSplashAt < SPLASH_MIN_INTERVAL_MS) return;
    this._lastSplashAt = now;
    const ctx = this._ensure();
    const master = audioBus.master;
    if (!ctx || !master || !this._noise || !audioBus.ready) return;

    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    panner.connect(master);
    const t = ctx.currentTime;

    const burst = ctx.createBufferSource();
    burst.buffer = this._noise;
    const colour = ctx.createBiquadFilter();
    colour.type = 'bandpass';
    colour.frequency.value = SPLASH_MIN_HZ + Math.random() * SPLASH_RANGE_HZ;
    colour.Q.value = 1.2;
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, t);
    envelope.gain.linearRampToValueAtTime(SPLASH_LEVEL, t + 0.006);
    envelope.gain.exponentialRampToValueAtTime(0.0001, t + SPLASH_SECONDS);
    burst.connect(colour);
    colour.connect(envelope);
    envelope.connect(panner);
    burst.start(t, Math.random() * (NOISE_SECONDS - SPLASH_SECONDS - 0.05));
    burst.stop(t + SPLASH_SECONDS + 0.02);

    this._splashCount++;
    if (this._splashCount % DROPLET_EVERY !== 0) return;
    const drop = ctx.createOscillator();
    const hz = DROPLET_MIN_HZ + Math.random() * DROPLET_RANGE_HZ;
    drop.frequency.setValueAtTime(hz, t);
    drop.frequency.exponentialRampToValueAtTime(hz * DROPLET_RISE, t + DROPLET_SECONDS);
    const dropEnvelope = ctx.createGain();
    dropEnvelope.gain.setValueAtTime(0.0001, t);
    dropEnvelope.gain.linearRampToValueAtTime(DROPLET_LEVEL, t + 0.004);
    dropEnvelope.gain.exponentialRampToValueAtTime(0.0001, t + DROPLET_SECONDS);
    drop.connect(dropEnvelope);
    dropEnvelope.connect(panner);
    drop.start(t);
    drop.stop(t + DROPLET_SECONDS + 0.02);
  }

  /** Builds the always-running spray chain on first use (needs the AudioContext, so not at construction). */
  private _ensure(): AudioContext | null {
    const ctx = audioBus.context;
    const master = audioBus.master;
    if (!ctx || !master) return null;
    if (ctx === this._ctx) return ctx;
    this._ctx = ctx;

    const length = Math.floor(ctx.sampleRate * NOISE_SECONDS);
    this._noise = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = this._noise.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = this._noise;
    source.loop = true;
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = SPRAY_HIGHPASS_HZ;
    const colour = ctx.createBiquadFilter();
    colour.type = 'bandpass';
    colour.frequency.value = SPRAY_CENTRE_HZ;
    colour.Q.value = SPRAY_Q;
    const wobble = ctx.createOscillator();
    wobble.frequency.value = SPRAY_WOBBLE_HZ;
    const wobbleDepth = ctx.createGain();
    wobbleDepth.gain.value = SPRAY_WOBBLE_DEPTH_HZ;
    wobble.connect(wobbleDepth);
    wobbleDepth.connect(colour.frequency);

    this._spray = ctx.createGain();
    this._spray.gain.value = 0;
    source.connect(highpass);
    highpass.connect(colour);
    colour.connect(this._spray);
    this._spray.connect(master);
    source.start();
    wobble.start();
    return ctx;
  }
}

/** Shared instance — one cannon, one sound of water. */
export const waterSound = new WaterSound();
