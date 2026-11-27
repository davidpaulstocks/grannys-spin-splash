/**
 * The only furniture on a Jam screen: a "JAM" tag with the venue's name at the
 * top, a round Home button in the bottom-left corner and a round gun button in
 * the bottom-right, both clear of the water bar between them. The gun button
 * wears the picture of the gun in Granny's hands and, when it changes, names
 * the new one for a moment.
 */

import Phaser from 'phaser';

import { SPRITE_KEYS } from '../../assets/keys';
import { GAME_WIDTH, WATER_BAR_HEIGHT, WATER_BAR_MARGIN_X, WATER_BAR_Y } from '../../config';
import type { GunDef } from '../../entities/gun/gun.types';
import { createIconButton } from '../../ui/IconButton';
import { drawHomeIcon } from '../../ui/icons';
import { COLOUR, COLOUR_HEX } from '../../utils/colour';
import { pillRadius } from '../../utils/math';
import { EASE } from '../../utils/tween';
import { textStyle } from '../../utils/typography';

/** Above the wall and the count-in's numbers' neighbours; the same layer as the pause button. */
const DEPTH = 400;
const BUTTON_DIAMETER = 64;
/** Centred in the margin beside the water bar (the bar starts WATER_BAR_MARGIN_X in from each edge). */
const BUTTON_X = WATER_BAR_MARGIN_X / 2;
const BUTTON_Y = WATER_BAR_Y + WATER_BAR_HEIGHT / 2;
/** The gun's picture fills this much of the button's face. */
const GUN_PICTURE_PX = 44;

const NAME_GAP = 62;
const NAME_SHOW_MS = 1400;
const NAME_FADE_MS = 400;

const TAG_Y = 30;
const TAG_HEIGHT = 40;
const TAG_PADDING_X = 20;
const TAG_GAP = 12;
const TAG_ALPHA = 0.82;

/** What the controls tell the scene. */
export interface JamControlsDeps {
  readonly scene: Phaser.Scene;
  readonly venueName: string;
  /** The gun in her hands now, for the button's picture. */
  readonly gun: GunDef;
  /** The Home button was pressed. */
  readonly onHome: () => void;
  /** The gun button was pressed. */
  readonly onGun: () => void;
  /** Keeps the scene's own input from also reading the press as aim (see InputManager.claimPointer). */
  readonly pointerGuard: {
    claimPointer(id: number): void;
    releasePointer(id: number): void;
  };
}

export class JamControls {
  private readonly _picture: Phaser.GameObjects.Image;
  private readonly _name: Phaser.GameObjects.Text;

  constructor(private readonly _d: JamControlsDeps) {
    const scene = _d.scene;
    this._buildTag();
    createIconButton(scene, {
      x: BUTTON_X,
      y: BUTTON_Y,
      icon: drawHomeIcon,
      diameter: BUTTON_DIAMETER,
      onClick: _d.onHome,
      pointerGuard: _d.pointerGuard,
    }).setDepth(DEPTH);

    const gunButton = createIconButton(scene, {
      x: GAME_WIDTH - BUTTON_X,
      y: BUTTON_Y,
      diameter: BUTTON_DIAMETER,
      onClick: _d.onGun,
      pointerGuard: _d.pointerGuard,
    }).setDepth(DEPTH);
    this._picture = scene.add.image(0, 0, SPRITE_KEYS.gun(_d.gun.id));
    gunButton.addAt(this._picture, gunButton.length - 1);
    this.setGun(_d.gun, false);

    this._name = scene.add
      .text(
        GAME_WIDTH - BUTTON_X + BUTTON_DIAMETER / 2,
        BUTTON_Y - NAME_GAP,
        '',
        textStyle('bodyL', COLOUR_HEX.cloud, COLOUR_HEX.ink),
      )
      .setOrigin(1, 0.5)
      .setDepth(DEPTH)
      .setAlpha(0);
  }

  /** Shows `gun` on the button and, when `announce`, writes its name above it for a moment. */
  setGun(gun: GunDef, announce = true): void {
    this._picture.setTexture(SPRITE_KEYS.gun(gun.id));
    const { width, height } = this._picture.frame;
    this._picture.setScale(GUN_PICTURE_PX / Math.max(width, height));
    if (!announce) return;
    const scene = this._d.scene;
    scene.tweens.killTweensOf(this._name);
    this._name.setText(gun.name).setAlpha(1);
    scene.tweens.add({
      targets: this._name,
      alpha: 0,
      delay: NAME_SHOW_MS,
      duration: NAME_FADE_MS,
      ease: EASE.standardOut,
    });
  }

  /** "JAM" in gold and the venue's name in Cloud, on a dark pill at the top centre. */
  private _buildTag(): void {
    const scene = this._d.scene;
    const jam = scene.add
      .text(0, 0, 'JAM', textStyle('bodyL', COLOUR_HEX.sunnyGold, COLOUR_HEX.ink))
      .setOrigin(0, 0.5);
    const name = scene.add
      .text(0, 0, this._d.venueName, textStyle('bodyL', COLOUR_HEX.cloud, COLOUR_HEX.ink))
      .setOrigin(0, 0.5);
    const width = TAG_PADDING_X * 2 + jam.width + TAG_GAP + name.width;
    jam.setX(-width / 2 + TAG_PADDING_X);
    name.setX(jam.x + jam.width + TAG_GAP);
    const plate = scene.add.graphics();
    plate.fillStyle(COLOUR.ink, TAG_ALPHA);
    plate.fillRoundedRect(
      -width / 2,
      -TAG_HEIGHT / 2,
      width,
      TAG_HEIGHT,
      pillRadius(width, TAG_HEIGHT),
    );
    scene.add.container(GAME_WIDTH / 2, TAG_Y, [plate, jam, name]).setDepth(DEPTH);
  }
}
