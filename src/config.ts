/** Game-wide constants: logical canvas size + scale config. See CLAUDE.md §3 rule 1, §7.2. */

import Phaser from 'phaser';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const SCALE_CONFIG: Phaser.Types.Core.ScaleConfig = {
  mode: Phaser.Scale.FIT,
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: 'game',
};

export const BACKGROUND_COLOUR = '#F5F2E8';
