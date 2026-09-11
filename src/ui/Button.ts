/**
 * Reusable button factory — primary/secondary/tertiary variants, applied
 * consistently everywhere (CLAUDE.md §7.2, story 2.3). Pill shape (§5.4 —
 * radius via utils/math.ts's pillRadius(), NOT a literal 999: Phaser's
 * Graphics doesn't clamp radius to the box size the way CSS does), Ink
 * stroke, 100ms hover/press feedback (§5.6).
 */

import Phaser from 'phaser';

import { COLOUR, COLOUR_HEX } from '../utils/colour';
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
}

const PADDING_X = 32;
const PADDING_Y = 16;
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

  const label = scene.add
    .text(0, 0, config.label, textStyle('bodyL', variant.textColour, COLOUR_HEX.ink))
    .setOrigin(0.5);

  const width = Math.max(config.minWidth ?? 0, label.width + PADDING_X * 2);
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

  const container = scene.add.container(config.x, config.y, [bg, label]);
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
