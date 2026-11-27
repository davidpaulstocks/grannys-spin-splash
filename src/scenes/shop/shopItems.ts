/** The Shop's carousel items: what each selector shows for the grannies, the guns and the venue on the stage. */

import { SPRITE_KEYS } from '../../assets/keys';
import { GRANNY_DEFS } from '../../entities/granny/granny.data';
import { GUN_DEFS } from '../../entities/gun/gun.data';
import { WORLD_DEFS } from '../../entities/world/world.data';
import { worldBackgroundKey } from '../../entities/world/worldBackgrounds';
import { frontier } from '../../systems/Progress';
import { saveManager } from '../../systems/SaveManager';
import type { UnlockManager } from '../../systems/UnlockManager';
import type { CarouselItem } from '../../ui/Carousel';
import { COLOUR } from '../../utils/colour';

/** Placeholder swatch colours standing in for real world backdrop thumbnails — one hero colour per world's vibe. */
const WORLD_SWATCH: Readonly<Record<string, number>> = {
  garden: COLOUR.mintGreen,
  workshop: COLOUR.heatOrange,
  kitchen: COLOUR.sunnyGold,
  funfair: COLOUR.grannyPink,
  disco: COLOUR.waterBlue,
};

/** One carousel item per granny. */
export function grannyItems(unlocks: UnlockManager): CarouselItem[] {
  return GRANNY_DEFS.map((g) => ({
    id: g.id,
    label: g.name,
    unlocked: unlocks.isGrannyUnlocked(g.id),
    cost: g.unlockCost,
    swatchColour: COLOUR.grannyPink,
    swatchTextureKey: SPRITE_KEYS.grannyPose(g.id, 'front'),
  }));
}

/** A locked gun beyond the next one to save for that cannot be afforded yet: shown as a dark shape. */
function isSilhouette(unlocks: UnlockManager, id: string, cost: number): boolean {
  if (unlocks.isGunUnlocked(id) || cost <= unlocks.getVault()) return false;
  const next = [...GUN_DEFS]
    .sort((a, b) => a.cost - b.cost)
    .find((g) => !unlocks.isGunUnlocked(g.id));
  return id !== next?.id;
}

/** One carousel item per gun. */
export function gunItems(unlocks: UnlockManager): CarouselItem[] {
  return GUN_DEFS.map((g) => ({
    id: g.id,
    label: g.name,
    unlocked: unlocks.isGunUnlocked(g.id),
    cost: g.cost,
    swatchColour: COLOUR.waterBlue,
    swatchTextureKey: SPRITE_KEYS.gun(g.id),
    silhouette: isSilhouette(unlocks, g.id, g.cost),
  }));
}

/** The stage shows one venue: the one being toured. Venues are chosen on the tour, not in the shop. */
export function worldItems(): CarouselItem[] {
  const venueId = frontier(saveManager.load(), WORLD_DEFS).venueId;
  return WORLD_DEFS.filter((w) => w.id === venueId).map((w) => {
    const bgKey = worldBackgroundKey(w.id);
    return {
      id: w.id,
      label: w.name,
      unlocked: true,
      cost: 0,
      swatchColour: WORLD_SWATCH[w.id] ?? COLOUR.softSlate,
      ...(bgKey ? { swatchTextureKey: bgKey } : {}),
    };
  });
}
