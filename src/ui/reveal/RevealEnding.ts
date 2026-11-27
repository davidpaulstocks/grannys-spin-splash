/**
 * Beat 3 of the gun reveal and what follows it. For a gun just bought:
 * POWER counting up, the three rows, USE IT and Later. For a preview: the
 * price and the player's progress, then OK, or BUY, which carries the same
 * overlay on into the owned gun's numbers.
 */

import type Phaser from 'phaser';

import { playStarChime } from '../../audio/ResultsMusic';
import { GUN_LADDER_DEFS } from '../../entities/gun/gun.data';
import type { GunDef } from '../../entities/gun/gun.types';
import { powerRatingAt } from '../../entities/gun/gunLevels';
import { gunStats, statRows } from '../../systems/gunStats';
import { spawnSparkles } from '../sparkle';
import type { GunPreviewConfig, GunRevealConfig } from '../GunReveal';
import {
  buildOwnedButtons,
  buildPreviewButtons,
  buildPreviewPrice,
  fadeIn,
  showPower,
  startOwnedRows,
  type TagRow,
} from './RevealPanels';
import type { RevealCtx } from './RevealTracker';
import { REVEAL_DEPTH, type Point, type RevealTimeline } from './revealTiming';

const BUY_SHAKE_MS = 220;
const BUY_SHAKE = 0.006;
const BUY_CHIME = 2;

/** What the ending needs from the reveal around it. */
export interface EndingHooks {
  /** False once the overlay has closed. */
  isOpen(): boolean;
  close(): void;
  /** The preview became an owned gun: the reveal carries on with `cfg` (its onClosed runs when it closes). */
  becameOwned(cfg: GunRevealConfig): void;
}

export class RevealEnding {
  private _previewThings: Phaser.GameObjects.GameObject[] = [];

  constructor(
    private readonly _ctx: RevealCtx,
    private readonly _gun: GunDef,
    private readonly _tag: TagRow,
    private readonly _timeline: RevealTimeline,
    private readonly _at: Point,
    private readonly _hooks: EndingHooks,
  ) {}

  /** The owned gun's beat 3: POWER counting up, the three rows, then USE IT and Later. */
  startOwned(cfg: GunRevealConfig, instant: boolean): void {
    const { _ctx: ctx, _gun: gun, _hooks: hooks } = this;
    const before = GUN_LADDER_DEFS.find((g) => g.id === cfg.previousGunId) ?? gun;
    const prevLevel = cfg.previousLevel ?? 1;
    const level = cfg.level ?? 1;
    showPower(ctx, this._tag, powerRatingAt(before, prevLevel), powerRatingAt(gun, level), instant);
    startOwnedRows(ctx, statRows(gunStats(before, prevLevel), gunStats(gun, level)), instant);
    const buttons = buildOwnedButtons(
      ctx,
      () => {
        if (!hooks.isOpen()) return;
        cfg.onUse();
        hooks.close();
      },
      () => {
        if (!hooks.isOpen()) return;
        cfg.onLater();
        hooks.close();
      },
    );
    if (instant) fadeIn(ctx, buttons, true);
    else
      ctx.tracker.delay(this._timeline.ownedButtonsAt - this._timeline.beat3At, () =>
        fadeIn(ctx, buttons, false),
      );
  }

  /** The preview's beat 3: the price, then OK or BUY. */
  startPreview(p: GunPreviewConfig, instant: boolean): void {
    const { _ctx: ctx, _hooks: hooks } = this;
    const power = powerRatingAt(this._gun, 1);
    showPower(ctx, this._tag, power, power, true);
    const canBuy = p.have >= p.price && p.onBuy !== undefined;
    const price = buildPreviewPrice(ctx, p.have, p.price);
    const buttons = buildPreviewButtons(
      ctx,
      p.price,
      canBuy,
      () => {
        if (!hooks.isOpen()) return;
        const next = p.onBuy?.();
        if (next) this._becomeOwned(next);
        else hooks.close();
      },
      () => hooks.close(),
    );
    this._previewThings = [...price, ...buttons];
    fadeIn(ctx, price, instant);
    if (instant) fadeIn(ctx, buttons, true);
    else
      ctx.tracker.delay(this._timeline.previewButtonsAt - this._timeline.beat3At, () =>
        fadeIn(ctx, buttons, false),
      );
  }

  /** The preview becomes the real thing: the same overlay carries on into the owned gun's numbers. */
  private _becomeOwned(cfg: GunRevealConfig): void {
    const { scene } = this._ctx;
    this._previewThings.forEach((t) => t.destroy());
    this._previewThings = [];
    this._hooks.becameOwned(cfg);
    scene.cameras.main.shake(BUY_SHAKE_MS, BUY_SHAKE);
    spawnSparkles(scene, this._at.x, this._at.y, REVEAL_DEPTH + 1);
    playStarChime(BUY_CHIME);
    this.startOwned(cfg, false);
  }
}
