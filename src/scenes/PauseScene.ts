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
import { createPanel } from '../ui/Panel';
import { COLOUR } from '../utils/colour';
import { DURATION } from '../utils/tween';

const DIM_ALPHA = 0.7;

/**
 * Layout. One card in the middle of the dimmed game: the ribbon names the
 * state, RESUME is the one large action, and QUIT sits below it, smaller.
 */
const CENTRE_X = GAME_WIDTH / 2;
const CENTRE_Y = GAME_HEIGHT / 2;
const PANEL_WIDTH = 460;
const PANEL_HEIGHT = 330;
const RESUME_Y = CENTRE_Y - 44;
const QUIT_Y = CENTRE_Y + 66;
const BUTTON_MIN_WIDTH = 320;

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('PauseScene');
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLOUR.ink, DIM_ALPHA).setOrigin(0);
    createPanel(this, {
      x: CENTRE_X,
      y: CENTRE_Y,
      width: PANEL_WIDTH,
      height: PANEL_HEIGHT,
      ribbon: 'PAUSED',
    });

    createButton(this, {
      x: CENTRE_X,
      y: RESUME_Y,
      label: 'RESUME',
      variant: 'primary',
      size: 'lg',
      minWidth: BUTTON_MIN_WIDTH,
      onClick: () => this._resume(),
    });

    createButton(this, {
      x: CENTRE_X,
      y: QUIT_Y,
      label: 'QUIT',
      variant: 'secondary',
      size: 'md',
      minWidth: BUTTON_MIN_WIDTH,
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
    this.scene.start('HomeScene');
  }
}
