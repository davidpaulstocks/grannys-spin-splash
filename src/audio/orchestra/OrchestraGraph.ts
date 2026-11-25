/**
 * The orchestra's signal path: one fader-and-pan channel per musician, a
 * shared hall reverb, a tone control that opens across the round, and a
 * limiter guarding the output.
 *
 *   channel fader → pan ─┬─────────────→ tone ─→ limiter ─→ trim ─→ out
 *                        └→ reverb send → hall ─┘
 *
 * Built against BaseAudioContext so the identical graph can be rendered
 * offline for level checks (tools and tests) as well as played live.
 */

/** Hall reverb: generated, so it costs no download. Real instruments need far less of it than the old oscillators did. */
const REVERB_SECONDS = 2.2;
const REVERB_DECAY_POWER = 2.4;
const REVERB_TONE_HZ = 4200;
const REVERB_SEND_MIN = 0.16;
const REVERB_SEND_MAX = 0.3;

/** Round arc: the top end arrives gradually, so the last ten seconds sound brighter, not just louder. */
const TONE_MIN_HZ = 3600;
const TONE_MAX_HZ = 16000;
const ARC_SMOOTHING_SECONDS = 0.2;

/** Safety net for the Frenzy tutti. Gentle ratio: a brick wall here pumps on every bass-drum hit. */
const LIMITER_THRESHOLD_DB = -8;
const LIMITER_RATIO = 5;
const LIMITER_ATTACK_SECONDS = 0.003;
const LIMITER_RELEASE_SECONDS = 0.2;
const OUTPUT_TRIM = 0.9;

/** Guitar amp (see `_amp`). */
const AMP_MAX_PRE_GAIN = 14;
const AMP_CURVE_SAMPLES = 1024;
const AMP_CURVE_STEEPNESS = 2.4;
const AMP_CABINET_LOW_HZ = 90;
const AMP_CABINET_HIGH_HZ = 4200;
const AMP_POST_GAIN = 0.9;

/** Fader moves: quick to arrive so a squirt is answered at once, slow to leave so a decaying spinner fades like a held breath. */
const FADER_RISE_SECONDS = 0.05;
const FADER_FALL_SECONDS = 0.28;

export class OrchestraGraph {
  private readonly _ctx: BaseAudioContext;
  private readonly _tone: BiquadFilterNode;
  private readonly _reverbSend: GainNode;
  private readonly _faders = new Map<string, GainNode>();
  /** What notes connect to: the fader itself, or the amp in front of it for a driven channel. */
  private readonly _inputs = new Map<string, AudioNode>();
  private readonly _faderTargets = new Map<string, number>();

  constructor(ctx: BaseAudioContext, destination: AudioNode) {
    this._ctx = ctx;

    const trim = ctx.createGain();
    trim.gain.value = OUTPUT_TRIM;
    trim.connect(destination);

    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = LIMITER_THRESHOLD_DB;
    limiter.knee.value = 8;
    limiter.ratio.value = LIMITER_RATIO;
    limiter.attack.value = LIMITER_ATTACK_SECONDS;
    limiter.release.value = LIMITER_RELEASE_SECONDS;
    limiter.connect(trim);

    this._tone = ctx.createBiquadFilter();
    this._tone.type = 'lowpass';
    this._tone.frequency.value = TONE_MIN_HZ;
    this._tone.Q.value = 0.0001;
    this._tone.connect(limiter);

    const hall = ctx.createConvolver();
    hall.buffer = createImpulse(ctx);
    const damping = ctx.createBiquadFilter();
    damping.type = 'lowpass';
    damping.frequency.value = REVERB_TONE_HZ;
    this._reverbSend = ctx.createGain();
    this._reverbSend.gain.value = REVERB_SEND_MIN;
    this._reverbSend.connect(damping);
    damping.connect(hall);
    hall.connect(limiter);
  }

  /**
   * Returns the input node for a named channel, creating it on first use.
   * `pan` is −1 (left) to 1 (right) and only applies at creation — a
   * musician's seat doesn't move mid-round.
   */
  channel(id: string, pan = 0, initialGain = 0, drive = 0): AudioNode {
    const existing = this._inputs.get(id);
    if (existing) return existing;

    const fader = this._ctx.createGain();
    fader.gain.value = initialGain;
    this._faderTargets.set(id, initialGain);
    const panner = this._ctx.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    fader.connect(panner);
    panner.connect(this._tone);
    panner.connect(this._reverbSend);
    this._faders.set(id, fader);
    const input = drive > 0 ? this._amp(drive, fader) : fader;
    this._inputs.set(id, input);
    return input;
  }

  /**
   * A guitar amp in front of a channel: the signal is pushed into a soft
   * clipper and then through a speaker-cabinet filter. This is what turns a
   * clean recorded guitar into a rock rhythm guitar — two notes a fifth apart
   * through it are a power chord. Costs no download, and the same recordings
   * serve the jazz band clean and the rock band dirty.
   */
  private _amp(drive: number, dest: AudioNode): AudioNode {
    const ctx = this._ctx;
    const pre = ctx.createGain();
    pre.gain.value = 1 + drive * AMP_MAX_PRE_GAIN;
    const shaper = ctx.createWaveShaper();
    shaper.curve = softClipCurve();
    shaper.oversample = '2x';
    const cabinetLow = ctx.createBiquadFilter();
    cabinetLow.type = 'highpass';
    cabinetLow.frequency.value = AMP_CABINET_LOW_HZ;
    const cabinetHigh = ctx.createBiquadFilter();
    cabinetHigh.type = 'lowpass';
    cabinetHigh.frequency.value = AMP_CABINET_HIGH_HZ;
    // Clipping flattens peaks and raises the average; trim so "driven" is a colour, not a volume jump.
    const post = ctx.createGain();
    post.gain.value = AMP_POST_GAIN / (1 + drive);
    pre.connect(shaper);
    shaper.connect(cabinetLow);
    cabinetLow.connect(cabinetHigh);
    cabinetHigh.connect(post);
    post.connect(dest);
    return pre;
  }

  /** Moves a channel's fader. No-op if the level hasn't meaningfully changed, so it is safe to call every frame. */
  setLevel(id: string, level: number): void {
    const fader = this._faders.get(id);
    if (!fader) return;
    const previous = this._faderTargets.get(id) ?? 0;
    if (Math.abs(level - previous) < 0.005) return;
    this._faderTargets.set(id, level);
    const seconds = level > previous ? FADER_RISE_SECONDS : FADER_FALL_SECONDS;
    fader.gain.setTargetAtTime(level, this._ctx.currentTime, seconds / 3);
  }

  /** `progress` 0–1 through the round: opens the tone control and deepens the hall. */
  setArc(progress: number): void {
    const eased = progress * progress;
    const now = this._ctx.currentTime;
    this._tone.frequency.setTargetAtTime(
      TONE_MIN_HZ + (TONE_MAX_HZ - TONE_MIN_HZ) * eased,
      now,
      ARC_SMOOTHING_SECONDS,
    );
    this._reverbSend.gain.setTargetAtTime(
      REVERB_SEND_MIN + (REVERB_SEND_MAX - REVERB_SEND_MIN) * eased,
      now,
      ARC_SMOOTHING_SECONDS,
    );
  }

  /** Silences every channel at once — pause, quit, scene shutdown. */
  silence(): void {
    for (const [id, fader] of this._faders) {
      fader.gain.cancelScheduledValues(this._ctx.currentTime);
      fader.gain.value = 0;
      this._faderTargets.set(id, 0);
    }
  }

  /** Drops every channel so the next round seats its musicians afresh (a new world has a different wall). */
  resetChannels(): void {
    for (const fader of this._faders.values()) fader.disconnect();
    this._faders.clear();
    this._inputs.clear();
    this._faderTargets.clear();
  }
}

/** tanh soft clipping: gentle at low levels, flat at the top, like a valve stage. */
function softClipCurve(): Float32Array<ArrayBuffer> {
  const curve = new Float32Array(AMP_CURVE_SAMPLES);
  for (let i = 0; i < AMP_CURVE_SAMPLES; i++) {
    const x = (i / (AMP_CURVE_SAMPLES - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * AMP_CURVE_STEEPNESS);
  }
  return curve;
}

/** Exponentially decaying stereo noise: a believable hall for the price of a few lines. */
function createImpulse(ctx: BaseAudioContext): AudioBuffer {
  const length = Math.floor(ctx.sampleRate * REVERB_SECONDS);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, REVERB_DECAY_POWER);
    }
  }
  return impulse;
}
