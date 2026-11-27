/**
 * Home — docs/ENGAGEMENT_DESIGN.md §5. One job: get the player into the next
 * gig. The current venue fills the screen, Granny stands in it, and a single
 * card says what is next and carries the one big button.
 *
 * Everything else a player might want — replaying an old gig, buying a gun —
 * is one small button away and never on the path to PLAY.
 */

import Phaser from 'phaser';

import { AD_MUTE_HOOKS } from '../audio/AudioBus';
import { GAME_WIDTH } from '../config';
import { WORLD_DEFS } from '../entities/world/world.data';
import { drawWorldBackground } from '../entities/world/worldBackgrounds';
import { adManager } from '../systems/AdManager';
import { frontier, isJamUnlocked, playGig, recommendedGig, totalStars } from '../systems/Progress';
import { nextReward, shopHasNews } from '../systems/Rewards';
import { saveManager } from '../systems/SaveManager';
import { startRoundAfterAdGate } from '../systems/startRound';
import { UnlockManager } from '../systems/UnlockManager';
import type { GameSceneData, JamSceneData, TourSceneData } from '../types/sceneData';
import { createButton } from '../ui/Button';
import { createDailyGiftButton } from '../ui/DailyGiftButton';
import { createGigCard } from '../ui/GigCard';
import { createIconButton } from '../ui/IconButton';
import { drawTourIcon } from '../ui/icons';
import { createSavingForStrip } from '../ui/SavingForStrip';
import { createStatPill, type StatPill } from '../ui/StatPill';
import { createVenueStrip, type VenueStrip } from '../ui/VenueStrip';
import { buildGranny, buildTitle } from './home/homeDecor';
import { COLOUR } from '../utils/colour';

/**
 * Layout. Along the top: what the player owns (coins, stars), the wordmark,
 * SHOP, and when there is one the daily gift. In the middle: Granny on the
 * left, ALL GIGS beneath her, and on the right the next-gig card with the one
 * big PLAY button under it. Along the bottom: the five venue tiles.
 */
const COINS_PILL_X = 104;
const STARS_PILL_X = 264;
const PILLS_Y = 50;
const SHOP_X = 440;
const SHOP_Y = 52;
/** The gold "something to buy" dot on the SHOP button's top-right corner. */
const SHOP_DOT_RADIUS = 10;
const SHOP_DOT_INSET = 4;
const SHOP_DOT_OUTLINE = 3;
const SHOP_DOT_DEPTH = 10;

const GIFT_X = GAME_WIDTH - 176;
const GIFT_Y = 54;

const ALL_GIGS_X = 104;
const ALL_GIGS_Y = 480;
const ALL_GIGS_DIAMETER = 64;

const CARD_X = 890;
const CARD_Y = 302;
const PLAY_Y = 524;
const PLAY_MIN_WIDTH = 420;
/** JAM: a small secondary button to the right of PLAY, only once the selected venue's Jam is open. */
const JAM_X = 1190;
const JAM_MIN_WIDTH = 110;

/** "Saving for" strip: under the pills, above ALL GIGS, clear of Granny's left edge (about 270). */
const SAVING_X = 136;
const SAVING_Y = 194;

const STRIP_Y = 652;

export class HomeScene extends Phaser.Scene {
  private _unlocks = new UnlockManager(saveManager);
  /** Phaser reuses scene instances, so this is reset in create() rather than at construction. */
  private _isLeaving = false;
  private _coinsPill!: StatPill;
  private _venueId = '';
  /** The gig PLAY will start: the recommended one until the player taps another. */
  private _gig = 0;
  private _backdrop: Phaser.GameObjects.GameObject[] = [];
  private _card: Phaser.GameObjects.GameObject[] = [];
  private _strip!: VenueStrip;
  private _jamButton: Phaser.GameObjects.GameObject | null = null;

  constructor() {
    super('HomeScene');
  }

  create(): void {
    this._isLeaving = false;
    this._backdrop = [];
    this._card = [];
    this._jamButton = null;
    const save = saveManager.load();
    // Opens on the venue the player is working through; tapping a tile changes it.
    this._venueId = frontier(save, WORLD_DEFS).venueId;
    if (!WORLD_DEFS.some((w) => w.id === this._venueId)) return;
    this._gig = playGig(save, this._venueId);

    this._setBackdrop();
    buildTitle(this);
    this._coinsPill = createStatPill(this, COINS_PILL_X, PILLS_Y, 'coins', save.vault);
    createStatPill(this, STARS_PILL_X, PILLS_Y, 'stars', totalStars(save));
    buildGranny(this, this._unlocks.getSelectedGrannyId());
    this._setCard();
    createDailyGiftButton(this, {
      x: GIFT_X,
      y: GIFT_Y,
      onClaimed: (vault) => this._coinsPill.setValue(vault),
    });
    createSavingForStrip(this, {
      x: SAVING_X,
      y: SAVING_Y,
      reward: nextReward(save),
      onTap: () => this._goTo('ShopScene'),
    });

    const shopButton = createButton(this, {
      x: SHOP_X,
      y: SHOP_Y,
      label: 'SHOP',
      variant: 'secondary',
      size: 'sm',
      onClick: () => this._goTo('ShopScene'),
    });
    if (shopHasNews(save)) {
      // A gold dot on the button's corner: something in there can be bought now.
      const edge = shopButton.getBounds();
      this.add
        .circle(
          edge.right - SHOP_DOT_INSET,
          edge.top + SHOP_DOT_INSET,
          SHOP_DOT_RADIUS,
          COLOUR.sunnyGold,
        )
        .setStrokeStyle(SHOP_DOT_OUTLINE, COLOUR.ink)
        .setDepth(SHOP_DOT_DEPTH);
    }
    createButton(this, {
      x: CARD_X,
      y: PLAY_Y,
      label: 'PLAY',
      variant: 'primary',
      size: 'lg',
      minWidth: PLAY_MIN_WIDTH,
      onClick: () => void this._play(),
    });
    createIconButton(this, {
      x: ALL_GIGS_X,
      y: ALL_GIGS_Y,
      icon: drawTourIcon,
      diameter: ALL_GIGS_DIAMETER,
      caption: 'ALL GIGS',
      onClick: () => this._goTo('TourScene'),
    });
    this._setJam();
    this._strip = createVenueStrip(this, {
      y: STRIP_Y,
      save,
      selectedId: this._venueId,
      onSelect: (venueId) => this._select(venueId),
    });
  }

  /** Switches the screen to another open venue: backdrop, card and the tile's ring. */
  private _select(venueId: string): void {
    if (venueId === this._venueId || this._isLeaving) return;
    this._venueId = venueId;
    this._gig = playGig(saveManager.load(), venueId);
    this._strip.setSelected(venueId);
    this._setBackdrop();
    this._setCard();
    this._setJam();
  }

  /** Shows JAM beside PLAY when the selected venue's Jam is open, and nothing at all when it is not. */
  private _setJam(): void {
    this._jamButton?.destroy();
    this._jamButton = null;
    if (!isJamUnlocked(saveManager.load(), this._venueId)) return;
    this._jamButton = createButton(this, {
      x: JAM_X,
      y: PLAY_Y,
      label: 'JAM',
      variant: 'secondary',
      size: 'sm',
      minWidth: JAM_MIN_WIDTH,
      onClick: () => void this._jam(),
    });
  }

  /** Paints the selected venue's backdrop, removing whatever the last one drew. */
  private _setBackdrop(): void {
    this._backdrop.forEach((o) => o.destroy());
    const before = new Set(this.children.list);
    drawWorldBackground(this, this._venueId);
    this._backdrop = this.children.list.filter((o) => !before.has(o));
  }

  /** Builds the gig card for the selected venue and gig. */
  private _setCard(): void {
    this._card.forEach((o) => o.destroy());
    const venue = WORLD_DEFS.find((w) => w.id === this._venueId);
    if (!venue) return;
    this._card = createGigCard(this, {
      x: CARD_X,
      y: CARD_Y,
      venueId: venue.id,
      venueName: venue.name,
      gig: this._gig,
      recommended: recommendedGig(saveManager.load(), venue.id),
      onSelect: (gig) => {
        if (this._isLeaving) return;
        this._gig = gig;
        this._setCard();
      },
    });
  }

  /** Starts a gig through the same between-runs ad gate as every other way into play. */
  private async _play(): Promise<void> {
    if (this._isLeaving) return; // double-tap guard while the ad promise is pending
    this._isLeaving = true;
    const venueId = this._venueId;
    const gig = this._gig;
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

  /** Starts the selected venue's Jam through the same between-runs ad gate as a gig. */
  private async _jam(): Promise<void> {
    if (this._isLeaving) return;
    this._isLeaving = true;
    const venueId = this._venueId;
    this._unlocks.selectWorld(venueId);
    const next: JamSceneData = {
      worldId: venueId,
      grannyId: this._unlocks.getSelectedGrannyId(),
    };
    await startRoundAfterAdGate(adManager, AD_MUTE_HOOKS, (click) =>
      this.scene.start('JamScene', { ...next, ...click }),
    );
  }

  private _goTo(scene: 'TourScene' | 'ShopScene'): void {
    if (this._isLeaving) return;
    this._isLeaving = true;
    if (scene === 'TourScene') {
      const data: TourSceneData = { venueId: this._venueId };
      this.scene.start(scene, data);
      return;
    }
    this.scene.start(scene);
  }
}
