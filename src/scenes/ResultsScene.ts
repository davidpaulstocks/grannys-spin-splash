/**
 * The end of a gig — docs/REWARD_LOOP.md. The Big Finish has already shown the
 * stars on the wall, so this screen says the score once, quickly, and is then
 * about "what next". Top to bottom, nothing overlapping (`results/resultsLayout`):
 *
 *  1. The score: the coin total and the three stars, one line under them.
 *     A gig with no star is "Almost!" — warm, with how far the first star was.
 *  2. ONE "what next" card: a NEW WORLD card when this gig opened a venue,
 *     otherwise the next gun or granny worth saving for.
 *  3. The tour path: this venue's eight gigs as buttons (an open one starts
 *     that gig), with the next venue as a button.
 *  4. The main button (the only green one: NEXT GIG, a gig that still has
 *     stars to win, or TRY AGAIN; see `results/resultsPlan`), Home, Retry.
 *
 * Poki requires the standard continue to be the most prominent button and
 * never gated (CLAUDE.md §11.3); there is no rewarded option on this screen.
 */

import Phaser from 'phaser';

import { AD_MUTE_HOOKS } from '../audio/AudioBus';
import { playStarChime } from '../audio/ResultsMusic';
import { GRANNY_DEFS } from '../entities/granny/granny.data';
import { spawnConfetti } from '../entities/waterParticle/splashVFX';
import { WORLD_DEFS } from '../entities/world/world.data';
import type { WorldDef } from '../entities/world/world.types';
import { adManager } from '../systems/AdManager';
import { joinedMessage } from '../systems/GrannyJoining';
import { applyGigToMission } from '../systems/Missions';
import {
  currentGig,
  isGigOpen,
  nextStop,
  recommendedGig,
  starsToGo,
  venueJustOpened,
  venueStars,
  type TourStop,
} from '../systems/Progress';
import { nextReward, type NextReward } from '../systems/Rewards';
import { saveManager } from '../systems/SaveManager';
import { startRoundAfterAdGate } from '../systems/startRound';
import { UnlockManager } from '../systems/UnlockManager';
import type { GameSceneData, GigResultData } from '../types/sceneData';
import { joinsLine } from '../ui/joinsLine';
import { createNewWorldCard, type NewWorldCard } from '../ui/NewWorldCard';
import { createNextRewardCard, type NextRewardCard } from '../ui/NextRewardCard';
import { ResultsScore } from '../ui/ResultsScore';
import { createStatPill, type StatPill } from '../ui/StatPill';
import { showToast } from '../ui/Toast';
import { createTourPath } from '../ui/TourPath';
import { COLOUR } from '../utils/colour';
import { EASE } from '../utils/tween';
import { buildResultsBackdrop } from './results/ResultsBackdrop';
import { buildResultsButtons } from './results/resultsButtons';
import { planMain } from './results/resultsPlan';
import {
  CENTRE_X,
  PATH_CENTRE_Y,
  PILL_X,
  PILL_Y,
  REQUEST_TOAST_X,
  REQUEST_TOAST_Y,
  SCORE_HEIGHT,
  SCORE_TOP,
  SLOT_CENTRE_Y,
} from './results/resultsLayout';

const FADE_IN_MS = 300;
const PATH_DELAY_MS = 150;
/** Two grannies joining at once are announced this far apart, so each toast is read. */
const GRANNY_TOAST_GAP_MS = 2600;
const START_ALPHA = 0;
const CONFETTI_COLOURS = [COLOUR.grannyPink, COLOUR.sunnyGold, COLOUR.waterBlue, COLOUR.mintGreen];

export class ResultsScene extends Phaser.Scene {
  private _unlocks = new UnlockManager(saveManager);
  private _card: NextRewardCard | null = null;
  private _worldCard: NewWorldCard | null = null;
  private _pill!: StatPill;
  /** Phaser reuses scene instances, so this is reset in create() rather than at construction. */
  private _isLeaving = false;

  constructor() {
    super('ResultsScene');
  }

  create(data: GigResultData): void {
    this._isLeaving = false;
    this._card = null;
    this._worldCard = null;
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

    buildResultsBackdrop(this, data.worldId, this._unlocks.getSelectedGrannyId(), passed);
    this._pill = createStatPill(this, PILL_X, PILL_Y, 'coins', vaultBefore);
    const score = new ResultsScore(this, {
      x: CENTRE_X,
      y: SCORE_TOP + SCORE_HEIGHT / 2,
      ribbon: `${venue.name}  ·  GIG ${data.gig + 1}`.toUpperCase(),
      data,
      bestStars: venueStars(save, data.worldId)[data.gig] ?? 0,
    });

    const opened = venueJustOpened(save, WORLD_DEFS, data.newStars);
    let slot: Phaser.GameObjects.Container;
    if (opened) {
      this._worldCard = createNewWorldCard(this, {
        x: CENTRE_X,
        y: SLOT_CENTRE_Y,
        venue: opened,
        onGo: () => void this._play({ venueId: opened.id, gig: currentGig(save, opened.id) }),
      });
      slot = this._worldCard.container;
    } else {
      this._card = createNextRewardCard(this, {
        x: CENTRE_X,
        y: SLOT_CENTRE_Y,
        onBuy: (reward) => this._buy(reward),
      });
      slot = this._card.container;
    }
    slot.setAlpha(START_ALPHA);

    const here: TourStop = { venueId: data.worldId, gig: data.gig };
    const onward = passed ? nextStop(save, WORLD_DEFS, data.worldId, data.gig) : null;
    const following = this._followingVenue(data.worldId);
    const stars = venueStars(save, data.worldId);
    const recommended = recommendedGig(save, data.worldId);
    const path = createTourPath(this, {
      x: CENTRE_X,
      y: PATH_CENTRE_Y,
      venue,
      stars,
      open: stars.map((_, gig) => isGigOpen(save, data.worldId, gig)),
      played: data.gig,
      recommended,
      onPick: (gig) => void this._play({ venueId: data.worldId, gig }),
      following: following ? { venue: following, starsNeeded: starsToGo(save, following) } : null,
      onGo: (target) => void this._play({ venueId: target.id, gig: currentGig(save, target.id) }),
    });
    path.container.setAlpha(START_ALPHA);

    buildResultsButtons(this, {
      plan: planMain({
        passed,
        here,
        onward,
        stars,
        recommended,
        joins: onward ? joinsLine(data.worldId, data.gig, onward) : null,
      }),
      here,
      onPlay: (stop) => void this._play(stop),
      onHome: () => this._toMenu(),
    });

    score.start(() => {
      this._pill.setValue(saveManager.load().vault);
      if (mission.completed) {
        showToast(
          this,
          REQUEST_TOAST_X,
          REQUEST_TOAST_Y,
          `Request done! +${mission.mission.reward}`,
        );
      }
      this._announceGrannies(data.joinedGrannies ?? []);
      if (this._card) {
        const reward = nextReward(saveManager.load());
        this._card.show(reward, reward ? Math.min(1, vaultBefore / Math.max(1, reward.cost)) : 0);
      }
      this._fadeIn(slot, 0);
      this._worldCard?.celebrate();
      this._fadeIn(path.container, PATH_DELAY_MS);
    });
  }

  /** A granny who has just joined the band is announced with a toast, one after another, with what she is good at. */
  private _announceGrannies(ids: readonly string[]): void {
    ids.forEach((id, i) => {
      const granny = GRANNY_DEFS.find((g) => g.id === id);
      if (!granny) return;
      this.time.delayedCall(i * GRANNY_TOAST_GAP_MS, () => {
        showToast(this, CENTRE_X, PATH_CENTRE_Y, joinedMessage(granny));
        playStarChime(2);
      });
    });
  }

  /** The venue after this one on the tour, or null after the last. */
  private _followingVenue(worldId: string): WorldDef | null {
    const index = WORLD_DEFS.findIndex((w) => w.id === worldId);
    return WORLD_DEFS[index + 1] ?? null;
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

  /** Spends the coins, equips the purchase, celebrates, and moves the card on to the next thing to save for. */
  private _buy(reward: NextReward): void {
    if (!this._unlocks.buy(reward)) return;

    playStarChime(2);
    spawnConfetti(this, CENTRE_X, SLOT_CENTRE_Y, CONFETTI_COLOURS);
    showToast(
      this,
      CENTRE_X,
      PATH_CENTRE_Y,
      `${reward.kind === 'upgrade' ? 'Upgraded' : 'Unlocked'} ${reward.name}! ${reward.perk}`,
    );
    this._pill.setValue(this._unlocks.getVault());
    this._card?.show(nextReward(saveManager.load()));
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
    await startRoundAfterAdGate(adManager, AD_MUTE_HOOKS, (click) =>
      this.scene.start('GameScene', { ...next, ...click }),
    );
  }

  private _toMenu(): void {
    if (this._isLeaving) return;
    this._isLeaving = true;
    this.scene.start('HomeScene');
  }
}
