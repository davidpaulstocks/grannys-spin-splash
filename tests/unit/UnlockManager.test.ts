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
    expect(unlocks.isGrannyUnlocked('classic')).toBe(true); // free
    expect(unlocks.isGrannyUnlocked('squirt')).toBe(true); // also free
    expect(unlocks.isGrannyUnlocked('punk')).toBe(false); // 30,000 coins
    expect(unlocks.isGunUnlocked('pistol')).toBe(true); // free
    expect(unlocks.isGunUnlocked('squirter')).toBe(true); // also free
    expect(unlocks.isGunUnlocked('hose')).toBe(false); // 6,000 coins
    expect(unlocks.isWorldUnlocked('garden')).toBe(true); // open from the start
    expect(unlocks.isWorldUnlocked('workshop')).toBe(false); // needs stars
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
    unlocks.addStars(29999);
    expect(unlocks.unlockGranny('punk')).toBe(false);
    expect(unlocks.isGrannyUnlocked('punk')).toBe(false);
    expect(unlocks.getVault()).toBe(29999); // nothing deducted on failure

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

    unlocks.addStars(30000);
    unlocks.unlockGranny('punk');
    unlocks.selectGranny('punk');
    expect(unlocks.getSelectedGrannyId()).toBe('punk');
  });

  it('opens venues on stars earned, never on coins', () => {
    unlocks.selectWorld('workshop'); // locked — ignored
    expect(unlocks.getSelectedWorldId()).toBe('garden');

    unlocks.addStars(100000); // any amount of coins changes nothing
    expect(unlocks.isWorldUnlocked('workshop')).toBe(false);

    // Three stars on four Garden gigs is the twelve the Workshop asks for.
    save.save({ ...save.load(), gigStars: { garden: [3, 3, 3, 3] } });
    expect(unlocks.isWorldUnlocked('workshop')).toBe(true);
    expect(unlocks.getVault()).toBe(100000);

    unlocks.selectWorld('workshop');
    expect(unlocks.getSelectedWorldId()).toBe('workshop');
  });

  it('upgradeGun() spends coins, raises the level and persists', () => {
    expect(unlocks.getGunLevel('pistol')).toBe(1);
    unlocks.addStars(2000);
    expect(unlocks.upgradeGun('pistol')).toBe(true); // 1,500
    expect(unlocks.getGunLevel('pistol')).toBe(2);
    expect(unlocks.getVault()).toBe(500);
    expect(new UnlockManager(new SaveManager()).getGunLevel('pistol')).toBe(2);
  });

  it('upgradeGun() refuses when short, unowned, unknown or at the top', () => {
    unlocks.addStars(1000);
    expect(unlocks.upgradeGun('pistol')).toBe(false); // short
    expect(unlocks.upgradeGun('hose')).toBe(false); // not owned
    expect(unlocks.upgradeGun('nope')).toBe(false);
    expect(unlocks.getVault()).toBe(1000);
    unlocks.addStars(1_000_000);
    for (let i = 0; i < 4; i++) expect(unlocks.upgradeGun('squirter')).toBe(true);
    const vault = unlocks.getVault();
    expect(unlocks.getGunLevel('squirter')).toBe(5);
    expect(unlocks.upgradeGun('squirter')).toBe(false);
    expect(unlocks.getVault()).toBe(vault);
  });

  it('buy() unlocks and equips a gun, or upgrades for an upgrade reward', () => {
    unlocks.addStars(10_000);
    expect(unlocks.buy({ kind: 'gun', id: 'hose' })).toBe(true);
    expect(unlocks.getSelectedGunId()).toBe('hose');
    expect(unlocks.buy({ kind: 'upgrade', id: 'hose' })).toBe(true);
    expect(unlocks.getGunLevel('hose')).toBe(2);
    expect(unlocks.buy({ kind: 'gun', id: 'inferno' })).toBe(false);
  });
});
