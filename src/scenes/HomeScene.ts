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
import { musiciansJoining } from '../audio/scores';
import { GAME_WIDTH } from '../config';
import { gigFor, GIGS_PER_VENUE } from '../entities/world/gigs.data';
import { WORLD_DEFS } from '../entities/world/world.data';
import { drawWorldBackground } from '../entities/world/worldBackgrounds';
import { adManager } from '../systems/AdManager';
import { claimDailyGift, dailyGift } from '../systems/DailyGift';
import { currentMission } from '../systems/Missions';
import { frontier, totalStars, venueStars } from '../systems/Progress';
import { saveManager } from '../systems/SaveManager';
import { startRoundAfterAdGate } from '../systems/startRound';
import { UnlockManager } from '../systems/UnlockManager';
import type { GameSceneData } from '../types/sceneData';
import { createButton } from '../ui/Button';
import { spawnFloatingText } from '../ui/FloatingText';
import { drawCoinIcon, drawStarIcon } from '../ui/icons';
import { createStatPill, type StatPill } from '../ui/StatPill';
import { COLOUR, COLOUR_HEX, shade } from '../utils/colour';
import { EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';

const TITLE_Y = 92;
const TITLE_HEIGHT = 124;

const COINS_PILL_X = 104;
const STARS_PILL_X = 264;
const PILLS_Y = 50;

const GRANNY_X = 330;
const GRANNY_Y = 452;
const GRANNY_HEIGHT = 420;
const GRANNY_BOB_PX = 10;
const GRANNY_BOB_MS = 900;

const CARD_X = 880;
const CARD_Y = 368;
const CARD_WIDTH = 480;
const CARD_HEIGHT = 356;
const CARD_RADIUS = 30;
const VENUE_NAME_Y = CARD_Y - 136;
const GIG_LINE_Y = CARD_Y - 92;
const STARS_Y = CARD_Y - 42;
const STAR_RADIUS = 24;
const STAR_SPACING = 64;
const STAR_OUTLINE_PX = 5;
const UNEARNED_STAR = 0xd8d4c6;
const NEW_LINE_Y = CARD_Y + 14;
const NEW_NAMES_Y = CARD_Y + 40;
/** The mission sits in its own band along the bottom of the card. */
const MISSION_BAND_HEIGHT = 64;
const MISSION_Y = CARD_Y + CARD_HEIGHT / 2 - MISSION_BAND_HEIGHT / 2;
const MISSION_COIN_RADIUS = 12;

const GIFT_X = GAME_WIDTH - 150;
const GIFT_MIN_WIDTH = 230;
const GIFT_PULSE_SCALE = 1.06;
const GIFT_PULSE_MS = 520;
const NEW_NAMES_WRAP = CARD_WIDTH - 56;

const PLAY_Y = 606;
const PLAY_MIN_WIDTH = 420;
const SIDE_BUTTONS_Y = 664;
const TOUR_X = 232;
const SHOP_X = 428;
const SIDE_BUTTON_MIN_WIDTH = 170;

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
    this._buildGigCard(venue.id, venue.name, stop.gig);
    this._buildMissionBand();
    this._buildDailyGift();

    createButton(this, {
      x: CARD_X,
      y: PLAY_Y,
      label: 'PLAY',
      variant: 'primary',
      minWidth: PLAY_MIN_WIDTH,
      onClick: () => void this._play(venue.id, stop.gig),
    });
    createButton(this, {
      x: TOUR_X,
      y: SIDE_BUTTONS_Y,
      label: 'TOUR',
      variant: 'secondary',
      minWidth: SIDE_BUTTON_MIN_WIDTH,
      onClick: () => this._goTo('TourScene'),
    });
    createButton(this, {
      x: SHOP_X,
      y: SIDE_BUTTONS_Y,
      label: 'SHOP',
      variant: 'secondary',
      minWidth: SIDE_BUTTON_MIN_WIDTH,
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

  /** What is next: the venue, which gig, the best rating so far, and who joins the band for it. */
  private _buildGigCard(venueId: string, venueName: string, gig: number): void {
    const card = this.add.graphics();
    card.fillStyle(COLOUR.cloud, 0.96);
    card.fillRoundedRect(
      CARD_X - CARD_WIDTH / 2,
      CARD_Y - CARD_HEIGHT / 2,
      CARD_WIDTH,
      CARD_HEIGHT,
      CARD_RADIUS,
    );
    card.lineStyle(5, COLOUR.ink, 1);
    card.strokeRoundedRect(
      CARD_X - CARD_WIDTH / 2,
      CARD_Y - CARD_HEIGHT / 2,
      CARD_WIDTH,
      CARD_HEIGHT,
      CARD_RADIUS,
    );

    this.add
      .text(
        CARD_X,
        VENUE_NAME_Y,
        venueName.toUpperCase(),
        textStyle('displayM', COLOUR_HEX.ink, COLOUR_HEX.cloud),
      )
      .setOrigin(0.5);
    const isFinale = gig === GIGS_PER_VENUE - 1;
    this.add
      .text(
        CARD_X,
        GIG_LINE_Y,
        isFinale ? 'The Grand Concert' : `Gig ${gig + 1} of ${GIGS_PER_VENUE}`,
        textStyle('bodyL', COLOUR_HEX.softSlate, COLOUR_HEX.cloud),
      )
      .setOrigin(0.5);

    const best = venueStars(saveManager.load(), venueId)[gig] ?? 0;
    for (let i = 0; i < 3; i++) {
      const star = this.add.graphics({ x: CARD_X + (i - 1) * STAR_SPACING, y: STARS_Y });
      drawStarIcon(star, STAR_RADIUS + STAR_OUTLINE_PX, COLOUR.ink);
      drawStarIcon(star, STAR_RADIUS, i < best ? COLOUR.sunnyGold : UNEARNED_STAR);
    }

    const world = WORLD_DEFS.find((w) => w.id === venueId);
    if (!world) return;
    const band = gigFor(world, gig).band;
    const before = gig > 0 ? gigFor(world, gig - 1).band : 0;
    const joining = musiciansJoining(venueId, before, band);
    if (joining.length === 0) return;
    this.add
      .text(
        CARD_X,
        NEW_LINE_Y,
        gig === 0 ? 'MEET THE BAND' : joining.length === 1 ? 'NEW MUSICIAN' : 'NEW MUSICIANS',
        textStyle('bodyM', COLOUR_HEX.softSlate, COLOUR_HEX.cloud),
      )
      .setOrigin(0.5);
    this.add
      .text(CARD_X, NEW_NAMES_Y, joining.join('  ·  '), {
        ...textStyle('bodyL', COLOUR_HEX.grannyPink, COLOUR_HEX.cloud),
        align: 'center',
        wordWrap: { width: NEW_NAMES_WRAP },
      })
      .setOrigin(0.5, 0);
  }

  /** Granny's request: the one mission on the go, how far along it is, and what it pays. */
  private _buildMissionBand(): void {
    const save = saveManager.load();
    const mission = currentMission(save);
    const top = MISSION_Y - MISSION_BAND_HEIGHT / 2;

    const band = this.add.graphics();
    band.fillStyle(COLOUR.sunnyGold, 0.22);
    band.fillRoundedRect(
      CARD_X - CARD_WIDTH / 2 + 3,
      top,
      CARD_WIDTH - 6,
      MISSION_BAND_HEIGHT - 3,
      {
        tl: 0,
        tr: 0,
        bl: CARD_RADIUS - 3,
        br: CARD_RADIUS - 3,
      },
    );
    band.lineStyle(3, COLOUR.ink, 0.25);
    band.lineBetween(CARD_X - CARD_WIDTH / 2 + 3, top, CARD_X + CARD_WIDTH / 2 - 3, top);

    this.add
      .text(
        CARD_X - CARD_WIDTH / 2 + 28,
        MISSION_Y,
        `${mission.text}   ${save.mission.progress} / ${mission.target}`,
        textStyle('bodyL', COLOUR_HEX.ink, COLOUR_HEX.cloud),
      )
      .setOrigin(0, 0.5);

    const reward = this.add
      .text(
        CARD_X + CARD_WIDTH / 2 - 28,
        MISSION_Y,
        `+${mission.reward}`,
        textStyle('bodyL', COLOUR_HEX.ink, COLOUR_HEX.cloud),
      )
      .setOrigin(1, 0.5);
    const coin = this.add.graphics({
      x: reward.x - reward.width - MISSION_COIN_RADIUS - 8,
      y: MISSION_Y,
    });
    drawCoinIcon(coin, MISSION_COIN_RADIUS + 3, COLOUR.ink, COLOUR.ink);
    drawCoinIcon(coin, MISSION_COIN_RADIUS, COLOUR.sunnyGold, shade(COLOUR.sunnyGold, 0.72));
  }

  /** A gift for coming back today. Only there when there is one to take, so it never becomes furniture. */
  private _buildDailyGift(): void {
    const gift = dailyGift(saveManager.load(), new Date());
    if (!gift.available) return;
    const button = createButton(this, {
      x: GIFT_X,
      y: PILLS_Y,
      label: `DAILY GIFT  +${gift.coins}`,
      variant: 'secondary',
      minWidth: GIFT_MIN_WIDTH,
      onClick: () => {
        const claimed = claimDailyGift(saveManager.load(), new Date());
        saveManager.save(claimed);
        this._coinsPill.setValue(claimed.vault);
        spawnFloatingText(this, GIFT_X, PILLS_Y + 46, `+${gift.coins}`, COLOUR_HEX.sunnyGold);
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
