/**
 * How a gun's rarity and POWER number are shown: the rarity colours (palette
 * only: common Soft Slate, rare Water Blue, epic Granny Pink, legendary Sunny
 * Gold), the tag text, the POWER number at a level, and the small drawn pieces
 * the Shop, the rack and the reward cards share (a thin frame, a pill).
 */

import type Phaser from 'phaser';

import { GUN_LADDER_DEFS, MIN_GUN_LEVEL } from '../entities/gun/gun.data';
import type { GunRarity } from '../entities/gun/gun.types';
import { powerRatingAt } from '../entities/gun/gunLevels';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { textStyle } from '../utils/typography';

const RARITY_COLOUR: Readonly<Record<GunRarity, number>> = {
  common: COLOUR.softSlate,
  rare: COLOUR.waterBlue,
  epic: COLOUR.grannyPink,
  legendary: COLOUR.sunnyGold,
};
const RARITY_HEX: Readonly<Record<GunRarity, string>> = {
  common: COLOUR_HEX.softSlate,
  rare: COLOUR_HEX.waterBlue,
  epic: COLOUR_HEX.grannyPink,
  legendary: COLOUR_HEX.sunnyGold,
};
const FRAME_PX = 3;
const FRAME_RADIUS = 14;
const PILL_HEIGHT = 20;
const PILL_PADDING = 14;
const PILL_OUTLINE_PX = 2;

/** The rarity's palette colour as a Phaser number. */
export function rarityColour(rarity: GunRarity): number {
  return RARITY_COLOUR[rarity];
}

/** The rarity's palette colour as a CSS string, for text. */
export function rarityHex(rarity: GunRarity): string {
  return RARITY_HEX[rarity];
}

/** "RARE", "EPIC", "LEGENDARY" (common guns have a tag too: "COMMON"). */
export function rarityLabel(rarity: GunRarity): string {
  return rarity.toUpperCase();
}

/** "POWER 550" for gun `id` at `level`; empty for an unknown gun. */
export function powerText(id: string, level = MIN_GUN_LEVEL): string {
  const def = GUN_LADDER_DEFS.find((g) => g.id === id);
  return def ? `POWER ${powerRatingAt(def, level).toLocaleString('en-US')}` : '';
}

/** A thin rounded frame in the gun's rarity colour, centred on (x, y). */
export function addRarityFrame(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  rarity: GunRarity,
): Phaser.GameObjects.Graphics {
  const frame = scene.add.graphics({ x, y });
  frame.lineStyle(FRAME_PX, RARITY_COLOUR[rarity], 1);
  frame.strokeRoundedRect(-width / 2, -height / 2, width, height, FRAME_RADIUS);
  return frame;
}

/** A small Cloud pill with a rarity-coloured rim and Ink text, centred on (x, y): "POWER 550". */
export function addPowerPill(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  rarity: GunRarity,
): Phaser.GameObjects.Container {
  const label = scene.add
    .text(0, 0, text, textStyle('caption', COLOUR_HEX.ink, COLOUR_HEX.cloud))
    .setOrigin(0.5);
  const width = label.width + PILL_PADDING;
  const bg = scene.add.graphics();
  bg.fillStyle(COLOUR.cloud, 1);
  bg.fillRoundedRect(
    -width / 2,
    -PILL_HEIGHT / 2,
    width,
    PILL_HEIGHT,
    pillRadius(width, PILL_HEIGHT),
  );
  bg.lineStyle(PILL_OUTLINE_PX, RARITY_COLOUR[rarity], 1);
  bg.strokeRoundedRect(
    -width / 2,
    -PILL_HEIGHT / 2,
    width,
    PILL_HEIGHT,
    pillRadius(width, PILL_HEIGHT),
  );
  return scene.add.container(x, y, [bg, label]);
}
