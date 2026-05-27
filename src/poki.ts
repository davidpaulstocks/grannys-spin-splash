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

/** Awaits the Poki SDK handshake. Safe to call before any other wrapper method. */
export async function init(): Promise<void> {
  if (_initialised) return;
  _initialised = true;
  const s = sdk();
  if (!s) {
    console.info('[poki] SDK not loaded — running in offline mode');
    return;
  }
  await s.init();
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
