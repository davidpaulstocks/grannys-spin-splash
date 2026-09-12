/**
 * The splash screen's hero visual (2026-09-12, direct user feedback: "show
 * a composite view where they are combined/overlapped... fun and
 * dramatic") — replaces the World carousel's plain thumbnail with a big
 * masked stage that layers the selected World's background, the selected
 * Granny standing on it, and the selected Gun as a corner badge, so
 * picking a loadout actually shows what it will look like together
 * instead of three disconnected icons. World selection still lives here
 * (its own prev/next arrows + lock/cost, same contract as `Carousel`) —
 * only the Granny/Gun textures are pushed in from outside, since those
 * carousels own their own selection state.
 */

import Phaser from 'phaser';

import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { drawLockIcon, drawStarIcon } from './icons';
import { pillRadius } from '../utils/math';
import { textStyle } from '../utils/typography';
import type { CarouselItem } from './Carousel';

const STAGE_WIDTH = 680;
const STAGE_HEIGHT = 340;
const STAGE_RADIUS = 24;
const ART_INSET = 10;
const GRANNY_ART_HEIGHT = 300;
const GUN_BADGE_SIZE = 96;
const GUN_BADGE_OFFSET_X = STAGE_WIDTH / 2 - 70;
const GUN_BADGE_OFFSET_Y = STAGE_HEIGHT / 2 - 90;
const LABEL_Y = STAGE_HEIGHT / 2 - 28;
const ARROW_BUTTON_SIZE = 50;
const ARROW_GAP = 32;
const LOCK_ICON_SIZE = 26;
const STAR_ICON_RADIUS = 13;

export class LoadoutStage extends Phaser.GameObjects.Container {
  private _items: readonly CarouselItem[];
  private _index: number;
  private readonly _onSelect: (id: string) => void;

  private readonly _worldImage: Phaser.GameObjects.Image;
  private readonly _grannyImage: Phaser.GameObjects.Image;
  private readonly _gunBadgeBg: Phaser.GameObjects.Graphics;
  private readonly _gunImage: Phaser.GameObjects.Image;
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

    const cardBg = scene.add.graphics();
    cardBg.fillStyle(COLOUR.cloud, 1);
    cardBg.fillRoundedRect(
      -STAGE_WIDTH / 2,
      -STAGE_HEIGHT / 2,
      STAGE_WIDTH,
      STAGE_HEIGHT,
      STAGE_RADIUS,
    );

    // Layered art, clipped to the stage's inner art area so nothing spills
    // past the card — a plain rect mask inset a few px from the rounded
    // border, which then draws on top and hides the corner mismatch.
    const artArea = new Phaser.GameObjects.Container(scene, 0, 0);
    this._worldImage = scene.add.image(0, 0, '__DEFAULT').setVisible(false);
    this._grannyImage = scene.add
      .image(0, STAGE_HEIGHT / 2 - ART_INSET, '__DEFAULT')
      .setOrigin(0.5, 1);
    artArea.add([this._worldImage, this._grannyImage]);
    const maskShape = scene.make.graphics({});
    maskShape.fillStyle(0xffffff);
    maskShape.fillRect(
      x - STAGE_WIDTH / 2 + ART_INSET,
      y - STAGE_HEIGHT / 2 + ART_INSET,
      STAGE_WIDTH - ART_INSET * 2,
      STAGE_HEIGHT - ART_INSET * 2 - 56,
    );
    artArea.setMask(maskShape.createGeometryMask());

    const borderGfx = scene.add.graphics();
    borderGfx.lineStyle(4, COLOUR.ink, 1);
    borderGfx.strokeRoundedRect(
      -STAGE_WIDTH / 2,
      -STAGE_HEIGHT / 2,
      STAGE_WIDTH,
      STAGE_HEIGHT,
      STAGE_RADIUS,
    );

    this._gunBadgeBg = scene.add.graphics().setPosition(GUN_BADGE_OFFSET_X, GUN_BADGE_OFFSET_Y);
    this._gunImage = scene.add.image(0, 0, '__DEFAULT').setVisible(false);
    const gunBadge = scene.add.container(GUN_BADGE_OFFSET_X, GUN_BADGE_OFFSET_Y, [this._gunImage]);
    this._drawGunBadgeBg();

    this._label = scene.add
      .text(0, LABEL_Y, '', textStyle('bodyL', COLOUR_HEX.ink, COLOUR_HEX.cloud))
      .setOrigin(0.5);

    const lockGfx = scene.add.graphics();
    drawLockIcon(lockGfx, LOCK_ICON_SIZE, COLOUR.cloud);
    const starGfx = scene.add.graphics().setPosition(-18, 40);
    drawStarIcon(starGfx, STAR_ICON_RADIUS, COLOUR.sunnyGold);
    this._costText = scene.add
      .text(6, 40, '', textStyle('bodyM', COLOUR_HEX.cloud, COLOUR_HEX.ink))
      .setOrigin(0, 0.5);
    const lockDim = scene.add.rectangle(
      0,
      -8,
      STAGE_WIDTH - ART_INSET * 2,
      STAGE_HEIGHT - 76,
      COLOUR.ink,
      0.55,
    );
    this._lockOverlay = scene.add.container(0, 0, [lockDim, lockGfx, starGfx, this._costText]);

    this._buildArrow(scene, -(STAGE_WIDTH / 2 + ARROW_GAP), -1);
    this._buildArrow(scene, STAGE_WIDTH / 2 + ARROW_GAP, 1);

    this.add([
      cardBg,
      artArea,
      this._gunBadgeBg,
      gunBadge,
      borderGfx,
      this._label,
      this._lockOverlay,
    ]);
    scene.add.existing(this);

    const hitZone = scene.add
      .zone(0, -20, STAGE_WIDTH - ART_INSET * 2, STAGE_HEIGHT - 76)
      .setInteractive({ useHandCursor: true });
    hitZone.on('pointerup', () => this._onSelect(this.getSelectedId()));
    this.add(hitZone);

    this._refresh();
  }

  getSelectedId(): string {
    return this._items[this._index].id;
  }

  /** Replaces the World item list wholesale (e.g. after an unlock) and keeps the same selection if still present. */
  setItems(items: readonly CarouselItem[]): void {
    const currentId = this.getSelectedId();
    this._items = items;
    const found = items.findIndex((i) => i.id === currentId);
    this._index = found >= 0 ? found : 0;
    this._refresh();
  }

  /** Pushed in from SplashScene whenever the Granny carousel changes — keeps the composite in sync. */
  setGrannyTexture(key: string): void {
    if (!this.scene.textures.exists(key)) return;
    this._grannyImage.setTexture(key).setVisible(true);
    const scale = GRANNY_ART_HEIGHT / this._grannyImage.frame.height;
    this._grannyImage.setScale(scale);
  }

  /** Pushed in from SplashScene whenever the Gun carousel changes — keeps the composite in sync. */
  setGunTexture(key: string): void {
    if (!this.scene.textures.exists(key)) return;
    this._gunImage.setTexture(key).setVisible(true);
    const frame = this._gunImage.frame;
    const scale = Math.min(GUN_BADGE_SIZE / frame.width, GUN_BADGE_SIZE / frame.height) * 0.8;
    this._gunImage.setScale(scale);
  }

  private _drawGunBadgeBg(): void {
    this._gunBadgeBg.fillStyle(COLOUR.cloud, 1);
    this._gunBadgeBg.fillRoundedRect(
      -GUN_BADGE_SIZE / 2,
      -GUN_BADGE_SIZE / 2,
      GUN_BADGE_SIZE,
      GUN_BADGE_SIZE,
      18,
    );
    this._gunBadgeBg.lineStyle(3, COLOUR.ink, 1);
    this._gunBadgeBg.strokeRoundedRect(
      -GUN_BADGE_SIZE / 2,
      -GUN_BADGE_SIZE / 2,
      GUN_BADGE_SIZE,
      GUN_BADGE_SIZE,
      18,
    );
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
    const tipX = direction * 7;
    arrow.fillTriangle(-tipX, -9, -tipX, 9, tipX, 0);

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
    if (item.swatchTextureKey && this.scene.textures.exists(item.swatchTextureKey)) {
      this._worldImage.setTexture(item.swatchTextureKey).setVisible(true);
      const frame = this._worldImage.frame;
      const scale = Math.max(
        (STAGE_WIDTH - ART_INSET * 2) / frame.width,
        (STAGE_HEIGHT - ART_INSET * 2 - 56) / frame.height,
      );
      this._worldImage.setScale(scale);
    } else {
      this._worldImage.setVisible(false);
    }
    this._label.setText(item.label);
    this._lockOverlay.setVisible(!item.unlocked);
    this._costText.setText(`${item.cost}`);
  }
}
