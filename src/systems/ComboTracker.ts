/**
 * Combo counter, 2-second decay window, star multiplier (CLAUDE.md §2, §7.2).
 * Behaviour extracted verbatim from the reference prototype's
 * `onHitSpinner`/`updateCombo` — including its one quirk: re-hitting the
 * *same* spinner holds the combo steady but does not refresh the window;
 * only hitting a *different* spinner both grows the combo and resets the
 * timer. That's what the playtested prototype does, so it's preserved
 * rather than "fixed".
 */

import { COMBO_WINDOW_MS, MAX_COMBO } from '../entities/spinner/spinner.data';

export class ComboTracker {
  private _combo = 0;
  private _timerMs = 0;
  private _lastHitId: number | null = null;

  /** Registers a water hit landing on `spinnerId`. Returns the resulting combo count. */
  registerHit(spinnerId: number): number {
    const isDifferentSpinner = spinnerId !== this._lastHitId;
    if (isDifferentSpinner) {
      this._combo = Math.min(this._combo + 1, MAX_COMBO);
      this._timerMs = COMBO_WINDOW_MS;
    } else {
      this._combo = Math.max(1, this._combo);
    }
    this._lastHitId = spinnerId;
    return this._combo;
  }

  /** Ticks the decay window; drops the combo back to 1 once it expires. Call once per frame. */
  update(deltaMs: number): void {
    if (this._combo <= 1) return;
    this._timerMs -= deltaMs;
    if (this._timerMs <= 0) {
      this._combo = 1;
      this._lastHitId = null;
    }
  }

  /** Current combo count (0 before the first hit of a run, otherwise 1–5). */
  get combo(): number {
    return this._combo;
  }

  /** Star multiplier for the current combo — always >= 1, even before any hit. */
  get multiplier(): number {
    return Math.max(1, this._combo);
  }

  /** Resets combo state — call at the start of a new run. */
  reset(): void {
    this._combo = 0;
    this._timerMs = 0;
    this._lastHitId = null;
  }
}
