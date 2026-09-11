/** Phaser game entry point. See CLAUDE.md §7.2 (target <80 lines). */

import Phaser from 'phaser';

import { BACKGROUND_COLOUR, SCALE_CONFIG } from './config';
import * as poki from './poki';
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
  await Promise.all([poki.init(), loadFredoka()]);

  // Poki's mobile branding pill defaults to a corner that overlaps our own
  // UI — a no-op on desktop, but CLAUDE.md §12 must-fix 8 requires this
  // call regardless of platform.
  poki.movePill(0, 24);

  // SplashScene boots first (splash → game → game over → splash, Sprint 5
  // exit criteria) — there's nothing to preload yet (procedural graphics +
  // a placeholder Granny), so BootScene stays a stub until Sprint 3's
  // sprite/audio assets need a real loading screen. HUDScene is registered
  // but not started here — GameScene launches it itself once it's running.
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    backgroundColor: BACKGROUND_COLOUR,
    scale: SCALE_CONFIG,
    // 2 concurrent touch pointers — Phaser's default of 1 can't see a
    // second simultaneous finger, which the two-finger pause gesture
    // (CLAUDE.md §6.3, InputManager.ts) needs to detect at all.
    input: { activePointers: 2 },
    scene: [SplashScene, GameScene, HUDScene, GameOverScene, PauseScene],
  });

  if (import.meta.env.DEV) window.__gameForDebug = game;
}

void boot();
