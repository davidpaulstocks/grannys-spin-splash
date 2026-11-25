/**
 * The spinner orchestra — CLAUDE.md §9, the game's headline feature.
 *
 * Every spinner on the wall is a musician with a written part in the world's
 * score. Three things make it feel like the player is conducting:
 *
 *  1. **Waking a spinner brings its musician in.** A barely-turning spinner
 *     plays the outline of its part, a spinning one plays the whole part, a
 *     full-speed one adds an ornament. Let it wind down and the musician
 *     fades back out.
 *  2. **Squirting plays the instrument.** Water landing on a spinner sounds
 *     that instrument at once — on the next sixteenth, from the current
 *     chord — so every squirt is a note that fits.
 *  3. **The round has a shape.** Driving strings and timpani join for the
 *     last third, Splash Frenzy lands a fanfare and a tutti, and the final
 *     whistle resolves on a closing chord.
 *
 * This class owns only the real-time clock and the game-facing API. What is
 * played is the `Conductor`'s job, the signal path is `OrchestraGraph`'s, and
 * the instruments are `SampleBank`'s.
 */

import { audioBus } from './AudioBus';
import { Conductor, seatChannel, sprayChannel } from './orchestra/Conductor';
import { OrchestraGraph } from './orchestra/OrchestraGraph';
import { sampleBank } from './orchestra/SampleBank';
import { playAnticipation, playClosingChord, playFanfare } from './orchestra/setPieces';
import { resolveScore } from './scores';

/** How far ahead of the audio clock notes are scheduled, and how often that is topped up. */
const LOOKAHEAD_SECONDS = 0.11;
const SCHEDULER_INTERVAL_MS = 25;
/** A stalled tab resumes from "now" instead of machine-gunning the notes it missed. */
const MAX_LATE_SECONDS = 0.06;
const START_DELAY_SECONDS = 0.06;

/** A musician is audible from the first drop and grows with its spinner. */
const SEAT_LEVEL_FLOOR = 0.5;
/** The final third of the round gets the finale lines (CLAUDE.md §2's last-ten-seconds urgency). */
const FINALE_FROM_PROGRESS = 2 / 3;

/** Spray notes: at most one per spinner per eighth note, and a few at once across the wall. */
const SPRAY_INTERVAL_STEPS = 2;
const SPRAY_MAX_PER_STEP = 3;
const SPRAY_MIN_LEAD_SECONDS = 0.012;
/** Once a musician is playing their own part, their spray notes step back so the part stays the hero. */
const SPRAY_LEVEL_AWAKE = 0.6;
const SPRAY_LEVEL_FULL = 0.38;
const SPRAY_AWAKE_CHARGE = 0.4;
const SPRAY_FULL_CHARGE = 0.8;

const STEPS_PER_BEAT = 4;

export interface OrchestraSpinnerSnapshot {
  /** 0..1 — this spinner's charge as a fraction of MAX_SPINNER_SPEED. */
  readonly charge: number;
}

/** A note that has just sounded, for the wall to react to. */
export interface OrchestraNote {
  /** Index into the spinner list passed to `updateMix`. */
  readonly spinner: number;
  readonly velocity: number;
  /** True when the note was the player's own squirt rather than the written part. */
  readonly spray: boolean;
}

interface PendingNote extends OrchestraNote {
  readonly time: number;
}

export class AudioOrchestra {
  private _ctx: AudioContext | null = null;
  private _graph: OrchestraGraph | null = null;
  private _conductor: Conductor | null = null;
  private _timer: ReturnType<typeof setInterval> | null = null;
  private _running = false;
  /** Set by finish(): the closing chord is ringing, so a following stop() must not cut it off. */
  private _finishing = false;

  private _origin = 0;
  private _step = 0;
  private _charges: number[] = [];
  /** How many spinners are on the wall — may exceed the score's seats, in which case seats are shared. */
  private _spinnerCount = 0;
  private _progress = 0;
  private _frenzy = false;

  private _pending: PendingNote[] = [];
  private _lastSprayStep: number[] = [];
  private _sprayCounter: number[] = [];
  private _spraysOnStep = { step: -1, count: 0 };

  /** Fetches and decodes the instruments. Call once at boot; never blocks play. */
  preload(): void {
    void sampleBank.load();
  }

  /**
   * Starts the music. With a `worldId` this is a new round: the score is
   * (re)seated across the wall, `pans` giving each spinner's left-right
   * position (−1..1) so the orchestra is laid out where the spinners are.
   * Without one it resumes exactly where `stop()` left off (un-pause).
   * Requires `audioBus.init()` on a user gesture first; otherwise a no-op.
   */
  start(worldId?: string, pans: readonly number[] = []): void {
    audioBus.resume();
    const ctx = audioBus.context;
    const master = audioBus.master;
    if (!ctx || !master) return;
    if (ctx !== this._ctx) {
      this._ctx = ctx;
      this._graph = new OrchestraGraph(ctx, master);
    }
    const graph = this._graph;
    if (!graph) return;

    if (worldId || !this._conductor) {
      this._conductor = new Conductor(resolveScore(worldId ?? ''), sampleBank);
      graph.resetChannels();
      for (let seat = 0; seat < this._conductor.seatCount; seat++) {
        const pan = pans[seat] ?? 0;
        graph.channel(seatChannel(seat), pan, 0);
        graph.channel(sprayChannel(seat), pan, 1);
      }
      this._step = 0;
      this._charges = [];
      this._progress = 0;
      this._frenzy = false;
      this._lastSprayStep = [];
      this._sprayCounter = [];
      graph.setArc(0);
    }
    if (this._running) return;

    this._finishing = false;
    this._pending = [];
    // Resuming keeps the step counter, so the origin is moved to wherever
    // makes the next step due a moment from now.
    this._origin = ctx.currentTime + START_DELAY_SECONDS - this._step * this._conductor.stepSeconds;
    this._running = true;
    this._tick();
    this._timer = setInterval(() => this._tick(), SCHEDULER_INTERVAL_MS);
  }

  /** Stops at once and silences every musician — pause, quit, scene shutdown. Position is kept for a resume. */
  stop(): void {
    this._halt();
    if (!this._finishing) this._graph?.silence();
  }

  /** Round over: land a closing chord on the next beat and let it ring, instead of cutting the music dead. */
  finish(): void {
    const ctx = this._ctx;
    const graph = this._graph;
    const conductor = this._conductor;
    if (!this._running || !ctx || !graph || !conductor) return;
    const step = this._nextStep(ctx.currentTime + SPRAY_MIN_LEAD_SECONDS, STEPS_PER_BEAT);
    playClosingChord(conductor, ctx, graph, step, conductor.timeOfStep(step, this._origin));
    this._finishing = true;
    this._halt();
  }

  /**
   * Drives the mix from live spinner state — call once per frame. Each
   * spinner's charge is its musician's fader; which version of the part they
   * play is decided by the conductor from the same number.
   */
  updateMix(spinners: readonly OrchestraSpinnerSnapshot[]): void {
    const graph = this._graph;
    const conductor = this._conductor;
    if (!this._running || !graph || !conductor) return;
    const charges: number[] = new Array<number>(conductor.seatCount).fill(0);
    spinners.forEach((spinner, i) => {
      const seat = i % conductor.seatCount;
      charges[seat] = Math.max(charges[seat] ?? 0, Math.min(1, Math.max(0, spinner.charge)));
    });
    this._charges = charges;
    this._spinnerCount = spinners.length;
    charges.forEach((charge, seat) => {
      const level = charge > 0 ? SEAT_LEVEL_FLOOR + (1 - SEAT_LEVEL_FLOOR) * charge : 0;
      graph.setLevel(seatChannel(seat), level);
    });
  }

  /** How far through the round we are, 0..1 — call once per frame. Opens the mix up and cues the finale. */
  setRoundProgress(progress: number): void {
    const clamped = Math.min(1, Math.max(0, progress));
    if (Math.abs(clamped - this._progress) < 0.004) return;
    this._progress = clamped;
    this._graph?.setArc(clamped);
  }

  /** Water has just landed on the spinner at `index`: its instrument answers on the next sixteenth. */
  onSpinnerHit(index: number): void {
    const ctx = this._ctx;
    const graph = this._graph;
    const conductor = this._conductor;
    if (!this._running || !ctx || !graph || !conductor) return;
    const seat = index % conductor.seatCount;
    const step = this._nextStep(ctx.currentTime + SPRAY_MIN_LEAD_SECONDS, 1);
    if (step - (this._lastSprayStep[seat] ?? -SPRAY_INTERVAL_STEPS) < SPRAY_INTERVAL_STEPS) return;
    if (this._spraysOnStep.step !== step) this._spraysOnStep = { step, count: 0 };
    if (this._spraysOnStep.count >= SPRAY_MAX_PER_STEP) return;
    this._spraysOnStep.count++;
    this._lastSprayStep[seat] = step;
    const counter = this._sprayCounter[seat] ?? 0;
    this._sprayCounter[seat] = counter + 1;

    const charge = this._charges[seat] ?? 0;
    const level =
      charge >= SPRAY_FULL_CHARGE
        ? SPRAY_LEVEL_FULL
        : charge >= SPRAY_AWAKE_CHARGE
          ? SPRAY_LEVEL_AWAKE
          : 1;
    const time = conductor.timeOfStep(step, this._origin);
    conductor.spray(ctx, graph, seat, step, time, counter, level);
    this._pending.push({ spinner: index, time, velocity: level, spray: true });
  }

  /** The wall is nearly full: a timpani roll and a cymbal swell lean into the drop. */
  onFrenzyNear(): void {
    const ctx = this._ctx;
    const graph = this._graph;
    const conductor = this._conductor;
    if (!this._running || !ctx || !graph || !conductor) return;
    playAnticipation(conductor, ctx, graph, this._step, ctx.currentTime + SPRAY_MIN_LEAD_SECONDS);
  }

  /** SPLASH FRENZY: crash, timpani and a rising trumpet fanfare, then the frenzy lines for the whole window. */
  onFrenzyStart(): void {
    const ctx = this._ctx;
    const graph = this._graph;
    const conductor = this._conductor;
    if (!this._running || !ctx || !graph || !conductor) return;
    this._frenzy = true;
    const step = this._nextStep(ctx.currentTime + SPRAY_MIN_LEAD_SECONDS, 1);
    playFanfare(conductor, ctx, graph, step, conductor.timeOfStep(step, this._origin));
  }

  onFrenzyEnd(): void {
    this._frenzy = false;
  }

  /** Notes that have sounded since the last call — drives the wall's visual response. Call once per frame. */
  pollNotes(): readonly OrchestraNote[] {
    const ctx = this._ctx;
    if (!ctx || this._pending.length === 0) return [];
    const now = ctx.currentTime;
    const due = this._pending.filter((note) => note.time <= now);
    if (due.length > 0) this._pending = this._pending.filter((note) => note.time > now);
    return due;
  }

  /** Position within the current beat, 0..1 — for anything that wants to pulse in time. */
  beatPhase(): number {
    const ctx = this._ctx;
    const conductor = this._conductor;
    if (!this._running || !ctx || !conductor) return 0;
    const beats = (ctx.currentTime - this._origin) / (conductor.stepSeconds * STEPS_PER_BEAT);
    return beats - Math.floor(beats);
  }

  /** The musician seated at a spinner: "Flute", "Harp". */
  seatName(index: number): string {
    return this._conductor?.seatName(index) ?? '';
  }

  private _halt(): void {
    this._running = false;
    if (this._timer !== null) {
      clearInterval(this._timer);
      this._timer = null;
    }
  }

  /** The first step at or after `time` that falls on a multiple of `grid` sixteenths. */
  private _nextStep(time: number, grid: number): number {
    const conductor = this._conductor;
    if (!conductor) return 0;
    const exact = (time - this._origin) / conductor.stepSeconds;
    return Math.max(0, Math.ceil(exact / grid) * grid);
  }

  private _tick(): void {
    const ctx = this._ctx;
    const graph = this._graph;
    const conductor = this._conductor;
    if (!this._running || !ctx || !graph || !conductor) return;

    const now = ctx.currentTime;
    const state = {
      charges: this._charges,
      frenzy: this._frenzy,
      finale: this._progress >= FINALE_FROM_PROGRESS,
    };
    for (;;) {
      const time = conductor.timeOfStep(this._step, this._origin);
      if (time >= now + LOOKAHEAD_SECONDS) break;
      if (time >= now - MAX_LATE_SECONDS) {
        conductor.scheduleStep(
          ctx,
          graph,
          this._step,
          Math.max(time, now),
          state,
          (seat, when, velocity) => this._queueNote(seat, when, velocity),
        );
      }
      this._step++;
    }
  }

  /** One written note fans out to every spinner seated at that part (walls larger than the score double up). */
  private _queueNote(seat: number, time: number, velocity: number): void {
    const seats = this._conductor?.seatCount ?? 1;
    for (let spinner = seat; spinner < this._spinnerCount; spinner += seats) {
      this._pending.push({ spinner, time, velocity, spray: false });
    }
  }
}

/** Shared instance — one orchestra for the whole game, like the audio bus it plays through. */
export const audioOrchestra = new AudioOrchestra();
