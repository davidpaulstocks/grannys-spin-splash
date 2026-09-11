/** All localStorage I/O — try/catch wrapped, JSON serialised. CLAUDE.md §7.3 rule 7. */

import { DEFAULT_GRANNY_ID } from '../entities/granny/granny.data';
import { DEFAULT_GUN_ID } from '../entities/gun/gun.data';
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

  private _defaultSave(): SaveData {
    return {
      version: SAVE_VERSION,
      vault: 0,
      unlockedGrannies: [DEFAULT_GRANNY_ID],
      unlockedGuns: [DEFAULT_GUN_ID],
      selectedGrannyId: DEFAULT_GRANNY_ID,
      selectedGunId: DEFAULT_GUN_ID,
      highScore: 0,
    };
  }
}
