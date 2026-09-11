/** UnlockManager unit tests — vault, unlock validation, selection (story 5.1). */

import { beforeEach, describe, expect, it } from 'vitest';

import { SaveManager } from '../../src/systems/SaveManager';
import { UnlockManager } from '../../src/systems/UnlockManager';

describe('UnlockManager', () => {
  let save: SaveManager;
  let unlocks: UnlockManager;

  beforeEach(() => {
    localStorage.clear();
    save = new SaveManager();
    unlocks = new UnlockManager(save);
  });

  it('starts with an empty vault and every 0★ launch item already unlocked', () => {
    expect(unlocks.getVault()).toBe(0);
    expect(unlocks.isGrannyUnlocked('classic')).toBe(true); // 0★ cost
    expect(unlocks.isGrannyUnlocked('squirt')).toBe(true); // also 0★ cost
    expect(unlocks.isGrannyUnlocked('punk')).toBe(false); // 500★ cost
    expect(unlocks.isGunUnlocked('pistol')).toBe(true); // 0★ cost
    expect(unlocks.isGunUnlocked('squirter')).toBe(true); // also 0★ cost
    expect(unlocks.isGunUnlocked('hose')).toBe(false); // 200★ cost
    expect(unlocks.isWorldUnlocked('garden')).toBe(true); // 0★ cost
    expect(unlocks.isWorldUnlocked('workshop')).toBe(false); // 500★ cost
  });

  it('addStars() accumulates into the vault and persists', () => {
    unlocks.addStars(100);
    unlocks.addStars(50);
    expect(unlocks.getVault()).toBe(150);
    expect(new UnlockManager(new SaveManager()).getVault()).toBe(150);
  });

  it('addStars() ignores non-positive amounts', () => {
    unlocks.addStars(-50);
    unlocks.addStars(0);
    expect(unlocks.getVault()).toBe(0);
  });

  it('unlockGranny() fails when the vault is short, succeeds once it is enough', () => {
    unlocks.addStars(499);
    expect(unlocks.unlockGranny('punk')).toBe(false);
    expect(unlocks.isGrannyUnlocked('punk')).toBe(false);
    expect(unlocks.getVault()).toBe(499); // nothing deducted on failure

    unlocks.addStars(1);
    expect(unlocks.unlockGranny('punk')).toBe(true);
    expect(unlocks.isGrannyUnlocked('punk')).toBe(true);
    expect(unlocks.getVault()).toBe(0); // full cost deducted
  });

  it('unlockGun() fails on an already-unlocked gun (no double-spend)', () => {
    unlocks.addStars(1000);
    expect(unlocks.unlockGun('pistol')).toBe(false); // already unlocked at 0★
    expect(unlocks.getVault()).toBe(1000); // untouched
  });

  it('unlockGranny()/unlockGun() fail silently for an unknown id', () => {
    unlocks.addStars(10000);
    expect(unlocks.unlockGranny('nonexistent')).toBe(false);
    expect(unlocks.unlockGun('nonexistent')).toBe(false);
  });

  it('grantGun() unlocks for free, does not touch the vault, is idempotent', () => {
    unlocks.addStars(10);
    unlocks.grantGun('hose');
    expect(unlocks.isGunUnlocked('hose')).toBe(true);
    expect(unlocks.getVault()).toBe(10);

    unlocks.grantGun('hose'); // granting again is a no-op, not an error
    expect(unlocks.isGunUnlocked('hose')).toBe(true);
  });

  it('pickRandomLockedGun() only returns guns at or below maxTier that are still locked', () => {
    for (let i = 0; i < 20; i++) {
      const picked = unlocks.pickRandomLockedGun(2);
      expect(picked === null || ['hose', 'splashjr'].includes(picked)).toBe(true);
    }
  });

  it('pickRandomLockedGun() returns null once nothing eligible remains', () => {
    unlocks.grantGun('hose');
    unlocks.grantGun('squirter');
    expect(unlocks.pickRandomLockedGun(1)).toBeNull(); // tier-1 guns (pistol/squirter) all unlocked
  });

  it('selectGranny()/selectGun() no-op on a locked item, succeed on an unlocked one', () => {
    unlocks.selectGranny('punk'); // locked — ignored
    expect(unlocks.getSelectedGrannyId()).toBe('classic');

    unlocks.addStars(500);
    unlocks.unlockGranny('punk');
    unlocks.selectGranny('punk');
    expect(unlocks.getSelectedGrannyId()).toBe('punk');
  });

  it('unlockWorld()/selectWorld() follow the same vault-gated pattern as grannies/guns', () => {
    unlocks.selectWorld('workshop'); // locked — ignored
    expect(unlocks.getSelectedWorldId()).toBe('garden');

    expect(unlocks.unlockWorld('workshop')).toBe(false); // vault short
    unlocks.addStars(500);
    expect(unlocks.unlockWorld('workshop')).toBe(true);
    expect(unlocks.getVault()).toBe(0);

    unlocks.selectWorld('workshop');
    expect(unlocks.getSelectedWorldId()).toBe('workshop');
  });
});
