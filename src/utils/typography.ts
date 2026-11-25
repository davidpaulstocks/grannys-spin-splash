/**
 * Fredoka type scale (CLAUDE.md §5.2) — one bundled variable-font file,
 * driven by weight per size tier. `fontStyle` carries the weight: Phaser's
 * Text GameObject concatenates `[fontStyle, fontSize, fontFamily]` into
 * the canvas `font` string (verified against
 * node_modules/phaser/src/gameobjects/text/TextStyle.js), and CSS font
 * shorthand accepts a weight token in that position.
 *
 * `color` (fill) is deliberately omitted — it varies by context (a score
 * number in Sunny Gold, a label in Cloud-on-Ink) and belongs to the call
 * site via utils/colour.ts, not to the type scale.
 */

import Phaser from 'phaser';

import { RENDER_SCALE } from '../config';

export const FONT_FAMILY = 'Fredoka, sans-serif';

export interface TypeStyle {
  readonly fontFamily: string;
  readonly fontSize: string;
  /** Carries font-weight, e.g. '700' — see file header. */
  readonly fontStyle: string;
  readonly lineSpacing: number;
  readonly letterSpacing: number;
}

/**
 * Tracking as a fraction of the type size, before any allowance for an
 * outline (see `textStyle`). Slightly open rather than §5.2's original
 * -0.5%: Fredoka is a round, wide face, and at the sizes a phone shows it
 * (a 20px label is about 10px on screen) tight tracking runs letters together.
 */
const BASE_TRACKING = 0.02;

/** Builds one tier: `weight`/`size` per CLAUDE.md §5.2, header line-height 1.2 / body 1.5. */
function tier(size: number, weight: 400 | 500 | 600 | 700, isHeader: boolean): TypeStyle {
  return {
    fontFamily: FONT_FAMILY,
    fontSize: `${size}px`,
    fontStyle: `${weight}`,
    lineSpacing: size * (isHeader ? 0.2 : 0.5),
    letterSpacing: size * BASE_TRACKING,
  };
}

export const TYPE_SCALE = {
  displayXL: tier(64, 700, true),
  displayL: tier(48, 700, true),
  displayM: tier(32, 600, true),
  bodyL: tier(20, 500, false),
  bodyM: tier(16, 500, false),
  caption: tier(12, 400, false),
  /** Button labels: heavier than body text so a label reads as a thing to press. See ui/Button.ts. */
  buttonL: tier(34, 700, true),
  buttonM: tier(24, 600, true),
  buttonS: tier(20, 600, true),
} as const;

/**
 * Outline thickness in px. Kept to roughly a tenth of the type size: the
 * original 4px on 20px body text was a fifth of the letter height, which
 * filled the counters of a, e and g and closed the gaps between letters
 * (2026-11-25, direct user feedback: "the fonts are quite hard to read…
 * the letters look like they're too close to each other").
 */
export const STROKE_THICKNESS: Readonly<Record<keyof typeof TYPE_SCALE, number>> = {
  displayXL: 6,
  displayL: 5,
  displayM: 4,
  bodyL: 2.5,
  bodyM: 2,
  caption: 2,
  buttonL: 4,
  buttonM: 3,
  buttonS: 2.5,
};

/**
 * An outline is drawn centred on each glyph's edge, so half of it lands
 * outside the letter on every side. Two neighbouring letters therefore lose
 * a full outline-width of the gap between them; this much of it is given
 * back as extra tracking.
 */
const TRACKING_PER_STROKE_PX = 0.75;

/**
 * Convenience: a TYPE_SCALE tier + fill colour + outline, ready to pass
 * straight to `scene.add.text()`.
 *
 * An outline in the text's own colour is not an outline at all — it just
 * fattens every letter into its neighbours — so it is dropped. That is what
 * every button label was doing (Ink text, Ink outline).
 */
export function textStyle(
  tierName: keyof typeof TYPE_SCALE,
  fillHex: string,
  strokeHex: string,
): Phaser.Types.GameObjects.Text.TextStyle {
  const t = TYPE_SCALE[tierName];
  const outlined = strokeHex.toLowerCase() !== fillHex.toLowerCase();
  const strokeThickness = outlined ? STROKE_THICKNESS[tierName] : 0;
  return {
    fontFamily: t.fontFamily,
    fontSize: t.fontSize,
    fontStyle: t.fontStyle,
    lineSpacing: t.lineSpacing,
    letterSpacing: t.letterSpacing + strokeThickness * TRACKING_PER_STROKE_PX,
    color: fillHex,
    stroke: strokeHex,
    strokeThickness,
    // Text is rasterised once; draw it at the density it will be shown at.
    resolution: RENDER_SCALE,
  };
}
