/**
 * The three stat rows of the gun reveal: a label, a bar, and a value that
 * count from the previous gun's number to the new gun's (blue up to the old
 * mark, Mint Green for the gain), then the gain pops in beside it.
 */

import type Phaser from 'phaser';

import { formatGain, formatStat, type StatRow } from '../systems/gunStats';
import { COLOUR, COLOUR_HEX, shade } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { BOUNCE_OVERSHOOT, DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';
import type { RevealTracker } from './reveal/RevealTracker';
import { ROW_COUNT_MS } from './reveal/revealTiming';
import { fitWidth } from './RewardParts';

const LABEL_X = 250;
const BAR_X = 372;
const BAR_W = 320;
const BAR_H = 24;
const VALUE_X = 712;
const VALUE_MAX_W = 208;
const GAIN_X = 932;
const GAIN_MAX_W = 112;
const OUTLINE_PX = 3;
const TRACK = shade(COLOUR.cloud, 0.85);
const GAIN_POP_FROM = 1.5;

export interface RowParts {
  readonly row: StatRow;
  readonly bar: Phaser.GameObjects.Graphics;
  readonly value: Phaser.GameObjects.Text;
  readonly gain: Phaser.GameObjects.Text;
  readonly y: number;
  /** Everything the row drew, so it can be faded in as one. */
  readonly objects: readonly Phaser.GameObjects.GameObject[];
}

/** One row: label, bar at the previous gun's fill, value text "from → from", and a hidden gain. */
export function buildRow(
  scene: Phaser.Scene,
  root: Phaser.GameObjects.Container,
  row: StatRow,
  y: number,
): RowParts {
  const label = scene.add
    .text(LABEL_X, y, row.label, textStyle('bodyL', COLOUR_HEX.cloud, COLOUR_HEX.ink))
    .setOrigin(0, 0.5);
  const bar = scene.add.graphics();
  const value = scene.add
    .text(VALUE_X, y, '', textStyle('bodyL', COLOUR_HEX.cloud, COLOUR_HEX.ink))
    .setOrigin(0, 0.5);
  const gain = scene.add
    .text(
      GAIN_X,
      y,
      row.gain > 0 ? formatGain(row.key, row.gain) : '',
      textStyle('bodyL', COLOUR_HEX.mintGreen, COLOUR_HEX.ink),
    )
    .setOrigin(0, 0.5)
    .setAlpha(0);
  fitWidth(gain, GAIN_MAX_W);
  root.add([label, bar, value, gain]);
  const parts: RowParts = { row, bar, value, gain, y, objects: [label, bar, value] };
  paintRow(parts, row.from, row.fromFill);
  return parts;
}

/** Draws the bar for fill `fill` (blue up to the previous gun's mark, mint beyond) and the value text for `current`. */
function paintRow(parts: RowParts, current: number, fill: number): void {
  const { row, bar, value, y } = parts;
  const top = y - BAR_H / 2;
  bar.clear();
  bar.fillStyle(TRACK, 1);
  bar.fillRoundedRect(BAR_X, top, BAR_W, BAR_H, pillRadius(BAR_W, BAR_H));
  const base = Math.min(fill, row.fromFill);
  const baseWidth = Math.max(BAR_H, BAR_W * base);
  bar.fillStyle(COLOUR.waterBlue, 1);
  bar.fillRoundedRect(BAR_X, top, baseWidth, BAR_H, pillRadius(baseWidth, BAR_H));
  if (fill > row.fromFill) {
    const extra = BAR_W * (fill - row.fromFill);
    bar.fillStyle(COLOUR.mintGreen, 1);
    bar.fillRoundedRect(BAR_X + baseWidth - BAR_H / 2, top, extra + BAR_H / 2, BAR_H, BAR_H / 2);
  }
  bar.lineStyle(OUTLINE_PX, COLOUR.ink, 1);
  bar.strokeRoundedRect(BAR_X, top, BAR_W, BAR_H, pillRadius(BAR_W, BAR_H));
  value.setText(`${formatStat(row.key, row.from)} → ${formatStat(row.key, current)}`).setScale(1);
  fitWidth(value, VALUE_MAX_W);
}

/** Jumps a row to its final numbers and shows the gain: what a skipped reveal shows. */
export function finishRow(parts: RowParts): void {
  paintRow(parts, parts.row.to, parts.row.toFill);
  if (parts.row.gain > 0) parts.gain.setAlpha(1).setScale(1);
}

/** Counts a row from the previous value to the new one, then pops the gain in. */
export function playRow(tracker: RevealTracker, parts: RowParts): void {
  const { row, gain } = parts;
  tracker.counter({
    from: 0,
    to: 1,
    duration: ROW_COUNT_MS,
    ease: EASE.standardOut,
    onUpdate: (tween) => {
      const t = tween.getValue() ?? 1;
      paintRow(
        parts,
        row.from + (row.to - row.from) * t,
        row.fromFill + (row.toFill - row.fromFill) * t,
      );
    },
    onComplete: () => {
      paintRow(parts, row.to, row.toFill);
      if (row.gain <= 0) return;
      gain.setAlpha(1).setScale(GAIN_POP_FROM);
      tracker.tween({
        targets: gain,
        scale: 1,
        duration: DURATION.stateChange,
        ease: EASE.bouncy,
        easeParams: [BOUNCE_OVERSHOOT],
      });
    },
  });
}
