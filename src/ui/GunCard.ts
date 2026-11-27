/**
 * The Shop's card for the selected gun: five level pips (filled to its level;
 * empty with a padlock when not owned), then what the next purchase changes
 * in words and numbers ("Level 2 → 3", "Coins ×1.15 → ×1.3", "Power +8% →
 * +16%"), and ONE button under it with the price on it: "UPGRADE · 3,000",
 * "BUY · 6,000", or a MAX LEVEL tag. After an upgrade the new pip pops in with
 * a sparkle, the numbers count to their new values, and the button is locked
 * for a moment so it cannot be hammered. A button the player cannot afford is
 * greyed; tapping it shakes it and lets the scene say how many coins it needs.
 * Everything sits inside the panel; nothing crosses its edge.
 */

import Phaser from 'phaser';

import { GUN_LADDER_DEFS, MAX_GUN_LEVEL } from '../entities/gun/gun.data';
import { formatCount } from '../systems/Rewards';
import { COLOUR, COLOUR_HEX, shade } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { BOUNCE_OVERSHOOT, DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';
import { createButton } from './Button';
import { drawLockIcon } from './icons';
import { addPowerPill, powerText, rarityLabel } from './gunRarity';
import { createPanel } from './Panel';
import { fitWidth } from './RewardParts';
import { spawnSparkles } from './sparkle';

/** One line of the card. With `to` it reads "prefix from → to" and can count; without, "prefix from". */
export interface GunCardRow {
  readonly prefix: string;
  readonly from: number;
  readonly to?: number;
  readonly format: (value: number) => string;
}

/** What the card shows for one gun. */
export interface GunCardState {
  readonly gunId: string;
  readonly owned: boolean;
  /** 1 to `MAX_GUN_LEVEL`; ignored when not owned. */
  readonly level: number;
  /** The three lines under the pips. */
  readonly rows: readonly GunCardRow[];
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
  /**
   * Redraws for `state`. With `bounceFrom`, pips from there up to the level
   * pop in, a sparkle bursts, and the numbers count from what the card showed
   * for this gun a moment ago.
   */
  show(state: GunCardState, bounceFrom?: number): void;
}

export const GUN_CARD_WIDTH = 230;
export const GUN_CARD_HEIGHT = 200;
/** Offsets from the card's centre. */
const PIP_Y = -52;
const RARITY_PILL_Y = -80;
const PIP_SPACING = 30;
const PIP_RADIUS = 10;
const PIPS_SHIFT_X = 14;
const LOCK_X = -88;
const LOCK_SIZE = 20;
const ROW_Y = [-24, 0, 24] as const;
const ROW_MAX_WIDTH = 204;
const ACTION_Y = 66;
const ACTION_WIDTH = 190;
const MAX_TAG_HEIGHT = 40;
const DISABLED_ALPHA = 0.55;
const SHAKE_PX = 8;
const SHAKE_MS = 55;
const PIP_OUTLINE_PX = 3;
const PIP_POP_FROM = 0.2;
const PIP_STAGGER_MS = 90;
const TICK_MS = 500;
/** After a purchase the button ignores taps for this long, so it cannot be hammered. */
export const BUTTON_LOCK_MS = 600;
const EMPTY_PIP = shade(COLOUR.cloud, 0.82);

/** The row as text, for the current counted values `a` and `b`. */
function rowText(row: GunCardRow, a: number, b: number): string {
  const first = row.format(a);
  const text =
    row.to === undefined ? `${row.prefix} ${first}` : `${row.prefix} ${first} → ${row.format(b)}`;
  return text.trim();
}

/** Builds the card (empty until `show` is called). */
export function createGunCard(scene: Phaser.Scene, config: GunCardConfig): GunCard {
  const container = scene.add.container(0, 0);
  let lastGunId = '';
  let lastRows: readonly GunCardRow[] = [];
  let lockedUntil = 0;
  let tick: Phaser.Tweens.Tween | null = null;

  const show = (state: GunCardState, bounceFrom?: number): void => {
    container.each((child: Phaser.GameObjects.GameObject) => scene.tweens.killTweensOf(child));
    tick?.remove();
    tick = null;
    container.removeAll(true);
    const previous = lastGunId === state.gunId ? lastRows : [];
    lastGunId = state.gunId;
    lastRows = state.rows;

    container.add(
      createPanel(scene, {
        x: config.x,
        y: config.y,
        width: GUN_CARD_WIDTH,
        height: GUN_CARD_HEIGHT,
      }),
    );

    const def = GUN_LADDER_DEFS.find((g) => g.id === state.gunId);
    if (def) {
      const level = state.owned ? state.level : 1;
      container.add(
        addPowerPill(
          scene,
          config.x,
          config.y + RARITY_PILL_Y,
          `${rarityLabel(def.rarity)} · ${powerText(def.id, level)}`,
          def.rarity,
        ),
      );
    }

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
        spawnSparkles(scene, pip.x, pip.y, container.depth + 1);
      }
    }
    if (!state.owned) {
      const lock = scene.add.graphics({ x: config.x + LOCK_X, y: config.y + PIP_Y });
      drawLockIcon(lock, LOCK_SIZE, COLOUR.softSlate);
      container.add(lock);
    }

    const texts = state.rows.map((row, i) => {
      const text = scene.add
        .text(
          config.x,
          config.y + (ROW_Y[i] ?? ROW_Y[ROW_Y.length - 1]),
          rowText(row, row.from, row.to ?? row.from),
          textStyle(
            i === 0 ? 'bodyL' : 'bodyM',
            i === 0 ? COLOUR_HEX.ink : COLOUR_HEX.grannyPink,
            COLOUR_HEX.cloud,
          ),
        )
        .setOrigin(0.5);
      fitWidth(text, ROW_MAX_WIDTH);
      container.add(text);
      return text;
    });
    if (bounceFrom !== undefined && previous.length > 0) {
      tick = scene.tweens.addCounter({
        from: 0,
        to: 1,
        duration: TICK_MS,
        ease: EASE.standardOut,
        onUpdate: (tween) => {
          const t = tween.getValue() ?? 1;
          state.rows.forEach((row, i) => {
            const old = previous[i];
            const a = old ? old.from + (row.from - old.from) * t : row.from;
            const b =
              row.to === undefined ? a : (old?.to ?? row.to) + (row.to - (old?.to ?? row.to)) * t;
            texts[i]?.setText(rowText(row, a, b)).setScale(1);
            if (texts[i]) fitWidth(texts[i], ROW_MAX_WIDTH);
          });
        },
      });
    }

    // Interactive children go last so they win input.
    if (state.price === null) {
      container.add(maxTag(scene, config.x, config.y + ACTION_Y));
      return;
    }
    const verb = state.owned ? 'UPGRADE' : 'BUY';
    const button = createButton(scene, {
      x: config.x,
      y: config.y + ACTION_Y,
      label: `${verb} · ${formatCount(state.price)}`,
      variant: 'secondary',
      size: 'sm',
      minWidth: ACTION_WIDTH,
      expandHitArea: false,
      onClick: () => {
        if (scene.time.now < lockedUntil) return;
        lockedUntil = scene.time.now + BUTTON_LOCK_MS;
        if (!config.onAction(state.gunId)) {
          lockedUntil = 0;
          shake(scene, button);
        }
      },
    });
    const locked = scene.time.now < lockedUntil;
    if (!state.canAfford || locked) button.setAlpha(DISABLED_ALPHA);
    if (locked && state.canAfford) {
      scene.time.delayedCall(lockedUntil - scene.time.now, () => {
        if (button.scene) button.setAlpha(1);
      });
    }
    container.add(button);
  };

  return { container, show };
}

/** The tag that replaces the button at the top level: gold, outlined, not pressable. */
function maxTag(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Container {
  const bg = scene.add.graphics();
  const radius = pillRadius(ACTION_WIDTH, MAX_TAG_HEIGHT);
  bg.fillStyle(COLOUR.sunnyGold, 1);
  bg.fillRoundedRect(-ACTION_WIDTH / 2, -MAX_TAG_HEIGHT / 2, ACTION_WIDTH, MAX_TAG_HEIGHT, radius);
  bg.lineStyle(PIP_OUTLINE_PX, COLOUR.ink, 1);
  bg.strokeRoundedRect(
    -ACTION_WIDTH / 2,
    -MAX_TAG_HEIGHT / 2,
    ACTION_WIDTH,
    MAX_TAG_HEIGHT,
    radius,
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
