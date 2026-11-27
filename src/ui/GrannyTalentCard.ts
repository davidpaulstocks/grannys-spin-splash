/**
 * The small card under the Shop's granny selector: her talent's name and its one line, and, while she is
 * still to join, the star milestone she joins at. One card, re-filled whenever another granny is shown.
 */

import Phaser from 'phaser';

import type { GrannyDef } from '../entities/granny/granny.types';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { textStyle } from '../utils/typography';

const CARD_WIDTH = 210;
const CARD_HEIGHT = 104;
const CARD_RADIUS = 18;
const OUTLINE_PX = 3;
const PADDING = 10;
const NAME_Y = -CARD_HEIGHT / 2 + PADDING;
const LINE_Y = NAME_Y + 24;
const JOIN_Y = CARD_HEIGHT / 2 - PADDING;

export interface GrannyTalentCard {
  readonly container: Phaser.GameObjects.Container;
  /** Shows `granny`'s talent; `joinLine` is the "Joins at 40 stars" text while she is locked, else null. */
  show(granny: GrannyDef, joinLine: string | null): void;
}

/** Builds the card centred on (x, y). */
export function createGrannyTalentCard(
  scene: Phaser.Scene,
  x: number,
  y: number,
): GrannyTalentCard {
  const bg = scene.add.graphics();
  bg.fillStyle(COLOUR.cloud, 1);
  bg.fillRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
  bg.lineStyle(OUTLINE_PX, COLOUR.ink, 1);
  bg.strokeRoundedRect(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT, CARD_RADIUS);
  const name = scene.add
    .text(0, NAME_Y, '', textStyle('bodyL', COLOUR_HEX.ink, COLOUR_HEX.cloud))
    .setOrigin(0.5, 0);
  const line = scene.add
    .text(0, LINE_Y, '', {
      ...textStyle('bodyM', COLOUR_HEX.softSlate, COLOUR_HEX.cloud),
      align: 'center',
      wordWrap: { width: CARD_WIDTH - PADDING * 2 },
    })
    .setOrigin(0.5, 0);
  const join = scene.add
    .text(0, JOIN_Y, '', textStyle('bodyM', COLOUR_HEX.heatOrange, COLOUR_HEX.cloud))
    .setOrigin(0.5, 1);
  const container = scene.add.container(x, y, [bg, name, line, join]);
  return {
    container,
    show(granny, joinLine) {
      name.setText(granny.talent.name);
      line.setText(granny.talent.line);
      join.setText(joinLine ?? '');
    },
  };
}
