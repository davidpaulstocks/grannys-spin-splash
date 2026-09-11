/**
 * Loads every launch asset up front — all 3 grannies' 3 poses, all 6 guns'
 * 8 angles + anchor.json, all 5 world backgrounds, the title lockup — so
 * neither SplashScene nor GameScene ever shows a blank/partial frame
 * while art streams in (CLAUDE.md §12 must-fix 9 territory: a first
 * impression that starts with a stutter reads as broken). Fires
 * `PokiSDK.gameLoadingFinished()` once everything is ready, then hands
 * off to SplashScene — neither downstream scene needs its own preload()
 * for launch content any more.
 */

import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { SPRITE_KEYS } from '../assets/keys';
import { GRANNY_DEFS } from '../entities/granny/granny.data';
import type { GrannyPose } from '../entities/granny/granny.types';
import { GUN_DEFS } from '../entities/gun/gun.data';
import type { GunAngle } from '../entities/gun/gun.types';
import { WORLD_DEFS } from '../entities/world/world.data';
import { preloadWorldBackground } from '../entities/world/worldBackgrounds';
import * as poki from '../poki';
import { COLOUR } from '../utils/colour';

const GRANNY_POSES: readonly GrannyPose[] = ['front', 'back', 'back_firing'];
const GUN_ANGLES: readonly GunAngle[] = [0, 45, 90, 135, 180, 225, 270, 315];

const BAR_WIDTH = 480;
const BAR_HEIGHT = 20;

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this._buildLoadingBar();

    for (const g of GRANNY_DEFS) {
      for (const pose of GRANNY_POSES) {
        this.load.image(SPRITE_KEYS.grannyPose(g.id, pose), SPRITE_KEYS.grannyPath(g.id, pose));
      }
    }
    for (const g of GUN_DEFS) {
      for (const angle of GUN_ANGLES) {
        this.load.image(SPRITE_KEYS.gunAngle(g.id, angle), SPRITE_KEYS.gunAnglePath(g.id, angle));
      }
      this.load.json(SPRITE_KEYS.gunAnchorKey(g.id), SPRITE_KEYS.gunAnchorPath(g.id));
    }
    for (const w of WORLD_DEFS) {
      preloadWorldBackground(this, w.id);
    }
    this.load.image(SPRITE_KEYS.titleWordmark, 'sprites/ui/wordmark.png');
    this.load.image(SPRITE_KEYS.titleFlourish, 'sprites/ui/title_flourish.png');
  }

  create(): void {
    poki.gameLoadingFinished();
    this.scene.start('SplashScene');
  }

  /** A minimal on-brand progress bar (CLAUDE.md §5) — the only thing visible while ~5MB of art streams in. */
  private _buildLoadingBar(): void {
    const x = (GAME_WIDTH - BAR_WIDTH) / 2;
    const y = GAME_HEIGHT / 2 - BAR_HEIGHT / 2;

    this.cameras.main.setBackgroundColor(COLOUR.cloud);
    const track = this.add.graphics();
    track.fillStyle(COLOUR.softSlate, 0.25);
    track.fillRoundedRect(x, y, BAR_WIDTH, BAR_HEIGHT, BAR_HEIGHT / 2);

    const fill = this.add.graphics();
    this.load.on('progress', (fraction: number) => {
      fill.clear();
      fill.fillStyle(COLOUR.waterBlue, 1);
      fill.fillRoundedRect(
        x,
        y,
        Math.max(BAR_HEIGHT, BAR_WIDTH * fraction),
        BAR_HEIGHT,
        BAR_HEIGHT / 2,
      );
    });
  }
}
