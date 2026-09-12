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
 * Deliberately shorter than the full §6.2 binding list (direct user
 * feedback, 2026-09-12: "just tell them to use the arrows rather than other
 * keys for direction"). A/D still work and always will — they just don't
 * need saying. A controls key that lists every alias is a spec sheet; one
 * that names the single obvious key for each job is an instruction a
 * seven-year-old can act on. Space (auto-fire toggle) is likewise omitted
 * now that aiming fires on its own — see InputManager's aim-to-fire note.
 */
const CONTROLS: readonly { readonly key: string; readonly action: string }[] = [
  { key: 'Mouse', action: 'Aim' },
  { key: '← →', action: 'Move' },
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
