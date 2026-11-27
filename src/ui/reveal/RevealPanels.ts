/**
 * The lower half of the gun reveal, beat 3: the rarity tag and POWER number,
 * then either the three stat rows (a gun just bought) or the price and the
 * player's progress toward it (a preview), and the buttons. Each piece is
 * built hidden and brought in by the reveal's timeline.
 */

import type Phaser from 'phaser';

import { GAME_WIDTH } from '../../config';
import type { GunDef } from '../../entities/gun/gun.types';
import type { StatRow } from '../../systems/gunStats';
import { formatCount } from '../../systems/Rewards';
import { COLOUR_HEX } from '../../utils/colour';
import { DURATION, EASE } from '../../utils/tween';
import { textStyle } from '../../utils/typography';
import { createButton } from '../Button';
import { addPowerPill, rarityHex, rarityLabel } from '../gunRarity';
import { buildRow, finishRow, playRow, type RowParts } from '../GunRevealRows';
import { createRewardBar, fitWidth } from '../RewardParts';
import type { RevealCtx } from './RevealTracker';
import { POWER_COUNT_MS, REVEAL_LAYOUT, ROWS_OFFSET_MS, ROW_STEP_MS } from './revealTiming';

const CENTRE_X = GAME_WIDTH / 2;
const TAG_SCALE = 1.25;
const TAG_GAP = 24;
const POWER_FADE_MS = 160;
const FADE_MS = DURATION.stateChange;
const USE_X = 560;
const LATER_X = 800;
const USE_MIN_WIDTH = 240;
const PRICE_TEXT_PAD = 48;

type Fadable = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Alpha;

export interface TagRow {
  readonly pill: Phaser.GameObjects.Container;
  readonly power: Phaser.GameObjects.Text;
}

const powerLabel = (n: number): string => `POWER ${Math.round(n).toLocaleString('en-US')}`;

/** The rarity pill and the POWER number side by side, centred as a pair; both hidden until shown. */
export function buildTagRow(ctx: RevealCtx, gun: GunDef, powerMax: number): TagRow {
  const { scene, root } = ctx;
  const pill = addPowerPill(scene, 0, 0, rarityLabel(gun.rarity), gun.rarity).setScale(TAG_SCALE);
  const pillWidth = pill.getBounds().width;
  const power = scene.add
    .text(0, 0, powerLabel(powerMax), textStyle('displayM', rarityHex(gun.rarity), COLOUR_HEX.ink))
    .setOrigin(0, 0.5);
  const total = pillWidth + TAG_GAP + power.width;
  const left = CENTRE_X - total / 2;
  pill.setPosition(left + pillWidth / 2, REVEAL_LAYOUT.tagRowY).setScale(0);
  power.setPosition(left + pillWidth + TAG_GAP, REVEAL_LAYOUT.tagRowY).setAlpha(0);
  root.add([pill, power]);
  return { pill, power };
}

/** Pops the rarity pill in. */
export function showPill(ctx: RevealCtx, tag: TagRow, instant: boolean): void {
  if (instant) {
    tag.pill.setScale(TAG_SCALE);
    return;
  }
  ctx.tracker.tween({
    targets: tag.pill,
    scale: TAG_SCALE,
    duration: DURATION.stateChange,
    ease: EASE.bouncy,
  });
}

/** Shows POWER counting from `from` to `to` (or straight at `to`). */
export function showPower(
  ctx: RevealCtx,
  tag: TagRow,
  from: number,
  to: number,
  instant: boolean,
): void {
  if (instant || from === to) {
    tag.power.setText(powerLabel(to)).setAlpha(1);
    return;
  }
  tag.power.setText(powerLabel(from));
  ctx.tracker.tween({ targets: tag.power, alpha: 1, duration: POWER_FADE_MS });
  ctx.tracker.counter({
    from,
    to,
    duration: POWER_COUNT_MS,
    ease: EASE.standardOut,
    onUpdate: (tween) => tag.power.setText(powerLabel(tween.getValue() ?? to)),
  });
}

/** The three rows, appearing together and then counting one after another (or already finished). */
export function startOwnedRows(ctx: RevealCtx, rows: readonly StatRow[], instant: boolean): void {
  const { scene, root, tracker } = ctx;
  rows.forEach((row, i) => {
    const parts: RowParts = buildRow(scene, root, row, REVEAL_LAYOUT.rowsY[i] ?? 0);
    if (instant) {
      finishRow(parts);
      return;
    }
    parts.objects.forEach((o) => (o as Fadable).setAlpha(0));
    tracker.tween({ targets: [...parts.objects], alpha: 1, duration: FADE_MS });
    tracker.delay(ROWS_OFFSET_MS + i * ROW_STEP_MS, () => playRow(tracker, parts));
  });
}

/** The preview's price line: a bar of coins toward the price and "12,400 / 35,000", or a cheer when it can be bought. Hidden; returns what it made. */
export function buildPreviewPrice(
  ctx: RevealCtx,
  have: number,
  price: number,
): Phaser.GameObjects.GameObject[] {
  const { scene, root } = ctx;
  const made: Phaser.GameObjects.GameObject[] = [];
  const canBuy = have >= price;
  if (!canBuy) {
    const bar = createRewardBar(scene, {
      x: CENTRE_X - REVEAL_LAYOUT.previewBarWidth / 2,
      y: REVEAL_LAYOUT.previewBarY,
      width: REVEAL_LAYOUT.previewBarWidth,
      height: REVEAL_LAYOUT.previewBarHeight,
    });
    bar.setProgress(have / price);
    made.push(bar.graphics);
  }
  const line = canBuy
    ? `You have enough! ${formatCount(price)} coins`
    : `${formatCount(have)} / ${formatCount(price)}`;
  const text = scene.add
    .text(
      CENTRE_X,
      canBuy ? REVEAL_LAYOUT.previewBarY : REVEAL_LAYOUT.previewCountY,
      line,
      textStyle(canBuy ? 'displayM' : 'bodyL', COLOUR_HEX.cloud, COLOUR_HEX.ink),
    )
    .setOrigin(0.5);
  fitWidth(text, REVEAL_LAYOUT.previewBarWidth + PRICE_TEXT_PAD);
  made.push(text);
  made.forEach((m) => (m as Fadable).setAlpha(0));
  root.add(made);
  return made;
}

/** Fades hidden things in (or just shows them). */
export function fadeIn(
  ctx: RevealCtx,
  things: readonly Phaser.GameObjects.GameObject[],
  instant: boolean,
): void {
  things.forEach((t) =>
    (t as Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible).setVisible(true),
  );
  if (instant) {
    things.forEach((t) => (t as Fadable).setAlpha(1));
    return;
  }
  ctx.tracker.tween({ targets: [...things], alpha: 1, duration: FADE_MS });
}

/** USE IT (the one Mint Green button) and Later, hidden until `fadeIn`. */
export function buildOwnedButtons(
  ctx: RevealCtx,
  onUse: () => void,
  onLater: () => void,
): Phaser.GameObjects.Container[] {
  const y = REVEAL_LAYOUT.buttonsY;
  return hidden(ctx, [
    createButton(ctx.scene, {
      x: USE_X,
      y,
      label: 'USE IT',
      variant: 'primary',
      size: 'md',
      minWidth: USE_MIN_WIDTH,
      onClick: onUse,
    }),
    createButton(ctx.scene, {
      x: LATER_X,
      y,
      label: 'Later',
      variant: 'secondary',
      size: 'sm',
      onClick: onLater,
    }),
  ]);
}

/** The preview's buttons: BUY (the one green button) with Later when it can be bought, else a single OK. */
export function buildPreviewButtons(
  ctx: RevealCtx,
  price: number,
  canBuy: boolean,
  onBuy: () => void,
  onClose: () => void,
): Phaser.GameObjects.Container[] {
  const y = REVEAL_LAYOUT.buttonsY;
  if (!canBuy) {
    return hidden(ctx, [
      createButton(ctx.scene, {
        x: CENTRE_X,
        y,
        label: 'OK',
        variant: 'primary',
        size: 'md',
        minWidth: USE_MIN_WIDTH,
        onClick: onClose,
      }),
    ]);
  }
  return hidden(ctx, [
    createButton(ctx.scene, {
      x: USE_X,
      y,
      label: `BUY · ${formatCount(price)}`,
      variant: 'primary',
      size: 'md',
      minWidth: USE_MIN_WIDTH,
      onClick: onBuy,
    }),
    createButton(ctx.scene, {
      x: LATER_X,
      y,
      label: 'Later',
      variant: 'secondary',
      size: 'sm',
      onClick: onClose,
    }),
  ]);
}

function hidden(
  ctx: RevealCtx,
  buttons: Phaser.GameObjects.Container[],
): Phaser.GameObjects.Container[] {
  buttons.forEach((b) => {
    b.setAlpha(0).setVisible(false);
    ctx.root.add(b);
  });
  return buttons;
}
