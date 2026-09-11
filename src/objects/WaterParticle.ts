/**
 * Pooled water particle — arc physics + collision check (CLAUDE.md §7.2,
 * story 1.4). Lives inside a `scene.add.group({classType: WaterParticle,
 * maxSize: 50, runChildUpdate: true})` pool; Group.preUpdate() calls
 * `update()` (not `preUpdate()`) on every active member each frame —
 * verified against node_modules/phaser/src/gameobjects/group/Group.js.
 *
 * Physics extracted from the reference prototype's `_spawnWater`/
 * `updateParticles`; collision extracted from its `updateSpinners` hit
 * loop (the cog dead-zone in particular — you have to hit the teeth).
 */

import Phaser from 'phaser';

import {
  GAME_HEIGHT,
  GAME_WIDTH,
  WATER_PARTICLE_GRAVITY,
  WATER_PARTICLE_RADIUS,
  WATER_PARTICLE_SPEED,
  WATER_PARTICLE_WOBBLE,
} from '../config';
import { COLOUR } from '../utils/colour';
import { distance } from '../utils/math';
import type { Spinner } from './Spinner';

/** How far out of bounds (px) a particle may drift before being recycled. */
const OUT_OF_BOUNDS_MARGIN = 20;
/** Extra lifetime padding so gravity droop doesn't cut a shot short before it reaches its target. */
const LIFE_PADDING_FACTOR = 1.4;
const LIFE_PADDING_SECONDS = 0.1;
/** Hit-test ring: a particle registers within `spinner.def.r + this` of the spinner centre. */
const HIT_RING_PADDING = 8;
/**
 * Cog-only: the inner "hole" radius (relative to r) where a hit does NOT
 * register — must hit the teeth.
 *
 * ⚠️ Known interaction, verified live (Sprint 1): auto-aim snaps every shot
 * to the spinner's exact centre (resolveAim in utils/math.ts), and
 * WATER_PARTICLE_WOBBLE is small enough that a fully-snapped shot's
 * horizontal drift rarely exceeds this dead zone's radius — so a snapped
 * cog can go effectively unhittable. Not reachable today (Garden's roster
 * has no 'cog' — data/worlds.ts), but fix the aim/dead-zone interaction
 * before any world adds cogs: either widen the wobble for cog targets
 * specifically, or have resolveAim offset off dead-centre when snapping to
 * a cog.
 */
const COG_DEAD_ZONE_RATIO = 0.42;

export class WaterParticle extends Phaser.GameObjects.Arc {
  private _vx = 0;
  private _vy = 0;
  private _lifeSeconds = 0;
  private _target: Spinner | null = null;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, WATER_PARTICLE_RADIUS, 0, 360, false, COLOUR.waterBlue, 1);
    this.setActive(false);
    this.setVisible(false);
  }

  /** (Re)launches this pooled particle from an origin toward an aim point, optionally locked onto a target. */
  fire(originX: number, originY: number, aimX: number, aimY: number, target: Spinner | null): void {
    const dist = Math.max(10, distance(originX, originY, aimX, aimY));
    const wobble = (Math.random() - 0.5) * WATER_PARTICLE_WOBBLE;
    const dirX = (aimX - originX) / dist + wobble;
    const dirY = (aimY - originY) / dist;

    this.setPosition(originX, originY);
    this._vx = dirX * WATER_PARTICLE_SPEED;
    this._vy = dirY * WATER_PARTICLE_SPEED;
    this._lifeSeconds = (dist / WATER_PARTICLE_SPEED) * LIFE_PADDING_FACTOR + LIFE_PADDING_SECONDS;
    this._target = target;
    this.setActive(true);
    this.setVisible(true);
  }

  /** The locked-on target only, or every live spinner if this shot wasn't snapped to one. */
  getCandidates(allSpinners: readonly Spinner[]): readonly Spinner[] {
    return this._target ? [this._target] : allSpinners;
  }

  /**
   * Tests this particle against `candidates`; on a hit, recycles the
   * particle and returns the spinner it landed on (GameScene decides what
   * that means — `spinner.hit()`'s own return tells it whether a whirligig
   * deflected instead of actually gaining speed).
   */
  checkCollision(candidates: readonly Spinner[]): Spinner | null {
    if (!this.active) return null;
    for (const spinner of candidates) {
      const outerRadius = spinner.def.r + HIT_RING_PADDING;
      const deadZone = spinner.def.style === 'cog' ? spinner.def.r * COG_DEAD_ZONE_RATIO : 0;
      const d = distance(this.x, this.y, spinner.x, spinner.y);
      if (d < outerRadius && d > deadZone) {
        this._deactivate();
        return spinner;
      }
    }
    return null;
  }

  /** Advances arc physics; recycles the particle once its life or the play-field bounds run out. */
  override update(_time: number, deltaMs: number): void {
    if (!this.active) return;
    const dt = deltaMs / 1000;
    this.x += this._vx * dt;
    this.y += this._vy * dt;
    this._vy += WATER_PARTICLE_GRAVITY * dt;
    this._lifeSeconds -= dt;

    const outOfBounds =
      this.x < -OUT_OF_BOUNDS_MARGIN ||
      this.x > GAME_WIDTH + OUT_OF_BOUNDS_MARGIN ||
      this.y > GAME_HEIGHT + OUT_OF_BOUNDS_MARGIN;

    if (this._lifeSeconds <= 0 || outOfBounds) {
      this._deactivate();
    }
  }

  private _deactivate(): void {
    this.setActive(false);
    this.setVisible(false);
    this._target = null;
  }
}
