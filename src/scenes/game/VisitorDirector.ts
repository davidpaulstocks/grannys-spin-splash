/**
 * Decides when a visitor comes and which, owns the live ones, and turns
 * what happens to them into rewards and feedback: water against a visitor,
 * a treat popped, a balloon burst, a sitter shooed. GameScene calls
 * `update` once a frame and WaterCollisions calls `tryBlock` for every
 * water particle; the rules for timing are in `visitorSchedule`.
 */

import type Phaser from 'phaser';

import { audioOrchestra } from '../../audio/AudioOrchestra';
import type { Accent } from '../../audio/orchestra/setPieces';
import * as SFX from '../../audio/SFX';
import type { GunDef } from '../../entities/gun/gun.types';
import type { Spinner } from '../../entities/spinner/Spinner';
import { SpinnerState } from '../../entities/spinner/spinner.types';
import {
  SITTER_HITS,
  VISIT_MOTION as M,
  VISIT_PAY,
  VISITOR_DEFS,
} from '../../entities/visitor/visitor.data';
import type { VisitorHit, VisitorId, VisitorKind } from '../../entities/visitor/visitor.types';
import { Visitor, type VisitorAimPoint } from '../../entities/visitor/Visitor';
import { castFor, VisitorSchedule, type RandomFn } from '../../entities/visitor/visitorSchedule';
import { spawnSparks, spawnSplash } from '../../entities/waterParticle/splashVFX';
import type { WaterParticle } from '../../entities/waterParticle/WaterParticle';
import { starTargets, type GigDef } from '../../entities/world/gigs.data';
import { wallAreaFor } from '../../entities/world/wallBuilder';
import type { WorldDef } from '../../entities/world/world.types';
import { spawnFloatingText } from '../../ui/FloatingText';
import { COLOUR, COLOUR_HEX } from '../../utils/colour';
import type { RewardLoop } from './RewardLoop';

/** The warning sound for each kind, from the orchestra's own accents. */
const TELEGRAPH_ACCENT: Readonly<Record<VisitorKind, Accent>> = {
  blocker: 'spin',
  sitter: 'wake',
  treat: 'cheer',
};
/** Where the words float: above the place it happened. */
const WORD_LIFT_PX = 44;
/** Coins thrown from where a payout happens spread this wide. */
const COIN_SPREAD_PX = 24;

/** What the director reads from the rest of the scene. */
export interface VisitorDirectorDeps {
  readonly scene: Phaser.Scene;
  readonly world: WorldDef;
  readonly gig: GigDef;
  readonly gun: GunDef;
  /** The fixed grid of instruments — never the Golden Spinner. */
  readonly spinners: () => readonly Spinner[];
  readonly reward: RewardLoop;
  readonly frenzyActive: () => boolean;
  readonly random?: RandomFn;
}

export class VisitorDirector {
  private readonly _schedule: VisitorSchedule;
  private readonly _random: RandomFn;
  private _live: Visitor[] = [];
  private _lastDeflectAt = -Infinity;

  constructor(private readonly _d: VisitorDirectorDeps) {
    this._random = _d.random ?? Math.random;
    this._schedule = new VisitorSchedule(castFor(_d.world.id), _d.gig.index, this._random);
  }

  /** Where the player may aim at a visitor (a treat or a blocker), for the aim assist. */
  get aimPoints(): readonly VisitorAimPoint[] {
    return this._live.flatMap((v) => v.aimPoint ?? []);
  }

  /** One frame: sends the next visitor when it is time, moves the live ones, drops the finished. */
  update(time: number, deltaMs: number, started: boolean, timeRemainingMs: number): void {
    const id = this._schedule.update(deltaMs, {
      started,
      frenzyActive: this._d.frenzyActive(),
      timeRemainingMs,
      liveCount: this._live.length,
    });
    if (id) this._send(id);
    for (const visitor of this._live) visitor.update(time, deltaMs);
    this._live = this._live.filter((v) => {
      if (!v.done) return true;
      v.destroy();
      return false;
    });
  }

  /** Tests one water particle against every live visitor; true if one took it. */
  tryBlock(particle: WaterParticle): boolean {
    for (const visitor of this._live) {
      const hit = visitor.tryBlock(particle);
      if (!hit) continue;
      this._onHit(visitor, hit, particle.x, particle.y);
      return true;
    }
    return false;
  }

  private _send(id: VisitorId): void {
    const d = this._d;
    const def = VISITOR_DEFS[id];
    const area = wallAreaFor(d.world);
    const dir = this._random() < 0.5 ? 1 : -1;
    let host: Spinner | null = null;
    let y = 0;
    if (def.kind === 'sitter') {
      host = this._pickHost();
      if (!host) return this._schedule.retrySoon();
    } else {
      const top = area.y + (def.kind === 'treat' ? M.treatArcPx : 0);
      const bottom = area.y + area.height * (def.kind === 'treat' ? 0.7 : 1);
      y = top + this._random() * Math.max(0, bottom - top);
    }
    const tiers = Math.max(0, d.gun.tier - 1);
    const hitsNeeded = Math.max(
      SITTER_HITS.min,
      Math.round(SITTER_HITS.base / (1 + SITTER_HITS.speedupPerTier * tiers)),
    );
    this._live.push(new Visitor(d.scene, { def, dir, y, host, hitsNeeded }));
    audioOrchestra.accent(TELEGRAPH_ACCENT[def.kind]);
  }

  /** A spinning instrument for a sitter: one at full speed if there is one, never one already sat on. */
  private _pick(spinners: readonly Spinner[]): Spinner | null {
    return (
      spinners[Math.min(spinners.length - 1, Math.floor(this._random() * spinners.length))] ?? null
    );
  }

  private _pickHost(): Spinner | null {
    const taken = new Set(this._live.map((v) => v.host));
    const free = this._d.spinners().filter((s) => !s.silenced && !taken.has(s));
    const full = free.filter((s) => s.currentState === SpinnerState.FULL);
    const spinning = free.filter((s) => s.currentState !== SpinnerState.STOPPED);
    return this._pick(full.length > 0 ? full : spinning);
  }

  /** Coins for an outcome: a share of the gig's third star target, never less than a couple. */
  private _coins(fraction: number): number {
    const third = starTargets(this._d.gig)[2];
    return Math.max(VISIT_PAY.minCoins, Math.round(third * fraction));
  }

  private _onHit(visitor: Visitor, hit: VisitorHit, x: number, y: number): void {
    const d = this._d;
    const word = VISITOR_DEFS[visitor.def.id].word;
    if (hit === 'absorbed') {
      spawnSplash(d.scene, x, y, d.gun.particleColour);
      if (d.scene.time.now - this._lastDeflectAt >= M.deflectSoundGapMs) {
        this._lastDeflectAt = d.scene.time.now;
        SFX.playDeflect();
      }
      return;
    }
    const at = hit === 'treat' ? { x: visitor.x, y: visitor.y } : { x, y };
    const spread = (): number => (this._random() - 0.5) * COIN_SPREAD_PX;
    const pay = (fraction: number, throws: number): number => {
      const amount = this._coins(fraction);
      d.reward.payBurst(
        Array.from({ length: throws }, () => ({ x: at.x + spread(), y: at.y + spread() })),
        amount,
      );
      return amount;
    };
    spawnSparks(d.scene, at.x, at.y, hit === 'shoo' ? COLOUR.mintGreen : COLOUR.sunnyGold);
    if (hit === 'treat') {
      const amount = pay(VISIT_PAY.treatFraction, M.treatCoinThrows);
      d.reward.groove.jackpot();
      this._say(at, `${word} +${amount}`, COLOUR_HEX.sunnyGold);
      audioOrchestra.accent('golden');
    } else if (hit === 'balloon') {
      pay(VISIT_PAY.balloonFraction, M.popCoinThrows);
      this._say(at, word, COLOUR_HEX.waterBlue);
      audioOrchestra.accent('wake');
    } else {
      const amount = pay(VISIT_PAY.shooFraction, M.shooCoinThrows);
      this._say(at, `${word} +${amount}`, COLOUR_HEX.mintGreen);
      audioOrchestra.accent('spin');
    }
  }

  private _say(at: { x: number; y: number }, message: string, colourHex: string): void {
    spawnFloatingText(this._d.scene, at.x, at.y - WORD_LIFT_PX, message, colourHex);
  }
}
