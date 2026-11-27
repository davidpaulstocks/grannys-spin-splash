/** The shapes shared by the projectile renderers: what each is given every frame. */

import type Phaser from 'phaser';

/** One point of a jet: where a shot in flight is. `seq` is its launch order, so it can keep its own look. */
export interface JetPoint {
  x: number;
  y: number;
  seq?: number | undefined;
}

/** Everything a renderer needs for one frame; it draws into `gfx` (already cleared). */
export interface JetFrame {
  readonly gfx: Phaser.GameObjects.Graphics;
  readonly time: number;
  /** One list per stream, nozzle first (while firing), then the shots in flight from newest to oldest. Each has 2+ points. */
  readonly streams: readonly JetPoint[][];
  /** The gun's own colours and shot size (px). */
  readonly colour: number;
  readonly accent: number;
  readonly size: number;
}

/** Draws one style of projectile. Hit logic is not its business: only what is drawn in flight. */
export type JetRenderer = (frame: JetFrame) => void;
