/** The 5 launch worlds' orchestra themes, keyed by world id (CLAUDE.md §9, §14). */

import { DISCO_THEME } from './discoTheme';
import { FUNFAIR_THEME } from './funfairTheme';
import { GARDEN_THEME } from './gardenTheme';
import { KITCHEN_THEME } from './kitchenTheme';
import type { WorldTheme } from './theme.types';
import { WORKSHOP_THEME } from './workshopTheme';

export const DEFAULT_THEME_ID = 'garden';

export const WORLD_THEMES: Readonly<Record<string, WorldTheme>> = {
  garden: GARDEN_THEME,
  workshop: WORKSHOP_THEME,
  kitchen: KITCHEN_THEME,
  funfair: FUNFAIR_THEME,
  disco: DISCO_THEME,
};

/** Falls back to Garden's theme for any unrecognised id, so an orchestra never silently has no voices at all. */
export function resolveTheme(worldId: string): WorldTheme {
  return WORLD_THEMES[worldId] ?? WORLD_THEMES[DEFAULT_THEME_ID];
}

export type { WorldTheme, VoiceSlot, SpinnerSlot } from './theme.types';
export { SPINNER_SLOTS, SPINNER_SLOT_COUNT } from './theme.types';
