/**
 * The gig's running tally — coins, locked-in stars, and the rules that pay
 * them (CLAUDE.md §2). Pure bookkeeping: it owns no Phaser objects, and the
 * only thing it does to the screen is call the floating-text function it is
 * handed, so the rules can be unit-tested without a scene.
 */

import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { SpinnerState } from '../../entities/spinner/spinner.types';
import { COLOUR_HEX } from '../../utils/colour';

/** Draws a transient "+N" style label at a world position — GameScene binds this to `spawnFloatingText`. */
export type FloatTextFn = (x: number, y: number, message: string, colourHex: string) => void;

/** A spinner climbing a tier pays this many coins, times the combo. */
export const COINS_PER_LEVEL_UP = 1;
/** Each star reached in a gig pays this many coins on the spot. */
export const COINS_PER_STAR = 10;
/** The encore — everything after FULL BAND — pays one coin per this much Frenzy time. */
export const ENCORE_COIN_INTERVAL_MS = 500;

/** Where the "one star!" call-outs appear, each a step lower so two earned at once don't overprint. */
const STAR_TEXT_Y = GAME_HEIGHT * 0.2;
const STAR_TEXT_STEP_Y = 34;
const STAR_LABELS = ['ONE STAR!', 'TWO STARS!', 'THREE STARS!'] as const;

/** Combo multiplier at which the floating "+N" turns pink / gold (below the gold one it stays blue). */
const PINK_MULTIPLIER = 4;
const GOLD_MULTIPLIER = 2;

/** Rank of each spinner state, so "has this spinner been this high before?" is a number comparison. */
export const STATE_TIER: Readonly<Record<SpinnerState, number>> = {
  [SpinnerState.STOPPED]: 0,
  [SpinnerState.SLOW]: 1,
  [SpinnerState.MEDIUM]: 2,
  [SpinnerState.FULL]: 3,
};

/** Floating "+N ★" colour by combo multiplier tier — escalates with the combo, matching the prototype's `awardStars`. */
function hitTextColour(multiplier: number): string {
  if (multiplier >= PINK_MULTIPLIER) return COLOUR_HEX.grannyPink;
  if (multiplier >= GOLD_MULTIPLIER) return COLOUR_HEX.sunnyGold;
  return COLOUR_HEX.waterBlue;
}

export class GigScore {
  private _coins = 0;
  /** Stars earned so far this gig (0–3) — they lock in the moment they are reached. */
  private _stars = 0;
  /** Frenzy time not yet paid out as encore coins. */
  private _encoreUnpaidMs = 0;
  /** Highest tier each spinner has reached this gig — coins are paid once per tier, per spinner. */
  private readonly _bestTier = new Map<number, number>();

  constructor(private readonly _float: FloatTextFn) {}

  /** Coins banked so far this gig. */
  get coins(): number {
    return this._coins;
  }

  /** Stars locked in so far this gig (0–3). */
  get stars(): number {
    return this._stars;
  }

  /** Back to an empty gig — covers first boot and a "Play Again" restart alike. */
  reset(): void {
    this._coins = 0;
    this._stars = 0;
    this._encoreUnpaidMs = 0;
    this._bestTier.clear();
  }

  /** Adds coins outright (a claimed Golden Spinner's payout). */
  addCoins(amount: number): void {
    this._coins += amount;
  }

  /**
   * Banks the coins for a spinner climbing to `newState`, and returns how many
   * were paid (0 when it has been this high before). Coins only for a tier
   * this spinner has not reached before in this gig. Paying every re-climb made
   * letting spinners wind down and bringing them back the most profitable way
   * to play.
   */
  levelUp(spinnerId: number, newState: SpinnerState, multiplier: number): number {
    const tier = STATE_TIER[newState];
    const isNewBest = tier > (this._bestTier.get(spinnerId) ?? 0);
    if (isNewBest) this._bestTier.set(spinnerId, tier);
    const total = isNewBest ? COINS_PER_LEVEL_UP * multiplier : 0;
    this._coins += total;
    return total;
  }

  /**
   * Restored 2026-09-12 from the prototype's `awardStars` — direct user
   * feedback that per-hit feedback ("toasts when the player hit
   * targets") was part of what made hits feel rewarding. This is
   * transient combat text at the point of action, distinct from
   * HUDScene's persistent running tally (ScoreCounter) — the two
   * complement each other rather than one replacing the other.
   */
  showCoinText(total: number, multiplier: number, x: number, y: number): void {
    if (total <= 0) return;
    const label = multiplier > 1 ? `+${total} ×${multiplier}` : `+${total}`;
    this._float(x, y, label, hitTextColour(multiplier));
  }

  /**
   * Locks in stars up to `reached` (1–3). Stars never drop back: the rating
   * is the best the band sounded at any one moment, so a child who gets
   * there and then loses the wall has still won it.
   */
  awardStars(reached: number): void {
    while (this._stars < reached) {
      this._stars++;
      this._coins += COINS_PER_STAR;
      this._float(
        GAME_WIDTH / 2,
        STAR_TEXT_Y + this._stars * STAR_TEXT_STEP_Y,
        STAR_LABELS[this._stars - 1] ?? '',
        COLOUR_HEX.sunnyGold,
      );
    }
  }

  /** The encore: while Frenzy runs, the clock pays coins. See `FrenzyController.celebrateHit` for why not per hit. */
  payEncore(deltaMs: number, frenzyActive: boolean): void {
    if (!frenzyActive) return;
    this._encoreUnpaidMs += deltaMs;
    while (this._encoreUnpaidMs >= ENCORE_COIN_INTERVAL_MS) {
      this._encoreUnpaidMs -= ENCORE_COIN_INTERVAL_MS;
      this._coins += 1;
    }
  }
}
