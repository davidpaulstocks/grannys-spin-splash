/**
 * SaveManager unit tests (story 1.1). Covers the localStorage try/catch
 * contract — incognito mode must never throw or block gameplay.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_GRANNY_ID } from '../../src/data/grannies';
import { DEFAULT_GUN_ID } from '../../src/data/guns';
import { SaveManager } from '../../src/systems/SaveManager';
import { SAVE_VERSION } from '../../src/types/save';

describe('SaveData schema', () => {
  it('starts at version 1 for the v1 launch', () => {
    expect(SAVE_VERSION).toBe(1);
  });
});

describe('SaveManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns a fresh default save when nothing is stored', () => {
    const save = new SaveManager().load();
    expect(save.vault).toBe(0);
    expect(save.highScore).toBe(0);
    expect(save.selectedGrannyId).toBe(DEFAULT_GRANNY_ID);
    expect(save.selectedGunId).toBe(DEFAULT_GUN_ID);
  });

  it('round-trips a save through localStorage', () => {
    const manager = new SaveManager();
    const data = manager.load();
    manager.save({ ...data, vault: 250, highScore: 999 });

    const reloaded = new SaveManager().load();
    expect(reloaded.vault).toBe(250);
    expect(reloaded.highScore).toBe(999);
  });

  it('falls back to defaults when the stored payload is a different schema version', () => {
    localStorage.setItem('grannySpinSplash.save.v1', JSON.stringify({ version: 999, vault: 5000 }));
    expect(new SaveManager().load().vault).toBe(0);
  });

  it('never throws when localStorage.getItem throws (incognito mode)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked');
    });
    expect(() => new SaveManager().load()).not.toThrow();
    vi.restoreAllMocks();
  });

  it('never throws when localStorage.setItem throws (incognito mode)', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('blocked');
    });
    const manager = new SaveManager();
    expect(() => manager.save(manager.load())).not.toThrow();
    vi.restoreAllMocks();
  });
});
