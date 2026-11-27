/**
 * The one place a new round is gated behind the between-runs commercial
 * break (CLAUDE.md §3 SDK step 5, §11.1). Shared by SplashScene's PLAY and
 * ResultsScene's PLAY AGAIN so the two can never drift apart — Poki
 * requires `commercialBreak()` between runs with audio muted for its
 * duration, whichever button started the next one.
 *
 * `startRound` is handed `PLAYER_CLICKED` to merge into the scene's start data;
 * that is how GameScene knows a real click led here (it counts the gig in
 * by itself) rather than a launch with no input.
 *
 * Callers own their own "already starting" flag (reset in `create()`, since
 * Phaser reuses scene instances) — this function only guarantees the round
 * starts exactly once per call, even if the ad call throws.
 */

import type { GameSceneData } from '../types/sceneData';
import type { AdHooks } from './AdManager';

/** Spread into the next GameScene's start data: the player has clicked, so the gig may count itself in. */
export const PLAYER_CLICKED: Pick<GameSceneData, 'playerClicked'> = { playerClicked: true };

/** The slice of AdManager this needs — a structural type so tests can pass a fake. */
export interface CommercialBreakGate {
  shouldShowCommercialBreak(): boolean;
  playCommercialBreak(hooks?: AdHooks): Promise<void>;
}

export async function startRoundAfterAdGate(
  ads: CommercialBreakGate,
  hooks: AdHooks,
  startRound: (click: typeof PLAYER_CLICKED) => void,
): Promise<void> {
  if (ads.shouldShowCommercialBreak()) {
    try {
      await ads.playCommercialBreak(hooks);
    } catch {
      // An ad failure must never gate core gameplay (CLAUDE.md §3 rule 9):
      // before this guard a rejection left PLAY permanently dead.
    }
  }
  startRound(PLAYER_CLICKED);
}
