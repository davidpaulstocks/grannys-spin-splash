/**
 * The game's card: a cloud-coloured panel with an ink outline and a soft
 * shadow, optionally headed by a ribbon that sits astride its top edge.
 * Every screen that groups information uses this, so cards across the game
 * share one corner radius, one outline weight and one shadow.
 *
 * The ribbon is the only element allowed to cross a panel's edge, and it
 * does so on purpose and always the same way: centred, half on, half off.
 * Nothing else straddles an edge.
 */

import type Phaser from 'phaser';

import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { textStyle } from '../utils/typography';

export interface PanelConfig {
  /** Centre of the panel. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Text for a ribbon across the top edge. */
  readonly ribbon?: string;
  /** Ribbon fill. Defaults to Granny Pink. */
  readonly ribbonColour?: number;
  /** Panel fill opacity; lower lets a painted background glow through. Defaults to 0.97. */
  readonly alpha?: number;
}

export const PANEL_RADIUS = 34;
export const PANEL_OUTLINE_PX = 5;
const SHADOW_ALPHA = 0.2;
const SHADOW_DROP = 10;
const RIBBON_HEIGHT = 54;
const RIBBON_PADDING_X = 40;
const RIBBON_MIN_WIDTH = 220;
const RIBBON_OUTLINE_PX = 4;

/**
 * Draws a panel and returns the objects it made, background first, so a
 * caller building a Container can add them before its own content.
 */
export function createPanel(
  scene: Phaser.Scene,
  config: PanelConfig,
): Phaser.GameObjects.GameObject[] {
  const left = config.x - config.width / 2;
  const top = config.y - config.height / 2;

  const body = scene.add.graphics();
  body.fillStyle(COLOUR.ink, SHADOW_ALPHA);
  body.fillRoundedRect(left, top + SHADOW_DROP, config.width, config.height, PANEL_RADIUS);
  body.fillStyle(COLOUR.cloud, config.alpha ?? 0.97);
  body.fillRoundedRect(left, top, config.width, config.height, PANEL_RADIUS);
  body.lineStyle(PANEL_OUTLINE_PX, COLOUR.ink, 1);
  body.strokeRoundedRect(left, top, config.width, config.height, PANEL_RADIUS);
  if (!config.ribbon) return [body];

  const label = scene.add
    .text(config.x, top, config.ribbon, textStyle('buttonM', COLOUR_HEX.cloud, COLOUR_HEX.ink))
    .setOrigin(0.5);
  const ribbonWidth = Math.max(RIBBON_MIN_WIDTH, label.width + RIBBON_PADDING_X * 2);
  const ribbon = scene.add.graphics();
  ribbon.fillStyle(config.ribbonColour ?? COLOUR.grannyPink, 1);
  ribbon.fillRoundedRect(
    config.x - ribbonWidth / 2,
    top - RIBBON_HEIGHT / 2,
    ribbonWidth,
    RIBBON_HEIGHT,
    pillRadius(ribbonWidth, RIBBON_HEIGHT),
  );
  ribbon.lineStyle(RIBBON_OUTLINE_PX, COLOUR.ink, 1);
  ribbon.strokeRoundedRect(
    config.x - ribbonWidth / 2,
    top - RIBBON_HEIGHT / 2,
    ribbonWidth,
    RIBBON_HEIGHT,
    pillRadius(ribbonWidth, RIBBON_HEIGHT),
  );
  // The label was created first to measure it; it must draw above its ribbon.
  label.setDepth(ribbon.depth + 1);
  scene.children.bringToTop(label);
  return [body, ribbon, label];
}
