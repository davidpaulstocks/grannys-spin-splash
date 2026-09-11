/**
 * Generic ◀ item ▶ carousel — used for both the Granny and Gun selectors
 * (CLAUDE.md §7.2, §10, story 5.2). Locked items show their star cost;
 * tapping one shows a "earn more ★" toast instead of selecting it (§10
 * behaviour spec) — arrows always step through every item regardless of
 * lock state, only the centre tap is gated.
 */

import Phaser from 'phaser';

import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { drawLockIcon, drawStarIcon } from './icons';
import { pillRadius } from '../utils/math';
import { showToast } from './Toast';
import { textStyle } from '../utils/typography';

export interface CarouselItem {
  readonly id: string;
  readonly label: string;
  readonly unlocked: boolean;
  readonly cost: number;
  /** Placeholder colour swatch standing in for real sprite art (Sprint 3). */
  readonly swatchColour: number;
}

const CARD_WIDTH = 220;
const CARD_HEIGHT = 200;
const CARD_RADIUS = 24;
const SWATCH_SIZE = 96;
const ARROW_BUTTON_SIZE = 44;
const ARROW_GAP = 32;
const LOCK_ICON_SIZE = 20;
const STAR_ICON_RADIUS = 10;

export class Carousel extends Phaser.GameObjects.Container {
  private _items: readonly CarouselItem[];
  private _index: number;
  private readonly _onSelect: (id: string) => void;

  private readonly _cardBg: Phaser.GameObjects.Graphics;
  private readonly _swatch: Phaser.GameObjects.Rectangle;
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
    this._swatch = scene.add.rectangle(0, -20, SWATCH_SIZE, SWATCH_SIZE, COLOUR.cloud);
    this._swatch.setStrokeStyle(4, COLOUR.ink);
    this._label = scene.add
      .text(0, 60, '', textStyle('bodyL', COLOUR_HEX.ink, COLOUR_HEX.cloud))
      .setOrigin(0.5);

    const lockGfx = scene.add.graphics();
    drawLockIcon(lockGfx, LOCK_ICON_SIZE, COLOUR.cloud);
    const starGfx = scene.add.graphics().setPosition(-14, 26);
    drawStarIcon(starGfx, STAR_ICON_RADIUS, COLOUR.sunnyGold);
    this._costText = scene.add
      .text(4, 26, '', textStyle('bodyM', COLOUR_HEX.cloud, COLOUR_HEX.ink))
      .setOrigin(0, 0.5);
    const lockDim = scene.add.rectangle(0, -20, SWATCH_SIZE, SWATCH_SIZE, COLOUR.ink, 0.55);
    this._lockOverlay = scene.add.container(0, 0, [lockDim, lockGfx, starGfx, this._costText]);

    this._buildArrow(scene, -(CARD_WIDTH / 2 + ARROW_GAP), -1);
    this._buildArrow(scene, CARD_WIDTH / 2 + ARROW_GAP, 1);

    this.add([this._cardBg, this._swatch, this._label, this._lockOverlay]);
    scene.add.existing(this);

    const hitZone = scene.add
      .zone(0, -20, SWATCH_SIZE, SWATCH_SIZE)
      .setInteractive({ useHandCursor: true });
    hitZone.on('pointerup', () => this._onTapCurrent());
    this.add(hitZone);

    this._refresh();
  }

  /** The currently-selected item's id. */
  getSelectedId(): string {
    return this._items[this._index].id;
  }

  /** Replaces the item list wholesale (e.g. once new unlock state loads) and keeps the same selection if still present. */
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
    bg.fillStyle(COLOUR.cloud, 1);
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
    const tipX = direction * 6;
    arrow.fillTriangle(-tipX, -8, -tipX, 8, tipX, 0);

    const zone = scene.add
      .zone(offsetX, 0, ARROW_BUTTON_SIZE, ARROW_BUTTON_SIZE)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerup', () => this._step(direction));

    const group = scene.add.container(offsetX, 0, [bg, arrow]);
    this.add([group, zone]);
  }

  private _step(direction: -1 | 1): void {
    this._index = (this._index + direction + this._items.length) % this._items.length;
    this._refresh();
    this._onSelect(this.getSelectedId());
  }

  private _onTapCurrent(): void {
    const item = this._items[this._index];
    if (!item.unlocked) {
      showToast(
        this.scene,
        this.x,
        this.y - CARD_HEIGHT / 2 - 16,
        `Earn ${item.cost}★ more to unlock`,
      );
      return;
    }
    this._onSelect(item.id);
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

    this._swatch.setFillStyle(item.swatchColour);
    this._label.setText(item.label);
    this._lockOverlay.setVisible(!item.unlocked);
    this._costText.setText(`${item.cost}`);
  }
}
