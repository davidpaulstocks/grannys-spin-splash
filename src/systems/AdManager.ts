/**
 * High-level "show ad between runs" — centralises every ad flow so
 * audio-mute/input-disable is guaranteed consistent instead of
 * re-implemented per call site (CLAUDE.md §7.2, story 6.5). All ad calls
 * in the game route through here, not `poki.ts` directly (`poki.ts`
 * itself stays the only file touching `PokiSDK.*`, per rule 6 — this is
 * the layer above that).
 *
 * Audio mute/unmute are caller-supplied hooks, not owned here — there's
 * no AudioBus yet (Sprint 4 is blocked on an audio source decision), so
 * callers simply omit them today and this centralises the *shape* ready
 * for when AudioBus exists, rather than leaving every call site to wire
 * its own mute logic later.
 */

import * as poki from '../poki';
import type { RewardSize } from '../poki';

/** CLAUDE.md §11.1 — a commercial break shows on every *2nd* "Play Again", not every one. */
const RUNS_BETWEEN_COMMERCIAL_BREAKS = 2;

export interface AdHooks {
  readonly onAdStart?: () => void;
  readonly onAdEnd?: () => void;
}

export class AdManager {
  private _runsSinceLastCommercialBreak = 0;

  /** Call once each time a run ends (GameScene → GameOverScene), regardless of whether an ad is about to show. */
  recordRunCompleted(): void {
    this._runsSinceLastCommercialBreak++;
  }

  /** Whether the next "Play Again" tap should show a commercial break (CLAUDE.md §11.1). */
  shouldShowCommercialBreak(): boolean {
    return this._runsSinceLastCommercialBreak >= RUNS_BETWEEN_COMMERCIAL_BREAKS;
  }

  /** Shows the commercial break and resets the run counter. No-ops the mute hooks if the caller doesn't supply them. */
  async playCommercialBreak(hooks: AdHooks = {}): Promise<void> {
    this._runsSinceLastCommercialBreak = 0;
    hooks.onAdStart?.();
    await poki.commercialBreak();
    hooks.onAdEnd?.();
  }

  /** Shows a rewarded ad. Resolves true only if the player watched it to completion — one reward per ad (CLAUDE.md §11.3). */
  async playRewarded(size: RewardSize, hooks: AdHooks = {}): Promise<boolean> {
    hooks.onAdStart?.();
    const watched = await poki.rewardedBreak(size);
    hooks.onAdEnd?.();
    return watched;
  }
}

/** Shared instance — same reasoning as systems/SaveManager.ts's `saveManager`: one source of truth for the run counter. */
export const adManager = new AdManager();
