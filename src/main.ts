/** Phaser game entry point. See CLAUDE.md §7.2 (target <80 lines). */

import Phaser from 'phaser';

import { BACKGROUND_COLOUR, SCALE_CONFIG } from './config';
import * as poki from './poki';
import { BootScene } from './scenes/BootScene';
import { GameOverScene } from './scenes/GameOverScene';
import { GameScene } from './scenes/GameScene';
import { HUDScene } from './scenes/HUDScene';
import { PauseScene } from './scenes/PauseScene';
import { SplashScene } from './scenes/SplashScene';

declare global {
  interface Window {
    /** Dev-only escape hatch for manual frame-stepping in headless/hidden-tab testing. Stripped from prod builds. */
    __gameForDebug?: Phaser.Game;
  }
}

/**
 * Waits for Fredoka to actually be usable before Phaser draws any text.
 * Canvas text (unlike DOM text) is rasterised once at creation and never
 * re-renders if the font finishes loading late, so this has to be awaited
 * up front, not left to `font-display` alone.
 */
async function loadFredoka(): Promise<void> {
  try {
    await document.fonts.load('700 32px Fredoka');
    await document.fonts.ready;
  } catch {
    // Font failed to load — Phaser text falls back to a system sans-serif. Not fatal.
  }
}

async function boot(): Promise<void> {
  // Neither the SDK handshake nor the font may keep the canvas off the page:
  // CLAUDE.md §3 rule 9's "core gameplay never gated" means an ad blocker (or
  // a font that fails to decode) degrades the experience, never blanks it.
  // poki.init() already swallows its own failures; this is belt-and-braces
  // for anything else in the pre-boot path.
  await Promise.allSettled([poki.init(), loadFredoka()]);

  // Poki's mobile branding pill defaults to a corner that overlaps our own
  // UI — a no-op on desktop, but CLAUDE.md §12 must-fix 8 requires this
  // call regardless of platform.
  poki.movePill(0, 24);

  // BootScene boots first — preloads every launch sprite once so neither
  // SplashScene nor GameScene ever shows a blank/partial frame waiting on
  // art (splash → game → game over → splash after that, Sprint 5 exit
  // criteria). HUDScene is registered but not started here — GameScene
  // launches it itself once it's running.
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    backgroundColor: BACKGROUND_COLOUR,
    scale: SCALE_CONFIG,
    // 4 concurrent touch pointers. Phaser's default of 1 can't see a second
    // simultaneous finger at all, which the two-finger pause gesture
    // (CLAUDE.md §6.3, InputManager.ts) needs; 2 was still too few in
    // practice (spec audit, 2026-09-12) — a thumb resting on the letterbox
    // bar beside the canvas ate a slot, so "hold move button + tap to fire"
    // silently dropped the fire tap. Spare Pointer objects are cheap.
    input: { activePointers: 4 },
    scene: [BootScene, SplashScene, GameScene, HUDScene, GameOverScene, PauseScene],
  });

  if (import.meta.env.DEV) window.__gameForDebug = game;
}

// A throw anywhere in boot() must still surface rather than vanish into an
// unhandled rejection — but it must never be the reason nothing renders.
void boot().catch((err: unknown) => console.error('[boot] failed', err));
