/**
 * A small readout pill — an icon and a number — for the two things a player
 * owns: coins (spent in the shop) and stars (the rating that opens venues).
 * One component so they always look like a pair and never like two widgets.
 */

import Phaser from 'phaser';

import { COLOUR, COLOUR_HEX, shade } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { textStyle } from '../utils/typography';
import { drawCoinIcon, drawStarIcon } from './icons';

export type StatKind = 'coins' | 'stars';

const PILL_WIDTH = 150;
const PILL_HEIGHT = 52;
const ICON_RADIUS = 15;
const ICON_OUTLINE_PX = 3;
const ICON_INSET = 28;
const TEXT_INSET = 52;

export interface StatPill {
  readonly container: Phaser.GameObjects.Container;
  setValue(value: number | string): void;
}

/** Builds a pill centred on (x, y). `value` may be a string for "17 / 24"-style readouts. */
export function createStatPill(
  scene: Phaser.Scene,
  x: number,
  y: number,
  kind: StatKind,
  value: number | string,
  width = PILL_WIDTH,
): StatPill {
  const radius = pillRadius(width, PILL_HEIGHT);
  const bg = scene.add.graphics();
  bg.fillStyle(COLOUR.cloud, 0.96);
  bg.fillRoundedRect(-width / 2, -PILL_HEIGHT / 2, width, PILL_HEIGHT, radius);
  bg.lineStyle(4, COLOUR.ink, 1);
  bg.strokeRoundedRect(-width / 2, -PILL_HEIGHT / 2, width, PILL_HEIGHT, radius);

  const icon = scene.add.graphics({ x: -width / 2 + ICON_INSET, y: 0 });
  if (kind === 'coins') {
    drawCoinIcon(icon, ICON_RADIUS + ICON_OUTLINE_PX, COLOUR.ink, COLOUR.ink);
    drawCoinIcon(icon, ICON_RADIUS, COLOUR.sunnyGold, shade(COLOUR.sunnyGold, 0.72));
  } else {
    drawStarIcon(icon, ICON_RADIUS + ICON_OUTLINE_PX + 1, COLOUR.ink);
    drawStarIcon(icon, ICON_RADIUS, COLOUR.sunnyGold);
  }

  const text = scene.add
    .text(
      -width / 2 + TEXT_INSET,
      0,
      String(value),
      textStyle('bodyL', COLOUR_HEX.ink, COLOUR_HEX.cloud),
    )
    .setOrigin(0, 0.5);

  const container = scene.add.container(x, y, [bg, icon, text]);
  return { container, setValue: (next) => text.setText(String(next)) };
}
