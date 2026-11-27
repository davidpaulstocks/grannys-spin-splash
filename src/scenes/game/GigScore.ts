/**
 * The gig's running tally — coins, locked-in stars, and the rules that pay
 * them (docs/REWARD_LOOP.md). Every 500 ms each instrument pays by how fast
 * it is spinning, times the groove, the gun and any bonuses; stars lock in
 * as the coin total passes the gig's three targets. Pure bookkeeping: it
 * owns no Phaser objects, and the only thing it does to the screen is call
 * the floating-text function it is handed, so the rules can be unit-tested
 * without a scene.
 */

import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { SpinnerState } from '../../entities/spinner/spinner.types';
import { COLOUR_HEX } from '../../utils/colour';

/** Draws a transient "+N" style label at a world position — GameScene binds this to `spawnFloatingText`. */
export type FloatTextFn = (x: number, y: number, message: string, colourHex: string) => void;

/** The coin totals that earn one, two and three stars (`starTargets` in gigs.data.ts). */
export type StarTargets = readonly [number, number, number];

/** How often every instrument pays. */
export const PAY_TICK_MS = 500;

/** Coins per pay tick for one instrument, by how fast it is spinning. */
export const PAY_BY_STATE: Readonly<Record<SpinnerState, number>> = {
  [SpinnerState.STOPPED]: 0,
  [SpinnerState.SLOW]: 1,
  [SpinnerState.MEDIUM]: 2,
  [SpinnerState.FULL]: 4,
};

/** Coins one instrument pays on a tick while in `state`. */
export function payFor(state: SpinnerState): number {
  return PAY_BY_STATE[state];
}

/** Where the "one star!" call-outs appear. */
const STAR_TEXT_Y = GAME_HEIGHT * 0.2;
const STAR_LABELS = ['ONE STAR!', 'TWO STARS!', 'THREE STARS!'] as const;

/** Targets nobody can pass — what an unset gig scores against. */
const NO_TARGETS: StarTargets = [Infinity, Infinity, Infinity];

export class GigScore {
  private _coins = 0;
  /** Stars earned so far this gig (0–3) — they lock in the moment they are reached. */
  private _stars = 0;
  private _targets: StarTargets;
  /** Time since the last pay tick, ms. */
  private _sinceTickMs = 0;

  constructor(
    private readonly _float: FloatTextFn,
    targets: StarTargets = NO_TARGETS,
  ) {
    this._targets = targets;
  }

  /** Coins banked so far this gig. */
  get coins(): number {
    return this._coins;
  }

  /** Stars locked in so far this gig (0–3). */
  get stars(): number {
    return this._stars;
  }

  /** The three coin totals this gig's stars are set at. */
  get targets(): StarTargets {
    return this._targets;
  }

  /** Back to an empty gig with `targets` as its star marks — covers first boot and a "Play Again" restart alike. */
  reset(targets: StarTargets = this._targets): void {
    this._coins = 0;
    this._stars = 0;
    this._sinceTickMs = 0;
    this._targets = targets;
  }

  /** Adds coins outright (a claimed Golden Spinner's payout). */
  addCoins(amount: number): void {
    this._coins += amount;
    this._lockStars();
  }

  /**
   * Takes coins away (a thief's loot). The total never goes below 0 and stars
   * already locked in stay locked. Returns the coins actually taken.
   */
  steal(amount: number): number {
    const taken = Math.max(0, Math.min(Math.round(amount), this._coins));
    this._coins -= taken;
    return taken;
  }

  /**
   * Advances the pay clock by `deltaMs`. Each time it passes a pay tick, every
   * instrument in `pays` (one entry per instrument, see `payFor`) pays at
   * `multiplier`, rounded to whole coins. Returns the coins paid by this call:
   * 0 unless a tick fell in it.
   */
  tick(deltaMs: number, pays: readonly number[], multiplier: number): number {
    this._sinceTickMs += deltaMs;
    const ticks = Math.floor(this._sinceTickMs / PAY_TICK_MS);
    if (ticks <= 0) return 0;
    this._sinceTickMs -= ticks * PAY_TICK_MS;
    let sum = 0;
    for (const pay of pays) sum += pay;
    const paid = Math.round(sum * multiplier) * ticks;
    this._coins += paid;
    this._lockStars();
    return paid;
  }

  /**
   * Locks in every star the coin total has now passed. Stars never drop
   * back, and one call-out names the rating now held — two earned in the
   * same instant are one moment, not two labels overprinting.
   */
  private _lockStars(): void {
    const before = this._stars;
    while (
      this._stars < this._targets.length &&
      this._coins >= (this._targets[this._stars] ?? Infinity)
    ) {
      this._stars++;
    }
    if (this._stars > before) {
      this._float(
        GAME_WIDTH / 2,
        STAR_TEXT_Y,
        STAR_LABELS[this._stars - 1] ?? '',
        COLOUR_HEX.sunnyGold,
      );
    }
  }
}
