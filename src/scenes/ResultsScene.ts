/**
 * The end of a gig — docs/ENGAGEMENT_DESIGN.md §5. One job: make the result
 * feel earned and make the next gig one tap away.
 *
 * Stars land one at a time, each with a note climbing the home chord; coins
 * count up; then a single large button carries on the tour. Retry and the
 * rewarded "double coins" are smaller and sit below it — Poki requires the
 * standard continue to be at least as prominent as any rewarded option, and
 * never to be gated by it.
 */

import Phaser from 'phaser';

import { SPRITE_KEYS } from '../assets/keys';
import { AD_MUTE_HOOKS } from '../audio/AudioBus';
import { playStarChime } from '../audio/ResultsMusic';
import * as SFX from '../audio/SFX';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { musiciansJoining } from '../audio/scores';
import { spawnConfetti } from '../entities/waterParticle/splashVFX';
import { gigFor } from '../entities/world/gigs.data';
import { WORLD_DEFS } from '../entities/world/world.data';
import { drawWorldBackground } from '../entities/world/worldBackgrounds';
import { adManager } from '../systems/AdManager';
import { applyGigToMission } from '../systems/Missions';
import { MAX_STARS_PER_GIG, nextLockedVenue, nextStop, type TourStop } from '../systems/Progress';
import { saveManager } from '../systems/SaveManager';
import { startRoundAfterAdGate } from '../systems/startRound';
import { UnlockManager } from '../systems/UnlockManager';
import type { GameSceneData, GigResultData } from '../types/sceneData';
import { createButton } from '../ui/Button';
import { createIconButton } from '../ui/IconButton';
import { drawCoinIcon, drawHomeIcon, drawRetryIcon, drawStarIcon } from '../ui/icons';
import { createPanel } from '../ui/Panel';
import { showMissionCard } from '../ui/MissionCard';
import { COLOUR, COLOUR_HEX, shade } from '../utils/colour';
import { DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';

const CENTRE_X = GAME_WIDTH / 2;

/**
 * Layout. One card in the middle holds the whole result, top to bottom:
 * ribbon (which gig), headline, stars, coins, one hint, then the row of
 * actions along the card's bottom — all inside it. The rewarded option sits
 * below the card on its own, smaller than the main action (CLAUDE.md §11.3).
 * Granny stands to the left and the mission card to the right, so the screen
 * reads as three columns with the result in the centre.
 */
const PANEL_WIDTH = 700;
const PANEL_HEIGHT = 524;
const PANEL_Y = 340;
const PANEL_BOTTOM = PANEL_Y + PANEL_HEIGHT / 2;
const BACKDROP_DIM_ALPHA = 0.5;

const HEADLINE_Y = 158;
const STARS_Y = 262;
const STAR_SPACING = 150;
const STAR_RADIUS = 54;
/** The middle star sits a little higher and larger — the classic three-star arc. */
const MIDDLE_STAR_LIFT = 16;
const MIDDLE_STAR_SCALE = 1.14;
const STAR_OUTLINE_PX = 7;
const STAR_FIRST_DELAY_MS = 350;
const STAR_STEP_MS = 380;

const COINS_Y = 362;
const COIN_RADIUS = 22;
const BANK_Y = 404;
const HINT_Y = 442;
/** The action row: its buttons' lips end 22px above the card's bottom edge. */
const ACTIONS_Y = PANEL_BOTTOM - 74;
const NEXT_MIN_WIDTH = 340;
const SIDE_ACTION_OFFSET_X = 254;
const DOUBLE_Y = PANEL_BOTTOM + 62;
const DOUBLE_MIN_WIDTH = 320;

const GRANNY_X = 150;
const GRANNY_Y = 452;
const GRANNY_HEIGHT = 340;

const MISSION_X = GAME_WIDTH - 144;
const MISSION_Y = 320;

const COUNT_UP_MS = 800;
const TICK_EVERY_MS = 90;

const HEADLINES = ['SO CLOSE!', 'NICE GIG!', 'GREAT GIG!', 'FULL BAND!'] as const;
const CONFETTI_COLOURS = [
  COLOUR.grannyPink,
  COLOUR.sunnyGold,
  COLOUR.waterBlue,
  COLOUR.mintGreen,
] as const;
const UNEARNED_STAR = 0xd8d4c6;

export class ResultsScene extends Phaser.Scene {
  private _unlocks = new UnlockManager(saveManager);
  private _coinsText!: Phaser.GameObjects.Text;
  private _bankText!: Phaser.GameObjects.Text;
  private _doubleButton: Phaser.GameObjects.Container | null = null;
  /** Phaser reuses scene instances, so this is reset in create() rather than at construction. */
  private _isLeaving = false;

  constructor() {
    super('ResultsScene');
  }

  create(data: GigResultData): void {
    this._isLeaving = false;
    const passed = data.stars > 0;
    const venue = WORLD_DEFS.find((w) => w.id === data.worldId) ?? WORLD_DEFS[0];
    const coins = data.score + data.starCoins;

    // Count the gig toward Granny's request before anything reads the bank.
    const mission = applyGigToMission(saveManager.load(), {
      stars: data.stars,
      newStars: data.newStars,
      coins,
    });
    saveManager.save(mission.save);

    this._buildBackdrop(
      data.worldId,
      `${venue?.name ?? ''}  ·  GIG ${data.gig + 1}`.toUpperCase(),
      passed,
    );

    this.add
      .text(
        CENTRE_X,
        HEADLINE_Y,
        HEADLINES[Math.min(data.stars, MAX_STARS_PER_GIG)] ?? '',
        textStyle('displayL', passed ? COLOUR_HEX.grannyPink : COLOUR_HEX.cloud, COLOUR_HEX.ink),
      )
      .setOrigin(0.5);

    this._buildStars(data.stars);
    this._buildCoins(coins, data.stars);
    this._buildHint(data);
    this._buildButtons(data, passed);
    showMissionCard(this, MISSION_X, MISSION_Y, mission, {
      celebrateAfterMs: STAR_FIRST_DELAY_MS + data.stars * STAR_STEP_MS + COUNT_UP_MS,
      onReward: () => this._refreshBank(),
    });
  }

  /** The venue's own art, softened, with the result card on top — the gig happened somewhere, and it still looks like there. */
  private _buildBackdrop(worldId: string, ribbon: string, passed: boolean): void {
    drawWorldBackground(this, worldId);
    this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLOUR.cloud, BACKDROP_DIM_ALPHA)
      .setOrigin(0);
    createPanel(this, {
      x: CENTRE_X,
      y: PANEL_Y,
      width: PANEL_WIDTH,
      height: PANEL_HEIGHT,
      ribbon,
    });

    const key = SPRITE_KEYS.grannyPose(this._unlocks.getSelectedGrannyId(), 'front');
    if (!this.textures.exists(key)) return;
    const granny = this.add.image(GRANNY_X, GRANNY_Y, key);
    granny.setScale(GRANNY_HEIGHT / granny.height);
    if (passed) {
      // She's pleased: a gentle bounce for as long as the screen is up.
      this.tweens.add({
        targets: granny,
        y: GRANNY_Y - 14,
        duration: 420,
        ease: EASE.standardOut,
        yoyo: true,
        repeat: -1,
      });
    }
  }

  private _buildStars(earned: number): void {
    for (let i = 0; i < MAX_STARS_PER_GIG; i++) {
      const isMiddle = i === 1;
      const x = CENTRE_X + (i - 1) * STAR_SPACING;
      const y = STARS_Y - (isMiddle ? MIDDLE_STAR_LIFT : 0);
      const size = isMiddle ? MIDDLE_STAR_SCALE : 1;

      const slot = this.add.graphics({ x, y }).setScale(size);
      drawStarIcon(slot, STAR_RADIUS + STAR_OUTLINE_PX, shade(UNEARNED_STAR, 0.8));
      drawStarIcon(slot, STAR_RADIUS, UNEARNED_STAR);
      if (i >= earned) continue;

      const star = this.add.graphics({ x, y }).setScale(0);
      drawStarIcon(star, STAR_RADIUS + STAR_OUTLINE_PX, COLOUR.ink);
      drawStarIcon(star, STAR_RADIUS, COLOUR.sunnyGold);
      this.tweens.add({
        targets: star,
        scale: size,
        duration: DURATION.celebration,
        ease: EASE.bouncy,
        delay: STAR_FIRST_DELAY_MS + i * STAR_STEP_MS,
        onStart: () => {
          playStarChime(i);
          if (i === MAX_STARS_PER_GIG - 1) {
            this.cameras.main.shake(160, 0.006);
            spawnConfetti(this, CENTRE_X - STAR_SPACING, STARS_Y, CONFETTI_COLOURS);
            spawnConfetti(this, CENTRE_X, STARS_Y - MIDDLE_STAR_LIFT, CONFETTI_COLOURS);
            spawnConfetti(this, CENTRE_X + STAR_SPACING, STARS_Y, CONFETTI_COLOURS);
          }
        },
      });
    }
  }

  private _buildCoins(coins: number, stars: number): void {
    const icon = this.add.graphics({ x: CENTRE_X - 70, y: COINS_Y });
    drawCoinIcon(icon, COIN_RADIUS + 4, COLOUR.ink, COLOUR.ink);
    drawCoinIcon(icon, COIN_RADIUS, COLOUR.sunnyGold, shade(COLOUR.sunnyGold, 0.72));

    this._coinsText = this.add
      .text(
        CENTRE_X - 34,
        COINS_Y,
        '+0',
        textStyle('displayL', COLOUR_HEX.sunnyGold, COLOUR_HEX.ink),
      )
      .setOrigin(0, 0.5);
    this._bankText = this.add
      .text(CENTRE_X, BANK_Y, '', textStyle('bodyL', COLOUR_HEX.softSlate, COLOUR_HEX.cloud))
      .setOrigin(0.5);
    this._refreshBank();

    // The count-up waits for the stars: one beat at a time.
    this.time.delayedCall(STAR_FIRST_DELAY_MS + stars * STAR_STEP_MS, () =>
      this._countUp(0, coins),
    );
  }

  private _refreshBank(): void {
    this._bankText.setText(`${this._unlocks.getVault()} coins in the bank`);
  }

  private _countUp(from: number, to: number): void {
    const counter = { value: from };
    let lastTickAt = 0;
    this.tweens.add({
      targets: counter,
      value: to,
      duration: to > from ? COUNT_UP_MS : 0,
      ease: EASE.standardOut,
      onUpdate: (tween) => {
        this._coinsText.setText(`+${Math.round(counter.value)}`);
        if (tween.elapsed - lastTickAt >= TICK_EVERY_MS) {
          lastTickAt = tween.elapsed;
          SFX.playTick(false);
        }
      },
      onComplete: () => this._coinsText.setText(`+${to}`),
    });
  }

  /**
   * One line that always points at the next thing worth doing. After a pass
   * that is who joins the band next — the strongest reason to press NEXT is
   * a new musician waiting behind it.
   */
  private _buildHint(data: GigResultData): void {
    this.add
      .text(
        CENTRE_X,
        HINT_Y,
        this._hintFor(data),
        textStyle('bodyL', COLOUR_HEX.softSlate, COLOUR_HEX.cloud),
      )
      .setOrigin(0.5);
  }

  private _hintFor(data: GigResultData): string {
    if (data.stars === 0) {
      return `${data.peakFullSpinners} of ${data.totalSpinners} playing at once — get more of the band going for a star`;
    }
    const save = saveManager.load();
    const onward = nextStop(save, WORLD_DEFS, data.worldId, data.gig);
    const venue = WORLD_DEFS.find((w) => w.id === data.worldId);
    if (onward && venue && onward.venueId === data.worldId) {
      const joining = musiciansJoining(
        data.worldId,
        gigFor(venue, data.gig).band,
        gigFor(venue, onward.gig).band,
      );
      if (joining.length > 0) {
        const last = joining[joining.length - 1] ?? '';
        const names =
          joining.length === 1 ? last : `${joining.slice(0, -1).join(', ')} and ${last}`;
        return `Next gig adds ${names}`;
      }
    }
    if (data.stars < MAX_STARS_PER_GIG) return 'Get the whole band playing at once for three stars';
    const locked = nextLockedVenue(save, WORLD_DEFS);
    return locked
      ? `${locked.starsNeeded} more ${locked.starsNeeded === 1 ? 'star' : 'stars'} to open the ${locked.venue.name}`
      : 'The whole band, playing together!';
  }

  /**
   * The action row. Exactly one large primary action — carry on if there is
   * somewhere to go, otherwise play this gig again — flanked by round icon
   * buttons for the things nobody needs to read: retry and home.
   */
  private _buildButtons(data: GigResultData, passed: boolean): void {
    const here: TourStop = { venueId: data.worldId, gig: data.gig };
    const onward = passed ? nextStop(saveManager.load(), WORLD_DEFS, data.worldId, data.gig) : null;

    createButton(this, {
      x: CENTRE_X,
      y: ACTIONS_Y,
      label: onward ? 'NEXT GIG' : passed ? 'PLAY AGAIN' : 'TRY AGAIN',
      variant: 'primary',
      size: 'lg',
      minWidth: NEXT_MIN_WIDTH,
      onClick: () => void this._play(onward ?? here),
    });
    if (onward) {
      createIconButton(this, {
        x: CENTRE_X - SIDE_ACTION_OFFSET_X,
        y: ACTIONS_Y,
        icon: drawRetryIcon,
        onClick: () => void this._play(here),
      });
    }
    createIconButton(this, {
      x: CENTRE_X + SIDE_ACTION_OFFSET_X,
      y: ACTIONS_Y,
      icon: drawHomeIcon,
      onClick: () => this._toMenu(),
    });

    const coins = data.score + data.starCoins;
    if (coins <= 0) return; // nothing worth doubling
    this._doubleButton = createButton(this, {
      x: CENTRE_X,
      y: DOUBLE_Y,
      label: 'Double your coins',
      variant: 'reward',
      size: 'sm',
      minWidth: DOUBLE_MIN_WIDTH,
      showPlayIcon: true,
      onClick: () => void this._onDouble(coins),
    });
  }

  /** Starts a gig through the same between-runs ad gate as every other way into play. */
  private async _play(stop: TourStop): Promise<void> {
    if (this._isLeaving) return; // double-tap guard while the ad promise is pending
    this._isLeaving = true;
    const next: GameSceneData = {
      grannyId: this._unlocks.getSelectedGrannyId(),
      gunId: this._unlocks.getSelectedGunId(),
      worldId: stop.venueId,
      gig: stop.gig,
    };
    this._unlocks.selectWorld(stop.venueId);
    await startRoundAfterAdGate(adManager, AD_MUTE_HOOKS, () =>
      this.scene.start('GameScene', next),
    );
  }

  private _toMenu(): void {
    if (this._isLeaving) return;
    this._isLeaving = true;
    this.scene.start('HomeScene');
  }

  /** CLAUDE.md §11.1/§11.3: optional, one reward per ad, and it tops the bank up rather than gating anything. */
  private async _onDouble(coins: number): Promise<void> {
    const watched = await adManager.playRewarded('medium', AD_MUTE_HOOKS);
    if (!watched) return;
    this._unlocks.addStars(coins); // the gig's coins are already banked — this adds them again
    this._doubleButton?.destroy();
    this._doubleButton = null;
    this._countUp(coins, coins * 2);
    this._refreshBank();
  }
}
