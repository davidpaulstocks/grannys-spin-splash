/**
 * The ASMR orchestra — CLAUDE.md §9, the game's headline feature. Holds one
 * GainNode per musical layer, keeps every layer scheduled on the same audio
 * clock so they can never drift apart, and mixes purely by moving those
 * gains. Instruments themselves live in `src/audio/themes/*.ts` — one theme
 * per world (2026-09-12, direct user feedback: "I also want there to be a
 * different orchestra tune for each world" — every world used to share one
 * fixed voice set/key/tempo).
 *
 * Mixing follows §9.1.1's refined model rather than §9.1's original
 * population thresholds: each spinner IS an instrument, and a spinner's own
 * `currentSpeed / MAX_SPINNER_SPEED` is that layer's gain, continuously.
 * Soak one spinner and its instrument swells in real time; let it decay and
 * the instrument fades back out, which is where the ASMR payoff actually
 * comes from — no separate fade logic needed. The layer GRAPH (11 fixed
 * generic slots: foundation, 9 spinner slots, dropBass) never changes
 * shape between themes — only which `WorldTheme`'s voice functions and bar
 * length the scheduler reads from does, so switching worlds mid-session
 * (Play Again into a different world) needs no rebuild, just a new
 * `start(worldId)` call.
 *
 * §9.2's reference implementation loads N looping AudioBufferSourceNodes and
 * starts them all silently at one shared time. Synthesised voices reach the
 * same guarantee more directly: every bar for every layer is scheduled from
 * the same `_nextBarTime`, so layers are sample-aligned by construction and
 * a silent layer costs nothing until its gain comes up.
 */

import { audioBus } from './AudioBus';
import {
  DEFAULT_THEME_ID,
  resolveTheme,
  SPINNER_SLOTS,
  type VoiceSlot,
  type WorldTheme,
} from './themes';

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

/**
 * Reverb. Every voice was previously bone dry, which is the main reason a
 * stack of synthesised tones read as "a pile of oscillators" rather than an
 * orchestra — dry synthesis has no space, no tail and no blend, so nine
 * layers just crowd the same point. A generated impulse response through a
 * ConvolverNode costs no asset bytes and is what turns the same notes into
 * something that sounds like a room.
 *
 * Sent-not-inserted: each layer feeds the send in parallel with its dry
 * path, so quiet layers stay quiet and the wet tail is shared. The send
 * level rises with the round arc below — space opening up as the music
 * builds is a large part of why a crescendo feels like one.
 */
const REVERB_SECONDS = 2.6;
const REVERB_DECAY_POWER = 2.6;
/** Wet level at round start → at the crescendo. */
const REVERB_SEND_MIN = 0.18;
const REVERB_SEND_MAX = 0.42;
/** Pre-reverb lowpass: keeps the tail warm instead of hissy. */
const REVERB_TONE_HZ = 3200;

/**
 * The round arc (2026-09-12, direct user request: "the soundtrack should
 * escalate... they should reach a crescendo by the end of the 30 seconds").
 *
 * The mix used to be purely reactive: layer gain tracked spinner charge and
 * nothing else, so a player holding a steady wall heard a steady, static
 * texture for thirty seconds — no arc, no payoff. `setRoundProgress()` adds
 * a second, independent axis: 0 at the whistle, 1 at the final second. It
 * does NOT simply raise the volume, which would just get louder and more
 * tiring; it opens the mix up —
 *
 *  - the master tone filter sweeps open, so the top end arrives gradually
 *    and the last ten seconds sound bright rather than merely loud
 *  - the reverb send rises, so the space grows around the same notes
 *  - a floor is added under every spinner layer, so late in the round even
 *    a half-charged spinner still contributes to a full-sounding wall
 *
 * Charge still drives which instruments you hear; the arc drives how big the
 * room they play in feels.
 */
/**
 * The always-on ambient bed. See WorldTheme.padHz for the measurement that
 * showed it was missing: every other voice, foundation included, is rhythmic,
 * so a sparsely-charged wall produced isolated blips over silence rather than
 * anything that reads as music. This holds the theme's triad on persistent
 * oscillators for the whole round — two slightly detuned saws per note
 * through one shared lowpass, which is the cheapest way to get a warm,
 * moving pad rather than three static sine tones.
 *
 * It sits under everything and rises modestly with the arc: present from the
 * first second, never the loudest thing, and the reason the gaps are gone.
 */
const PAD_DETUNE_CENTS = 7;
const PAD_GAIN_MIN = 0.1;
const PAD_GAIN_MAX = 0.2;
const PAD_FILTER_MIN_HZ = 420;
const PAD_FILTER_MAX_HZ = 1500;
/** Slow filter drift so the bed breathes instead of sitting perfectly still. */
const PAD_LFO_HZ = 0.07;
const PAD_LFO_DEPTH_HZ = 160;

const TONE_SWEEP_MIN_HZ = 900;
const TONE_SWEEP_MAX_HZ = 15000;
const LAYER_FLOOR_AT_CRESCENDO = 0.3;
const ARC_SMOOTHING_SECONDS = 0.6 / 3;

/**
 * Output limiter + trim. **Relaxed 2026-09-12 from -14dB/ratio 20 to
 * -6dB/ratio 6, and the trim raised 0.7 -> 0.92.** Running the Web Audio
 * static curve on the old settings: reduction began at -17 dBFS and an input
 * range of -6..+6 dBFS mapped to 0.60 dB of output — so the orchestra was
 * pinned near -13.4 dBFS no matter how many layers were up, which is to say
 * the crescendo could not get louder however much was playing. Worse, with a
 * 1ms attack and 0.25s release against a kick every 0.5s, the limiter
 * gain-modulated the whole bed at the kick rate: that was the pumping. It is
 * still a safety net for the Frenzy peak, just no longer the main gain stage.
 *
 * Originally measured live at Frenzy in Disco (20 spinners, every
 * layer up, cinematic hit landing): the limiter alone still let peaks reach
 * 1.12 on the master, because a compressor's 3 ms attack passes the hit's
 * initial transient and the master's own 0.65 gain is applied after it. A
 * fixed trim after the limiter is what actually guarantees headroom.
 */
const LIMITER_THRESHOLD_DB = -6;
const LIMITER_RATIO = 6;
const ORCHESTRA_TRIM = 0.92;

export interface OrchestraSpinnerSnapshot {
  /** 0..1 — this spinner's charge as a fraction of MAX_SPINNER_SPEED. */
  readonly charge: number;
}

export class AudioOrchestra {
  private _ctx: AudioContext | null = null;
  private _limiter: DynamicsCompressorNode | null = null;
  private _out: GainNode | null = null;
  private _layers = new Map<VoiceSlot, GainNode>();
  private _noise: AudioBuffer | null = null;
  private _timer: ReturnType<typeof setInterval> | null = null;
  private _theme: WorldTheme = resolveTheme(DEFAULT_THEME_ID);
  private _padNodes: {
    osc: OscillatorNode[];
    lfo: OscillatorNode;
    gain: GainNode;
    filter: BiquadFilterNode;
  } | null = null;
  private _reverbSend: GainNode | null = null;
  private _toneFilter: BiquadFilterNode | null = null;
  private _roundProgress = 0;
  private _nextBarTime = 0;
  private _bar = 0;
  private _running = false;

  /**
   * Builds the layer graph (first call only) and starts the scheduler on
   * the given world's theme. Safe to call on every run start — a second
   * call while already running just re-arms with the (possibly new) theme.
   * `worldId` is optional so a resume-from-pause call (PauseScene, which
   * has no reason to know which world is live) can just re-arm whatever
   * theme was already playing rather than needing to thread the world id
   * through a scene that otherwise has no use for it.
   * Requires `audioBus.init()` to have happened on a user gesture first;
   * without a context this no-ops and the game is simply silent.
   */
  start(worldId?: string): void {
    if (worldId) this._theme = resolveTheme(worldId);
    if (this._running) return;

    audioBus.resume();
    const ctx = audioBus.context;
    const master = audioBus.master;
    if (!ctx || !master) return;

    this._ctx = ctx;
    this._noise ??= this._createNoise(ctx);
    if (this._layers.size === 0) {
      // Every layer meets the master bus through one limiter. At Frenzy all
      // nine spinner layers plus the foundation and drop bass sound at once
      // and their peaks can sum past unity; without this, that exact moment
      // — the one the whole game builds to — is where it would distort.
      // SFX stay off this node so a hit never ducks the music.
      this._out = ctx.createGain();
      this._out.gain.value = ORCHESTRA_TRIM;
      this._out.connect(master);
      this._limiter = ctx.createDynamicsCompressor();
      this._limiter.threshold.value = LIMITER_THRESHOLD_DB;
      this._limiter.knee.value = 6;
      this._limiter.ratio.value = LIMITER_RATIO;
      this._limiter.attack.value = 0.001;
      this._limiter.release.value = 0.25;
      this._limiter.connect(this._out);

      // Master tone control, swept open by the round arc. Sits before the
      // limiter so the limiter sees the same spectrum the player hears.
      this._toneFilter = ctx.createBiquadFilter();
      this._toneFilter.type = 'lowpass';
      this._toneFilter.frequency.value = TONE_SWEEP_MIN_HZ;
      this._toneFilter.Q.value = 0.0001; // no resonant peak — this is a tone tilt, not an effect
      this._toneFilter.connect(this._limiter);

      // Shared reverb send: layer -> sendGain -> damping -> convolver -> limiter.
      const convolver = ctx.createConvolver();
      convolver.buffer = this._createImpulse(ctx);
      const damping = ctx.createBiquadFilter();
      damping.type = 'lowpass';
      damping.frequency.value = REVERB_TONE_HZ;
      this._reverbSend = ctx.createGain();
      this._reverbSend.gain.value = REVERB_SEND_MIN;
      this._reverbSend.connect(damping);
      damping.connect(convolver);
      convolver.connect(this._limiter);
      // Slot IDs are theme-agnostic (see class doc comment) — build once,
      // reused unchanged across every world for the rest of the session.
      const slotIds: VoiceSlot[] = ['foundation', ...SPINNER_SLOTS, 'dropBass'];
      for (const id of slotIds) {
        const gain = ctx.createGain();
        gain.gain.value = 0;
        gain.connect(this._toneFilter);
        gain.connect(this._reverbSend); // parallel wet path, see REVERB_SECONDS
        this._layers.set(id, gain);
      }
    }
    this._setGain('foundation', FOUNDATION_GAIN);
    this._startPad(ctx);
    this._roundProgress = 0;
    this._applyArc(0);
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
    if (this._padNodes) {
      // Oscillators can't be restarted, so they're discarded rather than
      // paused — start() builds a fresh set for the next round.
      this._padNodes.gain.gain.value = 0;
      for (const osc of this._padNodes.osc) osc.stop();
      this._padNodes.lfo.stop();
      this._padNodes = null;
    }
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
    const targets = new Map<VoiceSlot, number>();
    spinners.forEach((spinner, i) => {
      const id = SPINNER_SLOTS[i % SPINNER_SLOTS.length];
      targets.set(id, Math.max(targets.get(id) ?? 0, Math.min(1, Math.max(0, spinner.charge))));
    });
    // Late in the round every contributing layer keeps a floor under it, so
    // the wall sounds full even where a spinner is only half charged — see
    // the round-arc comment. A spinner at zero stays silent either way.
    const floor = LAYER_FLOOR_AT_CRESCENDO * this._roundProgress * this._roundProgress;
    for (const id of SPINNER_SLOTS) {
      const charge = targets.get(id) ?? 0;
      const lifted = charge > 0.001 ? Math.min(1, charge + floor * (1 - charge)) : 0;
      this._setGain(id, lifted * LAYER_HEADROOM);
    }
  }

  /** SPLASH FRENZY: the drop bass sustains for the bonus window and the cinematic hit fires once. */
  onFrenzyStart(): void {
    if (!this._running || !this._ctx || !this._noise) return;
    this._setGain('dropBass', DROP_BASS_GAIN);
    // Through the limiter, not the master — the hit is the loudest thing
    // in the game and lands exactly when every layer is already up.
    const dest = this._limiter ?? audioBus.master;
    if (dest) this._theme.cinematicHit(this._ctx, dest, this._noise);
  }

  onFrenzyEnd(): void {
    this._setGain('dropBass', 0);
  }

  private _setGain(id: VoiceSlot, value: number): void {
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
        this._theme.voices[id]({ ctx, dest: gain, at: this._nextBarTime, bar: this._bar, noise });
      }
      this._nextBarTime += this._theme.barSeconds;
      this._bar++;
    }
  }

  /**
   * How far through the round we are, 0..1 — call once per frame. Drives the
   * crescendo (see TONE_SWEEP_MIN_HZ's comment for what it actually changes).
   */
  setRoundProgress(progress: number): void {
    const clamped = Math.min(1, Math.max(0, progress));
    if (Math.abs(clamped - this._roundProgress) < 0.002) return;
    this._roundProgress = clamped;
    this._applyArc(clamped);
  }

  /**
   * Eased so the last third of the round carries most of the change —
   * a linear sweep spends its budget early and then flattens out exactly
   * when the player expects it to be building.
   */
  private _applyArc(progress: number): void {
    const ctx = this._ctx;
    if (!ctx) return;
    const eased = progress * progress;
    const now = ctx.currentTime;
    if (this._toneFilter) {
      const hz = TONE_SWEEP_MIN_HZ + (TONE_SWEEP_MAX_HZ - TONE_SWEEP_MIN_HZ) * eased;
      this._toneFilter.frequency.setTargetAtTime(hz, now, ARC_SMOOTHING_SECONDS);
    }
    if (this._reverbSend) {
      const wet = REVERB_SEND_MIN + (REVERB_SEND_MAX - REVERB_SEND_MIN) * eased;
      this._reverbSend.gain.setTargetAtTime(wet, now, ARC_SMOOTHING_SECONDS);
    }
    if (this._padNodes) {
      const padGain = PAD_GAIN_MIN + (PAD_GAIN_MAX - PAD_GAIN_MIN) * eased;
      this._padNodes.gain.gain.setTargetAtTime(padGain, now, ARC_SMOOTHING_SECONDS);
      const padHz = PAD_FILTER_MIN_HZ + (PAD_FILTER_MAX_HZ - PAD_FILTER_MIN_HZ) * eased;
      this._padNodes.filter.frequency.setTargetAtTime(padHz, now, ARC_SMOOTHING_SECONDS);
    }
  }

  /** Builds and starts the continuous bed. See PAD_DETUNE_CENTS's comment. */
  private _startPad(ctx: AudioContext): void {
    if (this._padNodes || !this._toneFilter || !this._reverbSend) return;
    const gain = ctx.createGain();
    gain.gain.value = PAD_GAIN_MIN;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = PAD_FILTER_MIN_HZ;
    filter.Q.value = 0.7;
    filter.connect(gain);
    gain.connect(this._toneFilter);
    gain.connect(this._reverbSend);

    const osc: OscillatorNode[] = [];
    for (const hz of this._theme.padHz) {
      for (const cents of [-PAD_DETUNE_CENTS, PAD_DETUNE_CENTS]) {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = hz;
        o.detune.value = cents;
        const voiceGain = ctx.createGain();
        voiceGain.gain.value = 1 / (this._theme.padHz.length * 2);
        o.connect(voiceGain);
        voiceGain.connect(filter);
        o.start();
        osc.push(o);
      }
    }

    const lfo = ctx.createOscillator();
    lfo.frequency.value = PAD_LFO_HZ;
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = PAD_LFO_DEPTH_HZ;
    lfo.connect(lfoDepth);
    lfoDepth.connect(filter.frequency);
    lfo.start();

    this._padNodes = { osc, lfo, gain, filter };
  }

  /**
   * A synthesised impulse response: exponentially-decaying noise, stereo,
   * with the two channels decorrelated so the tail has width. Cheaper and
   * smaller than shipping an IR file, and entirely adequate for a hall-ish
   * ambience behind lo-fi voices.
   */
  private _createImpulse(ctx: AudioContext): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * REVERB_SECONDS);
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const decay = Math.pow(1 - i / length, REVERB_DECAY_POWER);
        data[i] = (Math.random() * 2 - 1) * decay;
      }
    }
    return impulse;
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
