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

export const FONT_FAMILY = 'Fredoka, sans-serif';

export interface TypeStyle {
  readonly fontFamily: string;
  readonly fontSize: string;
  /** Carries font-weight, e.g. '700' — see file header. */
  readonly fontStyle: string;
  readonly lineSpacing: number;
  readonly letterSpacing: number;
}

/** Builds one tier: `weight`/`size` per CLAUDE.md §5.2, header tracking -0.5%, header line-height 1.2 / body 1.5. */
function tier(size: number, weight: 400 | 500 | 600 | 700, isHeader: boolean): TypeStyle {
  return {
    fontFamily: FONT_FAMILY,
    fontSize: `${size}px`,
    fontStyle: `${weight}`,
    lineSpacing: size * (isHeader ? 0.2 : 0.5),
    letterSpacing: isHeader ? size * -0.005 : 0,
  };
}

export const TYPE_SCALE = {
  displayXL: tier(64, 700, true),
  displayL: tier(48, 700, true),
  displayM: tier(32, 600, true),
  bodyL: tier(20, 500, false),
  bodyM: tier(16, 500, false),
  caption: tier(12, 400, false),
} as const;

/** Stroke thickness in px for CLAUDE.md §5.2's "3-6px depending on size" Ink outline rule. */
export const STROKE_THICKNESS: Readonly<Record<keyof typeof TYPE_SCALE, number>> = {
  displayXL: 6,
  displayL: 5,
  displayM: 4,
  bodyL: 4,
  bodyM: 3,
  caption: 3,
};

/**
 * Convenience: a TYPE_SCALE tier + fill colour + the standard Ink stroke,
 * ready to pass straight to `scene.add.text()`.
 */
export function textStyle(
  tierName: keyof typeof TYPE_SCALE,
  fillHex: string,
  strokeHex: string,
): Phaser.Types.GameObjects.Text.TextStyle {
  const t = TYPE_SCALE[tierName];
  return {
    fontFamily: t.fontFamily,
    fontSize: t.fontSize,
    fontStyle: t.fontStyle,
    lineSpacing: t.lineSpacing,
    letterSpacing: t.letterSpacing,
    color: fillHex,
    stroke: strokeHex,
    strokeThickness: STROKE_THICKNESS[tierName],
  };
}
