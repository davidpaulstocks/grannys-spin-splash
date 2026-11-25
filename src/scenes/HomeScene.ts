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
import { frontier, totalStars } from '../systems/Progress';
import { saveManager } from '../systems/SaveManager';
import { startRoundAfterAdGate } from '../systems/startRound';
import { UnlockManager } from '../systems/UnlockManager';
import type { GameSceneData } from '../types/sceneData';
import { createButton } from '../ui/Button';
import { spawnFloatingText } from '../ui/FloatingText';
import { createGigCard } from '../ui/GigCard';
import { createIconButton } from '../ui/IconButton';
import { drawShopIcon, drawTourIcon } from '../ui/icons';
import { createStatPill, type StatPill } from '../ui/StatPill';
import { COLOUR_HEX } from '../utils/colour';
import { EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';

/**
 * Layout. Three zones under the wordmark. Along the top, what the player
 * owns (coins, stars) and, when there is one, the daily gift. On the left,
 * Granny, with the two round buttons for Tour and Shop in the corner beneath
 * her. On the right, the next-gig card with the one big PLAY button under it.
 */
const TITLE_Y = 92;
const TITLE_HEIGHT = 124;

const COINS_PILL_X = 104;
const STARS_PILL_X = 264;
const PILLS_Y = 50;

const GIFT_X = GAME_WIDTH - 176;
const GIFT_Y = 54;
const GIFT_FLOAT_OFFSET_Y = 46;
const GIFT_PULSE_SCALE = 1.06;
const GIFT_PULSE_MS = 520;

const GRANNY_X = 420;
const GRANNY_Y = 452;
const GRANNY_HEIGHT = 420;
const GRANNY_BOB_PX = 10;
const GRANNY_BOB_MS = 900;

const SIDE_BUTTONS_Y = 596;
const TOUR_X = 104;
const SHOP_X = 216;

const CARD_X = 890;
const CARD_Y = 350;
const PLAY_Y = 592;
const PLAY_MIN_WIDTH = 420;

export class HomeScene extends Phaser.Scene {
  private _unlocks = new UnlockManager(saveManager);
  /** Phaser reuses scene instances, so this is reset in create() rather than at construction. */
  private _isLeaving = false;
  private _coinsPill!: StatPill;

  constructor() {
    super('HomeScene');
  }

  create(): void {
    this._isLeaving = false;
    const save = saveManager.load();
    const stop = frontier(save, WORLD_DEFS);
    const venue = WORLD_DEFS.find((w) => w.id === stop.venueId) ?? WORLD_DEFS[0];
    if (!venue) return;

    drawWorldBackground(this, venue.id);
    this._buildTitle();
    this._coinsPill = createStatPill(this, COINS_PILL_X, PILLS_Y, 'coins', save.vault);
    createStatPill(this, STARS_PILL_X, PILLS_Y, 'stars', totalStars(save));
    this._buildGranny();
    createGigCard(this, {
      x: CARD_X,
      y: CARD_Y,
      venueId: venue.id,
      venueName: venue.name,
      gig: stop.gig,
    });
    this._buildDailyGift();

    createButton(this, {
      x: CARD_X,
      y: PLAY_Y,
      label: 'PLAY',
      variant: 'primary',
      size: 'lg',
      minWidth: PLAY_MIN_WIDTH,
      onClick: () => void this._play(venue.id, stop.gig),
    });
    createIconButton(this, {
      x: TOUR_X,
      y: SIDE_BUTTONS_Y,
      icon: drawTourIcon,
      caption: 'TOUR',
      onClick: () => this._goTo('TourScene'),
    });
    createIconButton(this, {
      x: SHOP_X,
      y: SIDE_BUTTONS_Y,
      icon: drawShopIcon,
      caption: 'SHOP',
      onClick: () => this._goTo('ShopScene'),
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

  private _goTo(scene: 'TourScene' | 'ShopScene'): void {
    if (this._isLeaving) return;
    this._isLeaving = true;
    this.scene.start(scene);
  }
}
