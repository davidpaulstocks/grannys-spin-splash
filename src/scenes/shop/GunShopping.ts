/**
 * The Shop's gun purchases: works out what the gun card shows for the
 * selected gun, and carries out its BUY / UPGRADE button (spend, celebrate,
 * refill the pips, or say how many coins are missing). The scene owns the
 * screen; this owns the transaction.
 */

import type Phaser from 'phaser';

import { GAME_WIDTH } from '../../config';
import { playStarChime } from '../../audio/ResultsMusic';
import { GUN_DEFS } from '../../entities/gun/gun.data';
import { upgradeCost } from '../../entities/gun/gunLevels';
import { spawnConfetti } from '../../entities/waterParticle/splashVFX';
import { formatCount, gunPerk } from '../../systems/Rewards';
import type { UnlockManager } from '../../systems/UnlockManager';
import { createGunCard, type GunCard } from '../../ui/GunCard';
import { showToast } from '../../ui/Toast';
import { COLOUR } from '../../utils/colour';

const CONFETTI_COLOURS = [COLOUR.grannyPink, COLOUR.sunnyGold, COLOUR.waterBlue, COLOUR.mintGreen];

export interface GunShoppingConfig {
  readonly scene: Phaser.Scene;
  readonly unlocks: UnlockManager;
  /** Centre of the gun card, which is also where the confetti bursts. */
  readonly x: number;
  readonly y: number;
  /** Where feedback toasts appear. */
  readonly toastY: number;
  /** Called after a purchase so the scene can refresh what it draws from the save (thumbnails, stage, coin pill). */
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

  /** Redraws the card for gun `id`; when `bounceFrom` is given, pips from there up to the level pop in. */
  show(id: string, bounceFrom?: number): void {
    const def = GUN_DEFS.find((g) => g.id === id);
    if (!def) return;
    const { unlocks } = this._config;
    this._shownId = id;
    const owned = unlocks.isGunUnlocked(id);
    const level = unlocks.getGunLevel(id);
    const price = owned ? upgradeCost(def, level) : def.cost;
    this._card.show(
      {
        gunId: id,
        owned,
        level,
        perk: gunPerk(def, level),
        price,
        canAfford: price !== null && unlocks.getVault() >= price,
      },
      bounceFrom,
    );
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
    if (!(wasOwned ? unlocks.upgradeGun(id) : unlocks.unlockGun(id))) {
      const short = formatCount(price - unlocks.getVault());
      showToast(scene, GAME_WIDTH / 2, toastY, `${short} more coins needed`);
      return false;
    }
    if (!wasOwned) unlocks.selectGun(id);
    playStarChime(2);
    spawnConfetti(scene, this._config.x, this._config.y, CONFETTI_COLOURS);
    const message = wasOwned
      ? `${def.name} is level ${unlocks.getGunLevel(id)}!`
      : `Unlocked ${def.name}!`;
    showToast(scene, GAME_WIDTH / 2, toastY, message);
    this._config.onChanged();
    this.show(id, wasOwned ? before : 0);
    return true;
  }
}
