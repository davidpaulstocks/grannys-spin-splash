/**
 * Vault total, unlocked sets, validates unlock attempts, deducts gold
 * (CLAUDE.md §7.2, story 5.1). All persistence goes through SaveManager —
 * this class is the only thing allowed to decide *whether* an unlock is
 * valid; SaveManager just stores whatever it's told.
 */

import { GRANNY_DEFS } from '../entities/granny/granny.data';
import { GUN_DEFS } from '../entities/gun/gun.data';
import { WORLD_DEFS } from '../entities/world/world.data';
import type { SaveManager } from './SaveManager';

export class UnlockManager {
  constructor(private readonly _save: SaveManager) {}

  /** Current Granny Gold Vault total. */
  getVault(): number {
    return this._save.load().vault;
  }

  isGrannyUnlocked(id: string): boolean {
    return this._save.load().unlockedGrannies.includes(id);
  }

  isGunUnlocked(id: string): boolean {
    return this._save.load().unlockedGuns.includes(id);
  }

  isWorldUnlocked(id: string): boolean {
    return this._save.load().unlockedWorlds.includes(id);
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

  /** Spends vault stars to unlock a granny. Returns false if already unlocked or vault is short. */
  unlockGranny(id: string): boolean {
    const def = GRANNY_DEFS.find((g) => g.id === id);
    if (!def) return false;
    return this._unlock(id, def.unlockCost, 'unlockedGrannies');
  }

  /** Spends vault stars to unlock a gun. Returns false if already unlocked or vault is short. */
  unlockGun(id: string): boolean {
    const def = GUN_DEFS.find((g) => g.id === id);
    if (!def) return false;
    return this._unlock(id, def.cost, 'unlockedGuns');
  }

  /** Spends vault stars to unlock a world. Returns false if already unlocked or vault is short. */
  unlockWorld(id: string): boolean {
    const def = WORLD_DEFS.find((w) => w.id === id);
    if (!def) return false;
    return this._unlock(id, def.unlockThreshold, 'unlockedWorlds');
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

  private _unlock(
    id: string,
    cost: number,
    field: 'unlockedGrannies' | 'unlockedGuns' | 'unlockedWorlds',
  ): boolean {
    const save = this._save.load();
    if (save[field].includes(id)) return false;
    if (save.vault < cost) return false;
    this._save.save({ ...save, vault: save.vault - cost, [field]: [...save[field], id] });
    return true;
  }
}
