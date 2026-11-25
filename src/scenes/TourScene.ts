/**
 * The tour — docs/ENGAGEMENT_DESIGN.md §5. One venue at a time: its art, how
 * many stars it holds, and its eight gigs as tappable nodes with their best
 * rating. This is where a player goes to replay a gig for a better rating,
 * and where a locked venue says exactly how many stars it still needs.
 */

import Phaser from 'phaser';

import { AD_MUTE_HOOKS } from '../audio/AudioBus';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { GIGS_PER_VENUE } from '../entities/world/gigs.data';
import { WORLD_DEFS } from '../entities/world/world.data';
import type { WorldDef } from '../entities/world/world.types';
import { worldBackgroundKey } from '../entities/world/worldBackgrounds';
import { adManager } from '../systems/AdManager';
import {
  currentGig,
  frontier,
  isGigOpen,
  isVenueOpen,
  MAX_STARS_PER_GIG,
  totalStars,
  venueStars,
} from '../systems/Progress';
import { saveManager } from '../systems/SaveManager';
import { startRoundAfterAdGate } from '../systems/startRound';
import { UnlockManager } from '../systems/UnlockManager';
import type { GameSceneData } from '../types/sceneData';
import { createButton } from '../ui/Button';
import { drawLockIcon, drawStarIcon } from '../ui/icons';
import { createStatPill } from '../ui/StatPill';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';

const BACK_X = 130;
const BACK_Y = 56;
const BACK_MIN_WIDTH = 150;
const TITLE_Y = 56;
const STARS_PILL_X = GAME_WIDTH - 104;

const CARD_Y = 388;
const CARD_WIDTH = 980;
const CARD_HEIGHT = 500;
const CARD_RADIUS = 34;

const ART_WIDTH = 400;
const ART_HEIGHT = 225;
const ART_X = GAME_WIDTH / 2 - CARD_WIDTH / 2 + 40 + ART_WIDTH / 2;
const ART_Y = CARD_Y - 60;
const VENUE_NAME_Y = CARD_Y + 96;
const VENUE_STARS_Y = CARD_Y + 152;
const VENUE_STARS_PILL_WIDTH = 190;

const NODES_X = GAME_WIDTH / 2 + 222;
const NODES_Y = CARD_Y - 26;
const NODE_COLUMNS = 4;
const NODE_SPACING_X = 118;
const NODE_SPACING_Y = 168;
const NODE_RADIUS = 42;
const NODE_STAR_RADIUS = 10;
const NODE_STAR_SPACING = 26;
const NODE_STARS_OFFSET_Y = NODE_RADIUS + 26;
const NODE_LOCKED = 0xd8d4c6;
const LOCKED_LINE_Y = CARD_Y + 196;

const ARROW_OFFSET_X = CARD_WIDTH / 2 + 46;
const ARROW_RADIUS = 34;
const DOTS_Y = GAME_HEIGHT - 44;
const DOT_SPACING = 30;
const DOT_RADIUS = 8;

export class TourScene extends Phaser.Scene {
  private _unlocks = new UnlockManager(saveManager);
  private _page = 0;
  private _pageLayer!: Phaser.GameObjects.Container;
  private _dots: Phaser.GameObjects.Arc[] = [];
  /** Phaser reuses scene instances, so this is reset in create() rather than at construction. */
  private _isLeaving = false;

  constructor() {
    super('TourScene');
  }

  create(): void {
    this._isLeaving = false;
    const save = saveManager.load();
    // Open on the venue the player is working through, not always the first.
    this._page = Math.max(
      0,
      WORLD_DEFS.findIndex((w) => w.id === frontier(save, WORLD_DEFS).venueId),
    );

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLOUR.cloud).setOrigin(0);
    this.add
      .text(
        GAME_WIDTH / 2,
        TITLE_Y,
        'THE TOUR',
        textStyle('displayM', COLOUR_HEX.ink, COLOUR_HEX.cloud),
      )
      .setOrigin(0.5);
    createStatPill(this, STARS_PILL_X, TITLE_Y, 'stars', totalStars(save));
    createButton(this, {
      x: BACK_X,
      y: BACK_Y,
      label: 'BACK',
      variant: 'secondary',
      minWidth: BACK_MIN_WIDTH,
      onClick: () => this._leaveTo('HomeScene'),
    });

    this._pageLayer = this.add.container(0, 0);
    this._buildArrow(-1);
    this._buildArrow(1);
    this._dots = WORLD_DEFS.map((_, i) =>
      this.add
        .circle(
          GAME_WIDTH / 2 + (i - (WORLD_DEFS.length - 1) / 2) * DOT_SPACING,
          DOTS_Y,
          DOT_RADIUS,
          COLOUR.softSlate,
        )
        .setStrokeStyle(2, COLOUR.ink),
    );
    this._showPage();
  }

  /** Rebuilds the venue card for the current page. Cheap: a few dozen objects, on a tap. */
  private _showPage(): void {
    this._pageLayer.removeAll(true);
    this._dots.forEach((dot, i) =>
      dot.setFillStyle(i === this._page ? COLOUR.grannyPink : COLOUR.cloud),
    );
    const venue = WORLD_DEFS[this._page];
    if (!venue) return;
    const save = saveManager.load();
    const open = isVenueOpen(save, venue);

    const card = this.add.graphics();
    card.fillStyle(0xffffff, 0.75);
    card.fillRoundedRect(
      GAME_WIDTH / 2 - CARD_WIDTH / 2,
      CARD_Y - CARD_HEIGHT / 2,
      CARD_WIDTH,
      CARD_HEIGHT,
      CARD_RADIUS,
    );
    card.lineStyle(5, COLOUR.ink, 1);
    card.strokeRoundedRect(
      GAME_WIDTH / 2 - CARD_WIDTH / 2,
      CARD_Y - CARD_HEIGHT / 2,
      CARD_WIDTH,
      CARD_HEIGHT,
      CARD_RADIUS,
    );
    this._pageLayer.add(card);

    this._buildArt(venue, open);
    this._pageLayer.add(
      this.add
        .text(
          ART_X,
          VENUE_NAME_Y,
          venue.name.toUpperCase(),
          textStyle('displayM', COLOUR_HEX.ink, COLOUR_HEX.cloud),
        )
        .setOrigin(0.5),
    );
    const earned = venueStars(save, venue.id).reduce((sum, stars) => sum + stars, 0);
    this._pageLayer.add(
      createStatPill(
        this,
        ART_X,
        VENUE_STARS_Y,
        'stars',
        `${earned} / ${GIGS_PER_VENUE * MAX_STARS_PER_GIG}`,
        VENUE_STARS_PILL_WIDTH,
      ).container,
    );

    for (let gig = 0; gig < GIGS_PER_VENUE; gig++) this._buildNode(venue, gig, open);

    if (!open) {
      const needed = venue.starsToOpen - totalStars(save);
      this._pageLayer.add(
        this.add
          .text(
            NODES_X,
            LOCKED_LINE_Y,
            `${needed} more ${needed === 1 ? 'star' : 'stars'} to open`,
            textStyle('bodyL', COLOUR_HEX.softSlate, COLOUR_HEX.cloud),
          )
          .setOrigin(0.5),
      );
    }
  }

  private _buildArt(venue: WorldDef, open: boolean): void {
    const key = worldBackgroundKey(venue.id);
    if (key && this.textures.exists(key)) {
      const art = this.add.image(ART_X, ART_Y, key).setDisplaySize(ART_WIDTH, ART_HEIGHT);
      if (!open) art.setTint(0x8a8a9a);
      this._pageLayer.add(art);
    }
    const frame = this.add.graphics();
    frame.lineStyle(5, COLOUR.ink, 1);
    frame.strokeRect(ART_X - ART_WIDTH / 2, ART_Y - ART_HEIGHT / 2, ART_WIDTH, ART_HEIGHT);
    this._pageLayer.add(frame);
    if (!open) {
      const lock = this.add.graphics({ x: ART_X, y: ART_Y });
      drawLockIcon(lock, 54, COLOUR.cloud);
      this._pageLayer.add(lock);
    }
  }

  /** One gig: a numbered disc, its best rating beneath, tappable when it can be played. */
  private _buildNode(venue: WorldDef, gig: number, venueOpen: boolean): void {
    const save = saveManager.load();
    const col = gig % NODE_COLUMNS;
    const row = Math.floor(gig / NODE_COLUMNS);
    const x = NODES_X + (col - (NODE_COLUMNS - 1) / 2) * NODE_SPACING_X;
    const y = NODES_Y + (row - 0.5) * NODE_SPACING_Y;
    const playable = venueOpen && isGigOpen(save, venue.id, gig);
    const isNext = playable && gig === currentGig(save, venue.id);
    const best = venueStars(save, venue.id)[gig] ?? 0;

    const disc = this.add
      .circle(x, y, NODE_RADIUS, playable ? COLOUR.mintGreen : NODE_LOCKED)
      .setStrokeStyle(5, COLOUR.ink);
    this._pageLayer.add(disc);

    if (playable) {
      this._pageLayer.add(
        this.add
          .text(x, y, String(gig + 1), textStyle('displayM', COLOUR_HEX.ink, COLOUR_HEX.cloud))
          .setOrigin(0.5),
      );
      disc.setInteractive({ useHandCursor: true });
      disc.on('pointerup', () => void this._play(venue.id, gig));
    } else {
      const lock = this.add.graphics({ x, y });
      drawLockIcon(lock, 26, COLOUR.softSlate);
      this._pageLayer.add(lock);
    }
    if (isNext) {
      // The one to play next breathes, so the eye lands on it first.
      this.tweens.add({
        targets: disc,
        scale: 1.1,
        duration: 620,
        ease: EASE.standardOut,
        yoyo: true,
        repeat: -1,
      });
    }

    for (let i = 0; i < MAX_STARS_PER_GIG; i++) {
      const star = this.add.graphics({
        x: x + (i - 1) * NODE_STAR_SPACING,
        y: y + NODE_STARS_OFFSET_Y,
      });
      drawStarIcon(star, NODE_STAR_RADIUS + 3, COLOUR.ink);
      drawStarIcon(star, NODE_STAR_RADIUS, i < best ? COLOUR.sunnyGold : NODE_LOCKED);
      this._pageLayer.add(star);
    }
  }

  private _buildArrow(direction: -1 | 1): void {
    const x = GAME_WIDTH / 2 + direction * ARROW_OFFSET_X;
    const disc = this.add
      .circle(x, CARD_Y, ARROW_RADIUS, COLOUR.cloud)
      .setStrokeStyle(5, COLOUR.ink)
      .setInteractive({ useHandCursor: true });
    const tip = this.add.graphics({ x, y: CARD_Y });
    tip.fillStyle(COLOUR.ink, 1);
    tip.fillTriangle(direction * 12, 0, -direction * 8, -14, -direction * 8, 14);
    disc.on('pointerup', () => {
      this._page = (this._page + direction + WORLD_DEFS.length) % WORLD_DEFS.length;
      this._showPage();
    });
  }

  /** Starts a gig through the same between-runs ad gate as every other way into play. */
  private async _play(venueId: string, gig: number): Promise<void> {
    if (this._isLeaving) return; // double-tap guard while the ad promise is pending
    this._isLeaving = true;
    this._unlocks.selectWorld(venueId);
    const next: GameSceneData = {
      grannyId: this._unlocks.getSelectedGrannyId(),
      gunId: this._unlocks.getSelectedGunId(),
      worldId: venueId,
      gig,
    };
    await startRoundAfterAdGate(adManager, AD_MUTE_HOOKS, () =>
      this.scene.start('GameScene', next),
    );
  }

  private _leaveTo(scene: 'HomeScene'): void {
    if (this._isLeaving) return;
    this._isLeaving = true;
    this.scene.start(scene);
  }
}
