/**
 * The orchestra's instruments: real recordings (VSCO-2 Community Edition,
 * CC0) packed into one audio sprite by `tools/build-orchestra-samples.ts`.
 *
 * Loading is fire-and-forget from BootScene and never blocks play. Decoding
 * uses an OfflineAudioContext, which browsers allow before any user gesture,
 * so by the time a player fires their first shot the instruments are ready.
 * If the sprite fails to load at all, every note falls back to a plain
 * synthesised pluck — the game is never silent and never waits.
 */

import type { InstrumentId } from './score.types';
import { playbackRateFor } from './theory';

interface SampleEntry {
  readonly midi: number | null;
  readonly cents: number;
  readonly start: number;
  readonly duration: number;
  readonly rms: number;
}

interface SpriteIndex {
  readonly file: string;
  readonly sampleRate: number;
  readonly syncMarker: number;
  readonly instruments: Readonly<
    Record<string, { readonly pitched: boolean; readonly samples: readonly SampleEntry[] }>
  >;
}

interface LoadedSample {
  readonly midi: number | null;
  readonly cents: number;
  readonly buffer: AudioBuffer;
}

interface LoadedInstrument {
  readonly pitched: boolean;
  readonly samples: readonly LoadedSample[];
  roundRobin: number;
}

export interface NoteOptions {
  /** Linear gain for this note. */
  readonly gain: number;
  /** Bowed/blown notes: seconds until release. Omit to let the sample ring out. */
  readonly holdSeconds?: number;
}

/** The orchestra: instruments every venue may use. Loaded first. */
const CORE_SPRITE = { index: 'audio/orchestra.json', dir: 'audio/' } as const;
/**
 * One further sprite per band (docs/BANDS.md), fetched in the background
 * after the core. They are small, and by the time a player has toured far
 * enough to reach a venue its band has long since arrived; if it somehow has
 * not, that venue's notes use the fallback voice until it does.
 */
const BAND_SPRITES = ['kitchen'] as const;
const BAND_DIR = 'audio/bands/';

/** The sync marker is a full-scale burst; anything this loud in the first second is it. */
const SYNC_THRESHOLD = 0.5;
const SYNC_SEARCH_SECONDS = 1;

const RELEASE_SECONDS = 0.16;
/** Softens a bowed note's start so re-bowing every half bar doesn't tick. */
const SUSTAIN_ATTACK_SECONDS = 0.03;
const FALLBACK_DECAY_SECONDS = 0.5;
const FALLBACK_GAIN_SCALE = 0.35;

export class SampleBank {
  private readonly _instruments = new Map<string, LoadedInstrument>();
  private _loading: Promise<void> | null = null;

  /** True once the core sprite is decoded and sliced. Until then every note uses the fallback voice. */
  get ready(): boolean {
    return this._instruments.size > 0;
  }

  has(instrument: InstrumentId): boolean {
    return this._instruments.has(instrument);
  }

  /** Fetches and decodes the sprite. Safe to call repeatedly; failures are swallowed (see class comment). */
  load(): Promise<void> {
    this._loading ??= this._load().catch((err: unknown) => {
      console.warn('[orchestra] samples unavailable, using fallback voices', err);
    });
    return this._loading;
  }

  /**
   * Schedules one note. `midi` is ignored for unpitched instruments, which
   * cycle through their recorded variations instead so repeated hits don't
   * sound machine-stamped.
   */
  play(
    ctx: BaseAudioContext,
    dest: AudioNode,
    instrument: InstrumentId,
    midi: number,
    when: number,
    options: NoteOptions,
  ): void {
    const loaded = this._instruments.get(instrument);
    if (!loaded) {
      this._playFallback(ctx, dest, midi, when, options.gain);
      return;
    }
    const sample = loaded.pitched ? nearestSample(loaded.samples, midi) : nextVariation(loaded);
    if (!sample) return;

    const source = ctx.createBufferSource();
    source.buffer = sample.buffer;
    if (sample.midi !== null) {
      source.playbackRate.value = playbackRateFor(midi, sample.midi, sample.cents);
    }
    const envelope = ctx.createGain();
    source.connect(envelope);
    envelope.connect(dest);
    // start() must precede stop() — browsers throw otherwise.
    source.start(when);
    if (options.holdSeconds === undefined) {
      envelope.gain.setValueAtTime(options.gain, when);
    } else {
      const releaseAt = when + Math.max(SUSTAIN_ATTACK_SECONDS, options.holdSeconds);
      envelope.gain.setValueAtTime(0.0001, when);
      envelope.gain.linearRampToValueAtTime(options.gain, when + SUSTAIN_ATTACK_SECONDS);
      envelope.gain.setTargetAtTime(0, releaseAt, RELEASE_SECONDS / 3);
      source.stop(releaseAt + RELEASE_SECONDS * 2);
    }
  }

  private async _load(): Promise<void> {
    await this._loadSprite(CORE_SPRITE.index, CORE_SPRITE.dir);
    for (const band of BAND_SPRITES) {
      // A band that fails to load must not take the others, or the core, with it.
      await this._loadSprite(`${BAND_DIR}${band}.json`, BAND_DIR).catch((err: unknown) => {
        console.warn(`[orchestra] band "${band}" unavailable, using fallback voices`, err);
      });
    }
  }

  /** Fetches one sprite and its index, and adds its instruments to the bank. */
  private async _loadSprite(indexUrl: string, audioDir: string): Promise<void> {
    const indexResponse = await fetch(indexUrl);
    if (!indexResponse.ok) throw new Error(`${indexUrl}: HTTP ${indexResponse.status}`);
    const index = (await indexResponse.json()) as SpriteIndex;

    const audioResponse = await fetch(audioDir + index.file);
    if (!audioResponse.ok) throw new Error(`${index.file}: HTTP ${audioResponse.status}`);
    const sprite = await decode(await audioResponse.arrayBuffer(), index.sampleRate);

    const data = sprite.getChannelData(0);
    const rate = sprite.sampleRate;
    // MP3 decoders disagree about how much priming silence to strip, so the
    // sprite's written offsets can be tens of milliseconds out — fatal for
    // notes scheduled on a rhythmic grid. The sprite opens with a loud
    // marker at a known time; where it actually decodes to is the correction.
    const decoderOffset = findSyncMarker(data, rate) - index.syncMarker;

    for (const [id, instrument] of Object.entries(index.instruments)) {
      const samples: LoadedSample[] = [];
      for (const entry of instrument.samples) {
        const first = Math.max(0, Math.round((entry.start + decoderOffset) * rate));
        const length = Math.min(data.length - first, Math.round(entry.duration * rate));
        if (length <= 0) continue;
        const buffer = new AudioBuffer({ length, sampleRate: rate, numberOfChannels: 1 });
        buffer.copyToChannel(data.subarray(first, first + length), 0);
        samples.push({ midi: entry.midi, cents: entry.cents, buffer });
      }
      if (samples.length > 0) {
        this._instruments.set(id, { pitched: instrument.pitched, samples, roundRobin: 0 });
      }
    }
  }

  /** A soft sine-plus-octave pluck — unmistakably a stand-in, but in tune and in time. */
  private _playFallback(
    ctx: BaseAudioContext,
    dest: AudioNode,
    midi: number,
    when: number,
    gain: number,
  ): void {
    // Unpitched hits carry no note; a pitched blip standing in for a snare
    // would be worse than the gap.
    if (midi <= 0) return;
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0.0001, when);
    envelope.gain.linearRampToValueAtTime(gain * FALLBACK_GAIN_SCALE, when + 0.008);
    envelope.gain.exponentialRampToValueAtTime(0.0001, when + FALLBACK_DECAY_SECONDS);
    envelope.connect(dest);
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 440 * Math.pow(2, (midi - 69) / 12);
    osc.connect(envelope);
    osc.start(when);
    osc.stop(when + FALLBACK_DECAY_SECONDS + 0.02);
  }
}

function nearestSample(samples: readonly LoadedSample[], midi: number): LoadedSample | undefined {
  let best = samples[0];
  let bestDistance = Infinity;
  for (const sample of samples) {
    const distance = Math.abs((sample.midi ?? midi) - midi);
    if (distance < bestDistance) {
      best = sample;
      bestDistance = distance;
    }
  }
  return best;
}

function nextVariation(instrument: LoadedInstrument): LoadedSample | undefined {
  const sample = instrument.samples[instrument.roundRobin % instrument.samples.length];
  instrument.roundRobin++;
  return sample;
}

function findSyncMarker(data: Float32Array, sampleRate: number): number {
  const limit = Math.min(data.length, Math.floor(sampleRate * SYNC_SEARCH_SECONDS));
  for (let i = 0; i < limit; i++) {
    if (Math.abs(data[i] ?? 0) >= SYNC_THRESHOLD) return i / sampleRate;
  }
  return 0;
}

/** Decodes off the main audio graph. Falls back to 44.1 kHz where a browser refuses the sprite's own rate. */
async function decode(bytes: ArrayBuffer, preferredRate: number): Promise<AudioBuffer> {
  let offline: OfflineAudioContext;
  try {
    offline = new OfflineAudioContext(1, 1, preferredRate);
  } catch {
    offline = new OfflineAudioContext(1, 1, 44100);
  }
  return offline.decodeAudioData(bytes);
}

/** Shared instance — one set of instruments for the whole game. */
export const sampleBank = new SampleBank();
