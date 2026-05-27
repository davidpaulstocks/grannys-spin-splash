/** Phaser game entry point. See CLAUDE.md §7.2 (target <80 lines). */

import Phaser from 'phaser';

import { BACKGROUND_COLOUR, SCALE_CONFIG } from './config';
import * as poki from './poki';

class EmptyScene extends Phaser.Scene {
  constructor() {
    super('EmptyScene');
  }

  create(): void {
    // Sprint 0 placeholder — gameplay scenes land in Sprint 1.
    // Assets-ready signal fires here for now; BootScene will own it from Sprint 1.
    poki.gameLoadingFinished();
  }
}

async function boot(): Promise<void> {
  await poki.init();

  new Phaser.Game({
    type: Phaser.AUTO,
    backgroundColor: BACKGROUND_COLOUR,
    scale: SCALE_CONFIG,
    scene: [EmptyScene],
  });
}

void boot();
