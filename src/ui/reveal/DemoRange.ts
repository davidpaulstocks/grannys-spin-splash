/**
 * The demo range of the gun reveal: the gun turns and fires its REAL
 * projectile at three spinner-like discs, and they spin up and throw coins.
 *
 * Nothing here is a copy of the game's look. The shots are a plain list of
 * points in flight, handed every frame to `JET_RENDERERS[gun.projectile]`,
 * the same renderer `WaterJet` uses in a gig, and where they land the game's
 * own `spawnImpact` plays. Fire cadence, stream count, barrel spacing, shot
 * speed and wobble come from the same gun data and constants the cannon uses.
 * Everything it makes lives in the overlay's container.
 */

import Phaser from 'phaser';

import { GAME_WIDTH, WATER_PARTICLE_SPEED, WATER_PARTICLE_WOBBLE } from '../../config';
import type { AnchorJSON, GunDef } from '../../entities/gun/gun.types';
import { BARREL_SPACING_PX, FIRE_DENSITY_SCALE } from '../../entities/waterParticle/fireDensity';
import { JET_RENDERERS } from '../../entities/waterParticle/projectiles';
import { spawnImpact } from '../../entities/waterParticle/projectiles/impacts';
import type { JetPoint } from '../../entities/waterParticle/projectiles/projectile.types';
import { COLOUR } from '../../utils/colour';
import { DemoTarget } from './DemoTarget';
import type { RevealTracker } from './RevealTracker';
import {
  REVEAL_DEPTH,
  REVEAL_LAYOUT,
  demoPhase,
  easeAngle,
  nozzlePoint,
  type DemoMode,
} from './revealTiming';

const MAX_SHOTS = 120;
const HIT_PADDING = 8;
const OFF_SCREEN_MARGIN = 40;
const TURN_RATE = 14;
const FIRE_ANGLE_TOLERANCE = 0.05;
const RECOIL_PX = 5;
const RECOIL_RATE = 18;
const TARGET_STAGGER_MS = 90;
const COIN_POOL = 14;
const COIN_RADIUS = 9;
const COIN_OUTLINE_PX = 3;
const COIN_LIFE_S = 0.8;
const COIN_GRAVITY = 900;
const COIN_UP_SPEED = 360;
const COIN_SIDE_SPEED = 160;
const COIN_EVERY_MS = 110;

interface Shot {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  seq: number;
  stream: number;
}

interface Coin {
  readonly shape: Phaser.GameObjects.Arc;
  life: number;
  vx: number;
  vy: number;
}

export class DemoRange {
  private readonly _gfx: Phaser.GameObjects.Graphics;
  private readonly _targets: DemoTarget[] = [];
  private readonly _shots: Shot[] = [];
  private readonly _coins: Coin[] = [];
  private readonly _coinAt: number[] = [];
  private readonly _home: { x: number; y: number };
  private readonly _baseScale: number;
  private _mode: DemoMode = 'blast';
  private _modeElapsed = 0;
  private _elapsed = 0;
  private _nextFireAt = 0;
  private _seq = 0;
  private _angle = 0;
  private _recoil = 0;
  private _running = false;
  private _destroyed = false;

  constructor(
    private readonly _scene: Phaser.Scene,
    root: Phaser.GameObjects.Container,
    tracker: RevealTracker,
    private readonly _gun: GunDef,
    private readonly _image: Phaser.GameObjects.Image,
    private readonly _anchor: AnchorJSON,
  ) {
    this._home = { x: _image.x, y: _image.y };
    this._baseScale = _image.scaleX;
    this._gfx = _scene.add.graphics();
    root.add(this._gfx);
    // Behind the gun, so the stream comes out of the muzzle instead of sitting across it.
    root.moveBelow(this._gfx as Phaser.GameObjects.GameObject, _image);
    for (let i = 0; i < MAX_SHOTS; i++) {
      this._shots.push({ active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, seq: 0, stream: 0 });
    }
    for (let i = 0; i < COIN_POOL; i++) {
      const shape = _scene.add
        .circle(0, 0, COIN_RADIUS, COLOUR.sunnyGold, 1)
        .setStrokeStyle(COIN_OUTLINE_PX, COLOUR.ink, 1)
        .setVisible(false);
      root.add(shape);
      this._coins.push({ shape, life: 0, vx: 0, vy: 0 });
    }
    REVEAL_LAYOUT.targets.forEach((t, i) => {
      const target = new DemoTarget(_scene, root, t.x, t.y, REVEAL_LAYOUT.targetRadius, i);
      target.appear(tracker, i * TARGET_STAGGER_MS);
      this._targets.push(target);
      this._coinAt.push(0);
    });
    _scene.events.on(Phaser.Scenes.Events.UPDATE, this._tick, this);
  }

  /** Starts the gun turning and firing in blast mode. */
  start(): void {
    this._running = true;
    this._mode = 'blast';
    this._modeElapsed = 0;
  }

  /** Calms to the occasional idle burst. */
  setMode(mode: DemoMode): void {
    if (mode === this._mode) return;
    this._mode = mode;
    this._modeElapsed = 0;
  }

  /** Stops listening and forgets its shots; the container owns the drawn objects. */
  destroy(): void {
    if (this._destroyed) return;
    this._destroyed = true;
    this._scene.events.off(Phaser.Scenes.Events.UPDATE, this._tick, this);
    this._image.setPosition(this._home.x, this._home.y);
  }

  private readonly _tick = (_time: number, deltaMs: number): void => {
    if (!this._running || this._destroyed) return;
    const dt = Math.min(deltaMs, 50) / 1000;
    this._elapsed += dt * 1000;
    this._modeElapsed += dt * 1000;
    const phase = demoPhase(this._modeElapsed, this._mode, this._targets.length);
    const aim = this._targets[phase.aimIndex];
    const centre = this._home;
    if (aim) {
      const desired = Math.atan2(aim.y - centre.y, aim.x - centre.x);
      this._angle = easeAngle(this._angle, desired, deltaMs, TURN_RATE);
      const firing = phase.firing && Math.abs(desired - this._angle) < FIRE_ANGLE_TOLERANCE;
      this._recoil += ((firing ? 1 : 0) - this._recoil) * Math.min(1, dt * RECOIL_RATE);
      const fireAt = this._targets[phase.fireIndex];
      this._pose();
      if (firing && fireAt) this._fire(fireAt);
      this._draw(firing);
    }
    this._moveShots(dt);
    this._moveCoins(dt);
    this._targets.forEach((t) => t.step(dt));
  };

  /** Turns the picture to the aim and kicks it back while firing. */
  private _pose(): void {
    const kick = this._recoil * RECOIL_PX;
    this._image.setRotation(this._angle);
    this._image.setPosition(
      this._home.x - Math.cos(this._angle) * kick,
      this._home.y - Math.sin(this._angle) * kick,
    );
  }

  private _nozzle(): { x: number; y: number } {
    return nozzlePoint(this._image, this._image.frame, this._anchor, this._baseScale, this._angle);
  }

  /** Fires this frame's shots the way WaterCannon does: per stream, offset along the barrel line, on the gun's cadence. */
  private _fire(target: DemoTarget): void {
    if (this._elapsed < this._nextFireAt) return;
    const nozzle = this._nozzle();
    const dx = target.x - nozzle.x;
    const dy = target.y - nozzle.y;
    const dist = Math.max(1, Math.hypot(dx, dy));
    const perp = { x: -dy / dist, y: dx / dist };
    const streams = this._gun.streams;
    const spacing = this._gun.barrelSpacing ?? BARREL_SPACING_PX;
    for (let i = 0; i < streams; i++) {
      const shot = this._shots.find((s) => !s.active);
      if (!shot) break;
      const offset = (i - (streams - 1) / 2) * spacing;
      shot.x = nozzle.x + perp.x * offset;
      shot.y = nozzle.y + perp.y * offset;
      const wobble = (Math.random() - 0.5) * WATER_PARTICLE_WOBBLE;
      shot.vx = (dx / dist + wobble) * WATER_PARTICLE_SPEED;
      shot.vy = (dy / dist) * WATER_PARTICLE_SPEED;
      shot.life = (dist / WATER_PARTICLE_SPEED) * 1.5;
      shot.seq = this._seq++;
      shot.stream = i;
      shot.active = true;
    }
    this._nextFireAt = this._elapsed + this._gun.interval / FIRE_DENSITY_SCALE;
  }

  private _moveShots(dt: number): void {
    for (const s of this._shots) {
      if (!s.active) continue;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const hit = this._targets.findIndex(
        (t) => Math.hypot(t.x - s.x, t.y - s.y) < t.radius + HIT_PADDING,
      );
      if (hit >= 0) {
        s.active = false;
        this._land(hit, s.x, s.y);
      } else if (s.life <= 0 || s.x > GAME_WIDTH + OFF_SCREEN_MARGIN) {
        s.active = false;
      }
    }
  }

  private _land(index: number, x: number, y: number): void {
    const target = this._targets[index];
    if (!target) return;
    target.hit();
    spawnImpact(this._scene, x, y, this._gun, REVEAL_DEPTH + 1);
    if (this._elapsed < (this._coinAt[index] ?? 0)) return;
    this._coinAt[index] = this._elapsed + COIN_EVERY_MS;
    const coin = this._coins.find((c) => c.life <= 0);
    if (!coin) return;
    coin.life = COIN_LIFE_S;
    coin.vx = (Math.random() - 0.3) * COIN_SIDE_SPEED;
    coin.vy = -COIN_UP_SPEED * (0.7 + Math.random() * 0.5);
    coin.shape.setPosition(target.x, target.y).setVisible(true).setAlpha(1);
  }

  private _moveCoins(dt: number): void {
    for (const c of this._coins) {
      if (c.life <= 0) continue;
      c.life -= dt;
      c.vy += COIN_GRAVITY * dt;
      c.shape.x += c.vx * dt;
      c.shape.y += c.vy * dt;
      c.shape.setAlpha(Math.min(1, (c.life / COIN_LIFE_S) * 2));
      if (c.life <= 0) c.shape.setVisible(false);
    }
  }

  /** Hands the shots in flight to the gun's own projectile renderer, nozzle first while firing. */
  private _draw(firing: boolean): void {
    const gfx = this._gfx;
    gfx.clear();
    const byStream = new Map<number, Shot[]>();
    for (const s of this._shots) {
      if (!s.active) continue;
      const list = byStream.get(s.stream);
      if (list) list.push(s);
      else byStream.set(s.stream, [s]);
    }
    const nozzle = this._nozzle();
    const streams: JetPoint[][] = [];
    for (const list of byStream.values()) {
      list.sort((a, b) => b.seq - a.seq);
      const points: JetPoint[] = list.map((s) => ({ x: s.x, y: s.y, seq: s.seq }));
      if (firing) points.unshift({ x: nozzle.x, y: nozzle.y });
      if (points.length >= 2) streams.push(points);
    }
    if (streams.length === 0) return;
    JET_RENDERERS[this._gun.projectile]({
      gfx,
      time: this._scene.time.now,
      streams,
      colour: this._gun.particleColour,
      accent: this._gun.accentColour,
      size: this._gun.sz,
    });
  }
}
