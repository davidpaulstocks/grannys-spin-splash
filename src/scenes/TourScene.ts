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
import { standInTileFill, worldBackgroundKey } from '../entities/world/worldBackgrounds';
import { adManager } from '../systems/AdManager';
import {
  currentGig,
  frontier,
  isGigOpen,
  isJamUnlocked,
  isVenueOpen,
  MAX_STARS_PER_GIG,
  totalStars,
  venueStars,
} from '../systems/Progress';
import { saveManager } from '../systems/SaveManager';
import { startRoundAfterAdGate } from '../systems/startRound';
import { UnlockManager } from '../systems/UnlockManager';
import type { GameSceneData, JamSceneData, TourSceneData } from '../types/sceneData';
import { createIconButton } from '../ui/IconButton';
import { createJamTile } from '../ui/JamTile';
import { drawBackIcon, drawForwardIcon, drawLockIcon } from '../ui/icons';
import { createPanel } from '../ui/Panel';
import { createStatPill } from '../ui/StatPill';
import { createTourNode } from '../ui/TourNode';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { textStyle } from '../utils/typography';

/**
 * Layout. A header (back, title, stars owned) over one big card per venue.
 * The card's ribbon names the venue; inside it, the venue's art and its
 * star count sit on the left and the eight gig nodes (4 x 2) on the right,
 * the page arrows flank the card, and the page dots run along the bottom.
 */
const BACK_X = 72;
const HEADER_Y = 60;
const STARS_PILL_X = GAME_WIDTH - 104;

const CARD_Y = 392;
const CARD_WIDTH = 980;
const CARD_HEIGHT = 470;

const ART_WIDTH = 400;
const ART_HEIGHT = 225;
const ART_X = GAME_WIDTH / 2 - CARD_WIDTH / 2 + 40 + ART_WIDTH / 2;
const ART_Y = CARD_Y - 44;
const ART_FRAME_PX = 5;
const ART_FALLBACK_FILL = 0x8a8a9a;
const VENUE_STARS_Y = CARD_Y + 132;
const VENUE_STARS_PILL_WIDTH = 190;
const LOCK_ICON_SIZE = 54;

const NODES_X = GAME_WIDTH / 2 + 222;
const NODE_COLUMNS = 4;
const NODE_SPACING_X = 118;
const NODE_ROW_OFFSET_Y = 86;
const LOCKED_LINE_Y = CARD_Y + 196 - 8;
/** A venue's Jam sits under the art, on the left, clear of the node grid and the locked-venue line. */
const JAM_Y = CARD_Y + 200;

const ARROW_DIAMETER = 64;
const ARROW_OFFSET_X = CARD_WIDTH / 2 + 54;
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
  /** The venue Home had selected, if it said so; else the tour opens on the frontier. */
  private _startVenueId: string | undefined;

  constructor() {
    super('TourScene');
  }

  /** Phaser hands the scene its data on every start; remembers which venue to open on. */
  init(data?: TourSceneData): void {
    this._startVenueId = data?.venueId;
  }

  create(): void {
    this._isLeaving = false;
    const save = saveManager.load();
    // Open on the venue the player is working through, not always the first.
    this._page = Math.max(
      0,
      WORLD_DEFS.findIndex(
        (w) => w.id === (this._startVenueId ?? frontier(save, WORLD_DEFS).venueId),
      ),
    );

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLOUR.cloud).setOrigin(0);
    this.add
      .text(
        GAME_WIDTH / 2,
        HEADER_Y,
        'THE TOUR',
        textStyle('displayM', COLOUR_HEX.ink, COLOUR_HEX.cloud),
      )
      .setOrigin(0.5);
    createStatPill(this, STARS_PILL_X, HEADER_Y, 'stars', totalStars(save));
    createIconButton(this, {
      x: BACK_X,
      y: HEADER_Y,
      icon: drawBackIcon,
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

    this._pageLayer.add(
      createPanel(this, {
        x: GAME_WIDTH / 2,
        y: CARD_Y,
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        ribbon: venue.name.toUpperCase(),
      }),
    );

    this._buildArt(venue, open);
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
    this._pageLayer.add(
      createJamTile(this, {
        x: ART_X,
        y: JAM_Y,
        venueName: venue.name,
        unlocked: open && isJamUnlocked(save, venue.id),
        onPlay: () => void this._jam(venue.id),
      }),
    );

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
    } else {
      // No painting yet: a flat stand-in swatch, dimmed when locked, so the card is never an empty frame.
      const swatch = this.add.rectangle(
        ART_X,
        ART_Y,
        ART_WIDTH,
        ART_HEIGHT,
        standInTileFill(venue.id) ?? ART_FALLBACK_FILL,
      );
      if (!open) swatch.setFillStyle(ART_FALLBACK_FILL);
      this._pageLayer.add(swatch);
    }
    const frame = this.add.graphics();
    frame.lineStyle(ART_FRAME_PX, COLOUR.ink, 1);
    frame.strokeRect(ART_X - ART_WIDTH / 2, ART_Y - ART_HEIGHT / 2, ART_WIDTH, ART_HEIGHT);
    this._pageLayer.add(frame);
    if (!open) {
      const lock = this.add.graphics({ x: ART_X, y: ART_Y });
      drawLockIcon(lock, LOCK_ICON_SIZE, COLOUR.cloud);
      this._pageLayer.add(lock);
    }
  }

  /** One gig: its node on the 4 x 2 grid, tappable when it can be played. */
  private _buildNode(venue: WorldDef, gig: number, venueOpen: boolean): void {
    const save = saveManager.load();
    const col = gig % NODE_COLUMNS;
    const row = Math.floor(gig / NODE_COLUMNS);
    const playable = venueOpen && isGigOpen(save, venue.id, gig);
    this._pageLayer.add(
      createTourNode(this, {
        x: NODES_X + (col - (NODE_COLUMNS - 1) / 2) * NODE_SPACING_X,
        y: CARD_Y + (row === 0 ? -NODE_ROW_OFFSET_Y : NODE_ROW_OFFSET_Y),
        gig,
        playable,
        isNext: playable && gig === currentGig(save, venue.id),
        bestStars: venueStars(save, venue.id)[gig] ?? 0,
        onPlay: () => void this._play(venue.id, gig),
      }),
    );
  }

  private _buildArrow(direction: -1 | 1): void {
    createIconButton(this, {
      x: GAME_WIDTH / 2 + direction * ARROW_OFFSET_X,
      y: CARD_Y,
      icon: direction === -1 ? drawBackIcon : drawForwardIcon,
      diameter: ARROW_DIAMETER,
      onClick: () => {
        this._page = (this._page + direction + WORLD_DEFS.length) % WORLD_DEFS.length;
        this._showPage();
      },
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
    await startRoundAfterAdGate(adManager, AD_MUTE_HOOKS, (click) =>
      this.scene.start('GameScene', { ...next, ...click }),
    );
  }

  /** Starts a venue's Jam through the same between-runs ad gate as every other way into play. */
  private async _jam(venueId: string): Promise<void> {
    if (this._isLeaving) return;
    this._isLeaving = true;
    this._unlocks.selectWorld(venueId);
    const next: JamSceneData = {
      worldId: venueId,
      grannyId: this._unlocks.getSelectedGrannyId(),
    };
    await startRoundAfterAdGate(adManager, AD_MUTE_HOOKS, (click) =>
      this.scene.start('JamScene', { ...next, ...click }),
    );
  }

  private _leaveTo(scene: 'HomeScene'): void {
    if (this._isLeaving) return;
    this._isLeaving = true;
    this.scene.start(scene);
  }
}
