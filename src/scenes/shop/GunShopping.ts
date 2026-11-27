/**
 * The Shop's gun purchases: works out what the gun card shows for the
 * selected gun, and carries out its BUY / UPGRADE button. Buying a gun spends
 * the coins, equips it and plays the gun reveal; upgrading spends, pops the
 * new pip and sparkles; short of coins it says how many more are needed. The
 * scene owns the screen; this owns the transaction.
 */

import type Phaser from 'phaser';

import { GAME_WIDTH } from '../../config';
import { playStarChime } from '../../audio/ResultsMusic';
import { GUN_DEFS } from '../../entities/gun/gun.data';
import { upgradeCost } from '../../entities/gun/gunLevels';
import { formatCount } from '../../systems/Rewards';
import type { UnlockManager } from '../../systems/UnlockManager';
import { createGunCard, type GunCard } from '../../ui/GunCard';
import { buyGunWithReveal } from '../../ui/gunPurchase';
import { showToast } from '../../ui/Toast';
import { gunCardState } from './gunCardState';

const UPGRADE_CHIME = 1;

export interface GunShoppingConfig {
  readonly scene: Phaser.Scene;
  readonly unlocks: UnlockManager;
  /** Centre of the gun card. */
  readonly x: number;
  readonly y: number;
  /** Where feedback toasts appear. */
  readonly toastY: number;
  /** Called after a purchase so the scene can refresh what it draws from the save (thumbnails, rack, stage, coin pill). */
  readonly onChanged: () => void;
}

export class GunShopping {
  private _shownId = '';
  private readonly _card: GunCard;

  constructor(private readonly _config: GunShoppingConfig) {
    this._card = createGunCard(_config.scene, {
      x: _config.x,
      y: _config.y,
      onAction: (id) => this.act(id),
    });
  }

  /** Shows gun `id` if the card is not already on it (the thumbnail's arrows change the gun without telling the scene). */
  sync(id: string): void {
    if (id !== this._shownId) this.show(id);
  }

  /** Redraws the card for gun `id`; when `bounceFrom` is given, pips from there up to the level pop in and the numbers count. */
  show(id: string, bounceFrom?: number): void {
    const def = GUN_DEFS.find((g) => g.id === id);
    if (!def) return;
    this._shownId = id;
    this._card.show(gunCardState(this._config.unlocks, def), bounceFrom);
  }

  /** The button was pressed: true when it went through, false (with a toast) when coins were short. */
  act(id: string): boolean {
    const def = GUN_DEFS.find((g) => g.id === id);
    if (!def) return false;
    const { scene, unlocks, toastY } = this._config;
    const wasOwned = unlocks.isGunUnlocked(id);
    const before = unlocks.getGunLevel(id);
    const price = wasOwned ? upgradeCost(def, before) : def.cost;
    if (price === null) return false;
    if (unlocks.getVault() < price) {
      const short = formatCount(price - unlocks.getVault());
      showToast(scene, GAME_WIDTH / 2, toastY, `${short} more coins needed`);
      return false;
    }
    if (!wasOwned) {
      const bought = buyGunWithReveal(scene, id, () => {
        this._config.onChanged();
        this.show(id);
      });
      this._config.onChanged();
      this.show(id);
      return bought;
    }
    if (!unlocks.upgradeGun(id)) return false;
    playStarChime(UPGRADE_CHIME);
    showToast(scene, GAME_WIDTH / 2, toastY, `${def.name} is level ${unlocks.getGunLevel(id)}!`);
    this._config.onChanged();
    this.show(id, before);
    return true;
  }
}
