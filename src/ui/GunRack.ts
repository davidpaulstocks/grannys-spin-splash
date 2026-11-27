/**
 * The gun rack: the whole ladder of guns in price order, six to a page with
 * arrows and page dots, opening on the page that holds the equipped gun. Owned
 * guns are in colour with their level, the equipped one is ringed in gold,
 * locked ones are dimmed with their price, and the next one to save for wears
 * a NEXT tag. Locked guns the player cannot afford yet beyond the next one are
 * dark silhouettes with only a price, so the prizes ahead are teased, not
 * shown. Every cell has a thin frame in its rarity colour and its POWER number.
 * Tapping a cell tells the scene which gun was picked.
 */

import Phaser from 'phaser';

import { SPRITE_KEYS } from '../assets/keys';
import type { GunRarity } from '../entities/gun/gun.types';
import { formatCount } from '../systems/Rewards';
import { COLOUR, COLOUR_HEX, shade } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { textStyle } from '../utils/typography';
import { rarityColour } from './gunRarity';
import { createIconButton } from './IconButton';
import { drawBackIcon, drawForwardIcon } from './icons';

export interface GunRackItem {
  readonly id: string;
  readonly owned: boolean;
  readonly equipped: boolean;
  /** 1 to 5; shown for owned guns. */
  readonly level: number;
  readonly price: number;
  /** The next gun to save for. */
  readonly isNext: boolean;
  readonly rarity: GunRarity;
  /** "POWER 550" at the gun's level. */
  readonly power: string;
  /** A locked gun beyond the next one that cannot be afforded yet: drawn as a dark shape with only its price. */
  readonly silhouette: boolean;
}

export interface GunRackConfig {
  /** Centre of the whole row. */
  readonly x: number;
  readonly y: number;
  readonly onPick: (gunId: string) => void;
}

export interface GunRack {
  readonly container: Phaser.GameObjects.Container;
  /** Redraws the row for `items` (call after anything is bought or equipped). The first call opens on the equipped gun's page. */
  setItems(items: readonly GunRackItem[]): void;
}

export const GUN_RACK_CELL_WIDTH = 96;
export const GUN_RACK_CELL_HEIGHT = 92;
/** Guns on one page. */
export const GUN_RACK_PAGE_SIZE = 6;
const GAP = 8;
const CELL_RADIUS = 16;
const OUTLINE_PX = 3;
const EQUIPPED_OUTLINE_PX = 6;
const IMAGE_Y = -16;
const IMAGE_MAX_W = 76;
const IMAGE_MAX_H = 34;
const POWER_Y = 12;
const TEXT_Y = 33;
const TEXT_MAX_WIDTH = GUN_RACK_CELL_WIDTH - 12;
const TAG_Y = -37;
const TAG_WIDTH = 52;
const TAG_HEIGHT = 20;
const LOCKED_FILL = shade(COLOUR.cloud, 0.8);
const LOCKED_TINT = shade(COLOUR.cloud, 0.5);
const LOCKED_ALPHA = 0.8;
const ARROW_DIAMETER = 44;
const ARROW_GAP = 16;
const DISABLED_ARROW_ALPHA = 0.3;
const DOT_Y_OFFSET = GUN_RACK_CELL_HEIGHT / 2 + 5;
const DOT_RADIUS = 3;
const DOT_SPACING = 12;

/** Page number (0-based) a gun at `index` is on. */
export function pageOfIndex(index: number): number {
  return Math.floor(Math.max(0, index) / GUN_RACK_PAGE_SIZE);
}

/** How many pages `count` guns take. */
export function pageCount(count: number): number {
  return Math.max(1, Math.ceil(count / GUN_RACK_PAGE_SIZE));
}

/** Builds the rack (empty until `setItems` is called). */
export function createGunRack(scene: Phaser.Scene, config: GunRackConfig): GunRack {
  const container = scene.add.container(0, 0);
  let items: readonly GunRackItem[] = [];
  let page = 0;
  let opened = false;

  const draw = (): void => {
    container.removeAll(true);
    const pages = pageCount(items.length);
    page = Math.min(page, pages - 1);
    const shown = items.slice(page * GUN_RACK_PAGE_SIZE, (page + 1) * GUN_RACK_PAGE_SIZE);
    const rowWidth = GUN_RACK_PAGE_SIZE * GUN_RACK_CELL_WIDTH + (GUN_RACK_PAGE_SIZE - 1) * GAP;
    shown.forEach((item, i) => {
      const cx =
        config.x - rowWidth / 2 + GUN_RACK_CELL_WIDTH / 2 + i * (GUN_RACK_CELL_WIDTH + GAP);
      container.add(buildCell(scene, item, cx, config.y, config.onPick));
    });
    if (pages <= 1) return;
    const arrowX = rowWidth / 2 + ARROW_GAP + ARROW_DIAMETER / 2;
    const step = (delta: number): void => {
      const next = page + delta;
      if (next < 0 || next >= pages) return;
      page = next;
      draw();
    };
    const left = createIconButton(scene, {
      x: config.x - arrowX,
      y: config.y,
      diameter: ARROW_DIAMETER,
      icon: (g, size, colour) => drawBackIcon(g, size, colour),
      onClick: () => step(-1),
    });
    const right = createIconButton(scene, {
      x: config.x + arrowX,
      y: config.y,
      diameter: ARROW_DIAMETER,
      icon: (g, size, colour) => drawForwardIcon(g, size, colour),
      onClick: () => step(1),
    });
    if (page === 0) left.setAlpha(DISABLED_ARROW_ALPHA);
    if (page === pages - 1) right.setAlpha(DISABLED_ARROW_ALPHA);
    container.add([left, right]);
    for (let p = 0; p < pages; p++) {
      const dot = scene.add.circle(
        config.x + (p - (pages - 1) / 2) * DOT_SPACING,
        config.y + DOT_Y_OFFSET,
        DOT_RADIUS,
        p === page ? COLOUR.ink : COLOUR.softSlate,
        p === page ? 1 : 0.5,
      );
      container.add(dot);
    }
  };

  const setItems = (next: readonly GunRackItem[]): void => {
    items = next;
    if (!opened) {
      opened = true;
      page = pageOfIndex(
        Math.max(
          0,
          items.findIndex((item) => item.equipped),
        ),
      );
    }
    draw();
  };
  return { container, setItems };
}

/** One cell: card, gun picture, POWER, level or price, the NEXT tag, and a tap zone on top. */
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
    item.equipped ? COLOUR.sunnyGold : rarityColour(item.rarity),
    1,
  );
  bg.strokeRoundedRect(-w / 2, -h / 2, w, h, CELL_RADIUS);
  const parts: Phaser.GameObjects.GameObject[] = [bg];

  const key = SPRITE_KEYS.gun(item.id);
  if (scene.textures.exists(key)) {
    const image = scene.add.image(0, IMAGE_Y, key);
    image.setScale(Math.min(IMAGE_MAX_W / image.width, IMAGE_MAX_H / image.height));
    if (item.silhouette) image.setTintFill(COLOUR.ink);
    else if (!item.owned) image.setTint(LOCKED_TINT).setAlpha(LOCKED_ALPHA);
    parts.push(image);
  }
  if (!item.silhouette) {
    parts.push(
      scene.add
        .text(0, POWER_Y, item.power, textStyle('caption', COLOUR_HEX.ink, COLOUR_HEX.cloud))
        .setOrigin(0.5),
    );
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
    const radius = pillRadius(TAG_WIDTH, TAG_HEIGHT);
    const tag = scene.add.graphics();
    tag.fillStyle(COLOUR.sunnyGold, 1);
    tag.fillRoundedRect(-TAG_WIDTH / 2, TAG_Y - TAG_HEIGHT / 2, TAG_WIDTH, TAG_HEIGHT, radius);
    tag.lineStyle(OUTLINE_PX - 1, COLOUR.ink, 1);
    tag.strokeRoundedRect(-TAG_WIDTH / 2, TAG_Y - TAG_HEIGHT / 2, TAG_WIDTH, TAG_HEIGHT, radius);
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
