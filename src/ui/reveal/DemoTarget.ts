/**
 * A spinner-like disc for the gun reveal's demo range: a four-bladed
 * pinwheel that spins up when the water lands and slowly winds down. Drawn
 * once, then only turned and pulsed.
 */

import type Phaser from 'phaser';

import { COLOUR, shade } from '../../utils/colour';
import { BOUNCE_OVERSHOOT, DURATION, EASE } from '../../utils/tween';
import type { RevealTracker } from './RevealTracker';

const BLADE_COLOURS = [COLOUR.grannyPink, COLOUR.waterBlue, COLOUR.sunnyGold] as const;
const BLADES = 4;
const BLADE_SPREAD = 0.62;
const BLADE_LENGTH = 0.92;
const HUB_RADIUS = 0.2;
const BACKING_ALPHA = 0.85;
const OUTLINE_PX = 4;
const SPIN_PER_HIT = 2.4;
const MAX_SPIN = 14;
const SPIN_DECAY = 0.9;
const SPINNING_AT = 3;
const PULSE_SCALE = 0.14;
const PULSE_DECAY = 6;

export class DemoTarget {
  private readonly _gfx: Phaser.GameObjects.Graphics;
  private _spin = 0;
  private _pulse = 0;

  constructor(
    scene: Phaser.Scene,
    root: Phaser.GameObjects.Container,
    readonly x: number,
    readonly y: number,
    readonly radius: number,
    colourIndex: number,
  ) {
    const g = scene.add.graphics({ x, y });
    g.fillStyle(shade(COLOUR.cloud, 0.9), BACKING_ALPHA);
    g.fillCircle(0, 0, radius);
    const colour = BLADE_COLOURS[colourIndex % BLADE_COLOURS.length] ?? COLOUR.waterBlue;
    for (let i = 0; i < BLADES; i++) {
      const a = (i / BLADES) * Math.PI * 2;
      g.fillStyle(i % 2 === 0 ? colour : shade(colour, 0.78), 1);
      g.fillTriangle(
        0,
        0,
        Math.cos(a - BLADE_SPREAD) * radius * BLADE_LENGTH,
        Math.sin(a - BLADE_SPREAD) * radius * BLADE_LENGTH,
        Math.cos(a + BLADE_SPREAD) * radius * BLADE_LENGTH,
        Math.sin(a + BLADE_SPREAD) * radius * BLADE_LENGTH,
      );
    }
    g.fillStyle(COLOUR.cloud, 1);
    g.fillCircle(0, 0, radius * HUB_RADIUS);
    g.lineStyle(OUTLINE_PX, COLOUR.ink, 1);
    g.strokeCircle(0, 0, radius);
    g.strokeCircle(0, 0, radius * HUB_RADIUS);
    g.setScale(0);
    root.add(g);
    this._gfx = g;
  }

  /** Pops the disc in. */
  appear(tracker: RevealTracker, delayMs: number): void {
    tracker.tween({
      targets: this._gfx,
      scale: 1,
      delay: delayMs,
      duration: DURATION.celebration,
      ease: EASE.bouncy,
      easeParams: [BOUNCE_OVERSHOOT],
    });
  }

  /** Water landed: spin up and pulse. */
  hit(): void {
    this._spin = Math.min(MAX_SPIN, this._spin + SPIN_PER_HIT);
    this._pulse = 1;
  }

  /** True while it is turning fast enough to throw coins. */
  get spinning(): boolean {
    return this._spin >= SPINNING_AT;
  }

  /** Advances the spin and the pulse by `dt` seconds. */
  step(dt: number): void {
    this._gfx.rotation += this._spin * dt;
    this._spin *= Math.exp(-SPIN_DECAY * dt);
    this._pulse = Math.max(0, this._pulse - PULSE_DECAY * dt);
    if (this._gfx.scale > 0.99) this._gfx.setScale(1 + PULSE_SCALE * this._pulse);
  }
}
