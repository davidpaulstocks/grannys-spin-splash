/**
 * The coin fountain: on every pay tick each paying instrument throws a small
 * gold coin that pops up off it and flies to the coin counter at the top of
 * the screen (docs/REWARD_LOOP.md). It is only the picture of the payout —
 * the counter's number is exact whatever is drawn. Coins are pooled; when
 * more instruments pay than the pool has room for, the ones that throw
 * rotate so every instrument is seen to pay regularly.
 *
 * GameScene and HUDScene share the 1280x720 logical space, so the counter's
 * position in the HUD is a position in this scene too.
 */

import type Phaser from 'phaser';

import { drawCoinIcon } from '../../ui/icons';
import { SCORE_COIN_X, SCORE_COIN_Y } from '../../ui/ScoreBar';
import { COLOUR, shade } from '../../utils/colour';
import { EASE } from '../../utils/tween';

/** The most coins in the air at once. */
const POOL_SIZE = 36;
/** Coin radius at scale 1 (a FULL instrument's coin). */
const COIN_RADIUS = 13;
const COIN_RIM_SHADE = 0.72;
/** Coin scale by how much the instrument pays: SLOW 1, MEDIUM 2, FULL 4. */
const SCALE_BY_PAY: Readonly<Record<number, number>> = { 1: 0.55, 2: 0.78, 4: 1.05 };
const DEFAULT_SCALE = 0.55;
/** The pop up off the instrument, then the flight to the counter. */
const POP_RISE_PX = 28;
const POP_MS = 100;
const FLIGHT_MS = 350;
/** Throws are spread across this long so a pay tick sprays rather than lands as one clump. */
const SPRAY_MS = 120;
/** Depth: above the wall and its effects, below the HUD scene's own layer. */
const DEPTH = 160;

/** How long a coin is in the air from throw to arrival, ms (the HUD number waits this long to show it). */
export const COIN_TRAVEL_MS = POP_MS + FLIGHT_MS + SPRAY_MS;

/** One instrument that paid this tick. */
export interface Payer {
  readonly x: number;
  readonly y: number;
  /** Coins it paid on the tick (1, 2 or 4) — sets the coin's size. */
  readonly pay: number;
}

interface PooledCoin {
  readonly gfx: Phaser.GameObjects.Graphics;
  busy: boolean;
}

export class CoinFountain {
  private readonly _pool: PooledCoin[] = [];
  /** Where in the payer list the last throw stopped, so a crowded tick carries on from there. */
  private _cursor = 0;

  constructor(private readonly _scene: Phaser.Scene) {
    for (let i = 0; i < POOL_SIZE; i++) {
      const gfx = _scene.add.graphics().setDepth(DEPTH).setVisible(false);
      drawCoinIcon(gfx, COIN_RADIUS + 2, COLOUR.ink, COLOUR.ink);
      drawCoinIcon(gfx, COIN_RADIUS, COLOUR.sunnyGold, shade(COLOUR.sunnyGold, COIN_RIM_SHADE));
      this._pool.push({ gfx, busy: false });
    }
  }

  /** Coins in the air right now. */
  get alive(): number {
    return this._pool.filter((c) => c.busy).length;
  }

  /** Throws a coin from each of `payers`, or from as many as the pool has room for, rotating who goes. */
  throwCoins(payers: readonly Payer[]): void {
    if (payers.length === 0) return;
    const free = this._pool.filter((c) => !c.busy);
    const count = Math.min(free.length, payers.length);
    for (let i = 0; i < count; i++) {
      const payer = payers[(this._cursor + i) % payers.length];
      const coin = free[i];
      if (payer && coin) this._launch(coin, payer, (SPRAY_MS * i) / Math.max(1, count));
    }
    this._cursor = (this._cursor + count) % payers.length;
  }

  private _launch(coin: PooledCoin, payer: Payer, delayMs: number): void {
    const scene = this._scene;
    const scale = SCALE_BY_PAY[payer.pay] ?? DEFAULT_SCALE;
    coin.busy = true;
    coin.gfx
      .setPosition(payer.x, payer.y)
      .setScale(scale * 0.4)
      .setVisible(true)
      .setAlpha(0);
    scene.tweens.add({
      targets: coin.gfx,
      y: payer.y - POP_RISE_PX,
      scale,
      alpha: 1,
      delay: delayMs,
      duration: POP_MS,
      ease: EASE.standardOut,
      onComplete: () => {
        scene.tweens.add({
          targets: coin.gfx,
          x: SCORE_COIN_X,
          y: SCORE_COIN_Y,
          scale: scale * 0.7,
          duration: FLIGHT_MS,
          ease: EASE.standardIn,
          onComplete: () => {
            coin.gfx.setVisible(false);
            coin.busy = false;
          },
        });
      },
    });
  }
}
