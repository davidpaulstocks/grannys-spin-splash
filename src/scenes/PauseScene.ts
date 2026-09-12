/**
 * Overlay on pause — Resume, Quit (CLAUDE.md §7.2, story 6.6). Launched
 * on top of a genuinely-paused GameScene (`this.scene.pause()`, not a
 * manual flag — see GameScene.ts's `_pauseGame()`). No "Settings" entry:
 * there's a volume toggle's worth of settings and nothing else yet —
 * building a whole menu item for one on/off switch would be exactly the
 * kind of UI sprawl CLAUDE.md §6.1 warns against. Add it back once
 * there's more than that to configure.
 */

import Phaser from 'phaser';

import { audioBus } from '../audio/AudioBus';
import { audioOrchestra } from '../audio/AudioOrchestra';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import * as poki from '../poki';
import { createButton } from '../ui/Button';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { DURATION } from '../utils/tween';
import { textStyle } from '../utils/typography';

const DIM_ALPHA = 0.7;

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLOUR.ink, DIM_ALPHA).setOrigin(0);
    this.add
      .text(
        GAME_WIDTH / 2,
        GAME_HEIGHT * 0.38,
        'PAUSED',
        textStyle('displayL', COLOUR_HEX.cloud, COLOUR_HEX.ink),
      )
      .setOrigin(0.5);

    createButton(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT * 0.52,
      label: 'RESUME',
      variant: 'primary',
      minWidth: 260,
      onClick: () => this._resume(),
    });

    createButton(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT * 0.7,
      label: 'QUIT',
      variant: 'secondary',
      minWidth: 260,
      onClick: () => this._quit(),
    });
  }

  private _resume(): void {
    this.scene.resume('GameScene');
    audioBus.fadeIn(DURATION.stateChange);
    audioOrchestra.start();
    poki.gameplayStart();
    this.scene.stop();
  }

  private _quit(): void {
    this.scene.stop('GameScene');
    this.scene.stop('HUDScene');
    this.scene.start('SplashScene');
  }
}
