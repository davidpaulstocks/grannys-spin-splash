/**
 * The glue between buying a gun and the reveal: remembers what was equipped,
 * opens the reveal once the gun is owned, and puts the old gun back when the
 * player says Later. Every place a gun can be bought (the results card, Home's
 * strip, the Shop) goes through here, so the moment is the same everywhere.
 */

import type Phaser from 'phaser';

import { GUN_LADDER_DEFS } from '../entities/gun/gun.data';
import { gunLevelIn } from '../entities/gun/gunLevels';
import { saveManager } from '../systems/SaveManager';
import { UnlockManager } from '../systems/UnlockManager';
import { showGunPreview, showGunReveal, type GunRevealConfig } from './GunReveal';

/** What was equipped before a purchase; take it before spending anything. */
export interface EquippedGun {
  readonly id: string;
  readonly level: number;
}

/** The gun equipped right now and its level. */
export function equippedGun(): EquippedGun {
  const save = saveManager.load();
  return { id: save.selectedGunId, level: gunLevelIn(save.gunLevels, save.selectedGunId) };
}

/**
 * Opens the reveal for `gunId` if it is owned now (a failed purchase opens
 * nothing). The gun is equipped on purchase; USE IT keeps it, Later restores `previous`.
 */
export function revealIfOwned(
  scene: Phaser.Scene,
  gunId: string,
  previous: EquippedGun,
  onClosed?: () => void,
): boolean {
  const unlocks = new UnlockManager(saveManager);
  if (!unlocks.isGunUnlocked(gunId)) return false;
  showGunReveal(scene, {
    gunId,
    level: unlocks.getGunLevel(gunId),
    previousGunId: previous.id,
    previousLevel: previous.level,
    onUse: () => unlocks.selectGun(gunId),
    onLater: () => unlocks.selectGun(previous.id),
    ...(onClosed ? { onClosed } : {}),
  });
  return true;
}

/** Buys gun `gunId` and equips it, then opens the reveal. False (nothing happens) when coins are short or it is already owned. */
export function buyGunWithReveal(
  scene: Phaser.Scene,
  gunId: string,
  onClosed?: () => void,
): boolean {
  const unlocks = new UnlockManager(saveManager);
  const previous = equippedGun();
  if (!unlocks.buy({ kind: 'gun', id: gunId })) return false;
  return revealIfOwned(scene, gunId, previous, onClosed);
}

/** What the preview needs from its caller: how a purchase is made (the default spends coins directly) and what to run once the gun is owned and the overlay closed. */
export interface GunPreviewOptions {
  /** Makes the purchase; true when the gun is owned afterwards. Defaults to buying with the vault. */
  readonly buy?: () => boolean;
  /** Runs once the owned reveal has closed after a purchase made from the preview. */
  readonly onClosed?: () => void;
}

/**
 * Opens "see it blast" for a gun not owned yet: beats 1 and 2 of the reveal,
 * then the price and progress, or BUY when it is affordable (which carries on
 * into the owned gun's numbers). A gun already owned opens nothing.
 */
export function previewGunReveal(
  scene: Phaser.Scene,
  gunId: string,
  options: GunPreviewOptions = {},
): boolean {
  const unlocks = new UnlockManager(saveManager);
  const def = GUN_LADDER_DEFS.find((g) => g.id === gunId);
  if (!def || unlocks.isGunUnlocked(gunId)) return false;
  const have = unlocks.getVault();
  const buy = options.buy ?? ((): boolean => unlocks.buy({ kind: 'gun', id: gunId }));
  showGunPreview(scene, {
    gunId,
    have,
    price: def.cost,
    ...(have >= def.cost
      ? {
          onBuy: (): GunRevealConfig | null => {
            const previous = equippedGun();
            if (!buy() || !unlocks.isGunUnlocked(gunId)) return null;
            return {
              gunId,
              level: unlocks.getGunLevel(gunId),
              previousGunId: previous.id,
              previousLevel: previous.level,
              onUse: () => unlocks.selectGun(gunId),
              onLater: () => unlocks.selectGun(previous.id),
              ...(options.onClosed ? { onClosed: options.onClosed } : {}),
            };
          },
        }
      : {}),
  });
  return true;
}
