/**
 * Dev-only: open the gun reveal for any gun without buying it, from the
 * console: `__revealGun('dragon_drencher')`, or a preview with
 * `__revealGun('mega_cannon', { preview: true, have: 12400 })`. Nothing is
 * saved. Loaded only when `import.meta.env.DEV`.
 */

import type Phaser from 'phaser';

import { GUN_LADDER_DEFS } from '../entities/gun/gun.data';
import { showGunPreview, showGunReveal, type GunRevealConfig } from '../ui/GunReveal';

export interface RevealDebugOptions {
  /** Open the "see it blast" preview instead of the new-gun reveal. */
  readonly preview?: boolean;
  /** Coins held, for the preview. */
  readonly have?: number;
  /** The gun the rows compare against; defaults to the one before it on the ladder. */
  readonly previousId?: string;
}

export type RevealDebug = (
  gunId: string,
  options?: RevealDebugOptions,
) => { close(): void } | undefined;

/** Builds the console helper over the running game. */
export function installRevealDebug(game: Phaser.Game): RevealDebug {
  return (gunId, options = {}) => {
    const scene = game.scene.getScenes(true)[0];
    const index = GUN_LADDER_DEFS.findIndex((g) => g.id === gunId);
    const def = GUN_LADDER_DEFS[index];
    if (!scene || !def) return undefined;
    const previous = GUN_LADDER_DEFS[Math.max(0, index - 1)] ?? def;
    const owned: GunRevealConfig = {
      gunId,
      previousGunId: options.previousId ?? previous.id,
      onUse: () => undefined,
      onLater: () => undefined,
    };
    if (!options.preview) return showGunReveal(scene, owned);
    const have = options.have ?? 0;
    return showGunPreview(scene, {
      gunId,
      have,
      price: def.cost,
      ...(have >= def.cost ? { onBuy: () => owned } : {}),
    });
  };
}
