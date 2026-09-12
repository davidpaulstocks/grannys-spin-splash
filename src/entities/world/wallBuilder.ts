/**
 * Builds a world's spinner wall and obstacle roster — everything that turns
 * a `WorldDef` into live objects, kept out of GameScene so the scene
 * orchestrates a round rather than also knowing how a wall is laid out
 * (CLAUDE.md §7.3 rules 1 and 4).
 *
 * The per-world theming rules it applies all change *visuals only*. A
 * spinner's mechanical `type`, `decay`, `power`, `blades` and `deflects`
 * come straight from SPINNER_DEFS untouched — so a Workshop whirligig drawn
 * as a saw blade still deflects like every other whirligig, and no world's
 * difficulty shifts because of how its spinners look.
 */

import Phaser from 'phaser';

import { WALL_AREA } from '../../config';
import { computeGridPositions, fitScaleForGrid } from '../../utils/grid';
import { Obstacle } from '../obstacle/Obstacle';
import { MOUNT_RADIUS_SCALE, SPINNER_DEFS } from '../spinner/spinner.data';
import type { SpinnerDef, SpinnerStyle } from '../spinner/spinner.types';
import { Spinner } from '../spinner/Spinner';
import {
  MOUNT_BY_WORLD,
  SPARKLE_WORLDS,
  SPINNER_PALETTE_BY_WORLD,
  WORLD_STYLE_OVERRIDE,
  WORLD_TYPE_PALETTE,
} from './world.data';
import type { WorldDef } from './world.types';

/** Funfair-only: how many spinners drift, and the drift radius (prototype: 3 spinners, 55px). */
const MOVING_TARGET_COUNT = 3;
const MOVING_TARGET_DRIFT_RANGE = 55;

export interface WallArea {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Where this world's spinners, obstacles and bonus spawns mount — the
 * world's own art-matched rectangle if it declares one, else config.ts's
 * generic fallback. See WorldDef.wallArea's doc comment for why each world
 * needed its own.
 */
export function wallAreaFor(world: WorldDef): WallArea {
  return world.wallArea ?? WALL_AREA;
}

/**
 * Lays out the wall: an even grid inside the world's mounting area, kinds
 * cycled round-robin from its roster, each spinner re-skinned to the world
 * (palette, bespoke shape, sparkle, mount plate) and scaled to fit its cell.
 * Funfair's drifting targets are applied here too, since "which spinners
 * move" is part of laying the wall out.
 */
export function buildWall(scene: Phaser.Scene, world: WorldDef): Spinner[] {
  const { cols, rows } = world.grid;
  const kinds = world.types;
  const area = wallAreaFor(world);
  const positions = computeGridPositions(cols, rows, area.x, area.y, area.width, area.height);

  const palette = SPINNER_PALETTE_BY_WORLD[world.id];
  const typePalettes = WORLD_TYPE_PALETTE[world.id];
  const styleOverrides = WORLD_STYLE_OVERRIDE[world.id];
  const sparkle = SPARKLE_WORLDS.has(world.id);
  const mount = MOUNT_BY_WORLD[world.id];
  // A mount plate draws wider than the spinner it backs, so it — not the
  // blades — is what must fit inside the cell.
  const maxRadius =
    Math.max(...kinds.map((k) => SPINNER_DEFS.find((d) => d.type === k)?.r ?? 0)) *
    (mount ? MOUNT_RADIUS_SCALE : 1);
  const fit = fitScaleForGrid(cols, rows, area.width, area.height, maxRadius);

  const spinners = positions.map((pos, i) => {
    const kind = kinds[i % kinds.length];
    const def = SPINNER_DEFS.find((d) => d.type === kind);
    if (!def) throw new Error(`No SPINNER_DEFS entry for kind "${kind}"`);
    const bespokeStyle = styleOverrides?.[kind] as SpinnerStyle | undefined;
    const colours = typePalettes?.[kind] ?? palette;
    const themedDef: SpinnerDef = {
      ...def,
      r: def.r * fit,
      ...(colours ? { colors: colours } : {}),
      ...(bespokeStyle ? { style: bespokeStyle } : {}),
      ...(sparkle ? { sparkle: true } : {}),
      ...(mount ? { mount } : {}),
    };
    return new Spinner(scene, pos.x, pos.y, themedDef);
  });

  if (world.movingTargets) {
    for (const spinner of Phaser.Utils.Array.Shuffle([...spinners]).slice(0, MOVING_TARGET_COUNT)) {
      spinner.setDrift(MOVING_TARGET_DRIFT_RANGE, 0.4 + Math.random() * 0.4);
    }
  }
  return spinners;
}

/** Spawns this world's cat/umbrella/duck roster (CLAUDE.md §1, §4) within the wall's play field. */
export function buildObstacles(
  scene: Phaser.Scene,
  world: WorldDef,
  spinners: readonly Spinner[],
): Obstacle[] {
  const area = wallAreaFor(world);
  const bounds = {
    x0: area.x,
    y0: area.y,
    x1: area.x + area.width,
    y1: area.y + area.height,
  };
  return world.obstacles.map((kind) => new Obstacle(scene, kind, bounds, spinners));
}
