/**
 * Vault total, unlocked sets, validates unlock attempts, deducts gold
 * (CLAUDE.md §7.2, story 5.1). All persistence goes through SaveManager —
 * this class is the only thing allowed to decide *whether* an unlock is
 * valid; SaveManager just stores whatever it's told.
 */

import { GRANNY_DEFS } from '../entities/granny/granny.data';
import { isGrannyJoined } from './GrannyJoining';
import { GUN_DEFS } from '../entities/gun/gun.data';
import { clampGunLevel, gunLevelIn, upgradeCost } from '../entities/gun/gunLevels';
import { WORLD_DEFS } from '../entities/world/world.data';
import type { SaveManager } from './SaveManager';
import { isVenueOpen } from './Progress';

export class UnlockManager {
  constructor(private readonly _save: SaveManager) {}

  /** Current Granny Gold Vault total. */
  getVault(): number {
    return this._save.load().vault;
  }

  /** A granny is available once she is owned or the player's stars have reached her milestone (never bought: see GrannyJoining.ts). */
  isGrannyUnlocked(id: string): boolean {
    const save = this._save.load();
    const def = GRANNY_DEFS.find((g) => g.id === id);
    return def !== undefined && isGrannyJoined(save, def);
  }

  isGunUnlocked(id: string): boolean {
    return this._save.load().unlockedGuns.includes(id);
  }

  /** Venues open on total stars earned, never on coins (docs/ENGAGEMENT_DESIGN.md §4). */
  isWorldUnlocked(id: string): boolean {
    const venue = WORLD_DEFS.find((w) => w.id === id);
    return venue !== undefined && isVenueOpen(this._save.load(), venue);
  }

  getSelectedGrannyId(): string {
    return this._save.load().selectedGrannyId;
  }

  getSelectedGunId(): string {
    return this._save.load().selectedGunId;
  }

  getSelectedWorldId(): string {
    return this._save.load().selectedWorldId;
  }

  /** Adds stars earned from a run to the vault (CLAUDE.md §11.4 — earn-only, never purchasable). */
  addStars(amount: number): void {
    if (amount <= 0) return;
    const save = this._save.load();
    this._save.save({ ...save, vault: save.vault + amount });
  }

  /** Spends coins to unlock a gun. Returns false if already unlocked or vault is short. */
  unlockGun(id: string): boolean {
    const def = GUN_DEFS.find((g) => g.id === id);
    if (!def) return false;
    return this._unlock(id, def.cost);
  }

  /** A gun's upgrade level, 1 to 5; guns with no record (and old saves) are level 1. */
  getGunLevel(id: string): number {
    return gunLevelIn(this._save.load().gunLevels, id);
  }

  /** Spends coins to take an owned gun up one level. False if not owned, already at the maximum, or coins are short. */
  upgradeGun(id: string): boolean {
    const def = GUN_DEFS.find((g) => g.id === id);
    const save = this._save.load();
    if (!def || !save.unlockedGuns.includes(id)) return false;
    const level = this.getGunLevel(id);
    const cost = upgradeCost(def, level);
    if (cost === null || save.vault < cost) return false;
    const gunLevels = { ...save.gunLevels, [id]: clampGunLevel(level + 1) };
    this._save.save({ ...save, vault: save.vault - cost, gunLevels });
    return true;
  }

  /**
   * Buys what the results card offers: a gun is unlocked and equipped, an
   * upgrade raises the gun's level. False if it could not be bought. (Grannies
   * are never bought: they join at star milestones.)
   */
  buy(reward: { readonly kind: 'gun' | 'granny' | 'upgrade'; readonly id: string }): boolean {
    if (reward.kind === 'upgrade') return this.upgradeGun(reward.id);
    if (reward.kind !== 'gun' || !this.unlockGun(reward.id)) return false;
    this.selectGun(reward.id);
    return true;
  }

  /** Grants a gun for free — a successful rewarded-ad watch (CLAUDE.md §11.1/§11.4), never a purchase. */
  grantGun(id: string): void {
    const save = this._save.load();
    if (save.unlockedGuns.includes(id)) return;
    this._save.save({ ...save, unlockedGuns: [...save.unlockedGuns, id] });
  }

  /**
   * Picks a random currently-locked gun at or below `maxTier` — the reward
   * pool for CLAUDE.md §10/§11.1's "Watch ad → unlock random gun". Returns
   * null if nothing is left to grant (every eligible gun already unlocked).
   */
  pickRandomLockedGun(maxTier: number): string | null {
    const locked = GUN_DEFS.filter((g) => g.tier <= maxTier && !this.isGunUnlocked(g.id));
    if (locked.length === 0) return null;
    return locked[Math.floor(Math.random() * locked.length)].id;
  }

  /** Selects a granny for the next run. No-ops if it isn't unlocked. */
  selectGranny(id: string): void {
    if (!this.isGrannyUnlocked(id)) return;
    const save = this._save.load();
    this._save.save({ ...save, selectedGrannyId: id });
  }

  /** Selects a gun for the next run. No-ops if it isn't unlocked. */
  selectGun(id: string): void {
    if (!this.isGunUnlocked(id)) return;
    const save = this._save.load();
    this._save.save({ ...save, selectedGunId: id });
  }

  /** Selects a world for the next run. No-ops if it isn't unlocked. */
  selectWorld(id: string): void {
    if (!this.isWorldUnlocked(id)) return;
    const save = this._save.load();
    this._save.save({ ...save, selectedWorldId: id });
  }

  private _unlock(id: string, cost: number): boolean {
    const save = this._save.load();
    if (save.unlockedGuns.includes(id)) return false;
    if (save.vault < cost) return false;
    this._save.save({
      ...save,
      vault: save.vault - cost,
      unlockedGuns: [...save.unlockedGuns, id],
    });
    return true;
  }
}
