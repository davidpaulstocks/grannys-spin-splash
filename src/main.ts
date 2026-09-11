/** Phaser game entry point. See CLAUDE.md §7.2 (target <80 lines). */

import Phaser from 'phaser';

import { BACKGROUND_COLOUR, SCALE_CONFIG } from './config';
import * as poki from './poki';
import { GameScene } from './scenes/GameScene';

declare global {
  interface Window {
    /** Dev-only escape hatch for manual frame-stepping in headless/hidden-tab testing. Stripped from prod builds. */
    __gameForDebug?: Phaser.Game;
  }
}

async function boot(): Promise<void> {
  await poki.init();

  // Sprint 1: GameScene boots directly — there's nothing to preload yet
  // (procedural graphics + a placeholder Granny), so BootScene stays a
  // stub until Sprint 3's sprite/audio assets need a real loading screen.
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    backgroundColor: BACKGROUND_COLOUR,
    scale: SCALE_CONFIG,
    scene: [GameScene],
  });

  if (import.meta.env.DEV) window.__gameForDebug = game;
}

void boot();
