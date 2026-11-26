/**
 * The in-gig reward loop (docs/REWARD_LOOP.md), from the scene's side: every
 * instrument that is spinning pays coins on a 500 ms tick, the groove
 * multiplies them, an instrument dropping out of full speed costs a groove
 * level, and a coin fountain shows who paid. GameScene feeds it the wall once
 * a frame and tells it when a spinner changes state; the rules themselves
 * live in `GigScore` (coins and stars) and `systems/Groove` (the multiplier).
 */

import type Phaser from 'phaser';

import { audioOrchestra } from '../../audio/AudioOrchestra';
import type { GunDef } from '../../entities/gun/gun.types';
import type { Spinner } from '../../entities/spinner/Spinner';
import { SpinnerState } from '../../entities/spinner/spinner.types';
import { starTargets, type GigDef } from '../../entities/world/gigs.data';
import { Groove } from '../../systems/Groove';
import { spawnFloatingText } from '../../ui/FloatingText';
import { COLOUR_HEX } from '../../utils/colour';
import { CoinFountain, COIN_TRAVEL_MS } from './CoinFountain';
import { GigScore, payFor, type StarTargets } from './GigScore';

/** A spinner that falls out of full speed this soon after the first squirt is not the player's doing. */
const DROP_OUT_GRACE_MS = 1000;
/** After Splash Frenzy ends the whole band winds down together; that is the party ending, not a mistake. */
const AFTER_FRENZY_GRACE_MS = 2500;
/** Where the "x2" of a drop-out floats, above the instrument that dropped. */
const DROP_TEXT_LIFT_PX = 12;

/** What the loop needs to know about the rest of the scene. */
export interface RewardLoopDeps {
  readonly scene: Phaser.Scene;
  readonly gun: GunDef;
  readonly gig: GigDef;
  /** The fixed grid of instruments (a Golden Spinner is not part of the band). */
  readonly spinners: () => readonly Spinner[];
  readonly frenzyActive: () => boolean;
  readonly doubleStarsActive: (time: number) => boolean;
}

export class RewardLoop {
  readonly groove = new Groove();
  private readonly _score: GigScore;
  private readonly _fountain: CoinFountain;
  /** Coins paid by ticks that are still on their way to the counter. */
  private _flying: { at: number; amount: number }[] = [];
  private _dropOutsAllowedAt = 0;
  private _dropOuts = 0;

  constructor(private readonly _d: RewardLoopDeps) {
    const targets: StarTargets = starTargets(_d.gig);
    this._score = new GigScore(
      (x, y, message, colourHex) => spawnFloatingText(_d.scene, x, y, message, colourHex),
      targets,
    );
    this._fountain = new CoinFountain(_d.scene);
    this.groove.on('levelUp', () => audioOrchestra.accent('combo', this.groove.level));
    this.groove.on('levelDown', () => audioOrchestra.accent('goldenMissed'));
  }

  /** Coins banked this gig. */
  get coins(): number {
    return this._score.coins;
  }

  /** Stars locked in this gig, 0–3. */
  get stars(): number {
    return this._score.stars;
  }

  /** The coin totals that earn one, two and three stars. */
  get targets(): StarTargets {
    return this._score.targets;
  }

  /** How many times an instrument has dropped out of full speed and cost a groove level this gig. */
  get dropOuts(): number {
    return this._dropOuts;
  }

  /** True during Splash Frenzy: the groove is at its top and every coin counts double. */
  get jackpot(): boolean {
    return this._d.frenzyActive();
  }

  /** The first squirt: coins start, and drop-outs count from a moment later. */
  start(time: number): void {
    this._dropOutsAllowedAt = time + DROP_OUT_GRACE_MS;
  }

  /** A Golden Spinner's payout, straight into the total. */
  addCoins(amount: number): void {
    this._score.addCoins(amount);
  }

  /**
   * One frame of the gig: fills the groove, and on a pay tick pays every
   * instrument and throws their coins. Call only while the gig is running.
   */
  update(time: number, deltaMs: number): void {
    const d = this._d;
    const spinners = d.spinners();
    if (d.frenzyActive())
      this._dropOutsAllowedAt = Math.max(this._dropOutsAllowedAt, time + AFTER_FRENZY_GRACE_MS);

    const full = spinners.filter((s) => s.currentState === SpinnerState.FULL).length;
    this.groove.update(deltaMs, full, spinners.length);

    const multiplier =
      this.groove.level *
      d.gun.coinBoost *
      (d.frenzyActive() ? 2 : 1) *
      (d.doubleStarsActive(time) ? 2 : 1);
    const paid = this._score.tick(
      deltaMs,
      spinners.map((s) => payFor(s.currentState)),
      multiplier,
    );
    if (paid <= 0) return;
    this._flying.push({ at: time, amount: paid });
    this._fountain.throwCoins(
      spinners
        .filter((s) => payFor(s.currentState) > 0)
        .map((s) => ({ x: s.x, y: s.y, pay: payFor(s.currentState) })),
    );
  }

  /**
   * A spinner changed state. Falling out of full speed costs a groove level —
   * except during or just after Frenzy, and in the first moment of the gig.
   */
  onSpinnerStateChange(spinner: Spinner, from: SpinnerState, to: SpinnerState, time: number): void {
    if (from !== SpinnerState.FULL || to === SpinnerState.FULL) return;
    if (this._d.frenzyActive() || time < this._dropOutsAllowedAt) return;
    const before = this.groove.level;
    this.groove.dropOut(this._d.spinners().length);
    this._dropOuts++;
    if (this.groove.level < before) {
      spawnFloatingText(
        this._d.scene,
        spinner.x,
        spinner.y - spinner.def.r - DROP_TEXT_LIFT_PX,
        `×${this.groove.level}`,
        COLOUR_HEX.heatOrange,
      );
    }
  }

  /** Splash Frenzy has started: straight to the top groove. */
  jackpotStarted(): void {
    this.groove.jackpot();
  }

  /**
   * The total the counter should show at `time`: the real total less the
   * coins whose flight to the counter has not finished, so the number rises
   * as each coin lands rather than before it is thrown.
   */
  displayedCoins(time: number): number {
    this._flying = this._flying.filter((f) => time - f.at < COIN_TRAVEL_MS);
    let owed = 0;
    for (const f of this._flying) owed += f.amount;
    return Math.max(0, this._score.coins - owed);
  }
}
