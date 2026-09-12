/**
 * Reusable button factory — primary/secondary/tertiary variants, applied
 * consistently everywhere (CLAUDE.md §7.2, story 2.3). Pill shape (§5.4 —
 * radius via utils/math.ts's pillRadius(), NOT a literal 999: Phaser's
 * Graphics doesn't clamp radius to the box size the way CSS does), Ink
 * stroke, 100ms hover/press feedback (§5.6).
 */

import Phaser from 'phaser';

import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { drawPlayIcon } from './icons';
import { pillRadius } from '../utils/math';
import { DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary';

export interface ButtonConfig {
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly onClick: () => void;
  readonly variant?: ButtonVariant;
  /** Pads the pill out to at least this wide — buttons still auto-size to their label above this. */
  readonly minWidth?: number;
  /**
   * Draws the custom "play" glyph before the label (CLAUDE.md §11.3: every
   * rewarded-ad button must "include a video icon prominently" — §7.3 rule
   * 8 bans emoji, so `drawPlayIcon` is the custom-SVG equivalent of 🎬).
   */
  readonly showPlayIcon?: boolean;
}

const PADDING_X = 32;
const PADDING_Y = 16;
const ICON_RADIUS = 11;
/** Icon diameter plus a small gap, reserved as extra left padding on the label when `showPlayIcon` is set. */
const ICON_RESERVED_WIDTH = ICON_RADIUS * 2 + 10;
const HOVER_SCALE = 1.04;
const PRESS_SCALE = 0.96;

interface VariantStyle {
  readonly fill: number;
  readonly fillAlpha: number;
  readonly stroke: number;
  readonly strokeWidth: number;
  readonly textColour: string;
}

const VARIANTS: Readonly<Record<ButtonVariant, VariantStyle>> = {
  // Mint Green is the palette's "Confirm buttons" colour (CLAUDE.md §5.1) — the primary CTA.
  primary: {
    fill: COLOUR.mintGreen,
    fillAlpha: 1,
    stroke: COLOUR.ink,
    strokeWidth: 4,
    textColour: COLOUR_HEX.ink,
  },
  secondary: {
    fill: COLOUR.cloud,
    fillAlpha: 1,
    stroke: COLOUR.ink,
    strokeWidth: 3,
    textColour: COLOUR_HEX.ink,
  },
  tertiary: {
    fill: COLOUR.cloud,
    fillAlpha: 0,
    stroke: COLOUR.softSlate,
    strokeWidth: 0,
    textColour: COLOUR_HEX.softSlate,
  },
};

/** Builds a pill-shaped button as a Container; returns it so callers can position/destroy it themselves. */
export function createButton(
  scene: Phaser.Scene,
  config: ButtonConfig,
): Phaser.GameObjects.Container {
  const variant = VARIANTS[config.variant ?? 'primary'];
  const iconReserve = config.showPlayIcon ? ICON_RESERVED_WIDTH : 0;

  const label = scene.add
    .text(iconReserve / 2, 0, config.label, textStyle('bodyL', variant.textColour, COLOUR_HEX.ink))
    .setOrigin(0.5);

  const width = Math.max(config.minWidth ?? 0, label.width + iconReserve + PADDING_X * 2);
  const height = label.height + PADDING_Y * 2;

  const radius = pillRadius(width, height);
  const bg = scene.add.graphics();
  if (variant.fillAlpha > 0) {
    bg.fillStyle(variant.fill, variant.fillAlpha);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, radius);
  }
  if (variant.strokeWidth > 0) {
    bg.lineStyle(variant.strokeWidth, variant.stroke, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, radius);
  }

  const parts: Phaser.GameObjects.GameObject[] = [bg, label];
  if (config.showPlayIcon) {
    const iconGfx = scene.add
      .graphics()
      .setPosition(-width / 2 + PADDING_X * 0.7 + ICON_RADIUS, 0);
    drawPlayIcon(iconGfx, ICON_RADIUS, COLOUR.ink);
    parts.push(iconGfx);
  }

  const container = scene.add.container(config.x, config.y, parts);
  container.setSize(width, height);

  const hitZone = scene.add.zone(0, 0, width, height).setInteractive({ useHandCursor: true });
  container.add(hitZone);

  const scaleTo = (scale: number): void => {
    scene.tweens.add({
      targets: container,
      scale,
      duration: DURATION.hoverPress,
      ease: EASE.standardOut,
    });
  };
  hitZone.on('pointerover', () => scaleTo(HOVER_SCALE));
  hitZone.on('pointerout', () => scaleTo(1));
  hitZone.on('pointerdown', () => scaleTo(PRESS_SCALE));
  hitZone.on('pointerup', () => {
    scaleTo(HOVER_SCALE);
    config.onClick();
  });

  return container;
}
