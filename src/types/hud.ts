/**
 * Shared shape GameScene feeds to HUDScene each frame. HUDScene has no
 * game logic of its own (CLAUDE.md §7.2) — it only reads this. A plain
 * snapshot, not live Spinner instances, keeps the two scenes decoupled.
 */

import type { SpinnerState } from '../entities/spinner/spinner.types';

export interface HudSpinnerSnapshot {
  readonly x: number;
  readonly y: number;
  readonly r: number;
  readonly currentSpeed: number;
  readonly currentState: SpinnerState;
}

export interface HudRefreshData {
  readonly secondsRemaining: number;
  /** 0–100. */
  readonly waterPct: number;
  readonly isPumping: boolean;
  readonly spinners: readonly HudSpinnerSnapshot[];
  /**
   * The coins to show on the counter: the gig's total less the coins still
   * flying to it, so the number rises as each coin lands (docs/REWARD_LOOP.md).
   */
  readonly coins: number;
  /** The coin totals that earn one, two and three stars. */
  readonly starTargets: readonly [number, number, number];
  /** Stars locked in so far this gig, 0–3. */
  readonly stars: number;
  /** Groove level, 1–5 — the multiplier on every coin. */
  readonly grooveLevel: number;
  /** Progress toward the next groove level, 0–1. */
  readonly grooveRing: number;
  /** True during Splash Frenzy, when the groove is at its top and every coin counts double. */
  readonly jackpot: boolean;
}
