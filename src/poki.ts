/**
 * Wraps every PokiSDK.* call so the rest of the codebase never touches the
 * global directly (CLAUDE.md §7.3 rule 6). If the SDK fails to load — ad
 * blocker, offline preview, dev tooling — each call silently no-ops so
 * gameplay is never gated (CLAUDE.md §3 rule 9). The script tag itself
 * lives in index.html, since Poki rejects games that don't include it.
 */

export type RewardSize = 'small' | 'medium' | 'large';

interface PokiSDKv2 {
  init: () => Promise<void>;
  gameLoadingFinished: () => void;
  gameplayStart: () => void;
  gameplayStop: () => void;
  commercialBreak: (beforeAd?: () => void) => Promise<void>;
  rewardedBreak: (opts?: { size?: RewardSize }) => Promise<boolean>;
  movePill: (x: number, y: number) => void;
}

declare global {
  interface Window {
    PokiSDK?: PokiSDKv2;
  }
}

function sdk(): PokiSDKv2 | null {
  return typeof window !== 'undefined' && window.PokiSDK ? window.PokiSDK : null;
}

let _initialised = false;

/** How long to wait for the SDK handshake before booting the game without it. */
const INIT_TIMEOUT_MS = 3000;

/**
 * Awaits the Poki SDK handshake. Safe to call before any other wrapper
 * method, and **never rejects or hangs**.
 *
 * CLAUDE.md §3 rule 9 is "works with ad blockers — core gameplay never
 * gated", and this is the one place that rule can be broken absolutely: an
 * ad blocker that lets the SDK script load but blocks its backend calls
 * makes `s.init()` reject, which used to propagate out of `main.ts`'s
 * `boot()` before `new Phaser.Game()` ran — a permanently blank dark-blue
 * page with no canvas, no loading bar, and nothing to retry. Poki's own
 * reviewers test with an ad blocker on (found by spec audit, 2026-09-12).
 *
 * Both failure modes are handled: a rejection is swallowed, and a handshake
 * that never settles is raced against a timeout so it cannot stall boot
 * either. Gameplay then runs exactly as it does with no SDK present.
 */
export async function init(): Promise<void> {
  if (_initialised) return;
  _initialised = true;
  const s = sdk();
  if (!s) {
    console.info('[poki] SDK not loaded — running in offline mode');
    return;
  }
  try {
    await Promise.race([
      s.init(),
      new Promise<void>((resolve) => setTimeout(resolve, INIT_TIMEOUT_MS)),
    ]);
  } catch {
    console.info('[poki] init failed (ad blocker?) — continuing without the SDK');
  }
}

/** Fires once assets are ready and the game is about to become interactive. */
export function gameLoadingFinished(): void {
  sdk()?.gameLoadingFinished();
}

/** MUST fire on first player input, never on scene load (CLAUDE.md §3, §11.2). */
export function gameplayStart(): void {
  sdk()?.gameplayStart();
}

/** Fires on game over, pause, or menu navigation. */
export function gameplayStop(): void {
  sdk()?.gameplayStop();
}

/** Interstitial between runs after intent (e.g. "Play Again" tap). beforeAd should mute audio. */
export async function commercialBreak(beforeAd?: () => void): Promise<void> {
  const s = sdk();
  if (!s) return;
  await s.commercialBreak(beforeAd);
}

/** Player-initiated rewarded ad. Resolves true if the player watched to completion. */
export async function rewardedBreak(size: RewardSize = 'medium'): Promise<boolean> {
  const s = sdk();
  if (!s) return false;
  return s.rewardedBreak({ size });
}

/** Moves Poki's mobile branding pill so it doesn't overlap our UI (CLAUDE.md §12 must-fix 8). */
export function movePill(x: number, y: number): void {
  sdk()?.movePill(x, y);
}
