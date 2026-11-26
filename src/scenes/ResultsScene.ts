/**
 * The end of a gig — docs/REWARD_LOOP.md. Three beats, top to bottom, and one
 * row of buttons:
 *
 *  1. The score: the coin total counting up large, the stars landing as it
 *     passes each target, NEW BEST, and how far the next star is.
 *  2. What now: the next gun or granny worth saving for, with a bar of coins
 *     toward it or a BUY button when it is within reach.
 *  3. The path: this venue's eight gigs, where the player is on them, and the
 *     next venue at the end with the stars it still needs.
 *
 * NEXT GIG is the largest button and the only green one. Poki requires the
 * standard continue to be at least as prominent as any rewarded option, and
 * never gated by it (CLAUDE.md §11.3).
 */

import Phaser from 'phaser';

import { SPRITE_KEYS } from '../assets/keys';
import { AD_MUTE_HOOKS } from '../audio/AudioBus';
import { playStarChime } from '../audio/ResultsMusic';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { spawnConfetti } from '../entities/waterParticle/splashVFX';
import { WORLD_DEFS } from '../entities/world/world.data';
import { drawWorldBackground } from '../entities/world/worldBackgrounds';
import { adManager } from '../systems/AdManager';
import { applyGigToMission } from '../systems/Missions';
import { nextStop, venueJustOpened, venueStars, type TourStop } from '../systems/Progress';
import { nextReward, nextVenue, type NextReward } from '../systems/Rewards';
import { saveManager } from '../systems/SaveManager';
import { startRoundAfterAdGate } from '../systems/startRound';
import { UnlockManager } from '../systems/UnlockManager';
import type { GameSceneData, GigResultData } from '../types/sceneData';
import { createButton } from '../ui/Button';
import { createIconButton } from '../ui/IconButton';
import { joinsLine } from '../ui/joinsLine';
import { drawHomeIcon, drawRetryIcon } from '../ui/icons';
import { createNextRewardCard, type NextRewardCard } from '../ui/NextRewardCard';
import { ResultsScore } from '../ui/ResultsScore';
import { createStatPill, type StatPill } from '../ui/StatPill';
import { showToast } from '../ui/Toast';
import { createTourPath, type TourPath } from '../ui/TourPath';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';

const CENTRE_X = GAME_WIDTH / 2;
const BACKDROP_DIM_ALPHA = 0.5;

/** Every element has an explicit place on the 1280x720 canvas; nothing is laid out by flow. */
const SCORE_Y = 140;
const REWARD_Y = 346;
const PATH_Y = 514;
const PILL_X = 104;
const PILL_Y = 50;
const GRANNY_X = 130;
const GRANNY_Y = 480;
const GRANNY_HEIGHT = 300;
const ACTIONS_Y = 632;
const NEXT_MIN_WIDTH = 340;
const ICON_DIAMETER = 64;
const RETRY_X = 380;
const HOME_X = 300;
const DOUBLE_X = 1000;
const DOUBLE_MIN_WIDTH = 300;
const JOINS_Y = 700;
const TOAST_X = 150;
const TOAST_Y = 100;
const BUY_TOAST_Y = 432;
const FADE_IN_MS = 300;
const PATH_DELAY_MS = 250;
const MOMENT_DELAY_MS = 350;
const BAR_START_ALPHA = 0;

const CONFETTI_COLOURS = [COLOUR.grannyPink, COLOUR.sunnyGold, COLOUR.waterBlue, COLOUR.mintGreen];

export class ResultsScene extends Phaser.Scene {
  private _unlocks = new UnlockManager(saveManager);
  private _score!: ResultsScore;
  private _card!: NextRewardCard;
  private _path!: TourPath;
  private _pill!: StatPill;
  private _doubleButton: Phaser.GameObjects.Container | null = null;
  /** Phaser reuses scene instances, so this is reset in create() rather than at construction. */
  private _isLeaving = false;

  constructor() {
    super('ResultsScene');
  }

  create(data: GigResultData): void {
    this._isLeaving = false;
    this._doubleButton = null;
    const passed = data.stars > 0;
    const venue = WORLD_DEFS.find((w) => w.id === data.worldId) ?? WORLD_DEFS[0];
    if (!venue) return;
    const coins = data.score + data.starCoins;

    const mission = applyGigToMission(saveManager.load(), {
      stars: data.stars,
      newStars: data.newStars,
      coins,
    });
    saveManager.save(mission.save);
    const save = saveManager.load();
    const vaultBefore = save.vault - coins - (mission.completed ? mission.mission.reward : 0);

    this._buildBackdrop(data.worldId, passed);
    this._pill = createStatPill(this, PILL_X, PILL_Y, 'coins', vaultBefore);

    this._score = new ResultsScore(this, {
      x: CENTRE_X,
      y: SCORE_Y,
      ribbon: `${venue.name}  ·  GIG ${data.gig + 1}`.toUpperCase(),
      data,
    });
    this._card = createNextRewardCard(this, {
      x: CENTRE_X,
      y: REWARD_Y,
      onBuy: (reward) => this._buy(reward),
    });
    this._card.container.setAlpha(BAR_START_ALPHA);

    const onward = passed ? nextStop(save, WORLD_DEFS, data.worldId, data.gig) : null;
    this._path = createTourPath(this, {
      x: CENTRE_X,
      y: PATH_Y,
      venue,
      stars: venueStars(save, data.worldId),
      played: data.gig,
      next: onward && onward.venueId === data.worldId ? onward.gig : data.gig,
      opened: venueJustOpened(save, WORLD_DEFS, data.newStars),
      locked: nextVenue(save),
    });
    this._path.container.setAlpha(BAR_START_ALPHA);

    this._buildButtons(data, passed, onward, coins);

    this._score.start(() => {
      this._pill.setValue(saveManager.load().vault);
      if (mission.completed) {
        showToast(this, TOAST_X, TOAST_Y, `Request done! +${mission.mission.reward}`);
      }
      const reward = nextReward(saveManager.load());
      this._card.show(reward, reward ? Math.min(1, vaultBefore / Math.max(1, reward.cost)) : 0);
      this._fadeIn(this._card.container, 0);
      this._fadeIn(this._path.container, PATH_DELAY_MS);
      this.time.delayedCall(PATH_DELAY_MS + FADE_IN_MS + MOMENT_DELAY_MS, () =>
        this._path.celebrate(),
      );
    });
  }

  private _fadeIn(target: Phaser.GameObjects.Container, delay: number): void {
    this.tweens.add({
      targets: target,
      alpha: 1,
      duration: FADE_IN_MS,
      delay,
      ease: EASE.standardOut,
    });
  }

  /** The venue's own art, softened, with Granny on the left — the gig happened somewhere, and it still looks like there. */
  private _buildBackdrop(worldId: string, passed: boolean): void {
    drawWorldBackground(this, worldId);
    this.add
      .rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLOUR.cloud, BACKDROP_DIM_ALPHA)
      .setOrigin(0);

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

  /**
   * The action row. Exactly one large primary action — NEXT GIG after a pass,
   * TRY AGAIN after a miss — flanked by round icon buttons for retry and home
   * and the smaller gold rewarded option. Under NEXT GIG: who joins.
   */
  private _buildButtons(
    data: GigResultData,
    passed: boolean,
    onward: TourStop | null,
    coins: number,
  ): void {
    const here: TourStop = { venueId: data.worldId, gig: data.gig };
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
        x: RETRY_X,
        y: ACTIONS_Y,
        icon: drawRetryIcon,
        diameter: ICON_DIAMETER,
        onClick: () => void this._play(here),
      });
      this._buildJoins(data, onward);
    }
    createIconButton(this, {
      x: HOME_X,
      y: ACTIONS_Y,
      icon: drawHomeIcon,
      diameter: ICON_DIAMETER,
      onClick: () => this._toMenu(),
    });
    if (coins <= 0) return; // nothing worth doubling
    this._doubleButton = createButton(this, {
      x: DOUBLE_X,
      y: ACTIONS_Y,
      label: 'Double coins',
      variant: 'reward',
      size: 'sm',
      minWidth: DOUBLE_MIN_WIDTH,
      showPlayIcon: true,
      onClick: () => void this._onDouble(coins),
    });
  }

  /** "The Marimba joins!" under NEXT GIG — a new musician waiting is the strongest reason to press it. */
  private _buildJoins(data: GigResultData, onward: TourStop): void {
    const line = joinsLine(data.worldId, data.gig, onward);
    if (!line) return;
    this.add
      .text(CENTRE_X, JOINS_Y, line, textStyle('bodyL', COLOUR_HEX.grannyPink, COLOUR_HEX.cloud))
      .setOrigin(0.5);
  }

  /** Spends the coins, equips the purchase, celebrates, and moves the card on to the next thing to save for. */
  private _buy(reward: NextReward): void {
    const bought =
      reward.kind === 'gun'
        ? this._unlocks.unlockGun(reward.id)
        : this._unlocks.unlockGranny(reward.id);
    if (!bought) return;
    if (reward.kind === 'gun') this._unlocks.selectGun(reward.id);
    else this._unlocks.selectGranny(reward.id);

    playStarChime(2);
    spawnConfetti(this, CENTRE_X, REWARD_Y, CONFETTI_COLOURS);
    showToast(this, CENTRE_X, BUY_TOAST_Y, `Unlocked ${reward.name}! ${reward.perk}`);
    this._pill.setValue(this._unlocks.getVault());
    this._card.show(nextReward(saveManager.load()));
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
    const before = nextReward(saveManager.load());
    this._unlocks.addStars(coins); // the gig's coins are already banked — this adds them again
    this._doubleButton?.destroy();
    this._doubleButton = null;
    this._score.countTo(coins, coins * 2, DURATION.celebration * 2);
    this._pill.setValue(this._unlocks.getVault());
    const after = nextReward(saveManager.load());
    this._card.show(after, before ? before.progress : undefined);
  }
}
