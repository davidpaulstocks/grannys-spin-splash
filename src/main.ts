/** Phaser game entry point. See CLAUDE.md §7.2 (target <80 lines). */

import Phaser from 'phaser';

import { BACKGROUND_COLOUR, SCALE_CONFIG } from './config';

class EmptyScene extends Phaser.Scene {
  constructor() {
    super('EmptyScene');
  }

  create(): void {
    // Sprint 0 placeholder — gameplay scenes land in Sprint 1.
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  backgroundColor: BACKGROUND_COLOUR,
  scale: SCALE_CONFIG,
  scene: [EmptyScene],
});
