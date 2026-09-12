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
   * The run's current star total — shown live via `ScoreCounter` (2026-09-12
   * re-plan, direct user feedback: score should be visible and exciting
   * during play, not hidden until game over as story 2.5 originally had it).
   */
  readonly score: number;
}
