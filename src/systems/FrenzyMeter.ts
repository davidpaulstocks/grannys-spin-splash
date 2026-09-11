/**
 * Watches spinner states and emits threshold-crossing events — 60% of
 * spinners at FULL ('miniLow'), 80% ('miniHigh'), and all of them ('full',
 * the SPLASH FRENZY trigger). CLAUDE.md §2, §9.1.
 *
 * Pure logic, no Phaser dependency (CLAUDE.md §7.3 rule 10 — Systems must
 * stay unit-testable without booting the engine). GameScene owns what
 * actually happens on each event (locking spinners at FULL, the 25-star
 * bonus, the 5-second window) — that business logic isn't "watching
 * state", so it lives in the orchestrator, not here (§7.1 one-way data flow).
 *
 * All three thresholds use the same rising-edge check — including 'full'.
 * An earlier version gave 'full' its own latched `_frenzyActive` flag that
 * GameScene cleared via `endFrenzy()` when its bonus window ended; that
 * raced against reality: GameScene locks every spinner at FULL for the
 * whole window, so the instant it unlocks them and clears the flag, this
 * meter is still reading 100% (decay hasn't had a frame to act yet) and
 * re-fires 'full' immediately — an infinite Frenzy loop, confirmed live via
 * manual frame-stepping in the Browser pane during Sprint 1 verification.
 * A plain rising-edge check needs fullPct to genuinely dip below 1.0 before
 * it can cross back up, which can't happen inside the same instant it was
 * just released — so it can't self-retrigger, only re-trigger once the
 * player actually rebuilds the wall.
 */

import { FRENZY_THRESHOLDS } from '../data/spinners';
import { SpinnerState } from '../types/spinner';
import { EventEmitter } from '../utils/EventEmitter';

export interface SpinnerStateSnapshot {
  readonly state: SpinnerState;
}

export class FrenzyMeter extends EventEmitter {
  private _prevFullPct = 0;

  /** Recomputes the FULL-percentage from the current spinner list and fires any newly-crossed events. */
  update(spinners: readonly SpinnerStateSnapshot[]): void {
    if (spinners.length === 0) return;

    const fullCount = spinners.filter((s) => s.state === SpinnerState.FULL).length;
    const fullPct = fullCount / spinners.length;

    if (this._crossedUp(fullPct, FRENZY_THRESHOLDS.miniLow)) this.emit('miniLow');
    if (this._crossedUp(fullPct, FRENZY_THRESHOLDS.miniHigh)) this.emit('miniHigh');
    if (this._crossedUp(fullPct, FRENZY_THRESHOLDS.full)) this.emit('full');

    this._prevFullPct = fullPct;
  }

  /** Resets all threshold state — call at the start of a new run. */
  reset(): void {
    this._prevFullPct = 0;
  }

  private _crossedUp(currentPct: number, threshold: number): boolean {
    return this._prevFullPct < threshold && currentPct >= threshold;
  }
}
