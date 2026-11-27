/**
 * The shop — docs/ENGAGEMENT_DESIGN.md §5. Grannies and guns, bought with
 * coins. It is deliberately off the path to play: the home screen has one
 * job, and choosing a loadout is not it.
 *
 * The middle stage previews the chosen granny and gun in the venue the
 * player is touring. Under it the gun rack lists every gun in price order, so
 * it is plain there are more guns and which one to save for. The between-runs
 * ad gate does not live here; nothing on this screen starts a gig.
 */

import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { SPRITE_KEYS } from '../assets/keys';
import { GRANNY_DEFS } from '../entities/granny/granny.data';
import { GUN_DEFS } from '../entities/gun/gun.data';
import { WORLD_DEFS } from '../entities/world/world.data';
import { worldBackgroundKey } from '../entities/world/worldBackgrounds';
import { GunShopping } from './shop/GunShopping';
import { buildShopTitle } from './shop/shopTitle';
import { adManager } from '../systems/AdManager';
import { AD_MUTE_HOOKS } from '../audio/AudioBus';
import { frontier } from '../systems/Progress';
import { saveManager } from '../systems/SaveManager';
import { UnlockManager } from '../systems/UnlockManager';
import { createButton } from '../ui/Button';
import type { CarouselItem } from '../ui/Carousel';
import { createGunRack, type GunRack, type GunRackItem } from '../ui/GunRack';
import { LoadoutStage } from '../ui/LoadoutStage';
import { createStatPill, type StatPill } from '../ui/StatPill';
import { ThumbnailSelector } from '../ui/ThumbnailSelector';
import { showToast } from '../ui/Toast';
import { COLOUR } from '../utils/colour';

/** Placeholder swatch colours standing in for real world backdrop thumbnails — one hero colour per world's vibe. */
const WORLD_SWATCH: Readonly<Record<string, number>> = {
  garden: COLOUR.mintGreen,
  workshop: COLOUR.heatOrange,
  kitchen: COLOUR.sunnyGold,
  funfair: COLOUR.grannyPink,
  disco: COLOUR.waterBlue,
};

/**
 * Vertical composition, top to bottom: wordmark (ends 170), the loadout row
 * (stage 340 tall, so 195-535), the gun rack (538-642), then DONE and the
 * rewarded button side by side (646-717). The gun card fills the right column
 * under the gun thumbnail (498-698). The coin readout is a pill top-left.
 */
const CAROUSEL_Y = 365;
/** Inset arrows keep each selector's footprint at its own width, so the three never overlap (2026-09-12). */
const GRANNY_CAROUSEL_X = 150;
const WORLD_CAROUSEL_X = GAME_WIDTH * 0.5;
const GUN_CAROUSEL_X = GAME_WIDTH - 150;
/** Random-unlock reward pool cap — a random gun at or below the player's current highest tier (CLAUDE.md §11.1). */
const REWARD_MAX_TIER = 4;
/** Where unlock/select feedback toasts appear — a shared anchor above the rack. */
const SELECT_TOAST_Y = GAME_HEIGHT * 0.68;
const VAULT_PILL_X = 104;
const VAULT_PILL_Y = 50;
const RACK_Y = 590;
const BUTTONS_Y = 678;
const DONE_X = 470;
const AD_X = 830;
/** The gun card: under the gun's thumbnail, inside the right column (498-698). */
const GUN_CARD_Y = 598;
/** CLAUDE.md §11.3: the standard continue button must be larger or equal to the rewarded one beside it. */
const BUTTON_MIN_WIDTH = 340;
const AD_TOAST_RISE = 50;

export class ShopScene extends Phaser.Scene {
  private _unlocks = new UnlockManager(saveManager);
  private _grannySelector!: ThumbnailSelector;
  private _loadoutStage!: LoadoutStage;
  private _gunSelector!: ThumbnailSelector;
  private _vaultPill!: StatPill;
  private _gunShopping!: GunShopping;
  private _rack!: GunRack;

  constructor() {
    super('ShopScene');
  }

  create(): void {
    // Phaser REUSES the scene instance, so `private _x = ...` initialisers run once; create() is the per-visit reset.
    buildShopTitle(this);
    this._vaultPill = createStatPill(
      this,
      VAULT_PILL_X,
      VAULT_PILL_Y,
      'coins',
      this._unlocks.getVault(),
    );

    this._grannySelector = new ThumbnailSelector(
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
      frontier(saveManager.load(), WORLD_DEFS).venueId,
      () => undefined,
    );
    this._gunSelector = new ThumbnailSelector(
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

    this._gunShopping = new GunShopping({
      scene: this,
      unlocks: this._unlocks,
      x: GUN_CAROUSEL_X,
      y: GUN_CARD_Y,
      toastY: SELECT_TOAST_Y,
      onChanged: () => {
        this._gunSelector.setItems(this._gunItems());
        this._refreshGunViews();
        this._vaultPill.setValue(this._unlocks.getVault());
      },
    });
    this._rack = createGunRack(this, {
      x: WORLD_CAROUSEL_X,
      y: RACK_Y,
      onPick: (id) => {
        this._gunSelector.selectId(id);
        this._onTapGun(id);
      },
    });
    this._refreshGunViews();

    createButton(this, {
      x: DONE_X,
      y: BUTTONS_Y,
      label: 'DONE',
      variant: 'primary',
      size: 'md',
      minWidth: BUTTON_MIN_WIDTH,
      onClick: () => this.scene.start('HomeScene'),
    });
    this._buildRewardButton();
  }

  /** The arrows change the shown gun without telling the scene; the gun card follows here. */
  override update(): void {
    this._gunShopping.sync(this._gunSelector.getSelectedId());
  }

  private _grannyItems(): CarouselItem[] {
    return GRANNY_DEFS.map((g) => ({
      id: g.id,
      label: g.name,
      unlocked: this._unlocks.isGrannyUnlocked(g.id),
      cost: g.unlockCost,
      swatchColour: COLOUR.grannyPink,
      swatchTextureKey: SPRITE_KEYS.grannyPose(g.id, 'front'),
    }));
  }

  private _gunItems(): CarouselItem[] {
    return GUN_DEFS.map((g) => ({
      id: g.id,
      label: g.name,
      unlocked: this._unlocks.isGunUnlocked(g.id),
      cost: g.cost,
      swatchColour: COLOUR.waterBlue,
      swatchTextureKey: SPRITE_KEYS.gunAngle(g.id, 0),
    }));
  }

  /** The stage shows one venue: the one being toured. Venues are chosen on the tour, not in the shop. */
  private _worldItems(): CarouselItem[] {
    const venueId = frontier(saveManager.load(), WORLD_DEFS).venueId;
    return WORLD_DEFS.filter((w) => w.id === venueId).map((w) => {
      const bgKey = worldBackgroundKey(w.id);
      return {
        id: w.id,
        label: w.name,
        unlocked: true,
        cost: 0,
        swatchColour: WORLD_SWATCH[w.id] ?? COLOUR.softSlate,
        ...(bgKey ? { swatchTextureKey: bgKey } : {}),
      };
    });
  }

  /** CLAUDE.md §10: tapping a locked granny spends coins to unlock it if affordable, else says how many more are needed. */
  private _onTapGranny(id: string): void {
    const def = GRANNY_DEFS.find((g) => g.id === id);
    if (!def) return;
    if (this._unlocks.isGrannyUnlocked(id)) {
      this._unlocks.selectGranny(id);
    } else if (this._unlocks.unlockGranny(id)) {
      this._unlocks.selectGranny(id);
      this._grannySelector.setItems(this._grannyItems());
      this._vaultPill.setValue(this._unlocks.getVault());
      showToast(this, GAME_WIDTH / 2, SELECT_TOAST_Y, `Unlocked ${def.name}!`);
    } else {
      const short = def.unlockCost - this._unlocks.getVault();
      showToast(
        this,
        GAME_WIDTH / 2,
        SELECT_TOAST_Y,
        `${short} more ${short === 1 ? 'coin' : 'coins'} to unlock ${def.name}`,
      );
    }
    // Re-derive from the authoritative selection: an unaffordable tap does not change what is equipped.
    this._loadoutStage.setGrannyTexture(
      SPRITE_KEYS.grannyPose(this._unlocks.getSelectedGrannyId(), 'front'),
    );
  }

  /**
   * A gun was picked (arrows, thumbnail or rack). An owned gun is equipped; a
   * locked one is only shown: it is bought with the card's BUY button, whose
   * price is printed on it, never by stepping past it.
   */
  private _onTapGun(id: string): void {
    if (this._unlocks.isGunUnlocked(id)) this._unlocks.selectGun(id);
    this._refreshGunViews();
  }

  /** Redraws everything that follows the equipped or shown gun: stage, card and rack. */
  private _refreshGunViews(): void {
    this._loadoutStage.setGunTexture(SPRITE_KEYS.gunAngle(this._unlocks.getSelectedGunId(), 0));
    this._gunShopping.show(this._gunSelector.getSelectedId());
    this._rack.setItems(this._rackItems());
  }

  /** Every gun in price order, flagged for what the rack draws. */
  private _rackItems(): GunRackItem[] {
    const equipped = this._unlocks.getSelectedGunId();
    const ordered = [...GUN_DEFS].sort((a, b) => a.cost - b.cost);
    const next = ordered.find((g) => !this._unlocks.isGunUnlocked(g.id));
    return ordered.map((g) => ({
      id: g.id,
      owned: this._unlocks.isGunUnlocked(g.id),
      equipped: g.id === equipped,
      level: this._unlocks.getGunLevel(g.id),
      price: g.cost,
      isNext: g.id === next?.id,
    }));
  }

  /** CLAUDE.md §11.1/§11.3: rewarded button must never be Mint Green, must be visible alongside DONE, one reward per ad. */
  private _buildRewardButton(): void {
    createButton(this, {
      x: AD_X,
      y: BUTTONS_Y,
      label: 'Watch an ad for a free gun',
      variant: 'reward',
      size: 'sm',
      minWidth: BUTTON_MIN_WIDTH,
      showPlayIcon: true,
      // Keeps its hit zone at its drawn size: DONE sits beside it and an expanded zone could steal its taps.
      expandHitArea: false,
      onClick: () => void this._onWatchAdForGun(),
    });
  }

  private async _onWatchAdForGun(): Promise<void> {
    const reward = this._unlocks.pickRandomLockedGun(REWARD_MAX_TIER);
    if (!reward) {
      showToast(
        this,
        GAME_WIDTH / 2,
        BUTTONS_Y - AD_TOAST_RISE,
        'All eligible guns already unlocked!',
      );
      return;
    }

    const watched = await adManager.playRewarded('large', AD_MUTE_HOOKS);
    if (!watched) return;

    this._unlocks.grantGun(reward);
    this._gunSelector.setItems(this._gunItems());
    this._refreshGunViews();
    const unlockedName = GUN_DEFS.find((g) => g.id === reward)?.name ?? reward;
    showToast(this, GAME_WIDTH / 2, BUTTONS_Y - AD_TOAST_RISE, `Unlocked ${unlockedName}!`);
  }
}
