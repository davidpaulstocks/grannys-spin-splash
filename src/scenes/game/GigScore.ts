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
/**
 * Tips: every instrument playing at full speed earns this many coins a second.
 * This is what an instrument left to wind down costs you (2026-11-26, David:
 * "when you get the instrument started it then just is going, so you don't
 * lose anything if you stop spinning it"). It replaced the encore payout,
 * which only paid during Frenzy: Frenzy is every instrument at full speed, so
 * it still pays the most, but now so does simply keeping the band going.
 */
export const TIP_COINS_PER_PLAYER_SECOND = 0.35;

/** Where the "one star!" call-outs appear, each a step lower so two earned at once don't overprint. */
const STAR_TEXT_Y = GAME_HEIGHT * 0.2;
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
  /** Tips earned but not yet a whole coin. */
  private _tipsOwed = 0;
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
    this._tipsOwed = 0;
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
    const before = this._stars;
    while (this._stars < reached) {
      this._stars++;
      this._coins += COINS_PER_STAR;
    }
    // One call-out, for the rating now held — a trio earns its second and
    // third star in the same instant, and two labels there just overprint.
    if (this._stars > before) {
      this._float(
        GAME_WIDTH / 2,
        STAR_TEXT_Y,
        STAR_LABELS[this._stars - 1] ?? '',
        COLOUR_HEX.sunnyGold,
      );
    }
  }

  /**
   * Pays tips for `playing` instruments at full speed over `deltaMs`, and
   * returns the whole coins paid this call (usually 0 or 1).
   */
  payTips(deltaMs: number, playing: number): number {
    if (playing <= 0) return 0;
    this._tipsOwed += (playing * TIP_COINS_PER_PLAYER_SECOND * deltaMs) / 1000;
    const paid = Math.floor(this._tipsOwed);
    this._tipsOwed -= paid;
    this._coins += paid;
    return paid;
  }
}
