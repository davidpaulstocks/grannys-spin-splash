/**
 * Granny + Gun carousels, vault display, PLAY (CLAUDE.md §7.2, §10,
 * story 5.3). First scene the player ever sees; GameOverScene's Play
 * Again returns here too (full loop: splash → game → game over → splash,
 * Sprint 5 exit criteria) so progression/unlocks are always visible
 * between runs, not just once at boot.
 */

import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { SPRITE_KEYS } from '../assets/keys';
import { GRANNY_DEFS } from '../entities/granny/granny.data';
import { GUN_DEFS } from '../entities/gun/gun.data';
import { WORLD_DEFS } from '../entities/world/world.data';
import { worldBackgroundKey } from '../entities/world/worldBackgrounds';
import { adManager } from '../systems/AdManager';
import { AD_MUTE_HOOKS } from '../audio/AudioBus';
import { saveManager } from '../systems/SaveManager';
import { UnlockManager } from '../systems/UnlockManager';
import { createButton } from '../ui/Button';
import type { CarouselItem } from '../ui/Carousel';
import { CompactSelector, type CompactItem } from '../ui/CompactSelector';
import { drawStarIcon } from '../ui/icons';
import { LoadoutStage } from '../ui/LoadoutStage';
import { showToast } from '../ui/Toast';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { textStyle } from '../utils/typography';

/** Placeholder swatch colours standing in for real world backdrop thumbnails — one hero colour per world's vibe. */
const WORLD_SWATCH: Readonly<Record<string, number>> = {
  garden: COLOUR.mintGreen,
  workshop: COLOUR.heatOrange,
  kitchen: COLOUR.sunnyGold,
  funfair: COLOUR.grannyPink,
  disco: COLOUR.waterBlue,
};

const CAROUSEL_Y = 405;
const GRANNY_CAROUSEL_X = 170;
const WORLD_CAROUSEL_X = GAME_WIDTH * 0.5;
const GUN_CAROUSEL_X = 1110;
/** Random-unlock reward pool cap — a random gun at or below the player's current highest tier (CLAUDE.md §11.1). */
const REWARD_MAX_TIER = 4;

/** Where unlock/select feedback toasts appear — a shared anchor above PLAY, not per-carousel (CLAUDE.md §10). */
const SELECT_TOAST_Y = GAME_HEIGHT * 0.68;

/**
 * Title lockup — the illustrated flourish wreath sits behind the drippy
 * wordmark, both centred at the same point (CLAUDE.md §3 rule 6 bans
 * studio splash screens, not the game's own stylised title on its own
 * menu). Re-sized 2026-09-12 on direct user feedback: the flourish now
 * reads as a real background element (~520px wide) instead of a small
 * tight frame — everything below it (vault, carousels, buttons) got
 * pushed down/enlarged to match the bigger carousel cards.
 */
const TITLE_CENTRE_Y = 110;
const TITLE_WORDMARK_HEIGHT = 120;
const VAULT_Y = 205;
const PLAY_Y = 618;
const REWARD_Y = 676;

export class SplashScene extends Phaser.Scene {
  private _unlocks = new UnlockManager(saveManager);
  private _grannySelector!: CompactSelector;
  private _loadoutStage!: LoadoutStage;
  private _gunSelector!: CompactSelector;
  private _vaultText!: Phaser.GameObjects.Text;
  private _isStartingRun = false;

  constructor() {
    super('SplashScene');
  }

  create(): void {
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, COLOUR.cloud).setOrigin(0);
    this._buildTitle();
    this._buildVaultDisplay();

    this._grannySelector = new CompactSelector(
      this,
      GRANNY_CAROUSEL_X,
      CAROUSEL_Y,
      this._grannyItems(),
      this._unlocks.getSelectedGrannyId(),
      (id) => this._onTapGranny(id),
    );
    this._loadoutStage = new LoadoutStage(
      this,
      WORLD_CAROUSEL_X,
      CAROUSEL_Y,
      this._worldItems(),
      this._unlocks.getSelectedWorldId(),
      (id) => this._onTapWorld(id),
    );
    this._gunSelector = new CompactSelector(
      this,
      GUN_CAROUSEL_X,
      CAROUSEL_Y,
      this._gunItems(),
      this._unlocks.getSelectedGunId(),
      (id) => this._onTapGun(id),
    );
    this._loadoutStage.setGrannyTexture(
      SPRITE_KEYS.grannyPose(this._unlocks.getSelectedGrannyId(), 'front'),
    );
    this._loadoutStage.setGunTexture(SPRITE_KEYS.gunAngle(this._unlocks.getSelectedGunId(), 0));

    createButton(this, {
      x: GAME_WIDTH / 2,
      y: PLAY_Y,
      label: 'PLAY',
      variant: 'primary',
      minWidth: 300,
      onClick: () => void this._onPlay(),
    });

    this._buildRewardButton();
  }

  private _grannyItems(): CompactItem[] {
    return GRANNY_DEFS.map((g) => ({
      id: g.id,
      label: g.name,
      unlocked: this._unlocks.isGrannyUnlocked(g.id),
      cost: g.unlockCost,
    }));
  }

  private _gunItems(): CompactItem[] {
    return GUN_DEFS.map((g) => ({
      id: g.id,
      label: g.name,
      unlocked: this._unlocks.isGunUnlocked(g.id),
      cost: g.cost,
    }));
  }

  private _worldItems(): CarouselItem[] {
    return WORLD_DEFS.map((w) => {
      const bgKey = worldBackgroundKey(w.id);
      return {
        id: w.id,
        label: w.name,
        unlocked: this._unlocks.isWorldUnlocked(w.id),
        cost: w.unlockThreshold,
        swatchColour: WORLD_SWATCH[w.id] ?? COLOUR.softSlate,
        ...(bgKey ? { swatchTextureKey: bgKey } : {}),
      };
    });
  }

  /** CLAUDE.md §10: tapping a locked item spends vault stars to unlock it if affordable, else nudges to earn more. */
  private _onTapGranny(id: string): void {
    const def = GRANNY_DEFS.find((g) => g.id === id);
    if (!def) return;
    this._attemptUnlock({
      alreadyUnlocked: this._unlocks.isGrannyUnlocked(id),
      cost: def.unlockCost,
      name: def.name,
      unlock: () => this._unlocks.unlockGranny(id),
      select: () => this._unlocks.selectGranny(id),
      refresh: () => this._grannySelector.setItems(this._grannyItems()),
    });
    // Always re-derive from the authoritative selection, not the tapped id
    // — an unaffordable locked tap doesn't actually change what's equipped.
    this._loadoutStage.setGrannyTexture(
      SPRITE_KEYS.grannyPose(this._unlocks.getSelectedGrannyId(), 'front'),
    );
  }

  private _onTapWorld(id: string): void {
    const def = WORLD_DEFS.find((w) => w.id === id);
    if (!def) return;
    this._attemptUnlock({
      alreadyUnlocked: this._unlocks.isWorldUnlocked(id),
      cost: def.unlockThreshold,
      name: def.name,
      unlock: () => this._unlocks.unlockWorld(id),
      select: () => this._unlocks.selectWorld(id),
      refresh: () => this._loadoutStage.setItems(this._worldItems()),
    });
  }

  private _onTapGun(id: string): void {
    const def = GUN_DEFS.find((g) => g.id === id);
    if (!def) return;
    this._attemptUnlock({
      alreadyUnlocked: this._unlocks.isGunUnlocked(id),
      cost: def.cost,
      name: def.name,
      unlock: () => this._unlocks.unlockGun(id),
      select: () => this._unlocks.selectGun(id),
      refresh: () => this._gunSelector.setItems(this._gunItems()),
    });
    this._loadoutStage.setGunTexture(SPRITE_KEYS.gunAngle(this._unlocks.getSelectedGunId(), 0));
  }

  /**
   * Shared by all three carousels: an already-unlocked item just gets
   * selected. A locked one is an unlock *attempt* — spend vault stars and
   * select on success, or show how many more stars are needed.
   */
  private _attemptUnlock(item: {
    readonly alreadyUnlocked: boolean;
    readonly cost: number;
    readonly name: string;
    readonly unlock: () => boolean;
    readonly select: () => void;
    readonly refresh: () => void;
  }): void {
    if (item.alreadyUnlocked) {
      item.select();
      return;
    }
    if (item.unlock()) {
      item.select();
      item.refresh();
      this._refreshVaultText();
      showToast(this, GAME_WIDTH / 2, SELECT_TOAST_Y, `Unlocked ${item.name}!`);
      return;
    }
    const short = item.cost - this._unlocks.getVault();
    showToast(this, GAME_WIDTH / 2, SELECT_TOAST_Y, `Earn ${short}★ more to unlock ${item.name}`);
  }

  /**
   * The flourish wreath is the page's frame (2026-09-12 redesign, direct
   * user feedback — "make it the framing for the entire landscape screen,
   * everything else lives within it"): scaled to fill the whole 1280×720
   * canvas, sitting behind every other element as one continuous decorative
   * border. Its own painted ring occupies roughly the outer ~13-18% on each
   * edge with a large soft-transparent centre (by design, since it was
   * composed as a wreath) — every opaque card/button drawn on top of it
   * (Carousel's cloud-coloured cards, the pill buttons) simply masks the
   * art directly behind it, so legibility is never at risk; the wreath
   * shows through only in what would otherwise be empty cream margin,
   * which is exactly the "too much dead white space" complaint this also
   * answers. The wordmark sits near the top, independently sized, as the
   * actual title lockup. Falls back to plain styled text if either image
   * failed to load, rather than showing nothing.
   */
  private _buildTitle(): void {
    const hasArt =
      this.textures.exists(SPRITE_KEYS.titleFlourish) &&
      this.textures.exists(SPRITE_KEYS.titleWordmark);
    if (!hasArt) {
      this.add
        .text(
          GAME_WIDTH / 2,
          TITLE_CENTRE_Y + 10,
          "GRANNY'S SPIN SPLASH",
          textStyle('displayXL', COLOUR_HEX.grannyPink, COLOUR_HEX.ink),
        )
        .setOrigin(0.5);
      return;
    }

    const frame = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, SPRITE_KEYS.titleFlourish);
    frame.setScale(Math.max(GAME_WIDTH / frame.width, GAME_HEIGHT / frame.height));

    const wordmark = this.add.image(GAME_WIDTH / 2, TITLE_CENTRE_Y, SPRITE_KEYS.titleWordmark);
    wordmark.setScale(TITLE_WORDMARK_HEIGHT / wordmark.height);
  }

  private _buildVaultDisplay(): void {
    const y = VAULT_Y;
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
      y: REWARD_Y,
      label: 'Watch an ad for a free gun',
      variant: 'secondary',
      minWidth: 340,
      onClick: () => void this._onWatchAdForGun(),
    });
  }

  private async _onWatchAdForGun(): Promise<void> {
    const reward = this._unlocks.pickRandomLockedGun(REWARD_MAX_TIER);
    if (!reward) {
      showToast(this, GAME_WIDTH / 2, REWARD_Y - 50, 'All eligible guns already unlocked!');
      return;
    }

    const watched = await adManager.playRewarded('large', AD_MUTE_HOOKS);
    if (!watched) return;

    this._unlocks.grantGun(reward);
    this._gunSelector.setItems(this._gunItems());
    const unlockedName = GUN_DEFS.find((g) => g.id === reward)?.name ?? reward;
    showToast(this, GAME_WIDTH / 2, REWARD_Y - 50, `Unlocked ${unlockedName}!`);
  }

  /** CLAUDE.md §11.1: a commercial break shows before every *2nd* "Play Again" — AdManager tracks the cadence. */
  private async _onPlay(): Promise<void> {
    if (this._isStartingRun) return; // guards against a double-tap firing two commercial breaks
    this._isStartingRun = true;

    if (adManager.shouldShowCommercialBreak()) {
      await adManager.playCommercialBreak(AD_MUTE_HOOKS);
    }

    this.scene.start('GameScene', {
      grannyId: this._unlocks.getSelectedGrannyId(),
      gunId: this._unlocks.getSelectedGunId(),
      worldId: this._unlocks.getSelectedWorldId(),
    });
  }
}
