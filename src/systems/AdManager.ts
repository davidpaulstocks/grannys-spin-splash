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

/**
 * ⚠️ **MUST BE `true` BEFORE POKI SUBMISSION.** ⚠️
 *
 * Temporarily false (2026-09-12, direct user request: "disable all the ads
 * for now, it's annoying while testing"). Every ad flow below becomes a
 * no-op: commercial breaks never show, and rewarded ads resolve as
 * "watched" so the reward still lands and the reward paths stay testable.
 *
 * Shipping this as `false` would fail review, not just lose revenue —
 * CLAUDE.md §12 must-fix 5 requires `commercialBreak()` between runs and
 * the reviewer checks the SDK events actually fire. One flag rather than
 * commented-out call sites precisely so it is a single, obvious switch.
 */
const ADS_ENABLED = false;

export interface AdHooks {
  readonly onAdStart?: () => void;
  readonly onAdEnd?: () => void;
}

export class AdManager {
  private _runsSinceLastCommercialBreak = 0;
  private readonly _enabled: boolean;

  /**
   * `enabled` defaults to ADS_ENABLED. It exists so the unit and ad-flow
   * tests can keep exercising the real SDK event ordering while ads are
   * switched off for playtesting — the tests assert the behaviour we have to
   * ship, so they must not silently pass because of a temporary flag.
   */
  constructor(options: { readonly enabled?: boolean } = {}) {
    this._enabled = options.enabled ?? ADS_ENABLED;
  }

  /** Call once each time a run ends (GameScene → GameOverScene), regardless of whether an ad is about to show. */
  recordRunCompleted(): void {
    this._runsSinceLastCommercialBreak++;
  }

  /** Whether the next "Play Again" tap should show a commercial break (CLAUDE.md §11.1). */
  shouldShowCommercialBreak(): boolean {
    if (!this._enabled) return false;
    return this._runsSinceLastCommercialBreak >= RUNS_BETWEEN_COMMERCIAL_BREAKS;
  }

  /**
   * Shows the commercial break and resets the run counter. No-ops the mute
   * hooks if the caller doesn't supply them.
   *
   * The underlying SDK call is wrapped in try/catch (2026-09-12, found by
   * spec audit): an ad blocker or a rejected SDK promise must never gate
   * core gameplay (CLAUDE.md §3 rule 9) — before this, a rejection here
   * propagated straight out of the caller's `await`, which for
   * `SplashScene._onPlay()` meant `_isStartingRun` stayed permanently true
   * and `scene.start('GameScene', ...)` never ran, bricking the PLAY button
   * for the rest of the session. The `finally` also guarantees `onAdEnd`
   * (unmute) still fires — without it, a rejection after `onAdStart` had
   * already muted audio would leave it muted forever.
   */
  async playCommercialBreak(hooks: AdHooks = {}): Promise<void> {
    this._runsSinceLastCommercialBreak = 0;
    if (!this._enabled) return;
    hooks.onAdStart?.();
    try {
      await poki.commercialBreak();
    } catch {
      // Treated as "the break didn't happen" — play proceeds regardless.
    } finally {
      hooks.onAdEnd?.();
    }
  }

  /**
   * Shows a rewarded ad. Resolves true only if the player watched it to
   * completion — one reward per ad (CLAUDE.md §11.3). A rejected SDK
   * promise resolves `false`, the same outcome as a player-skipped ad —
   * callers already handle that by granting nothing, so this needs no
   * special case beyond not bricking whatever awaited it (see
   * `playCommercialBreak`'s doc comment for the same failure mode).
   */
  async playRewarded(size: RewardSize, hooks: AdHooks = {}): Promise<boolean> {
    // Grants the reward without showing anything while ads are off, so the
    // double-score and free-gun paths stay testable — see ADS_ENABLED.
    if (!this._enabled) return true;
    hooks.onAdStart?.();
    try {
      return await poki.rewardedBreak(size);
    } catch {
      return false;
    } finally {
      hooks.onAdEnd?.();
    }
  }
}

/** Shared instance — same reasoning as systems/SaveManager.ts's `saveManager`: one source of truth for the run counter. */
export const adManager = new AdManager();
