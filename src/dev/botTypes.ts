/** The types of the dev balance bot (botSim.ts): its view of GameScene, and what a run and a batch return. */

import type Phaser from 'phaser';

import type { SpinnerState } from '../entities/spinner/spinner.types';
import type { BotProfile } from './botProfiles';
import type { DirectorView } from './botVisitors';

export interface SpinnerView {
  readonly x: number;
  readonly y: number;
  currentSpeed: number;
  readonly playingState: SpinnerState;
  readonly silenced: boolean;
}

/** The slice of GameScene the bot drives. All private in the real class; this is a test double's view of it. */
export interface SceneView {
  readonly scene: Phaser.Scenes.ScenePlugin;
  readonly events: Phaser.Events.EventEmitter;
  readonly input: Phaser.Input.InputPlugin;
  _roundOver: boolean;
  _started: boolean;
  _timeRemainingMs: number;
  readonly _reward: {
    readonly coins: number;
    readonly stars: number;
    readonly dropOuts: number;
    readonly groove: { readonly level: number };
    addCoins(amount: number): void;
  };
  _peakFullSpinners: number;
  readonly _gig: { readonly seconds: number };
  readonly _gun: { readonly coinBoost: number };
  readonly _visitors: DirectorView;
  readonly _spinners: readonly SpinnerView[];
  readonly _input: {
    _pointerX: number;
    _pointerY: number;
    _lastWasTouch: boolean;
    _hasAimed: boolean;
  };
  /** Starts the gig at once with no count-in (GameScene keeps this for the bot). */
  _onFirstInput(): void;
}

/** What one played gig came to, after the Big Finish. */
export interface RunResult {
  readonly coins: number;
  readonly stars: number;
  /** Coins and stars at the whistle, before the bows. */
  readonly preFinishCoins: number;
  readonly preFinishStars: number;
  readonly dropOuts: number;
  readonly groovePeak: number;
  readonly grooveAvg: number;
  readonly peakFull: number;
  readonly band: number;
  readonly starAtSeconds: readonly (number | null)[];
}

/** One case of a batch: a gig (0-based index), a gun, and who plays it. */
export interface BatchCase {
  readonly venue: string;
  readonly gig: number;
  readonly gun: string;
  readonly profile: 'child' | 'keen' | 'expert';
  readonly gunLevel?: number;
}

/** A batch case's averages over its runs. */
export interface BatchRow {
  readonly venue: string;
  readonly gig: number;
  readonly gun: string;
  readonly profile: string;
  readonly runs: number;
  /** Each run's coin total, so stars can be re-worked against other targets without playing again. */
  readonly coinList: readonly number[];
  /** Each run's banked stars, in the same order. */
  readonly starList: readonly number[];
  readonly coins: number;
  readonly stars: number;
  /** Share of runs with at least one star. */
  readonly pass: number;
  /** Share of runs with three stars. */
  readonly three: number;
}

export interface BotSim {
  readonly CHILD: BotProfile;
  readonly KEEN: BotProfile;
  readonly EXPERT: BotProfile;
  /** Resolves when the game has loaded. `ladder` and `batch` call it; call it yourself before a bare `play`. */
  ready(): Promise<void>;
  play(worldId: string, gig: number, bot: BotProfile, gunId?: string, gunLevel?: number): string;
  playRun(
    worldId: string,
    gig: number,
    bot: BotProfile,
    gunId?: string,
    gunLevel?: number,
  ): RunResult | string;
  ladder(worldId: string, gunId?: string, gigs?: readonly number[]): Promise<string[]>;
  /**
   * The expected-gun cases of a venue's gigs (child, keen, expert, then keen with a gun two
   * rungs up, marked `^`) as `[gig, gun, profile, coins per run, stars per run]`, for working stars out offline.
   */
  sweep(
    venue: string,
    gigs: readonly number[],
    runs: number,
    seed?: number,
  ): Promise<(string | number | readonly number[])[][]>;
  /** Draws nothing while the bot plays (the default); `false` brings the drawing back. */
  setHeadless(on: boolean): void;
  /** Plays every case `runs` times and averages them. With a `seed` the visitors and misses repeat. */
  batch(cases: readonly BatchCase[], runs?: number, seed?: number): Promise<BatchRow[]>;
}
