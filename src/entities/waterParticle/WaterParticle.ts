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
} from '../../config';
import { COLOUR } from '../../utils/colour';
import { distance } from '../../utils/math';
import { SPINNER_HIT_RING_PADDING, resolveShotLock, spinnersForShot } from '../../utils/shotLock';
import type { Spinner } from '../spinner/Spinner';

/** How far out of bounds (px) a particle may drift before being recycled. */
const OUT_OF_BOUNDS_MARGIN = 20;
/** Extra lifetime padding so gravity droop doesn't cut a shot short before it reaches its target. */
const LIFE_PADDING_FACTOR = 1.4;
const LIFE_PADDING_SECONDS = 0.1;
/**
 * Cog-only: the inner "hole" radius (relative to r) where a hit does NOT
 * register — must hit the teeth.
 *
 * Auto-aim snaps every shot to the spinner's exact centre (resolveAim in
 * utils/math.ts), which lands squarely in this dead zone — a snapped cog
 * would otherwise be effectively unhittable. Verified live (Sprint 1);
 * fixed once cogs actually shipped (Workshop/Kitchen, 2026-09-11 world
 * re-plan) via `resolveFireAimPoint()` below, which nudges a cog-locked
 * shot's aim point onto the teeth ring instead of dead-centre.
 */
const COG_DEAD_ZONE_RATIO = 0.42;
/** Cog-only fix: keep the resolved aim point safely inside the hittable "teeth" ring, away from both edges. */
const COG_SAFE_RING_INNER = 0.55;
const COG_SAFE_RING_OUTER = 0.85;

/**
 * A cog's auto-aim snap lands dead-centre (resolveAim in utils/math.ts
 * doesn't know about per-spinner dead zones), which is exactly the
 * unhittable hole above — see COG_DEAD_ZONE_RATIO's comment. Rather than
 * widen wobble globally (would loosen aim feel for every other spinner
 * too), a cog-locked shot's aim point is nudged onto a random point on
 * the teeth ring instead, so a "perfectly snapped" shot still lands where
 * it visibly should.
 */
function resolveFireAimPoint(
  aimX: number,
  aimY: number,
  target: Spinner | null,
): { x: number; y: number } {
  if (!target || target.def.style !== 'cog') return { x: aimX, y: aimY };
  const angle = Math.random() * Math.PI * 2;
  const radius =
    target.def.r *
    (COG_SAFE_RING_INNER + Math.random() * (COG_SAFE_RING_OUTER - COG_SAFE_RING_INNER));
  return { x: target.x + Math.cos(angle) * radius, y: target.y + Math.sin(angle) * radius };
}

let _nextSeq = 0;

export class WaterParticle extends Phaser.GameObjects.Arc {
  private _vx = 0;
  private _vy = 0;
  private _lifeSeconds = 0;
  private _target: Spinner | null = null;
  /** Set at launch when the aim was on a visitor: this shot flies over the instruments and only visitors can take it. */
  private _visitorLock = false;
  /** Where this shot was aimed, so a free shot is only tested against an instrument under that point. */
  private _aimX = 0;
  private _aimY = 0;
  /**
   * Which of the gun's streams this shot belongs to, or -1 for loose water
   * (the opening burst, the dying splutter). `WaterJet` joins each stream's
   * shots into one ribbon, so stream shots are drawn by it, not as dots.
   */
  stream = -1;
  /** Launch order — lets `WaterJet` string a stream together from the gun outward. */
  seq = 0;

  constructor(scene: Phaser.Scene) {
    super(scene, 0, 0, WATER_PARTICLE_RADIUS, 0, 360, false, COLOUR.waterBlue, 1);
    this.setActive(false);
    this.setVisible(false);
  }

  /** Sets this shot's colour + size to the firing gun's own — called once per pool `get()`, before `fire()`. */
  setAppearance(colour: number, radius: number): void {
    this.setFillStyle(colour, 1);
    this.setRadius(radius);
  }

  /**
   * (Re)launches this pooled particle from an origin toward an aim point,
   * optionally locked onto a target (`visitorLock`: aimed at a visitor, so it
   * skips every instrument). `extraWobble` is a deliberate
   * horizontal shear on top of the random one — Super Soaker's two side
   * streams use ±0.12 here (prototype: `_spawnWater`'s `wobbleExtra`
   * param), not a true angular rotation, matching its exact feel.
   */
  fire(
    originX: number,
    originY: number,
    aimX: number,
    aimY: number,
    target: Spinner | null,
    extraWobble = 0,
    stream = -1,
    visitorLock = false,
  ): void {
    this.stream = stream;
    this._visitorLock = visitorLock;
    this._aimX = aimX;
    this._aimY = aimY;
    this.seq = _nextSeq++;
    const aimPoint = resolveFireAimPoint(aimX, aimY, target);
    const dist = Math.max(10, distance(originX, originY, aimPoint.x, aimPoint.y));
    const wobble = (Math.random() - 0.5) * WATER_PARTICLE_WOBBLE + extraWobble;
    const dirX = (aimPoint.x - originX) / dist + wobble;
    const dirY = (aimPoint.y - originY) / dist;

    this.setPosition(originX, originY);
    this._vx = dirX * WATER_PARTICLE_SPEED;
    this._vy = dirY * WATER_PARTICLE_SPEED;
    // A free shot (aimed into a gap, at nothing) lands where it was aimed and stops there;
    // a shot at an instrument or a visitor gets the padding, since its target may be a little further.
    const flightSeconds = dist / WATER_PARTICLE_SPEED;
    const free = target === null && !visitorLock;
    this._lifeSeconds = free
      ? flightSeconds
      : flightSeconds * LIFE_PADDING_FACTOR + LIFE_PADDING_SECONDS;
    this._target = target;
    this.setActive(true);
    // A stream's shots are drawn as one ribbon by WaterJet; only loose water shows as droplets.
    this.setVisible(stream < 0);
  }

  /** The locked-on target only, none if aimed at a visitor, or, for a free shot, only an instrument whose body holds the aim point (usually none). */
  getCandidates(allSpinners: readonly Spinner[]): readonly Spinner[] {
    const lock = resolveShotLock(this._visitorLock, this._target !== null);
    return spinnersForShot(
      lock,
      this._target,
      allSpinners,
      { x: this._aimX, y: this._aimY },
      (s) => s.def.r,
    );
  }

  /** Recycles this particle from outside — a visitor's `tryBlock()` calls this when a blocker or sitter intercepts it. */
  blockAndRecycle(): void {
    this._deactivate();
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
      const outerRadius = spinner.def.r + SPINNER_HIT_RING_PADDING;
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
    this._visitorLock = false;
  }
}
