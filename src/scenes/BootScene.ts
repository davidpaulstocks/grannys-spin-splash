/**
 * Loads every launch asset up front — all 3 grannies' 3 poses, all 6 guns'
 * 8 angles + anchor.json, all 5 world backgrounds, the title lockup — so
 * no later scene ever shows a blank/partial frame
 * while art streams in (CLAUDE.md §12 must-fix 9 territory: a first
 * impression that starts with a stutter reads as broken). Fires
 * `PokiSDK.gameLoadingFinished()` once everything is ready, then hands
 * off — to the first gig on a first-ever launch, otherwise to Home. No
 * downstream scene needs its own preload() for launch content.
 */

import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { SPRITE_KEYS } from '../assets/keys';
import { audioOrchestra } from '../audio/AudioOrchestra';
import { GRANNY_DEFS } from '../entities/granny/granny.data';
import type { GrannyPose } from '../entities/granny/granny.types';
import { INSTRUMENT_ART_READY } from '../entities/spinner/instrumentArt.data';
import { VISITOR_ART_READY } from '../entities/visitor/visitorArt.data';
import { GUN_DEFS } from '../entities/gun/gun.data';
import type { GunAngle } from '../entities/gun/gun.types';
import { WORLD_DEFS } from '../entities/world/world.data';
import { preloadWorldBackground } from '../entities/world/worldBackgrounds';
import * as poki from '../poki';
import { saveManager } from '../systems/SaveManager';
import type { GameSceneData } from '../types/sceneData';
import { usesTouchControls } from '../ui/touchControls';
import { COLOUR } from '../utils/colour';

const GRANNY_POSES: readonly GrannyPose[] = ['front', 'back', 'back_firing'];
const GUN_ANGLES: readonly GunAngle[] = [0, 45, 90, 135, 180, 225, 270, 315];

const BAR_WIDTH = 480;
const BAR_HEIGHT = 20;

/**
 * A review link: `?venue=kitchen&gig=2` opens that gig directly, whatever the
 * save says is unlocked. It exists so a venue's band can be heard without
 * first earning the stars to reach it (2026-11-25: the Kitchen's jazz combo
 * sits behind 30 stars). It grants nothing and saves nothing unusual — the
 * gig is banked like any other — but it does bypass the tour, so it is listed
 * in BACKLOG.md as something to remove before submission.
 */
export function reviewLink(search: string): { worldId: string; gig: number } | null {
  const params = new URLSearchParams(search);
  const venue = WORLD_DEFS.find((w) => w.id === params.get('venue'));
  if (!venue) return null;
  const gig = Number.parseInt(params.get('gig') ?? '1', 10);
  return { worldId: venue.id, gig: Number.isFinite(gig) ? Math.max(0, gig - 1) : 0 };
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload(): void {
    this._buildLoadingBar();
    // The orchestra's instruments decode in the background and never hold
    // the loading bar — play starts as soon as the art is in.
    audioOrchestra.preload();

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
    // Painted instruments for the spinners — only the ones that exist, so an
    // icon not yet painted costs no 404 and its spinner keeps the drawn badge.
    for (const icon of INSTRUMENT_ART_READY) {
      this.load.image(SPRITE_KEYS.instrumentIcon(icon), SPRITE_KEYS.instrumentIconPath(icon));
    }
    // Painted visitors likewise: only the ones that exist; the rest are drawn.
    for (const id of VISITOR_ART_READY) {
      this.load.image(SPRITE_KEYS.visitor(id), SPRITE_KEYS.visitorPath(id));
    }
    this.load.image(SPRITE_KEYS.titleWordmark, 'sprites/ui/wordmark.webp');
    this.load.image(SPRITE_KEYS.titleFlourish, 'sprites/ui/title_flourish.webp');

    // Touch-only art — skipped on desktop, where the pause button is never
    // built, so mouse/keyboard players don't download it. Gated on the same
    // predicate that decides whether the button exists at all, so the two
    // can't disagree and leave a touch device with a missing texture.
    if (usesTouchControls(this.sys.game)) {
      this.load.image(SPRITE_KEYS.pauseButton, SPRITE_KEYS.pauseButtonPath);
    }
  }

  create(): void {
    poki.gameLoadingFinished();
    // A first-ever launch goes straight into the first gig: Poki measures
    // how many visitors reach their first input, and a menu before play costs
    // some of them. Everyone else lands on Home.
    const save = saveManager.load();
    const review = reviewLink(window.location.search);
    if (review) {
      this.scene.start('GameScene', {
        grannyId: save.selectedGrannyId,
        gunId: save.selectedGunId,
        ...review,
      } satisfies GameSceneData);
      return;
    }
    if (save.hasPlayed) {
      this.scene.start('HomeScene');
      return;
    }
    const firstGig: GameSceneData = {
      grannyId: save.selectedGrannyId,
      gunId: save.selectedGunId,
      worldId: save.selectedWorldId,
      gig: 0,
    };
    this.scene.start('GameScene', firstGig);
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
