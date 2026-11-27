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
import { GunShopping } from './shop/GunShopping';
import { isMysteryGun, MYSTERY_MESSAGE } from './shop/mystery';
import { grannyItems, gunItems, worldItems } from './shop/shopItems';
import { buildShopTitle } from './shop/shopTitle';
import { adManager } from '../systems/AdManager';
import { AD_MUTE_HOOKS } from '../audio/AudioBus';
import { joinLine, starsUntilJoin } from '../systems/GrannyJoining';
import { frontier } from '../systems/Progress';
import { saveManager } from '../systems/SaveManager';
import { UnlockManager } from '../systems/UnlockManager';
import { createButton } from '../ui/Button';
import { createGunRack, type GunRack, type GunRackItem } from '../ui/GunRack';
import { powerText } from '../ui/gunRarity';
import { LoadoutStage } from '../ui/LoadoutStage';
import { createGrannyTalentCard, type GrannyTalentCard } from '../ui/GrannyTalentCard';
import { createStatPill, type StatPill } from '../ui/StatPill';
import { ThumbnailSelector } from '../ui/ThumbnailSelector';
import { showToast } from '../ui/Toast';

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
const REWARD_MAX_TIER = 3;
/** Where unlock/select feedback toasts appear — a shared anchor above the rack. */
const SELECT_TOAST_Y = GAME_HEIGHT * 0.68;
const VAULT_PILL_X = 104;
const VAULT_PILL_Y = 50;
const RACK_Y = 590;
/** The granny's talent card hangs under her selector (which ends at 481), left of the gun rack. */
const TALENT_CARD_Y = 540;
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
  private _talentCard!: GrannyTalentCard;
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
      grannyItems(this._unlocks),
      this._unlocks.getSelectedGrannyId(),
      (id) => this._onTapGranny(id),
    );
    this._talentCard = createGrannyTalentCard(this, GRANNY_CAROUSEL_X, TALENT_CARD_Y);
    this._showTalent(this._grannySelector.getSelectedId());
    this._loadoutStage = new LoadoutStage(
      this,
      WORLD_CAROUSEL_X,
      CAROUSEL_Y,
      worldItems(),
      frontier(saveManager.load(), WORLD_DEFS).venueId,
      () => undefined,
    );
    this._gunSelector = new ThumbnailSelector(
      this,
      GUN_CAROUSEL_X,
      CAROUSEL_Y,
      gunItems(this._unlocks),
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
        this._gunSelector.setItems(gunItems(this._unlocks));
        this._refreshGunViews();
        this._vaultPill.setValue(this._unlocks.getVault());
      },
    });
    this._rack = createGunRack(this, {
      x: WORLD_CAROUSEL_X,
      y: RACK_Y,
      onPick: (id) => {
        if (isMysteryGun(this._unlocks, id)) {
          showToast(this, GAME_WIDTH / 2, SELECT_TOAST_Y, MYSTERY_MESSAGE);
          return;
        }
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

  /** Fills the talent card for granny `id`: her talent, and while she is locked the stars she joins at. */
  private _showTalent(id: string): void {
    const def = GRANNY_DEFS.find((g) => g.id === id);
    if (def) this._talentCard.show(def, this._unlocks.isGrannyUnlocked(id) ? null : joinLine(def));
  }

  /** A granny is picked: an owned one is equipped; a locked one only says how many stars she needs (stars are never spent). */
  private _onTapGranny(id: string): void {
    const def = GRANNY_DEFS.find((g) => g.id === id);
    if (!def) return;
    const save = saveManager.load();
    if (this._unlocks.isGrannyUnlocked(id)) {
      this._unlocks.selectGranny(id);
    } else {
      const toGo = starsUntilJoin(save, def);
      showToast(
        this,
        GAME_WIDTH / 2,
        SELECT_TOAST_Y,
        `${toGo} more ${toGo === 1 ? 'star' : 'stars'} and ${def.name} joins`,
      );
    }
    this._showTalent(id);
    // Re-derive from the authoritative selection: a tap on a locked granny does not change what is equipped.
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
    this._loadoutStage.setGunTexture(SPRITE_KEYS.gun(this._unlocks.getSelectedGunId()));
    this._gunShopping.show(this._gunSelector.getSelectedId());
    this._rack.setItems(this._rackItems());
  }

  /** Every gun in price order, flagged for what the rack draws. */
  private _rackItems(): GunRackItem[] {
    const equipped = this._unlocks.getSelectedGunId();
    const ordered = [...GUN_DEFS].sort((a, b) => a.cost - b.cost);
    const next = ordered.find((g) => !this._unlocks.isGunUnlocked(g.id));
    return ordered.map((g) => {
      const owned = this._unlocks.isGunUnlocked(g.id);
      const level = this._unlocks.getGunLevel(g.id);
      return {
        id: g.id,
        owned,
        equipped: g.id === equipped,
        level,
        price: g.cost,
        isNext: g.id === next?.id,
        rarity: g.rarity,
        power: powerText(g.id, level),
        silhouette: isMysteryGun(this._unlocks, g.id),
      };
    });
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
    this._gunSelector.setItems(gunItems(this._unlocks));
    this._refreshGunViews();
    const unlockedName = GUN_DEFS.find((g) => g.id === reward)?.name ?? reward;
    showToast(this, GAME_WIDTH / 2, BUTTONS_Y - AD_TOAST_RISE, `Unlocked ${unlockedName}!`);
  }
}
