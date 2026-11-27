/**
 * The groove — the multiplier on every coin (docs/REWARD_LOOP.md). Level 1–5,
 * and a ring that fills toward the next level while the band is going: the
 * whole band at full speed earns a level every three seconds, half the band
 * every six. An instrument falling out of full speed costs a level, which
 * is the jeopardy: chasing new instruments while the old ones wind down
 * keeps the multiplier from ever building.
 *
 * Pure logic, no Phaser dependency (CLAUDE.md §7.3 rule 10). It emits
 * `'levelUp'` and `'levelDown'` after the level has changed; listeners read
 * `level` for the new value.
 */

import { EventEmitter } from '../utils/EventEmitter';

/** How long the whole band at full speed takes to earn one groove level. */
export const GROOVE_LEVEL_MS = 3000;
/** The lowest groove level — what every gig starts at and a drop-out never goes below. */
export const MIN_GROOVE_LEVEL = 1;
/** The highest groove level. */
export const MAX_GROOVE_LEVEL = 5;
/** Band size at and below which a drop-out costs a whole level. */
export const DROP_OUT_REFERENCE_BAND = 4;

export class Groove extends EventEmitter {
  private _level = MIN_GROOVE_LEVEL;
  private _ring = 0;

  /** Current multiplier, 1–5. */
  get level(): number {
    return this._level;
  }

  /** Progress toward the next level, 0–1 (held at 1 once the top level is reached). */
  get ring(): number {
    return this._ring;
  }

  /**
   * Advances the ring by `deltaMs` with `fullCount` of `band` instruments at
   * full speed, levelling up each time it fills. Call once per frame while
   * the gig is running.
   */
  update(deltaMs: number, fullCount: number, band: number): void {
    if (band <= 0 || deltaMs <= 0) return;
    const share = Math.min(1, Math.max(0, fullCount / band));
    this._ring += (share * deltaMs) / GROOVE_LEVEL_MS;
    while (this._ring >= 1 && this._level < MAX_GROOVE_LEVEL) {
      this._ring -= 1;
      this._level++;
      this.emit('levelUp');
    }
    if (this._level >= MAX_GROOVE_LEVEL) this._ring = 1;
  }

  /**
   * An instrument dropped out of full speed. In a band of up to
   * DROP_OUT_REFERENCE_BAND that costs a whole level; in a bigger band it
   * costs proportionally less (a quarter of a level in a sixteen-piece),
   * because a bigger band has that many more instruments to drop. Charging a
   * whole level each time left every big band stuck at ×1 however well it
   * was played. Never goes below level 1.
   */
  dropOut(band = DROP_OUT_REFERENCE_BAND): void {
    const cost = Math.min(1, DROP_OUT_REFERENCE_BAND / Math.max(1, band));
    const top = this._level >= MAX_GROOVE_LEVEL;
    const value = Math.max(MIN_GROOVE_LEVEL, this._level + (top ? 1 : this._ring) - cost);
    const level = Math.min(MAX_GROOVE_LEVEL, Math.floor(value));
    this._ring = level >= MAX_GROOVE_LEVEL ? 1 : value - level;
    if (level < this._level) {
      this._level = level;
      this.emit('levelDown');
    }
  }

  /**
   * Splash Frenzy: one level up at once. (It went straight to the top level
   * at first; with coins also doubled for the window, one jackpot then
   * decided the whole score and the groove built by play counted for little.)
   */
  jackpot(): void {
    if (this._level >= MAX_GROOVE_LEVEL) return;
    this._level += 1;
    this._ring = 0;
    this.emit('levelUp');
  }

  /** Back to level 1 with an empty ring — the start of a gig. */
  reset(): void {
    this._level = MIN_GROOVE_LEVEL;
    this._ring = 0;
  }
}
