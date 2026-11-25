/**
 * The round version of the game's button: same face-on-a-lip body, same
 * press, carrying a drawn icon instead of a word. For the actions every
 * screen has and nobody needs to read — home, retry, back — with an
 * optional caption underneath where the icon alone might not be enough.
 */

import type Phaser from 'phaser';

import { COLOUR, COLOUR_HEX, shade } from '../utils/colour';
import { textStyle } from '../utils/typography';
import { attachPress, BUTTON_STYLE, type ButtonConfig } from './Button';

export type IconDrawer = (g: Phaser.GameObjects.Graphics, size: number, colour: number) => void;

export interface IconButtonConfig extends Pick<ButtonConfig, 'x' | 'y' | 'onClick'> {
  /** The glyph on the face. Give this or `text`; `icon` wins if both are set. */
  readonly icon?: IconDrawer;
  /** A short label on the face instead of an icon, e.g. a gig number. */
  readonly text?: string;
  readonly variant?: 'primary' | 'secondary' | 'reward';
  /** Diameter of the face. Defaults to 76. */
  readonly diameter?: number;
  /** A word beneath the button. */
  readonly caption?: string;
}

const DEFAULT_DIAMETER = 76;
const LIP = 7;
/** The icon fills this fraction of the face. */
const ICON_FRACTION = 0.46;
const CAPTION_GAP = 14;

/** Builds a round icon button centred on (x, y). */
export function createIconButton(
  scene: Phaser.Scene,
  config: IconButtonConfig,
): Phaser.GameObjects.Container {
  const variant = BUTTON_STYLE.variants[config.variant ?? 'secondary'];
  const radius = (config.diameter ?? DEFAULT_DIAMETER) / 2;

  const base = scene.add.graphics();
  base.fillStyle(COLOUR.ink, BUTTON_STYLE.shadowAlpha);
  base.fillCircle(0, LIP + BUTTON_STYLE.shadowDrop, radius);
  base.fillStyle(shade(variant.face, variant.lipShade), 1);
  base.fillCircle(0, LIP, radius);
  base.lineStyle(BUTTON_STYLE.outlinePx, COLOUR.ink, 1);
  base.strokeCircle(0, LIP, radius);

  const faceGfx = scene.add.graphics();
  faceGfx.fillStyle(variant.face, 1);
  faceGfx.fillCircle(0, 0, radius);
  faceGfx.fillStyle(0xffffff, BUTTON_STYLE.highlightAlpha);
  faceGfx.fillEllipse(0, -radius * 0.42, radius * 1.3, radius * 0.6);
  faceGfx.lineStyle(BUTTON_STYLE.outlinePx, COLOUR.ink, 1);
  faceGfx.strokeCircle(0, 0, radius);
  const glyph = createGlyph(scene, config, radius);
  const face = scene.add.container(0, 0, glyph ? [faceGfx, glyph] : [faceGfx]);

  const parts: Phaser.GameObjects.GameObject[] = [base, face];
  if (config.caption) {
    parts.push(
      scene.add
        .text(
          0,
          radius + LIP + CAPTION_GAP,
          config.caption,
          textStyle('bodyL', COLOUR_HEX.cloud, COLOUR_HEX.ink),
        )
        .setOrigin(0.5, 0),
    );
  }
  const container = scene.add.container(config.x, config.y, parts);
  container.setSize(radius * 2, radius * 2 + LIP);
  attachPress(scene, container, config, radius * 2, radius * 2 + LIP, LIP / 2, (pressed) =>
    face.setY(pressed ? LIP - 2 : 0),
  );
  return container;
}

/** What is written on the face: the drawn icon, else the text label. */
function createGlyph(
  scene: Phaser.Scene,
  config: IconButtonConfig,
  radius: number,
): Phaser.GameObjects.GameObject | null {
  if (config.icon) {
    const icon = scene.add.graphics();
    config.icon(icon, radius * 2 * ICON_FRACTION, COLOUR.ink);
    return icon;
  }
  if (config.text === undefined) return null;
  return scene.add
    .text(0, 0, config.text, textStyle('buttonM', COLOUR_HEX.ink, COLOUR_HEX.ink))
    .setOrigin(0.5);
}
