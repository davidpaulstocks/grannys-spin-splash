/**
 * All localStorage I/O — try/catch wrapped, JSON serialised. CLAUDE.md
 * §7.3 rule 7.
 *
 * `load()` caches after its first read so repeated calls in one frame
 * don't hit localStorage repeatedly — but that means two independent
 * `SaveManager` instances (e.g. one per scene) can drift: one writes
 * through `save()`, the other's stale cache never finds out. Confirmed
 * live (Sprint 5): GameScene's own instance correctly banked a run's
 * score, but SplashScene's separate instance still showed the vault at 0
 * after "Play Again". Fixed by exporting one shared `saveManager`
 * singleton below — every scene imports and uses *that*, not `new
 * SaveManager()`. The class itself stays exported for tests, which
 * deliberately want fresh, isolated instances.
 */

import { DEFAULT_GRANNY_ID, GRANNY_DEFS } from '../entities/granny/granny.data';
import { DEFAULT_GUN_ID, GUN_DEFS } from '../entities/gun/gun.data';
import { DEFAULT_WORLD_ID, WORLD_DEFS } from '../entities/world/world.data';
import { SAVE_VERSION, type SaveData } from '../types/save';

const STORAGE_KEY = 'grannySpinSplash.save.v1';

/**
 * Wraps every read/write of the player's persisted progress. Every
 * localStorage call is try/catch guarded so incognito mode (or any
 * environment that throws on storage access) never crashes the game
 * (CLAUDE.md §3 rule 4) — it silently falls back to an in-memory default.
 */
export class SaveManager {
  private _cache: SaveData | null = null;

  /** Returns the player's saved progress, or a fresh default if none exists / storage is blocked. */
  load(): SaveData {
    if (!this._cache) {
      this._cache = this._readFromStorage() ?? this._defaultSave();
    }
    return this._cache;
  }

  /** Persists progress. Never throws — silently no-ops if storage is unavailable. */
  save(data: SaveData): void {
    this._cache = data;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Incognito / storage disabled — gameplay must never be gated on this (CLAUDE.md §3 rule 4).
    }
  }

  private _readFromStorage(): SaveData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<SaveData>;
      if (parsed.version !== SAVE_VERSION) return null; // no migrations exist yet at v1
      return { ...this._defaultSave(), ...parsed };
    } catch {
      return null;
    }
  }

  /**
   * A fresh player starts with every 0★ launch item already unlocked, not
   * just the single default — CLAUDE.md §8.1's roster has two free
   * grannies and two free guns specifically "to validate the splash-screen
   * carousel works with multiple unlocked items from run one".
   */
  private _defaultSave(): SaveData {
    return {
      version: SAVE_VERSION,
      vault: 0,
      unlockedGrannies: GRANNY_DEFS.filter((g) => g.unlockCost === 0).map((g) => g.id),
      unlockedGuns: GUN_DEFS.filter((g) => g.cost === 0).map((g) => g.id),
      unlockedWorlds: WORLD_DEFS.filter((w) => w.unlockThreshold === 0).map((w) => w.id),
      selectedGrannyId: DEFAULT_GRANNY_ID,
      selectedGunId: DEFAULT_GUN_ID,
      selectedWorldId: DEFAULT_WORLD_ID,
      highScore: 0,
    };
  }
}

/** The one shared instance every scene/system should use — see the class-level doc comment for why. */
export const saveManager = new SaveManager();
