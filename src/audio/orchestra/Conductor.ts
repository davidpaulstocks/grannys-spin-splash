/**
 * Turns a written score into scheduled notes. The conductor knows nothing
 * about clocks or game objects: hand it a sixteenth-note index, the audio
 * time that step falls on, and how awake each musician is, and it schedules
 * exactly what the orchestra plays at that instant. `AudioOrchestra` drives
 * it in real time; tests and offline level checks drive it step by step.
 */

import { MAX_SPINNER_SPEED, SPINNER_STATE_THRESHOLDS } from '../../entities/spinner/spinner.data';
import type { OrchestraGraph } from './OrchestraGraph';
import { compileBars, STEPS_PER_BAR, thinToBeats, type PatternEvent } from './pattern';
import type { SampleBank } from './SampleBank';
import { BARS_PER_FORM, type InstrumentId, type Line, type Part, type Score } from './score.types';
import {
  bassTone,
  chord,
  pitchClass,
  scaleDegree,
  stackedTone,
  windowTone,
  type Chord,
} from './theory';

/** A spinner's charge (0–1) at which its musician plays the full part, and then adds the ornament. */
const TIER_FULL_PART = SPINNER_STATE_THRESHOLDS.medium / MAX_SPINNER_SPEED;
const TIER_ORNAMENT = SPINNER_STATE_THRESHOLDS.full / MAX_SPINNER_SPEED;

/** Overall note level. Calibrated by offline render so a full wall peaks just under the limiter. */
const NOTE_GAIN = 0.5;
const LIGHT_VELOCITY = 0.72;
/** Players, not a sequencer: each note lands up to this late and varies this much in loudness. */
const HUMANISE_SECONDS = 0.007;
const HUMANISE_VELOCITY = 0.12;
/** A bowed note stops just short of the next one so repeated notes re-articulate. */
const SUSTAIN_LEGATO = 0.94;

/** Spray notes climb and fall through the chord: root, third, fifth, octave, fifth, third. */
const SPRAY_CONTOUR = [0, 1, 2, 4, 2, 1] as const;
/**
 * Loud enough to be unmistakably "that spinner's instrument" — it was 0.34,
 * and the first listening note was that hitting a spinner "doesn't obviously
 * play the notes from that instrument".
 */
const SPRAY_GAIN = 0.62;
/**
 * A bowed or blown instrument answers a squirt bowed or blown: its squirt
 * note is held this many sixteenths, long enough to hear the bow or the
 * breath. The first version answered every sustained instrument with a
 * plucked or tongued stand-in, an octave up — and David heard exactly that:
 * "different tones of the same sound… it doesn't feel as distinct as it
 * should". A plucked violin, a plucked cello, a harp and a marimba are all
 * plinks; a bowed cello and a flute are not.
 */
const SPRAY_HOLD_STEPS = 2.4;

/**
 * The wake-up call: what a sleeping musician plays the instant it is first
 * splashed, alone and in its own voice. A struck instrument runs up the
 * chord — root, fifth, octave, a sixteenth apart. A held one sings two notes,
 * short then long: "da-daaa".
 */
const WAKE_CALL_STRUCK_TONES = [0, 2, 4] as const;
const WAKE_CALL_HELD = [
  { tone: 0, atStep: 0, holdSteps: 1.7 },
  { tone: 2, atStep: 2, holdSteps: 5 },
] as const;
const WAKE_CALL_GAIN = 0.9;

const STEPS_PER_HALF_BAR = STEPS_PER_BAR / 2;
const STEPS_PER_BEAT = STEPS_PER_BAR / 4;
const STEPS_PER_FORM = STEPS_PER_BAR * BARS_PER_FORM;

interface CompiledLine {
  readonly line: Line;
  readonly bars: readonly (readonly PatternEvent[])[];
}

interface CompiledSeat {
  readonly part: Part;
  readonly full: CompiledLine;
  readonly light: CompiledLine;
  readonly extras: readonly CompiledLine[];
  readonly ornament: CompiledLine | null;
  /** True for unpitched parts, whose spray is the hit itself rather than a chord tone. */
  readonly percussive: boolean;
}

export interface ConductorState {
  /** Charge 0–1 per seat, in seat order. Seats beyond the array are silent. */
  readonly charges: readonly number[];
  readonly frenzy: boolean;
  readonly finale: boolean;
}

/** Called for every note a seated musician plays, so the wall can move with the music. */
export type NoteListener = (seat: number, time: number, velocity: number) => void;

function compileLine(line: Line, bars = line.bars): CompiledLine {
  return { line, bars: compileBars(bars) };
}

export class Conductor {
  readonly score: Score;
  readonly stepSeconds: number;
  private readonly _bank: SampleBank;
  private readonly _tonic: number;
  /** One chord per half bar across the form. */
  private readonly _chords: readonly Chord[];
  private readonly _seats: readonly CompiledSeat[];
  private readonly _bed: readonly CompiledLine[];
  private readonly _finale: readonly CompiledLine[];
  private readonly _frenzy: readonly CompiledLine[];

  /** `band` is how many musicians are on the wall for this gig — the first that many of the score's line-up. */
  constructor(score: Score, bank: SampleBank, band = score.lineup.length) {
    this.score = score;
    this._bank = bank;
    this.stepSeconds = 60 / score.bpm / 4;
    this._tonic = pitchClass(score.tonic);

    if (score.chords.length !== BARS_PER_FORM) {
      throw new Error(`Score "${score.id}" needs ${BARS_PER_FORM} bars of chords`);
    }
    this._chords = score.chords.flatMap((symbols) => {
      const [first = '', second = first] = symbols.trim().split(/\s+/);
      return [chord(first), chord(second)];
    });

    const byId = new Map(score.seats.map((part) => [part.id, part]));
    const seated = score.lineup
      .slice(0, Math.max(1, band))
      .map((id) => byId.get(id))
      .filter((part): part is Part => part !== undefined);
    this._seats = seated.map((part) => {
      const full = compileLine(part);
      return {
        part,
        full,
        light: part.light
          ? compileLine(part, part.light)
          : { line: part, bars: full.bars.map(thinToBeats) },
        extras: (part.with ?? []).map((line) => compileLine(line)),
        ornament: part.ornament ? compileLine(part.ornament) : null,
        percussive: full.bars.every((bar) => bar.every((event) => event.kind === 'hit')),
      };
    });
    this._bed = score.bed.map((line) => compileLine(line));
    this._finale = score.finale.map((line) => compileLine(line));
    this._frenzy = score.frenzy.map((line) => compileLine(line));
  }

  get seatCount(): number {
    return this._seats.length;
  }

  /** How hard a seat is driven through the guitar amp, 0 for clean. */
  seatDrive(seat: number): number {
    return this._seats[seat % this._seats.length]?.part.drive ?? 0;
  }

  seatName(seat: number): string {
    return this._seats[seat % this._seats.length]?.part.name ?? '';
  }

  /** Audio-clock time of a step, given when step 0 fell. Off-beat eighths are delayed by the score's swing. */
  timeOfStep(step: number, origin: number): number {
    const offBeatEighth = step % STEPS_PER_BEAT === STEPS_PER_BEAT / 2;
    const swing = offBeatEighth ? this.score.swing * STEPS_PER_BEAT * this.stepSeconds : 0;
    return origin + step * this.stepSeconds + swing;
  }

  chordAt(step: number): Chord {
    const halfBar = Math.floor((step % STEPS_PER_FORM) / STEPS_PER_HALF_BAR);
    return this._chords[halfBar] as Chord;
  }

  /** Schedules everything that sounds on `step`. */
  scheduleStep(
    ctx: BaseAudioContext,
    graph: OrchestraGraph,
    step: number,
    time: number,
    state: ConductorState,
    onNote?: NoteListener,
  ): void {
    for (const line of this._bed) {
      this._playLine(ctx, lineChannel(graph, 'bed', line.line), line, step, time, 1);
    }
    if (state.finale) {
      for (const line of this._finale) {
        this._playLine(ctx, lineChannel(graph, 'finale', line.line), line, step, time, 1);
      }
    }
    if (state.frenzy) {
      for (const line of this._frenzy) {
        this._playLine(ctx, lineChannel(graph, 'frenzy', line.line), line, step, time, 1);
      }
    }

    this._seats.forEach((seat, index) => {
      const charge = state.frenzy ? 1 : (state.charges[index] ?? 0);
      if (charge <= 0) return;
      const dest = graph.channel(seatChannel(index));
      const awake = charge >= TIER_FULL_PART;
      this._playLine(
        ctx,
        dest,
        awake ? seat.full : seat.light,
        step,
        time,
        awake ? 1 : LIGHT_VELOCITY,
        onNote ? (when, velocity) => onNote(index, when, velocity) : undefined,
      );
      if (awake) for (const extra of seat.extras) this._playLine(ctx, dest, extra, step, time, 1);
      if (seat.ornament && charge >= TIER_ORNAMENT) {
        this._playLine(ctx, dest, seat.ornament, step, time, 1);
      }
    });
  }

  /**
   * The answer to a squirt: one note from the seat's instrument, on the
   * given step, walking up and down the chord as `counter` advances.
   */
  spray(
    ctx: BaseAudioContext,
    graph: OrchestraGraph,
    seat: number,
    step: number,
    time: number,
    counter: number,
    level: number,
  ): void {
    const compiled = this._seats[seat];
    if (!compiled) return;
    const { part } = compiled;
    const contour = SPRAY_CONTOUR[counter % SPRAY_CONTOUR.length] ?? 0;
    const midi = compiled.percussive
      ? 0
      : stackedTone(this.chordAt(step), contour, voiceFloor(part));
    this._bank.play(ctx, graph.channel(sprayChannel(seat)), voiceOf(part), midi, time, {
      gain: SPRAY_GAIN * level * part.level,
      ...(part.sustain ? { holdSeconds: SPRAY_HOLD_STEPS * this.stepSeconds } : {}),
    });
  }

  /** Plays the seat's wake-up call starting on `step` — see WAKE_CALL_TONES. */
  wakeCall(
    ctx: BaseAudioContext,
    graph: OrchestraGraph,
    seat: number,
    step: number,
    time: number,
  ): void {
    const compiled = this._seats[seat];
    if (!compiled) return;
    const { part } = compiled;
    const dest = graph.channel(sprayChannel(seat));
    const harmony = this.chordAt(step);
    const gain = WAKE_CALL_GAIN * part.level;
    if (part.sustain) {
      for (const note of WAKE_CALL_HELD) {
        const midi = stackedTone(harmony, note.tone, voiceFloor(part));
        this._bank.play(ctx, dest, part.instrument, midi, time + note.atStep * this.stepSeconds, {
          gain,
          holdSeconds: note.holdSteps * this.stepSeconds,
        });
      }
      return;
    }
    WAKE_CALL_STRUCK_TONES.forEach((tone, i) => {
      const midi = compiled.percussive ? 0 : stackedTone(harmony, tone, voiceFloor(part));
      // The last note lands hardest, so the call reads as a little "ta-da".
      const accent = i === WAKE_CALL_STRUCK_TONES.length - 1 ? 1 : 0.8;
      this._bank.play(ctx, dest, voiceOf(part), midi, time + i * this.stepSeconds, {
        gain: gain * accent,
      });
    });
  }

  /** One-off notes outside the written parts — fanfares, the final chord. `tone` is a stacked chord-tone index. */
  stinger(
    ctx: BaseAudioContext,
    graph: OrchestraGraph,
    instrument: InstrumentId,
    step: number,
    time: number,
    options: {
      tone?: number;
      floor?: number;
      gain: number;
      holdSeconds?: number;
      tonic?: boolean;
      /** 0–1: play through the guitar amp (a rock band's lead guitar fanfare). */
      drive?: number;
    },
  ): void {
    const harmony = options.tonic
      ? chord(this.score.tonic + (this.score.mode === 'minor' ? 'm' : ''))
      : this.chordAt(step);
    const midi =
      options.tone === undefined ? 0 : stackedTone(harmony, options.tone, options.floor ?? 60);
    const dest = options.drive
      ? graph.channel(STINGER_AMP_CHANNEL, 0, 1, options.drive)
      : graph.channel(STINGER_CHANNEL, 0, 1);
    this._bank.play(ctx, dest, instrument, midi, time, {
      gain: options.gain,
      ...(options.holdSeconds === undefined ? {} : { holdSeconds: options.holdSeconds }),
    });
  }

  private _playLine(
    ctx: BaseAudioContext,
    dest: AudioNode,
    compiled: CompiledLine,
    step: number,
    time: number,
    velocityScale: number,
    onNote?: (when: number, velocity: number) => void,
  ): void {
    const bar = Math.floor(step / STEPS_PER_BAR) % compiled.bars.length;
    const events = compiled.bars[bar];
    if (!events) return;
    const stepInBar = step % STEPS_PER_BAR;
    const { line } = compiled;

    for (const event of events) {
      if (event.step !== stepInBar) continue;
      const when = time + Math.random() * HUMANISE_SECONDS;
      const velocity =
        event.velocity * velocityScale * (1 + (Math.random() - 0.5) * HUMANISE_VELOCITY);
      this._bank.play(ctx, dest, line.instrument, this._pitch(event, line.floor, step), when, {
        gain: NOTE_GAIN * line.level * velocity,
        ...(line.sustain
          ? { holdSeconds: event.lengthSteps * this.stepSeconds * SUSTAIN_LEGATO }
          : {}),
      });
      onNote?.(when, velocity);
    }
  }

  private _pitch(event: PatternEvent, floor: number, step: number): number {
    const harmony = this.chordAt(step);
    switch (event.kind) {
      case 'stack':
        return stackedTone(harmony, event.index, floor) + event.transpose;
      case 'window':
        return windowTone(harmony, event.index, floor) + event.transpose;
      case 'bass':
        return bassTone(harmony, floor) + event.transpose;
      case 'degree':
        return scaleDegree(this._tonic, this.score.mode, event.index, floor) + event.transpose;
      case 'hit':
        return 0;
    }
  }
}

/**
 * The instrument that answers a squirt. A held part always answers in its own
 * voice; a struck part may name a companion (a drum kit answering on its
 * snare).
 */
function voiceOf(part: Part): InstrumentId {
  return part.sustain ? part.instrument : (part.spray ?? part.instrument);
}

/** Where squirt notes are pitched: the part's own register, unless a struck part asks to answer elsewhere (a bass, an octave up). */
function voiceFloor(part: Part): number {
  return part.sustain ? part.floor : (part.sprayFloor ?? part.floor);
}

const STINGER_CHANNEL = 'stinger';
const STINGER_AMP_CHANNEL = 'stinger:amp';

/** The channel a bed, finale or frenzy line plays on: the shared one, or an amp channel for a driven guitar line (one per drive setting). */
function lineChannel(graph: OrchestraGraph, base: string, line: Line): AudioNode {
  return line.drive
    ? graph.channel(`${base}:amp${line.drive}`, 0, 1, line.drive)
    : graph.channel(base, 0, 1);
}

export function seatChannel(seat: number): string {
  return `seat:${seat}`;
}

export function sprayChannel(seat: number): string {
  return `spray:${seat}`;
}
