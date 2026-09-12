/**
 * The water tank — bottom-of-screen, and deliberately the most alive piece
 * of HUD in the game (CLAUDE.md §7.2, §5.8; rebuilt 2026-09-12 on direct
 * user feedback to make it "a signature feature" rather than a progress bar).
 *
 * It was a flat blue rounded rectangle whose only animation was an alpha
 * pulse while pumping. It is now a body of liquid:
 *
 * - the leading edge is a **meniscus** that undulates and sloshes, so the
 *   tank reads as water being pushed around rather than a bar being trimmed
 * - **bubbles** rise and wobble inside it, surging while the player fires
 *   and boiling up while the pump refills
 * - the colour **warms from Water Blue toward Heat Orange** as the tank
 *   empties, so running dry is felt before it is read — §5.1 assigns Heat
 *   Orange to urgency, and §5.9's "no red flashing until the very end"
 *   is why this warms rather than flashes red
 * - a **gloss band** and a darker floor give it depth without gradients
 *
 * Everything is procedural Phaser Graphics: zero bytes of asset budget, and
 * it scales with the canvas like the rest of the UI. All colour comes from
 * the §5.1 palette via `COLOUR`/`shade()` — no raw hex (§7.3 rule 3).
 *
 * `update()` keeps its original `(pct, isPumping)` signature: whether the
 * player is firing is inferred from the level falling, so GameScene's HUD
 * payload (`types/hud.ts`) did not need widening for this.
 */

import Phaser from 'phaser';

import { COLOUR, shade } from '../utils/colour';

const BAR_RADIUS = 16;

/** Horizontal sway of the leading edge, px, and how tightly it ripples up the bar's height. */
const WAVE_AMPLITUDE = 5;
const WAVE_LENGTH_PX = 22;
const WAVE_SPEED = 3.2;
/** Vertical slices used to draw the meniscus — enough to read as a curve, cheap to fill. */
const WAVE_SEGMENTS = 10;

const BUBBLE_COUNT = 22;
const BUBBLE_MIN_R = 2.4;
const BUBBLE_MAX_R = 6;
const BUBBLE_RISE_MIN = 14;
const BUBBLE_RISE_MAX = 34;
/** Rise multipliers — firing stirs the tank, pumping makes it boil. */
const BUBBLE_BOOST_DRAINING = 2.1;
const BUBBLE_BOOST_PUMPING = 3.4;

/** Below this percentage the tank starts warming toward Heat Orange and breathing. */
const LOW_WATER_PCT = 35;
/**
 * The tank holds pure Water Blue until it drops below this level, then ramps
 * Blue -> Gold -> Orange over the remainder. Holding blue through the healthy
 * half keeps the transition decisive instead of spending most of the bar's
 * range in the desaturated middle of a blue/orange blend.
 */
const WARM_START_LEVEL = 0.6;
const LOW_THROB_HZ = 2.4;
/** Peak brightening at the top of the low-water pulse. */
const LOW_THROB_GAIN = 0.18;

const GLOSS_ALPHA = 0.28;
const FLOOR_ALPHA = 0.16;
const BUBBLE_ALPHA = 0.5;

interface Bubble {
  /** 0–1 across the filled width, so bubbles stay put as the level moves. */
  t: number;
  y: number;
  r: number;
  rise: number;
  phase: number;
}

export class WaterBar {
  private readonly _scene: Phaser.Scene;
  private readonly _x: number;
  private readonly _y: number;
  private readonly _width: number;
  private readonly _height: number;
  private readonly _liquidGfx: Phaser.GameObjects.Graphics;
  private readonly _frameGfx: Phaser.GameObjects.Graphics;
  private readonly _bubbles: Bubble[] = [];
  private _lastPct = 100;
  private _lastTime = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    this._scene = scene;
    this._x = x;
    this._y = y;
    this._width = width;
    this._height = height;

    this._liquidGfx = scene.add.graphics();
    // Clipped to the tank's own rounded shape so the meniscus and bubbles can
    // be drawn freely without spilling past the frame.
    const maskShape = scene.make.graphics({}, false);
    maskShape.fillStyle(COLOUR.cloud, 1);
    maskShape.fillRoundedRect(x, y, width, height, BAR_RADIUS);
    this._liquidGfx.setMask(maskShape.createGeometryMask());

    this._frameGfx = scene.add.graphics();
    this._frameGfx.lineStyle(4, COLOUR.ink, 1);
    this._frameGfx.strokeRoundedRect(x, y, width, height, BAR_RADIUS);

    for (let i = 0; i < BUBBLE_COUNT; i++) this._bubbles.push(this._spawnBubble(Math.random()));
  }

  /** Call once per frame with the current tank percentage (0–100) and pump state. */
  update(pct: number, isPumping: boolean): void {
    const now = this._scene.time.now;
    const dt = this._lastTime === 0 ? 0 : Math.min(0.05, (now - this._lastTime) / 1000);
    this._lastTime = now;

    const clamped = Phaser.Math.Clamp(pct, 0, 100);
    const draining = clamped < this._lastPct - 0.01;
    this._lastPct = clamped;

    const level = clamped / 100;
    const fillWidth = this._width * level;
    const colour = this._liquidColour(clamped, now);

    this._advanceBubbles(dt, draining, isPumping);

    this._liquidGfx.clear();
    if (fillWidth > 1) {
      this._drawLiquid(fillWidth, colour, now, isPumping);
      this._drawBubbles(fillWidth, colour);
    }
  }

  /**
   * Water Blue when healthy, warming toward Heat Orange as the tank drains,
   * with a slow breath below LOW_WATER_PCT so an empty-ish tank pulls the
   * eye without ever flashing red (§5.9).
   *
   * Routed **through Sunny Gold** rather than interpolating Water Blue
   * straight to Heat Orange. Those two are near-complementary, so a direct
   * RGB blend passes through desaturated mud — measured live at 55% tank it
   * produced #C19877, a washed-out tan that read as a broken grey bar.
   * Blue → Gold → Orange keeps every step saturated and tells the story
   * more clearly anyway: fine, getting low, urgent. All three are §5.1
   * palette colours.
   */
  private _liquidColour(pct: number, now: number): number {
    const warm = Phaser.Math.Clamp((WARM_START_LEVEL - pct / 100) / WARM_START_LEVEL, 0, 1);
    const firstLeg = warm <= 0.5;
    const from = firstLeg ? COLOUR.waterBlue : COLOUR.sunnyGold;
    const to = firstLeg ? COLOUR.sunnyGold : COLOUR.heatOrange;
    const legT = firstLeg ? warm / 0.5 : (warm - 0.5) / 0.5;

    const mixed = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(from),
      Phaser.Display.Color.ValueToColor(to),
      100,
      legT * 100,
    );
    const base = Phaser.Display.Color.GetColor(
      Math.round(mixed.r),
      Math.round(mixed.g),
      Math.round(mixed.b),
    );
    if (pct >= LOW_WATER_PCT) return base;
    // Brightens rather than darkens: a low tank should GLOW, not go dull.
    // The first version oscillated 0.76-1.0x and measured out at #D4A933
    // against an expected #FFC63C — it read as muddy olive, the opposite of
    // urgent.
    const throb =
      1 + LOW_THROB_GAIN * (0.5 + 0.5 * Math.sin((now / 1000) * LOW_THROB_HZ * Math.PI * 2));
    return shade(base, throb);
  }

  /** Body, sloshing meniscus, gloss band and shaded floor. */
  private _drawLiquid(fillWidth: number, colour: number, now: number, isPumping: boolean): void {
    const t = now / 1000;
    const sway = isPumping ? WAVE_AMPLITUDE * 1.6 : WAVE_AMPLITUDE;

    // Body up to just short of the leading edge, then the wavy edge on top of it.
    const bodyWidth = Math.max(0, fillWidth - sway);
    this._liquidGfx.fillStyle(colour, 1);
    this._liquidGfx.fillRect(this._x, this._y, bodyWidth, this._height);

    this._liquidGfx.beginPath();
    this._liquidGfx.moveTo(this._x + bodyWidth, this._y);
    for (let i = 0; i <= WAVE_SEGMENTS; i++) {
      const frac = i / WAVE_SEGMENTS;
      const y = this._y + this._height * frac;
      const edge = fillWidth + Math.sin(t * WAVE_SPEED + (y / WAVE_LENGTH_PX) * Math.PI * 2) * sway;
      this._liquidGfx.lineTo(this._x + edge, y);
    }
    this._liquidGfx.lineTo(this._x + bodyWidth, this._y + this._height);
    this._liquidGfx.closePath();
    this._liquidGfx.fillPath();

    // Gloss along the top and a darker floor — depth without a gradient (§5.9).
    this._liquidGfx.fillStyle(shade(colour, 1.45), GLOSS_ALPHA);
    this._liquidGfx.fillRect(this._x, this._y + 3, bodyWidth, this._height * 0.28);
    this._liquidGfx.fillStyle(shade(colour, 0.72), FLOOR_ALPHA);
    this._liquidGfx.fillRect(
      this._x,
      this._y + this._height * 0.74,
      bodyWidth,
      this._height * 0.26,
    );
  }

  private _advanceBubbles(dt: number, draining: boolean, isPumping: boolean): void {
    const boost = isPumping ? BUBBLE_BOOST_PUMPING : draining ? BUBBLE_BOOST_DRAINING : 1;
    for (const b of this._bubbles) {
      b.y -= b.rise * boost * dt;
      b.phase += dt * 2.6;
      if (b.y + b.r < this._y) Object.assign(b, this._spawnBubble(Math.random()));
    }
  }

  private _drawBubbles(fillWidth: number, colour: number): void {
    const highlight = shade(colour, 1.7);
    for (const b of this._bubbles) {
      const x = this._x + b.t * fillWidth + Math.sin(b.phase) * 2.5;
      // Keep clear of the wobbling edge so bubbles never appear outside the water.
      if (x > this._x + fillWidth - b.r - WAVE_AMPLITUDE) continue;
      this._liquidGfx.fillStyle(highlight, BUBBLE_ALPHA);
      this._liquidGfx.fillCircle(x, b.y, b.r);
    }
  }

  private _spawnBubble(t: number): Bubble {
    return {
      t,
      y: this._y + this._height + Math.random() * this._height * 0.5,
      r: BUBBLE_MIN_R + Math.random() * (BUBBLE_MAX_R - BUBBLE_MIN_R),
      rise: BUBBLE_RISE_MIN + Math.random() * (BUBBLE_RISE_MAX - BUBBLE_RISE_MIN),
      phase: Math.random() * Math.PI * 2,
    };
  }
}
