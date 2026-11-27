/**
 * A thief (the cat, squirrel, seagull or pigeon): lands on one instrument and
 * silences it, and while it sits steals coins from the gig's total every half
 * second. Squirting it off makes it drop the loot; leave it too long and it
 * flies off with it. The director does the paying; this keeps the sitting,
 * the count of what it holds and the loot number over its head.
 */

import Phaser from 'phaser';

import type { Spinner } from '../spinner/Spinner';
import type { WaterParticle } from '../waterParticle/WaterParticle';
import { boxesOverlap, getStageBounds } from '../../ui/stageBounds';
import { COLOUR_HEX } from '../../utils/colour';
import { textStyle } from '../../utils/typography';
import { drawSitterShadow } from './sitterShadow';
import { THIEF, VISIT_MOTION as M } from './visitorTuning.data';
import type { VisitorHit } from './visitor.types';
import { Visitor, type VisitorSpec } from './Visitor';

const { Quadratic } = Phaser.Math.Easing;

/** The loot number's size and opacity while it would sit on a big message. */
const LOOT_YIELD_SCALE = 0.6;
const LOOT_YIELD_ALPHA = 0.5;

/** What the director hands a thief when it is sent out. */
export interface ThiefSpec extends Omit<VisitorSpec, 'y' | 'widthPx'> {
  /** The instrument it lands on. */
  readonly host: Spinner;
  /** Hits that shoo it. */
  readonly hitsNeeded: number;
}

export class ThiefVisitor extends Visitor {
  private readonly _host: Spinner;
  private readonly _hitsNeeded: number;
  private readonly _shadow: Phaser.GameObjects.Graphics;
  private readonly _lootLabel: Phaser.GameObjects.Text;
  private _hits = 0;
  private _loot = 0;
  private _stealMs = 0;
  private _owedSteals = 0;
  private _escapedWith = 0;
  private _leaveBaseY = 0;

  constructor(scene: Phaser.Scene, spec: ThiefSpec) {
    super(scene, { def: spec.def, dir: spec.dir, y: spec.host.y });
    this._host = spec.host;
    this._hitsNeeded = spec.hitsNeeded;
    this._body.setAlpha(0);
    this._shadow = scene.add.graphics().setDepth(M.depth - 1);
    this._lootLabel = scene.add
      .text(0, -THIEF.lootLiftPx, '', textStyle('displayM', COLOUR_HEX.heatOrange, COLOUR_HEX.ink))
      .setOrigin(0.5)
      .setVisible(false);
    this.add(this._lootLabel);
    this.setPosition(spec.host.x, spec.host.y);
  }

  override get occupied(): readonly Spinner[] {
    return [this._host];
  }

  /** The coins it holds right now. */
  get loot(): number {
    return this._loot;
  }

  /** Steal ticks that have fallen since the last call — the director takes the coins. */
  consumeSteals(): number {
    const n = this._owedSteals;
    this._owedSteals = 0;
    return n;
  }

  /** Adds coins it has just taken and pops the number over its head. */
  addLoot(amount: number): void {
    this._loot += amount;
    this._lootLabel.setText(`-${this._loot}`).setVisible(true).setScale(THIEF.lootPop);
    this.scene.tweens.killTweensOf(this._lootLabel);
    this.scene.tweens.add({ targets: this._lootLabel, scale: 1, duration: THIEF.lootPopMs });
  }

  /** If it just left with its loot, how much — once; otherwise 0. */
  takeEscape(): number {
    const n = this._escapedWith;
    this._escapedWith = 0;
    return n;
  }

  /** Empties its hands (it has been shooed and the director has paid the loot back). */
  clearLoot(): void {
    this._loot = 0;
    this._lootLabel.setVisible(false);
  }

  override tryBlock(particle: WaterParticle): VisitorHit | null {
    if (this._phase !== 'active') return null;
    const host = this._host;
    const reach = host.def.r * host.scaleX + M.sitterHitPadPx;
    if (Math.hypot(particle.x - host.x, particle.y - host.y) >= reach) return null;
    particle.blockAndRecycle();
    this._hits++;
    this._kick = Math.min(1, this._kick + M.kickPerHit);
    if (this._hits < this._hitsNeeded) return 'absorbed';
    this._beginLeaving(false);
    return 'shoo';
  }

  protected override _release(): void {
    this._host.silenced = false;
    if (this._shadow.active) this._shadow.destroy();
  }

  private _beginLeaving(timedOut: boolean): void {
    this._phase = 'leaving';
    this._phaseMs = 0;
    this._leaveBaseY = this.y;
    this._host.silenced = false;
    this._body.redraw(true, []);
    if (timedOut) this._escapedWith = this._loot;
  }

  protected override _step(time: number, dt: number): void {
    const host = this._host;
    const perchY = host.y - host.def.r * M.sitterPerchFraction;
    if (this._phase === 'telegraph') {
      drawSitterShadow(this._shadow, host, this._phaseMs);
      if (this._phaseMs >= M.telegraphMs) {
        this._phase = 'drop';
        this._phaseMs = 0;
        this._body.setAlpha(1);
      }
    } else if (this._phase === 'drop') {
      const t = Math.min(1, this._phaseMs / M.sitterDropMs);
      this.setPosition(host.x, perchY - M.sitterDropHeightPx * (1 - Quadratic.In(t)));
      if (t >= 1) this._land();
    } else if (this._phase === 'active') {
      this.setPosition(host.x, perchY + Math.sin(time * M.perchSwayRadPerMs) * M.perchSwayPx);
      this._yieldToStage();
      this._stealMs += dt * 1000;
      while (this._stealMs >= THIEF.tickMs) {
        this._stealMs -= THIEF.tickMs;
        this._owedSteals++;
      }
      if (this._phaseMs >= M.sitterStayMs) this._beginLeaving(true);
    } else {
      this._stepLeaving(dt);
    }
  }

  /** While a big message is on the wall's stage and the loot number would sit on it, the number shrinks and dims. */
  private _yieldToStage(): void {
    const label = this._lootLabel;
    const stage = getStageBounds();
    const over = stage !== null && label.visible && boxesOverlap(label.getBounds(), stage);
    label.setAlpha(over ? LOOT_YIELD_ALPHA : 1);
    if (!this.scene.tweens.isTweening(label)) label.setScale(over ? LOOT_YIELD_SCALE : 1);
  }

  private _land(): void {
    this._shadow.clear();
    this._host.silenced = true;
    this._host.pulse(1);
    this._kick = 1;
    this._phase = 'active';
    this._phaseMs = 0;
  }

  private _stepLeaving(dt: number): void {
    const t = Math.min(1, this._phaseMs / M.sitterExitMs);
    this.x += this._dir * M.sitterExitPxPerS * dt;
    const hop =
      Math.abs(Math.sin((this._phaseMs / 1000) * M.sitterHopHz * Math.PI)) * M.sitterHopPx;
    this.y = this._leaveBaseY - hop - this.def.exitRisePxPerS * (this._phaseMs / 1000);
    this._body.setAlpha(1 - Quadratic.In(t));
    this._lootLabel.setAlpha(1 - t);
    if (t >= 1) this._finish();
  }
}
