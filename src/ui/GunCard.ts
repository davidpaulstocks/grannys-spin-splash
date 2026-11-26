/**
 * The Shop's card for the selected gun: five level pips (filled to its level;
 * empty with a padlock when not owned), the perk line in words, and ONE action
 * under it: BUY, UPGRADE, or a MAX LEVEL tag. A button the player cannot
 * afford is greyed; tapping it shakes it and lets the scene say how many more
 * coins it needs. Everything sits inside the panel; nothing crosses its edge.
 */

import Phaser from 'phaser';

import { MAX_GUN_LEVEL } from '../entities/gun/gun.data';
import { formatCount } from '../systems/Rewards';
import { COLOUR, COLOUR_HEX, shade } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { BOUNCE_OVERSHOOT, DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';
import { createButton } from './Button';
import { drawLockIcon } from './icons';
import { createPanel } from './Panel';

/** What the card shows for one gun. */
export interface GunCardState {
  readonly gunId: string;
  readonly owned: boolean;
  /** 1 to `MAX_GUN_LEVEL`; ignored when not owned. */
  readonly level: number;
  /** The perk line, already worded (`gunPerk`). */
  readonly perk: string;
  /** Coins the action costs; null at the maximum level. */
  readonly price: number | null;
  readonly canAfford: boolean;
}

export interface GunCardConfig {
  /** Centre of the card. */
  readonly x: number;
  readonly y: number;
  /** The player pressed the action button; true when it went through, false when coins were short. */
  readonly onAction: (gunId: string) => boolean;
}

export interface GunCard {
  readonly container: Phaser.GameObjects.Container;
  /** Redraws for `state`; pips from `bounceFrom` up to the level pop in with a bounce. */
  show(state: GunCardState, bounceFrom?: number): void;
}

export const GUN_CARD_WIDTH = 230;
export const GUN_CARD_HEIGHT = 150;
/** Offsets from the card's centre. */
const PIP_Y = -49;
const PIP_SPACING = 30;
const PIP_RADIUS = 10;
const PIPS_SHIFT_X = 14;
const LOCK_X = -88;
const LOCK_SIZE = 20;
const PERK_Y = -19;
const PERK_MAX_WIDTH = 204;
const ACTION_Y = 31;
const ACTION_WIDTH = 190;
const MAX_TAG_HEIGHT = 40;
const DISABLED_ALPHA = 0.55;
const SHAKE_PX = 8;
const SHAKE_MS = 55;
const PIP_OUTLINE_PX = 3;
const PIP_POP_FROM = 0.2;
const PIP_STAGGER_MS = 90;
const EMPTY_PIP = shade(COLOUR.cloud, 0.82);

/** Builds the card (empty until `show` is called). */
export function createGunCard(scene: Phaser.Scene, config: GunCardConfig): GunCard {
  const container = scene.add.container(0, 0);

  const show = (state: GunCardState, bounceFrom?: number): void => {
    container.each((child: Phaser.GameObjects.GameObject) => scene.tweens.killTweensOf(child));
    container.removeAll(true);
    container.add(
      createPanel(scene, {
        x: config.x,
        y: config.y,
        width: GUN_CARD_WIDTH,
        height: GUN_CARD_HEIGHT,
      }),
    );

    const filled = state.owned ? state.level : 0;
    for (let i = 0; i < MAX_GUN_LEVEL; i++) {
      const pip = scene.add.graphics({
        x: config.x + PIPS_SHIFT_X + (i - (MAX_GUN_LEVEL - 1) / 2) * PIP_SPACING,
        y: config.y + PIP_Y,
      });
      const isFilled = i < filled;
      pip.fillStyle(isFilled ? COLOUR.sunnyGold : EMPTY_PIP, 1);
      pip.fillCircle(0, 0, PIP_RADIUS);
      pip.lineStyle(PIP_OUTLINE_PX, COLOUR.ink, 1);
      pip.strokeCircle(0, 0, PIP_RADIUS);
      container.add(pip);
      if (isFilled && bounceFrom !== undefined && i >= bounceFrom) {
        pip.setScale(PIP_POP_FROM);
        scene.tweens.add({
          targets: pip,
          scale: 1,
          delay: (i - bounceFrom) * PIP_STAGGER_MS,
          duration: DURATION.celebration,
          ease: EASE.bouncy,
          easeParams: [BOUNCE_OVERSHOOT],
        });
      }
    }
    if (!state.owned) {
      const lock = scene.add.graphics({ x: config.x + LOCK_X, y: config.y + PIP_Y });
      drawLockIcon(lock, LOCK_SIZE, COLOUR.softSlate);
      container.add(lock);
    }

    const perk = scene.add
      .text(
        config.x,
        config.y + PERK_Y,
        state.perk,
        textStyle('bodyM', COLOUR_HEX.grannyPink, COLOUR_HEX.cloud),
      )
      .setOrigin(0.5);
    if (perk.width > PERK_MAX_WIDTH) perk.setScale(PERK_MAX_WIDTH / perk.width);
    container.add(perk);

    // Interactive children go last so they win input.
    if (state.price === null) {
      container.add(maxTag(scene, config.x, config.y + ACTION_Y));
      return;
    }
    const verb = state.owned ? 'UPGRADE' : 'BUY';
    const button = createButton(scene, {
      x: config.x,
      y: config.y + ACTION_Y,
      label: `${verb} ${formatCount(state.price)}`,
      variant: 'secondary',
      size: 'sm',
      minWidth: ACTION_WIDTH,
      expandHitArea: false,
      onClick: () => {
        if (!config.onAction(state.gunId)) shake(scene, button);
      },
    });
    if (!state.canAfford) button.setAlpha(DISABLED_ALPHA);
    container.add(button);
  };

  return { container, show };
}

/** The tag that replaces the button at the top level: gold, outlined, not pressable. */
function maxTag(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const bg = scene.add.graphics();
  bg.fillStyle(COLOUR.sunnyGold, 1);
  bg.fillRoundedRect(
    -ACTION_WIDTH / 2,
    -MAX_TAG_HEIGHT / 2,
    ACTION_WIDTH,
    MAX_TAG_HEIGHT,
    pillRadius(ACTION_WIDTH, MAX_TAG_HEIGHT),
  );
  bg.lineStyle(PIP_OUTLINE_PX, COLOUR.ink, 1);
  bg.strokeRoundedRect(
    -ACTION_WIDTH / 2,
    -MAX_TAG_HEIGHT / 2,
    ACTION_WIDTH,
    MAX_TAG_HEIGHT,
    pillRadius(ACTION_WIDTH, MAX_TAG_HEIGHT),
  );
  const label = scene.add
    .text(0, 0, 'MAX LEVEL', textStyle('buttonS', COLOUR_HEX.ink, COLOUR_HEX.ink))
    .setOrigin(0.5);
  return scene.add.container(x, y, [bg, label]);
}

/** A gentle side-to-side wobble: "not yet". */
function shake(scene: Phaser.Scene, target: Phaser.GameObjects.Container): void {
  const home = target.x;
  scene.tweens.add({
    targets: target,
    x: { from: home - SHAKE_PX, to: home + SHAKE_PX },
    duration: SHAKE_MS,
    yoyo: true,
    repeat: 2,
    ease: EASE.standardOut,
    onComplete: () => target.setX(home),
  });
}
