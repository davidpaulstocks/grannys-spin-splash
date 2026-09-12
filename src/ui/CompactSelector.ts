/**
 * A slim ◀ label ▶ cycler — no swatch box (2026-09-12, direct user
 * feedback: once the LoadoutStage shows Granny/Gun/World combined, having
 * each one ALSO sit in its own big thumbnail card next to it is
 * redundant). Used for the Granny and Gun axes now that `LoadoutStage`
 * carries the actual art; keeps the same unlock/cost contract as
 * `Carousel` so `SplashScene`'s `_attemptUnlock` flow doesn't need two
 * different shapes to feed.
 */

import Phaser from 'phaser';

import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { drawLockIcon, drawStarIcon } from './icons';
import { pillRadius } from '../utils/math';
import { textStyle } from '../utils/typography';

export interface CompactItem {
  readonly id: string;
  readonly label: string;
  readonly unlocked: boolean;
  readonly cost: number;
}

const PILL_WIDTH = 210;
const PILL_HEIGHT = 64;
const ARROW_BUTTON_SIZE = 44;
const ARROW_GAP = 18;
const LOCK_ICON_SIZE = 16;
const STAR_ICON_RADIUS = 9;

export class CompactSelector extends Phaser.GameObjects.Container {
  private _items: readonly CompactItem[];
  private _index: number;
  private readonly _onSelect: (id: string) => void;

  private readonly _pillBg: Phaser.GameObjects.Graphics;
  private readonly _label: Phaser.GameObjects.Text;
  private readonly _lockRow: Phaser.GameObjects.Container;
  private readonly _costText: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    items: readonly CompactItem[],
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

    this._pillBg = scene.add.graphics();
    this._label = scene.add
      .text(0, -10, '', textStyle('bodyL', COLOUR_HEX.ink, COLOUR_HEX.cloud))
      .setOrigin(0.5);

    const lockGfx = scene.add.graphics();
    drawLockIcon(lockGfx, LOCK_ICON_SIZE, COLOUR.softSlate);
    const starGfx = scene.add.graphics().setPosition(-16, 16);
    drawStarIcon(starGfx, STAR_ICON_RADIUS, COLOUR.sunnyGold);
    lockGfx.setPosition(-38, 16);
    this._costText = scene.add
      .text(-2, 16, '', textStyle('bodyM', COLOUR_HEX.softSlate, COLOUR_HEX.cloud))
      .setOrigin(0, 0.5);
    this._lockRow = scene.add.container(0, 0, [lockGfx, starGfx, this._costText]);

    this._buildArrow(scene, -(PILL_WIDTH / 2 + ARROW_GAP), -1);
    this._buildArrow(scene, PILL_WIDTH / 2 + ARROW_GAP, 1);

    this.add([this._pillBg, this._label, this._lockRow]);
    scene.add.existing(this);

    const hitZone = scene.add
      .zone(0, 0, PILL_WIDTH, PILL_HEIGHT)
      .setInteractive({ useHandCursor: true });
    hitZone.on('pointerup', () => this._onSelect(this.getSelectedId()));
    this.add(hitZone);

    this._refresh();
  }

  getSelectedId(): string {
    return this._items[this._index].id;
  }

  /** Replaces the item list wholesale (e.g. after an unlock) and keeps the same selection if still present. */
  setItems(items: readonly CompactItem[]): void {
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

  private _refresh(): void {
    const item = this._items[this._index];

    this._pillBg.clear();
    this._pillBg.fillStyle(COLOUR.cloud, 1);
    const radius = pillRadius(PILL_WIDTH, PILL_HEIGHT);
    this._pillBg.fillRoundedRect(
      -PILL_WIDTH / 2,
      -PILL_HEIGHT / 2,
      PILL_WIDTH,
      PILL_HEIGHT,
      radius,
    );
    this._pillBg.lineStyle(3, COLOUR.ink, 1);
    this._pillBg.strokeRoundedRect(
      -PILL_WIDTH / 2,
      -PILL_HEIGHT / 2,
      PILL_WIDTH,
      PILL_HEIGHT,
      radius,
    );

    this._label.setText(item.label);
    this._lockRow.setVisible(!item.unlocked);
    this._costText.setText(`${item.cost}`);
  }
}
