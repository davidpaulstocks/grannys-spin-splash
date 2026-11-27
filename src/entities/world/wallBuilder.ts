/**
 * Builds a world's spinner wall — everything that turns
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
import { iconFor, type InstrumentIconId } from '../../audio/orchestra/icons';
import { musicianAt, resolveScore } from '../../audio/scores';
import { startDeckRoll } from './deckRoll';
import { fitScaleForBand, layoutBand } from '../../utils/grid';
import { FAMILY_PALETTE } from '../spinner/instrumentBadge';
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
import type { GigDef } from './gigs.data';
import type { WorldDef } from './world.types';

/** How far a drifting spinner swings either side of its mount (prototype: 55px). */
const MOVING_TARGET_DRIFT_RANGE = 55;

/** The painted instrument for spinner `index` of a venue's wall, or undefined beyond the line-up. */
function iconAtSeat(worldId: string, index: number): InstrumentIconId | undefined {
  const score = resolveScore(worldId);
  const seat = score.seats.find((part) => part.id === score.lineup[index]);
  return seat ? iconFor(seat) : undefined;
}

export interface WallArea {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Where this world's spinners, visitors and bonus spawns mount — the
 * world's own art-matched rectangle if it declares one, else config.ts's
 * generic fallback. See WorldDef.wallArea's doc comment for why each world
 * needed its own.
 */
export function wallAreaFor(world: WorldDef): WallArea {
  return world.wallArea ?? WALL_AREA;
}

/**
 * Lays out the wall for one gig: its band as centred rows inside the world's
 * mounting area, kinds cycled round-robin from the world's roster, each
 * spinner re-skinned to the world (palette, bespoke shape, sparkle, mount
 * plate) and scaled to fit — small bands get big spinners. The gig's
 * difficulty (wind-down, hold) and its drifting targets are applied here
 * too, since they are part of what the wall *is* for that gig.
 */
export function buildWall(scene: Phaser.Scene, world: WorldDef, gig: GigDef): Spinner[] {
  const kinds = world.types;
  const area = wallAreaFor(world);
  const gridCount = gig.band - (gig.feature ? 1 : 0);
  const { positions, cols, rows } = layoutBand(gridCount, area.x, area.y, area.width, area.height);

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
  const fit = fitScaleForBand(cols, rows, area.width, area.height, maxRadius);

  const spinners = positions.map((pos, i) => {
    const kind = kinds[i % kinds.length];
    const def = SPINNER_DEFS.find((d) => d.type === kind);
    if (!def) throw new Error(`No SPINNER_DEFS entry for kind "${kind}"`);
    const bespokeStyle = styleOverrides?.[kind] as SpinnerStyle | undefined;
    // Spinner i is line-up seat i. Its musician's section sets the blade
    // colours and the hub badge, so colour means something across every
    // world; the world keeps its identity through its shapes and backdrop.
    const musician = musicianAt(world.id, i);
    const icon = iconAtSeat(world.id, i);
    const colours = musician ? FAMILY_PALETTE[musician.family] : (typePalettes?.[kind] ?? palette);
    const themedDef: SpinnerDef = {
      ...def,
      r: def.r * fit,
      decay: def.decay * gig.decayScale,
      ...(colours ? { colors: colours } : {}),
      ...(bespokeStyle ? { style: bespokeStyle } : {}),
      ...(sparkle ? { sparkle: true } : {}),
      ...(mount ? { mount } : {}),
      ...(musician ? { family: musician.family } : {}),
      ...(icon ? { icon } : {}),
    };
    return new Spinner(scene, pos.x, pos.y, themedDef);
  });

  // The background's own painted centrepiece, if this world has one (Disco's
  // mirror ball). Deliberately built after the grid and from the unscaled
  // def: its size comes from the art it sits on, not from the grid fit.
  const feature = gig.feature ? world.featureSpinner : undefined;
  if (feature) {
    const def = SPINNER_DEFS.find((d) => d.type === feature.type);
    if (!def) throw new Error(`No SPINNER_DEFS entry for featureSpinner "${feature.type}"`);
    // Keeps the TYPE's own colours rather than the world palette: the disco
    // def is already silver/grey, which is what a mirror ball looks like and
    // what the background painted. The world palette would tint it pink and
    // it would stop reading as the ball it is sitting on.
    spinners.push(
      new Spinner(scene, feature.x, feature.y, {
        ...def,
        r: feature.r,
        decay: def.decay * gig.decayScale,
        ...(sparkle ? { sparkle: true } : {}),
      }),
    );
  }

  for (const spinner of spinners) spinner.holdMs = gig.holdMs;
  for (const spinner of Phaser.Utils.Array.Shuffle([...spinners]).slice(0, gig.moving)) {
    spinner.setDrift(MOVING_TARGET_DRIFT_RANGE, 0.4 + Math.random() * 0.4);
  }
  if (gig.roll) startDeckRoll(scene, spinners);
  return spinners;
}
