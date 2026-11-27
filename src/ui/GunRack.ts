/**
 * The gun rack: every gun in price order as a small thumbnail, so the Shop
 * shows at a glance that there are more guns and which one to save for. Owned
 * guns are in colour with their level, the equipped one is ringed in gold,
 * locked ones are dimmed with their price, and the next one to save for wears
 * a NEXT tag. Tapping a cell tells the scene which gun was picked.
 */

import Phaser from 'phaser';

import { SPRITE_KEYS } from '../assets/keys';
import { formatCount } from '../systems/Rewards';
import { COLOUR, COLOUR_HEX, shade } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { textStyle } from '../utils/typography';

export interface GunRackItem {
  readonly id: string;
  readonly owned: boolean;
  readonly equipped: boolean;
  /** 1 to 5; shown for owned guns. */
  readonly level: number;
  readonly price: number;
  /** The next gun to save for. */
  readonly isNext: boolean;
}

export interface GunRackConfig {
  /** Centre of the whole row. */
  readonly x: number;
  readonly y: number;
  readonly onPick: (gunId: string) => void;
}

export interface GunRack {
  readonly container: Phaser.GameObjects.Container;
  /** Redraws the row for `items` (call after anything is bought or equipped). */
  setItems(items: readonly GunRackItem[]): void;
}

export const GUN_RACK_CELL_WIDTH = 96;
export const GUN_RACK_CELL_HEIGHT = 104;
const GAP = 8;
const CELL_RADIUS = 16;
const OUTLINE_PX = 3;
const EQUIPPED_OUTLINE_PX = 6;
const IMAGE_Y = -8;
const IMAGE_MAX_W = 76;
const IMAGE_MAX_H = 40;
const TEXT_Y = 34;
const TEXT_MAX_WIDTH = GUN_RACK_CELL_WIDTH - 12;
const TAG_Y = -38;
const TAG_WIDTH = 52;
const TAG_HEIGHT = 20;
const LOCKED_FILL = shade(COLOUR.cloud, 0.8);
const LOCKED_TINT = shade(COLOUR.cloud, 0.5);
const LOCKED_ALPHA = 0.8;

/** Builds the rack (empty until `setItems` is called). */
export function createGunRack(scene: Phaser.Scene, config: GunRackConfig): GunRack {
  const container = scene.add.container(0, 0);

  const setItems = (items: readonly GunRackItem[]): void => {
    container.removeAll(true);
    const total = items.length * GUN_RACK_CELL_WIDTH + (items.length - 1) * GAP;
    items.forEach((item, i) => {
      const cx = config.x - total / 2 + GUN_RACK_CELL_WIDTH / 2 + i * (GUN_RACK_CELL_WIDTH + GAP);
      container.add(buildCell(scene, item, cx, config.y, config.onPick));
    });
  };
  return { container, setItems };
}

/** One cell: card, gun picture, level or price, the NEXT tag, and a tap zone on top. */
function buildCell(
  scene: Phaser.Scene,
  item: GunRackItem,
  x: number,
  y: number,
  onPick: (gunId: string) => void,
): Phaser.GameObjects.Container {
  const w = GUN_RACK_CELL_WIDTH;
  const h = GUN_RACK_CELL_HEIGHT;
  const bg = scene.add.graphics();
  bg.fillStyle(item.owned ? COLOUR.cloud : LOCKED_FILL, 1);
  bg.fillRoundedRect(-w / 2, -h / 2, w, h, CELL_RADIUS);
  bg.lineStyle(
    item.equipped ? EQUIPPED_OUTLINE_PX : OUTLINE_PX,
    item.equipped ? COLOUR.sunnyGold : COLOUR.ink,
    1,
  );
  bg.strokeRoundedRect(-w / 2, -h / 2, w, h, CELL_RADIUS);
  const parts: Phaser.GameObjects.GameObject[] = [bg];

  const key = SPRITE_KEYS.gunAngle(item.id, 0);
  if (scene.textures.exists(key)) {
    const image = scene.add.image(0, IMAGE_Y, key);
    image.setScale(Math.min(IMAGE_MAX_W / image.width, IMAGE_MAX_H / image.height));
    if (!item.owned) image.setTint(LOCKED_TINT).setAlpha(LOCKED_ALPHA);
    parts.push(image);
  }
  const caption = item.owned ? `Lv ${item.level}` : formatCount(item.price);
  const text = scene.add
    .text(
      0,
      TEXT_Y,
      caption,
      textStyle('bodyM', item.owned ? COLOUR_HEX.ink : COLOUR_HEX.softSlate, COLOUR_HEX.cloud),
    )
    .setOrigin(0.5);
  if (text.width > TEXT_MAX_WIDTH) text.setScale(TEXT_MAX_WIDTH / text.width);
  parts.push(text);

  if (item.isNext) {
    const tag = scene.add.graphics();
    tag.fillStyle(COLOUR.sunnyGold, 1);
    tag.fillRoundedRect(
      -TAG_WIDTH / 2,
      TAG_Y - TAG_HEIGHT / 2,
      TAG_WIDTH,
      TAG_HEIGHT,
      pillRadius(TAG_WIDTH, TAG_HEIGHT),
    );
    tag.lineStyle(OUTLINE_PX - 1, COLOUR.ink, 1);
    tag.strokeRoundedRect(
      -TAG_WIDTH / 2,
      TAG_Y - TAG_HEIGHT / 2,
      TAG_WIDTH,
      TAG_HEIGHT,
      pillRadius(TAG_WIDTH, TAG_HEIGHT),
    );
    const label = scene.add
      .text(0, TAG_Y, 'NEXT', textStyle('caption', COLOUR_HEX.ink, COLOUR_HEX.ink))
      .setOrigin(0.5);
    parts.push(tag, label);
  }

  const zone = scene.add.zone(0, 0, w, h).setInteractive({ useHandCursor: true });
  zone.on('pointerup', () => onPick(item.id));
  parts.push(zone);
  return scene.add.container(x, y, parts);
}
