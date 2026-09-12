/**
 * A compact desktop-only controls key on the splash screen (2026-09-12,
 * direct user feedback: "for desktop, we need to put a controls key that
 * tells the player simply what to press and how to play"). CLAUDE.md §6.5
 * deliberately keeps GAMEPLAY tutorial-free — this is not that. It sits on
 * the menu, before a run starts, which is exactly where a reference like
 * this belongs: read once or ignored entirely, never blocking play.
 *
 * Never shown on a touch device (`device.input.touch`) — mouse/keyboard
 * bindings are meaningless there, and mobile's own affordances (the two
 * chunky move buttons, tap-to-fire) are self-explanatory on sight.
 */

import Phaser from 'phaser';

import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { textStyle } from '../utils/typography';

const PANEL_PADDING_X = 20;
const PANEL_PADDING_Y = 14;
const PANEL_RADIUS = 16;
const LINE_GAP = 6;

/**
 * Two lines, because there are only two things to know (2026-09-12, direct
 * user feedback: "keep it simple for kids"). Granny no longer walks and
 * firing is automatic while you're aiming at a spinner, so the whole game is
 * "point at what you want to soak". Space still toggles permanent auto-fire
 * and the arrow keys are still captured so they can't scroll the page — but
 * a controls key that lists every binding is a spec sheet, not an
 * instruction a seven-year-old can act on.
 */
const CONTROLS: readonly { readonly key: string; readonly action: string }[] = [
  { key: 'Mouse', action: 'Aim — water follows' },
  { key: 'Esc', action: 'Pause' },
];

/** Adds the controls key at (x, y) — top-left corner of the panel — but only on a non-touch device. */
export function createControlsLegend(scene: Phaser.Scene, x: number, y: number): void {
  if (scene.sys.game.device.input.touch) return;

  const rows = CONTROLS.map(({ key, action }) =>
    scene.add.text(
      0,
      0,
      `${key}  —  ${action}`,
      textStyle('bodyM', COLOUR_HEX.ink, COLOUR_HEX.cloud),
    ),
  );

  let rowY = PANEL_PADDING_Y;
  let maxWidth = 0;
  for (const row of rows) {
    row.setPosition(PANEL_PADDING_X, rowY);
    rowY += row.height + LINE_GAP;
    maxWidth = Math.max(maxWidth, row.width);
  }
  const panelWidth = maxWidth + PANEL_PADDING_X * 2;
  const panelHeight = rowY - LINE_GAP + PANEL_PADDING_Y;

  const bg = scene.add.graphics();
  bg.fillStyle(COLOUR.cloud, 0.92);
  bg.fillRoundedRect(0, 0, panelWidth, panelHeight, PANEL_RADIUS);
  bg.lineStyle(3, COLOUR.ink, 1);
  bg.strokeRoundedRect(0, 0, panelWidth, panelHeight, PANEL_RADIUS);

  scene.add.container(x, y, [bg, ...rows]);
}
