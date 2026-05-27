/**
 * Asset key registry — every load.image(), load.audio(), sound.play(), and
 * setTexture() call must reference a constant here so typos become compile
 * errors. CLAUDE.md §7.3 rule 11. Populated as assets land in later sprints.
 */

export const SPRITE_KEYS = {} as const;
export const AUDIO_KEYS = {} as const;
export const ICON_KEYS = {} as const;
