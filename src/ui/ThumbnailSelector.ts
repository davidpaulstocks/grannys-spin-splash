/**
 * A compact visual ◀ thumbnail ▶ selector, name printed below the art
 * (2026-09-12, direct user feedback: "better to let players scroll through
 * carousel of different thumbnails for guns and grannies... make it a more
 * visual selector, [with] the beautiful composite visual in centre
 * reflecting current choices" — a deliberate return to showing real art
 * here, after an earlier session's `CompactSelector` had gone text-only).
 *
 * Sized to fit the same footprint budget `CompactSelector` was built to
 * respect (see `SplashScene`'s carousel-X spacing comment) — a full-size
 * `Carousel.ts` card is far too wide to sit either side of the 680px-wide
 * `LoadoutStage` composite without the exact overlap this project already
 * fixed twice tonight. The design that actually fits AND stays visual: the
 * thumbnail and its flanking arrows share one row (arrows inset within the
 * card, exactly as `CompactSelector`/`LoadoutStage` do), and the item's
 * name sits in its OWN row below that — never sharing horizontal space
 * with an arrow, which is what caused `CompactSelector`'s long-name
 * clipping bug. Two rows instead of one is what buys the room a thumbnail
 * image needs without growing the total width at all.
 */

import Phaser from 'phaser';

import { COLOUR, COLOUR_HEX } from '../utils/colour';
import type { CarouselItem } from './Carousel';
import { drawLockIcon, drawStarIcon } from './icons';
import { pillRadius } from '../utils/math';
import { textStyle } from '../utils/typography';

const CARD_WIDTH = 210;
const CARD_HEIGHT = 232;
const CARD_RADIUS = 20;
const THUMB_SIZE = 132;
const THUMB_Y = -32;
const LABEL_Y = 82;
/** Bigger than CompactSelector's old 44px — chunky, easy for a young child to hit (CLAUDE.md §6.1). */
const ARROW_BUTTON_SIZE = 52;
const ARROW_INSET = 4;
const ARROW_OFFSET_X = CARD_WIDTH / 2 - ARROW_BUTTON_SIZE / 2 - ARROW_INSET;
const LOCK_ICON_SIZE = 22;
const STAR_ICON_RADIUS = 11;

export class ThumbnailSelector extends Phaser.GameObjects.Container {
  private _items: readonly CarouselItem[];
  private _index: number;
  private readonly _onSelect: (id: string) => void;

  private readonly _cardBg: Phaser.GameObjects.Graphics;
  private readonly _swatch: Phaser.GameObjects.Rectangle;
  private readonly _swatchImage: Phaser.GameObjects.Image;
  private readonly _label: Phaser.GameObjects.Text;
  private readonly _lockOverlay: Phaser.GameObjects.Container;
  private readonly _costText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    items: readonly CarouselItem[],
    initialId: string,
    onSelect: (id: string) => void,
  ) {
    super(scene, x, y);
    this._items = items;
    this._index = Math.max(
      0,
      items.findIndex((i) => i.id === initialId),
    );
    this._onSelect = onSelect;

    this._cardBg = scene.add.graphics();
    this._swatch = scene.add.rectangle(0, THUMB_Y, THUMB_SIZE, THUMB_SIZE, COLOUR.cloud);
    this._swatch.setStrokeStyle(3, COLOUR.ink);
    this._swatchImage = scene.add.image(0, THUMB_Y, '__DEFAULT').setVisible(false);
    this._label = scene.add
      .text(0, LABEL_Y, '', textStyle('bodyM', COLOUR_HEX.ink, COLOUR_HEX.cloud))
      .setOrigin(0.5);

    const lockGfx = scene.add.graphics();
    drawLockIcon(lockGfx, LOCK_ICON_SIZE, COLOUR.cloud);
    const starGfx = scene.add.graphics().setPosition(-16, 34);
    drawStarIcon(starGfx, STAR_ICON_RADIUS, COLOUR.sunnyGold);
    lockGfx.setPosition(0, -8);
    this._costText = scene.add
      .text(6, 34, '', textStyle('bodyM', COLOUR_HEX.cloud, COLOUR_HEX.ink))
      .setOrigin(0, 0.5);
    const lockDim = scene.add.rectangle(0, THUMB_Y, THUMB_SIZE, THUMB_SIZE, COLOUR.ink, 0.55);
    this._lockOverlay = scene.add.container(0, 0, [lockDim, lockGfx, starGfx, this._costText]);

    this.add([this._cardBg, this._swatch, this._swatchImage, this._label, this._lockOverlay]);
    scene.add.existing(this);

    const hitZone = scene.add
      .zone(0, THUMB_Y, THUMB_SIZE, THUMB_SIZE)
      .setInteractive({ useHandCursor: true });
    hitZone.on('pointerup', () => this._onSelect(this.getSelectedId()));
    this.add(hitZone);

    // Added last, and therefore on top for both painting and input — see
    // this file's class doc comment and `CompactSelector`'s matching note:
    // arrows sit inset within the card, so they must win any overlap with
    // the opaque card background and the thumbnail's own tap-to-select zone.
    this._buildArrow(scene, -ARROW_OFFSET_X, -1);
    this._buildArrow(scene, ARROW_OFFSET_X, 1);

    this._refresh();
  }

  getSelectedId(): string {
    return this._items[this._index].id;
  }

  /** Replaces the item list wholesale (e.g. after an unlock) and keeps the same selection if still present. */
  setItems(items: readonly CarouselItem[]): void {
    const currentId = this.getSelectedId();
    this._items = items;
    const found = items.findIndex((i) => i.id === currentId);
    this._index = found >= 0 ? found : 0;
    this._refresh();
  }

  private _buildArrow(scene: Phaser.Scene, offsetX: number, direction: -1 | 1): void {
    const bg = scene.add.graphics();
    const radius = pillRadius(ARROW_BUTTON_SIZE, ARROW_BUTTON_SIZE);
    bg.fillStyle(COLOUR.mintGreen, 1);
    bg.fillRoundedRect(
      -ARROW_BUTTON_SIZE / 2,
      -ARROW_BUTTON_SIZE / 2,
      ARROW_BUTTON_SIZE,
      ARROW_BUTTON_SIZE,
      radius,
    );
    bg.lineStyle(3, COLOUR.ink, 1);
    bg.strokeRoundedRect(
      -ARROW_BUTTON_SIZE / 2,
      -ARROW_BUTTON_SIZE / 2,
      ARROW_BUTTON_SIZE,
      ARROW_BUTTON_SIZE,
      radius,
    );

    const arrow = scene.add.graphics();
    arrow.fillStyle(COLOUR.ink, 1);
    const tipX = direction * 7;
    arrow.fillTriangle(-tipX, -9, -tipX, 9, tipX, 0);

    const zone = scene.add
      .zone(offsetX, THUMB_Y, ARROW_BUTTON_SIZE + 10, THUMB_SIZE)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerup', () => this._step(direction));

    const group = scene.add.container(offsetX, THUMB_Y, [bg, arrow]);
    this.add([group, zone]);
  }

  private _step(direction: -1 | 1): void {
    this._index = (this._index + direction + this._items.length) % this._items.length;
    this._refresh();
    this._onSelect(this.getSelectedId());
  }

  private _refresh(): void {
    const item = this._items[this._index];

    this._cardBg.clear();
    this._cardBg.fillStyle(COLOUR.cloud, 1);
    this._cardBg.fillRoundedRect(
      -CARD_WIDTH / 2,
      -CARD_HEIGHT / 2,
      CARD_WIDTH,
      CARD_HEIGHT,
      CARD_RADIUS,
    );
    this._cardBg.lineStyle(4, COLOUR.ink, 1);
    this._cardBg.strokeRoundedRect(
      -CARD_WIDTH / 2,
      -CARD_HEIGHT / 2,
      CARD_WIDTH,
      CARD_HEIGHT,
      CARD_RADIUS,
    );

    if (item.swatchTextureKey && this.scene.textures.exists(item.swatchTextureKey)) {
      this._swatch.setVisible(false);
      this._swatchImage.setVisible(true).setTexture(item.swatchTextureKey);
      const frame = this._swatchImage.frame;
      const scale = Math.min(THUMB_SIZE / frame.width, THUMB_SIZE / frame.height);
      this._swatchImage.setScale(scale);
    } else {
      this._swatch.setVisible(true).setFillStyle(item.swatchColour);
      this._swatchImage.setVisible(false);
    }
    // Long names (e.g. "The Squirt Sister") get a smaller row all to
    // themselves rather than sharing the thumbnail row with the arrows —
    // see the class doc comment for why that's the actual fix.
    this._label.setText(item.label).setScale(1);
    const maxLabelWidth = CARD_WIDTH - 16;
    if (this._label.width > maxLabelWidth) {
      this._label.setScale(maxLabelWidth / this._label.width);
    }
    this._lockOverlay.setVisible(!item.unlocked);
    this._costText.setText(`${item.cost}`);
  }
}
