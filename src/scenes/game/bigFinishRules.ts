/**
 * The Big Finish's rules, with no Phaser in them so they can be unit-tested:
 * what each instrument's bow is worth, when each one bows, the word for the
 * stars earned, and how many coins are left to the next star. The sequence
 * that plays them out is `BigFinish.ts`.
 */

import { SpinnerState } from '../../entities/spinner/spinner.types';
import { payFor, type StarTargets } from './GigScore';

/** A bow is worth this many pay ticks of the instrument's state, so a full-speed bow beats a whole second of playing. */
export const BOW_BONUS_TICKS = 6;
/** A full-band finish (every instrument at full speed at the buzzer) doubles the whole bow bonus. */
export const FULL_BAND_BONUS_FACTOR = 2;

/** The whole cascade fits in this long, however big the band. */
export const CASCADE_BUDGET_MS = 1400;
/** Gap between two bows: 120 ms for a small band, tightening for a big one, never below 60 ms. */
export const CASCADE_MAX_GAP_MS = 120;
export const CASCADE_MIN_GAP_MS = 60;

/** The chime climbs the chord across the cascade, from level 1 up to this. */
export const CHIME_LEVELS = 5;

/** What the stars earned are called, indexed by star count. */
const VERDICTS = ['Almost!', 'Nice!', 'Great!', 'Superstar!'] as const;

/** One instrument on the wall, as the finish sees it at the buzzer. */
export interface BandMember {
  readonly x: number;
  readonly state: SpinnerState;
}

/** One instrument's bow. */
export interface Bow {
  /** Index into the band as given to `planBows`. */
  readonly index: number;
  /** Still playing at the buzzer: it pops and pays. A quiet one only dims. */
  readonly spinning: boolean;
  /** Coins the bow pays; 0 for a quiet instrument. */
  readonly bonus: number;
  /** Time after the cascade starts that this bow lands, ms. */
  readonly delayMs: number;
  /** Which rung of the rising chime this bow plays, 1 to `CHIME_LEVELS`. */
  readonly chimeLevel: number;
}

/** The whole finish, worked out from the wall at the buzzer. */
export interface FinishPlan {
  readonly bows: readonly Bow[];
  /** Every instrument was at full speed. */
  readonly fullBand: boolean;
  /** How long from the first bow to the last, ms. */
  readonly cascadeMs: number;
}

/** Gap between bows for a band of `count`: faster as the band grows, so the cascade fits `CASCADE_BUDGET_MS`. */
export function cascadeGapMs(count: number): number {
  if (count <= 1) return CASCADE_MAX_GAP_MS;
  const fit = CASCADE_BUDGET_MS / count;
  return Math.min(CASCADE_MAX_GAP_MS, Math.max(CASCADE_MIN_GAP_MS, fit));
}

/** True when there is a band and every instrument in it is at full speed. */
export function isFullBand(states: readonly SpinnerState[]): boolean {
  return states.length > 0 && states.every((s) => s === SpinnerState.FULL);
}

/**
 * Coins one instrument's bow pays: its normal per-tick pay for its state,
 * times `BOW_BONUS_TICKS`, the groove and the gun's coin boost, doubled for
 * a full-band finish. Whole coins; a quiet instrument pays nothing.
 */
export function bowBonus(
  state: SpinnerState,
  grooveLevel: number,
  coinBoost: number,
  fullBand: boolean,
): number {
  const base = payFor(state) * BOW_BONUS_TICKS * grooveLevel * coinBoost;
  return Math.round(base * (fullBand ? FULL_BAND_BONUS_FACTOR : 1));
}

/** Plans the finish: bows from the left of the wall to the right, each with its bonus, time and chime. */
export function planBows(
  band: readonly BandMember[],
  grooveLevel: number,
  coinBoost: number,
): FinishPlan {
  const fullBand = isFullBand(band.map((m) => m.state));
  const gap = cascadeGapMs(band.length);
  const order = band.map((_, i) => i).sort((a, b) => (band[a]?.x ?? 0) - (band[b]?.x ?? 0));
  const bows = order.map((index, place): Bow => {
    const state = band[index]?.state ?? SpinnerState.STOPPED;
    return {
      index,
      spinning: payFor(state) > 0,
      bonus: bowBonus(state, grooveLevel, coinBoost, fullBand),
      delayMs: Math.round(place * gap),
      chimeLevel: Math.min(CHIME_LEVELS, 1 + Math.floor((place * CHIME_LEVELS) / band.length)),
    };
  });
  return { bows, fullBand, cascadeMs: Math.round(Math.max(0, band.length - 1) * gap) };
}

/** The word that goes with `stars` earned (0 to 3). */
export function finishVerdict(stars: number): string {
  return VERDICTS[Math.max(0, Math.min(VERDICTS.length - 1, Math.floor(stars)))] ?? VERDICTS[0];
}

/**
 * Coins still needed for the next star, given the stars already locked in;
 * 0 when all three are held. Drives the "N to go!" chase in the last seconds.
 */
export function coinsToNextStar(coins: number, targets: StarTargets, starsHeld: number): number {
  const next = targets[Math.max(0, Math.floor(starsHeld))];
  if (next === undefined || !Number.isFinite(next)) return 0;
  return Math.max(0, Math.ceil(next - coins));
}
