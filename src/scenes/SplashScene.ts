/**
 * Granny + Gun carousels, vault display, PLAY (CLAUDE.md §7.2, §10,
 * story 5.3). First scene the player ever sees; GameOverScene's Play
 * Again returns here too (full loop: splash → game → game over → splash,
 * Sprint 5 exit criteria) so progression/unlocks are always visible
 * between runs, not just once at boot.
 */

import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { GRANNY_DEFS } from '../entities/granny/granny.data';
import { GUN_DEFS } from '../entities/gun/gun.data';
import * as poki from '../poki';
import { adManager } from '../systems/AdManager';
import { saveManager } from '../systems/SaveManager';
import { UnlockManager } from '../systems/UnlockManager';
import { createButton } from '../ui/Button';
import { Carousel, type CarouselItem } from '../ui/Carousel';
import { drawStarIcon } from '../ui/icons';
import { showToast } from '../ui/Toast';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { textStyle } from '../utils/typography';

/** Placeholder swatch colours standing in for real sprite art (Sprint 3) — not game data, purely presentational. */
const GRANNY_SWATCH: Readonly<Record<string, number>> = {
  classic: COLOUR.grannyPink,
  squirt: COLOUR.sunnyGold,
  punk: COLOUR.softSlate,
};
const GUN_TIER_SWATCH: Readonly<Record<number, number>> = {
  1: COLOUR.softSlate,
  2: COLOUR.waterBlue,
  3: COLOUR.heatOrange,
  4: COLOUR.grannyPink,
};

const CAROUSEL_Y = GAME_HEIGHT * 0.5;
const GRANNY_CAROUSEL_X = GAME_WIDTH * 0.3;
const GUN_CAROUSEL_X = GAME_WIDTH * 0.7;
/** Random-unlock reward pool cap — a random gun at or below the player's current highest tier (CLAUDE.md §11.1). */
const REWARD_MAX_TIER = 4;

export class SplashScene extends Phaser.Scene {
  private _unlocks = new UnlockManager(saveManager);
  private _gunCarousel!: Carousel;
  private _vaultText!: Phaser.GameObjects.Text;
  private _isStartingRun = false;

  constructor() {
    super('SplashScene');
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLOUR.cloud).setOrigin(0);
    this.add
      .text(
        GAME_WIDTH / 2,
        90,
        "GRANNY'S SPIN SPLASH",
        textStyle('displayXL', COLOUR_HEX.grannyPink, COLOUR_HEX.ink),
      )
      .setOrigin(0.5);

    this._buildVaultDisplay();

    // No refresh hook needed for this one (yet) — v1's only rewarded-unlock flow targets guns.
    new Carousel(
      this,
      GRANNY_CAROUSEL_X,
      CAROUSEL_Y,
      this._grannyItems(),
      this._unlocks.getSelectedGrannyId(),
      (id) => this._unlocks.selectGranny(id),
    );
    this._gunCarousel = new Carousel(
      this,
      GUN_CAROUSEL_X,
      CAROUSEL_Y,
      this._gunItems(),
      this._unlocks.getSelectedGunId(),
      (id) => this._unlocks.selectGun(id),
    );

    createButton(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT * 0.78,
      label: 'PLAY',
      variant: 'primary',
      minWidth: 300,
      onClick: () => void this._onPlay(),
    });

    this._buildRewardButton();

    poki.gameLoadingFinished();
  }

  private _grannyItems(): CarouselItem[] {
    return GRANNY_DEFS.map((g) => ({
      id: g.id,
      label: g.name,
      unlocked: this._unlocks.isGrannyUnlocked(g.id),
      cost: g.unlockCost,
      swatchColour: GRANNY_SWATCH[g.id] ?? COLOUR.softSlate,
    }));
  }

  private _gunItems(): CarouselItem[] {
    return GUN_DEFS.map((g) => ({
      id: g.id,
      label: g.name,
      unlocked: this._unlocks.isGunUnlocked(g.id),
      cost: g.cost,
      swatchColour: GUN_TIER_SWATCH[g.tier] ?? COLOUR.softSlate,
    }));
  }

  private _buildVaultDisplay(): void {
    const y = 170;
    const starGfx = this.add.graphics().setPosition(GAME_WIDTH / 2 - 70, y);
    drawStarIcon(starGfx, 14, COLOUR.sunnyGold);
    this._vaultText = this.add
      .text(GAME_WIDTH / 2 - 48, y, '', textStyle('bodyL', COLOUR_HEX.ink, COLOUR_HEX.cloud))
      .setOrigin(0, 0.5);
    this._refreshVaultText();
  }

  private _refreshVaultText(): void {
    this._vaultText.setText(`${this._unlocks.getVault()} in the vault`);
  }

  /** CLAUDE.md §11.1/§11.3: rewarded button must never be Mint Green, must be visible alongside PLAY, one reward per ad. */
  private _buildRewardButton(): void {
    createButton(this, {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT * 0.88,
      label: 'Watch an ad for a free gun',
      variant: 'secondary',
      minWidth: 340,
      onClick: () => void this._onWatchAdForGun(),
    });
  }

  private async _onWatchAdForGun(): Promise<void> {
    const reward = this._unlocks.pickRandomLockedGun(REWARD_MAX_TIER);
    if (!reward) {
      showToast(
        this,
        GAME_WIDTH / 2,
        GAME_HEIGHT * 0.88 - 50,
        'All eligible guns already unlocked!',
      );
      return;
    }

    const watched = await poki.rewardedBreak('large');
    if (!watched) return;

    this._unlocks.grantGun(reward);
    this._gunCarousel.setItems(this._gunItems());
    const unlockedName = GUN_DEFS.find((g) => g.id === reward)?.name ?? reward;
    showToast(this, GAME_WIDTH / 2, GAME_HEIGHT * 0.88 - 50, `Unlocked ${unlockedName}!`);
  }

  /** CLAUDE.md §11.1: a commercial break shows before every *2nd* "Play Again" — AdManager tracks the cadence. */
  private async _onPlay(): Promise<void> {
    if (this._isStartingRun) return; // guards against a double-tap firing two commercial breaks
    this._isStartingRun = true;

    if (adManager.shouldShowCommercialBreak()) {
      await adManager.playCommercialBreak();
    }

    this.scene.start('GameScene', {
      grannyId: this._unlocks.getSelectedGrannyId(),
      gunId: this._unlocks.getSelectedGunId(),
    });
  }
}
