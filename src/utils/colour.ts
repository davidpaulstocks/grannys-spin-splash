/**
 * The 8-colour palette (CLAUDE.md §5.1), as Phaser-friendly 0xRRGGBB
 * numbers. No hardcoded hex outside this file (CLAUDE.md §7.3 rule 3,
 * Sprint 2 story 2.2) — objects/UI import from here even while Sprint 1's
 * placeholder graphics only need a handful of these.
 */

export const COLOUR = {
  grannyPink: 0xff6ba8,
  waterBlue: 0x4db3e5,
  sunnyGold: 0xffc93c,
  heatOrange: 0xff8a3d,
  mintGreen: 0x7fd9a8,
  ink: 0x1f2138,
  softSlate: 0x6b6f8c,
  cloud: 0xf5f2e8,
} as const;

/** Same palette as CSS-style `#RRGGBB` strings, for contexts that want hex text. */
export const COLOUR_HEX = {
  grannyPink: '#FF6BA8',
  waterBlue: '#4DB3E5',
  sunnyGold: '#FFC93C',
  heatOrange: '#FF8A3D',
  mintGreen: '#7FD9A8',
  ink: '#1F2138',
  softSlate: '#6B6F8C',
  cloud: '#F5F2E8',
} as const;

/**
 * Darkens (factor < 1) or lightens (factor > 1) a 0xRRGGBB colour by
 * multiplying each channel — the one sanctioned way to get a muted/shaded
 * variant of a palette colour without inventing a new raw hex (rule 3).
 * Used for the ground plane's "grass" tone, spinner state dimming, etc.
 */
export function shade(hex: number, factor: number): number {
  const r = Math.min(255, Math.max(0, Math.floor(((hex >> 16) & 0xff) * factor)));
  const g = Math.min(255, Math.max(0, Math.floor(((hex >> 8) & 0xff) * factor)));
  const b = Math.min(255, Math.max(0, Math.floor((hex & 0xff) * factor)));
  return (r << 16) | (g << 8) | b;
}
