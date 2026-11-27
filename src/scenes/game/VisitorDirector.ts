/**
 * Decides when a visitor comes and which, owns the live ones, and turns
 * what happens to them into rewards and feedback: water against a visitor,
 * a treat popped, a balloon burst, a sitter shooed. GameScene calls
 * `update` once a frame and WaterCollisions calls `tryBlock` for every
 * water particle; the rules for timing are in `visitorSchedule`.
 */

import type Phaser from 'phaser';

import { GAME_WIDTH } from '../../config';

import { audioOrchestra } from '../../audio/AudioOrchestra';
import type { Accent } from '../../audio/orchestra/setPieces';
import * as SFX from '../../audio/SFX';
import type { GunDef } from '../../entities/gun/gun.types';
import type { Spinner } from '../../entities/spinner/Spinner';
import { SpinnerState } from '../../entities/spinner/spinner.types';
import { VISITOR_DEFS } from '../../entities/visitor/visitor.data';
import {
  BLOCKER,
  SITTER_HITS,
  THIEF,
  VISIT_MOTION as M,
  VISIT_PAY,
} from '../../entities/visitor/visitorTuning.data';
import type {
  VisitorDef,
  VisitorHit,
  VisitorId,
  VisitorKind,
} from '../../entities/visitor/visitor.types';
import type { Visitor, VisitorAimPoint } from '../../entities/visitor/Visitor';
import { BlockerVisitor } from '../../entities/visitor/BlockerVisitor';
import { pickCluster, type ClusterCandidate } from '../../entities/visitor/blockerCluster';
import { createVisitor, type PlacedSpec } from '../../entities/visitor/createVisitor';
import { stealPerTick } from '../../entities/visitor/theft';
import { ThiefVisitor } from '../../entities/visitor/ThiefVisitor';
import { castFor, VisitorSchedule, type RandomFn } from '../../entities/visitor/visitorSchedule';
import { spawnImpact } from '../../entities/waterParticle/projectiles/impacts';
import { spawnSparks } from '../../entities/waterParticle/splashVFX';
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
/** Treats fly in the top part of the wall only. */
const TREAT_HEIGHT_SHARE = 0.7;
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
    for (const visitor of this._live) {
      visitor.update(time, deltaMs);
      if (visitor instanceof ThiefVisitor) this._thiefActs(visitor);
      else if (visitor instanceof BlockerVisitor) this._chargeDropOuts(visitor, time);
    }
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
    const def = VISITOR_DEFS[id];
    const placed = this._place(def);
    if (!placed) return this._schedule.retrySoon();
    const visitor = createVisitor(this._d.scene, placed);
    this._live.push(visitor);
    audioOrchestra.accent(TELEGRAPH_ACCENT[def.kind]);
    if (visitor instanceof ThiefVisitor) {
      const host = visitor.occupied[0];
      if (host) this._say(host, THIEF.arrivalWord, COLOUR_HEX.heatOrange);
    }
  }

  /** Decides where a visitor goes: a cluster for a blocker, one instrument for a thief, a height for a treat. */
  private _place(def: VisitorDef): PlacedSpec | null {
    const d = this._d;
    const area = wallAreaFor(d.world);
    if (def.kind === 'sitter') {
      const host = this._pickHost();
      if (!host) return null;
      const tiers = Math.max(0, d.gun.tier - 1);
      const hitsNeeded = Math.max(
        SITTER_HITS.min,
        Math.round(SITTER_HITS.base / (1 + SITTER_HITS.speedupPerTier * tiers)),
      );
      return { kind: 'sitter', spec: { def, dir: this._side(), host, hitsNeeded } };
    }
    if (def.kind === 'blocker') {
      const cluster = pickCluster(this._freeCandidates(), this._random);
      if (!cluster) return null;
      return {
        kind: 'blocker',
        spec: {
          def,
          dir: cluster.x < GAME_WIDTH / 2 ? 1 : -1,
          park: { x: cluster.x, y: cluster.y, radius: cluster.radius },
          covered: cluster.members.map((m) => m.spinner),
          hitsNeeded: BLOCKER.baseHits + BLOCKER.hitsPerGigIndex * d.gig.index,
          fitToCluster: true,
        },
      };
    }
    const top = area.y + M.treatArcPx;
    const bottom = area.y + area.height * TREAT_HEIGHT_SHARE;
    const y = top + this._random() * Math.max(0, bottom - top);
    return { kind: 'treat', spec: { def, dir: this._side(), y } };
  }

  private _side(): 1 | -1 {
    return this._random() < 0.5 ? 1 : -1;
  }

  /** Instruments nothing is sitting on or covering. */
  private _free(): Spinner[] {
    const taken = new Set(this._live.flatMap((v) => v.occupied));
    return this._d.spinners().filter((s) => !s.silenced && !taken.has(s));
  }

  private _freeCandidates(): (ClusterCandidate & { spinner: Spinner })[] {
    return this._free().map((s) => ({
      x: s.x,
      y: s.y,
      r: s.def.r * s.scaleX,
      spinning: s.currentState !== SpinnerState.STOPPED,
      spinner: s,
    }));
  }

  /** A spinning instrument for a thief: one at full speed if there is one, never one already taken. */
  private _pickHost(): Spinner | null {
    const free = this._free();
    const full = free.filter((s) => s.currentState === SpinnerState.FULL);
    const spinning = free.filter((s) => s.currentState !== SpinnerState.STOPPED);
    const pool = full.length > 0 ? full : spinning;
    return pool[Math.min(pool.length - 1, Math.floor(this._random() * pool.length))] ?? null;
  }

  /** Coins for an outcome: a share of the gig's third star target, never less than a couple. */
  private _coins(fraction: number): number {
    const third = starTargets(this._d.gig)[2];
    return Math.max(VISIT_PAY.minCoins, Math.round(third * fraction));
  }

  /** A thief's half-second: take its coins (counter to thief), and say so if it just flew off with them. */
  private _thiefActs(thief: ThiefVisitor): void {
    const at = { x: thief.x, y: thief.y };
    const per = stealPerTick(starTargets(this._d.gig)[2]);
    for (let i = thief.consumeSteals(); i > 0; i--) {
      const taken = this._d.reward.steal(per, at);
      if (taken <= 0) continue;
      if (thief.loot === 0) audioOrchestra.accent('goldenMissed');
      thief.addLoot(taken);
      this._say(at, `-${taken}`, COLOUR_HEX.heatOrange);
    }
    const escaped = thief.takeEscape();
    if (escaped > 0) this._say(at, `-${escaped}`, COLOUR_HEX.heatOrange);
  }

  /** Instruments under a blocker that have wound down out of full speed cost groove, as they would have uncovered. */
  private _chargeDropOuts(blocker: BlockerVisitor, time: number): void {
    for (const spinner of blocker.consumeDropOuts()) {
      this._d.reward.onSpinnerStateChange(spinner, SpinnerState.FULL, SpinnerState.MEDIUM, time);
    }
  }

  /** A shooed thief drops everything: the loot flies back to the counter with the usual bonus. */
  private _returnLoot(thief: ThiefVisitor, at: { x: number; y: number }): void {
    const d = this._d;
    const loot = thief.loot;
    const bonus = this._coins(VISIT_PAY.shooFraction);
    thief.clearLoot();
    d.reward.payBurst(
      Array.from({ length: THIEF.returnCoinThrows }, () => ({
        x: at.x + (this._random() - 0.5) * COIN_SPREAD_PX,
        y: at.y + (this._random() - 0.5) * COIN_SPREAD_PX,
      })),
      loot + bonus,
    );
    spawnSparks(d.scene, at.x, at.y, COLOUR.mintGreen);
    const word = loot > 0 ? THIEF.returnWord : thief.def.word;
    this._say(at, `${word} +${loot + bonus}`, COLOUR_HEX.mintGreen);
    audioOrchestra.accent(loot > 0 ? 'golden' : 'spin');
  }

  private _onHit(visitor: Visitor, hit: VisitorHit, x: number, y: number): void {
    const d = this._d;
    const word = VISITOR_DEFS[visitor.def.id].word;
    if (hit === 'absorbed') {
      spawnImpact(d.scene, x, y, d.gun);
      if (d.scene.time.now - this._lastDeflectAt >= M.deflectSoundGapMs) {
        this._lastDeflectAt = d.scene.time.now;
        SFX.playDeflect();
      }
      return;
    }
    if (hit === 'shoo' && visitor instanceof ThiefVisitor) {
      return this._returnLoot(visitor, { x: visitor.x, y: visitor.y });
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
