/**
 * Master volume, mute, fade (CLAUDE.md §7.2). Owns the single shared
 * AudioContext + master GainNode everything else (SFX.ts, eventually
 * AudioOrchestra.ts) plays through — CLAUDE.md §3 rule 9/must-fix 6:
 * audio must mute within 100ms of `commercialBreak()`, so there has to
 * be exactly one master gain every sound routes through, not one per
 * sound. `init()` must be called from a real user-gesture handler
 * (InputManager's 'first-input' is the natural one) — browsers block
 * AudioContext creation before that.
 */

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

/** Normal playback volume — CLAUDE.md §9.2's prototype reference used the same 0.65. */
const BASE_VOLUME = 0.65;

export class AudioBus {
  private _ctx: AudioContext | null = null;
  private _master: GainNode | null = null;
  private _muted = false;

  /** Creates the AudioContext + master gain. Safe to call more than once — only the first call does anything. */
  init(): void {
    if (this._ctx) return;
    try {
      const Ctx = window.AudioContext ?? window.webkitAudioContext;
      if (!Ctx) return;
      this._ctx = new Ctx();
      this._master = this._ctx.createGain();
      this._master.gain.value = BASE_VOLUME;
      this._master.connect(this._ctx.destination);
    } catch {
      // Web Audio unavailable — `ready` stays false and every sound call silently no-ops.
    }
  }

  /** False until `init()` has succeeded, or while muted — SFX/AudioOrchestra check this before doing any work. */
  get ready(): boolean {
    return !!this._ctx && !!this._master && !this._muted;
  }

  get context(): AudioContext | null {
    return this._ctx;
  }

  get master(): GainNode | null {
    return this._master;
  }

  /** Browsers start a fresh AudioContext 'suspended' — resume it on the same user gesture that unlocks audio. */
  resume(): void {
    if (this._ctx?.state === 'suspended') void this._ctx.resume();
  }

  mute(): void {
    this._muted = true;
    if (this._master) this._master.gain.value = 0;
  }

  unmute(): void {
    this._muted = false;
    if (this._master) this._master.gain.value = BASE_VOLUME;
  }

  /** Linear fade to silent over `durationMs` — call before a commercial/rewarded break (CLAUDE.md §3 must-fix 6: within 100ms). */
  fadeOut(durationMs: number): void {
    if (!this._ctx || !this._master) return;
    const t = this._ctx.currentTime;
    this._master.gain.setValueAtTime(this._master.gain.value, t);
    this._master.gain.linearRampToValueAtTime(0, t + durationMs / 1000);
  }

  /** Linear fade back to normal volume over `durationMs` — call after an ad break resolves. */
  fadeIn(durationMs: number): void {
    if (!this._ctx || !this._master || this._muted) return;
    const t = this._ctx.currentTime;
    this._master.gain.setValueAtTime(this._master.gain.value, t);
    this._master.gain.linearRampToValueAtTime(BASE_VOLUME, t + durationMs / 1000);
  }
}

/** Shared instance — every sound in the game plays through this one bus. */
export const audioBus = new AudioBus();

/** How fast the fade must be to satisfy CLAUDE.md §3 must-fix 6 ("audio mutes within 100ms of commercialBreak()"). */
const AD_FADE_OUT_MS = 100;
const AD_FADE_IN_MS = 300;

/**
 * The `AdHooks` every `adManager.play*()` call site should pass — one
 * definition instead of re-typing the same fade calls at each of the
 * three call sites (SplashScene's commercial break, GameOverScene's
 * double-score reward, GameScene's mid-run refill reward).
 */
export const AD_MUTE_HOOKS = {
  onAdStart: () => audioBus.fadeOut(AD_FADE_OUT_MS),
  onAdEnd: () => audioBus.fadeIn(AD_FADE_IN_MS),
};
