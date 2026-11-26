/**
 * Home — docs/ENGAGEMENT_DESIGN.md §5. One job: get the player into the next
 * gig. The current venue fills the screen, Granny stands in it, and a single
 * card says what is next and carries the one big button.
 *
 * Everything else a player might want — replaying an old gig, buying a gun —
 * is one small button away and never on the path to PLAY.
 */

import Phaser from 'phaser';

import { SPRITE_KEYS } from '../assets/keys';
import { AD_MUTE_HOOKS } from '../audio/AudioBus';
import { GAME_WIDTH } from '../config';
import { WORLD_DEFS } from '../entities/world/world.data';
import { drawWorldBackground } from '../entities/world/worldBackgrounds';
import { adManager } from '../systems/AdManager';
import { claimDailyGift, dailyGift } from '../systems/DailyGift';
import { currentGig, frontier, totalStars } from '../systems/Progress';
import { saveManager } from '../systems/SaveManager';
import { startRoundAfterAdGate } from '../systems/startRound';
import { UnlockManager } from '../systems/UnlockManager';
import type { GameSceneData, TourSceneData } from '../types/sceneData';
import { createButton } from '../ui/Button';
import { spawnFloatingText } from '../ui/FloatingText';
import { createGigCard } from '../ui/GigCard';
import { createIconButton } from '../ui/IconButton';
import { drawTourIcon } from '../ui/icons';
import { createStatPill, type StatPill } from '../ui/StatPill';
import { createVenueStrip, type VenueStrip } from '../ui/VenueStrip';
import { COLOUR_HEX } from '../utils/colour';
import { EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';

/**
 * Layout. Along the top: what the player owns (coins, stars), the wordmark,
 * SHOP, and when there is one the daily gift. In the middle: Granny on the
 * left, ALL GIGS beneath her, and on the right the next-gig card with the one
 * big PLAY button under it. Along the bottom: the five venue tiles.
 */
const TITLE_Y = 50;
const TITLE_HEIGHT = 88;

const COINS_PILL_X = 104;
const STARS_PILL_X = 264;
const PILLS_Y = 50;
const SHOP_X = 440;
const SHOP_Y = 52;

const GIFT_X = GAME_WIDTH - 176;
const GIFT_Y = 54;
const GIFT_FLOAT_OFFSET_Y = 46;
const GIFT_PULSE_SCALE = 1.06;
const GIFT_PULSE_MS = 520;

const GRANNY_X = 380;
const GRANNY_Y = 350;
const GRANNY_HEIGHT = 400;
const GRANNY_BOB_PX = 10;
const GRANNY_BOB_MS = 900;

const ALL_GIGS_X = 104;
const ALL_GIGS_Y = 480;
const ALL_GIGS_DIAMETER = 64;

const CARD_X = 890;
const CARD_Y = 302;
const PLAY_Y = 524;
const PLAY_MIN_WIDTH = 420;

const STRIP_Y = 652;

export class HomeScene extends Phaser.Scene {
  private _unlocks = new UnlockManager(saveManager);
  /** Phaser reuses scene instances, so this is reset in create() rather than at construction. */
  private _isLeaving = false;
  private _coinsPill!: StatPill;
  private _venueId = '';
  private _backdrop: Phaser.GameObjects.GameObject[] = [];
  private _card: Phaser.GameObjects.GameObject[] = [];
  private _strip!: VenueStrip;

  constructor() {
    super('HomeScene');
  }

  create(): void {
    this._isLeaving = false;
    this._backdrop = [];
    this._card = [];
    const save = saveManager.load();
    // Opens on the venue the player is working through; tapping a tile changes it.
    this._venueId = frontier(save, WORLD_DEFS).venueId;
    if (!WORLD_DEFS.some((w) => w.id === this._venueId)) return;

    this._setBackdrop();
    this._buildTitle();
    this._coinsPill = createStatPill(this, COINS_PILL_X, PILLS_Y, 'coins', save.vault);
    createStatPill(this, STARS_PILL_X, PILLS_Y, 'stars', totalStars(save));
    this._buildGranny();
    this._setCard();
    this._buildDailyGift();

    createButton(this, {
      x: SHOP_X,
      y: SHOP_Y,
      label: 'SHOP',
      variant: 'secondary',
      size: 'sm',
      onClick: () => this._goTo('ShopScene'),
    });
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
    this._strip.setSelected(venueId);
    this._setBackdrop();
    this._setCard();
  }

  /** Paints the selected venue's backdrop, removing whatever the last one drew. */
  private _setBackdrop(): void {
    this._backdrop.forEach((o) => o.destroy());
    const before = new Set(this.children.list);
    drawWorldBackground(this, this._venueId);
    this._backdrop = this.children.list.filter((o) => !before.has(o));
  }

  /** Builds the next-gig card for the selected venue. */
  private _setCard(): void {
    this._card.forEach((o) => o.destroy());
    const venue = WORLD_DEFS.find((w) => w.id === this._venueId);
    if (!venue) return;
    this._card = createGigCard(this, {
      x: CARD_X,
      y: CARD_Y,
      venueId: venue.id,
      venueName: venue.name,
      gig: currentGig(saveManager.load(), venue.id),
    });
  }

  private _buildTitle(): void {
    if (!this.textures.exists(SPRITE_KEYS.titleWordmark)) {
      this.add
        .text(
          GAME_WIDTH / 2,
          TITLE_Y,
          "GRANNY'S SPIN SPLASH",
          textStyle('displayL', COLOUR_HEX.grannyPink, COLOUR_HEX.ink),
        )
        .setOrigin(0.5);
      return;
    }
    const wordmark = this.add.image(GAME_WIDTH / 2, TITLE_Y, SPRITE_KEYS.titleWordmark);
    wordmark.setScale(TITLE_HEIGHT / wordmark.height);
  }

  private _buildGranny(): void {
    const key = SPRITE_KEYS.grannyPose(this._unlocks.getSelectedGrannyId(), 'front');
    if (!this.textures.exists(key)) return;
    const granny = this.add.image(GRANNY_X, GRANNY_Y, key);
    granny.setScale(GRANNY_HEIGHT / granny.height);
    this.tweens.add({
      targets: granny,
      y: GRANNY_Y - GRANNY_BOB_PX,
      duration: GRANNY_BOB_MS,
      ease: EASE.standardOut,
      yoyo: true,
      repeat: -1,
    });
  }

  /** A gift for coming back today. Only there when there is one to take, so it never becomes furniture. */
  private _buildDailyGift(): void {
    const gift = dailyGift(saveManager.load(), new Date());
    if (!gift.available) return;
    const button = createButton(this, {
      x: GIFT_X,
      y: GIFT_Y,
      label: `DAILY GIFT  +${gift.coins}`,
      variant: 'reward',
      size: 'sm',
      onClick: () => {
        const claimed = claimDailyGift(saveManager.load(), new Date());
        saveManager.save(claimed);
        this._coinsPill.setValue(claimed.vault);
        spawnFloatingText(
          this,
          GIFT_X,
          GIFT_Y + GIFT_FLOAT_OFFSET_Y,
          `+${gift.coins}`,
          COLOUR_HEX.sunnyGold,
        );
        this.tweens.killTweensOf(button);
        button.destroy();
      },
    });
    this.tweens.add({
      targets: button,
      scale: GIFT_PULSE_SCALE,
      duration: GIFT_PULSE_MS,
      ease: EASE.standardOut,
      yoyo: true,
      repeat: -1,
    });
  }

  /** Starts a gig through the same between-runs ad gate as every other way into play. */
  private async _play(): Promise<void> {
    if (this._isLeaving) return; // double-tap guard while the ad promise is pending
    this._isLeaving = true;
    const venueId = this._venueId;
    const gig = currentGig(saveManager.load(), venueId);
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
