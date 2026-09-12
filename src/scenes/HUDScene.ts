/**
 * Overlay on top of GameScene — timer dial, live star tally, water bar,
 * on-wall Frenzy meter (CLAUDE.md §7.2). No game logic of its own:
 * GameScene calls `refresh()` once per frame with fresh state (CLAUDE.md
 * §7.1 one-way data flow — HUDScene is a leaf, it never reads GameScene
 * back).
 *
 * The star tally is visible throughout the run (2026-09-12 re-plan, direct
 * user feedback: "I'm not seeing a point and gold tally add up as I'm
 * playing, I want to see that currency get earned and be excited about how
 * much gold I'm earning") — this supersedes story 2.5's original design,
 * which hid score until GameOverScene revealed it at the end.
 */

import Phaser from 'phaser';

import {
  GAME_HEIGHT,
  GAME_WIDTH,
  WATER_BAR_HEIGHT,
  WATER_BAR_MARGIN_X,
  WATER_BAR_Y,
} from '../config';
import type { HudRefreshData } from '../types/hud';
import { FrenzyMeterUI } from '../ui/FrenzyMeterUI';
import { ScoreCounter } from '../ui/ScoreCounter';
import { TimerDial } from '../ui/TimerDial';
import { UrgencyOverlay } from '../ui/UrgencyOverlay';
import { WaterBar } from '../ui/WaterBar';

/** Top 8% of the canvas (CLAUDE.md §5.8) — where the timer dial sits. */
const TIMER_Y = GAME_HEIGHT * 0.04;
/** Same top band as the timer, offset to its left so the two pills read as one HUD row, not a collision. */
const SCORE_X = 150;

export class HUDScene extends Phaser.Scene {
  private _timerDial!: TimerDial;
  private _waterBar!: WaterBar;
  private _frenzyMeterUI!: FrenzyMeterUI;
  private _urgencyOverlay!: UrgencyOverlay;
  private _scoreCounter!: ScoreCounter;
  private _lastRefreshAt = 0;

  constructor() {
    super('HUDScene');
  }

  create(): void {
    this._timerDial = new TimerDial(this, GAME_WIDTH / 2, TIMER_Y);
    this._scoreCounter = new ScoreCounter(this, SCORE_X, TIMER_Y);
    this._waterBar = new WaterBar(
      this,
      WATER_BAR_MARGIN_X,
      WATER_BAR_Y,
      GAME_WIDTH - WATER_BAR_MARGIN_X * 2,
      WATER_BAR_HEIGHT,
    );
    this._frenzyMeterUI = new FrenzyMeterUI(this);
    this._urgencyOverlay = new UrgencyOverlay(this, GAME_WIDTH, GAME_HEIGHT);
    this._lastRefreshAt = this.time.now;
  }

  /** GameScene's single per-frame call into this scene. */
  refresh(data: HudRefreshData): void {
    const now = this.time.now;
    const deltaMs = now - this._lastRefreshAt;
    this._lastRefreshAt = now;

    this._timerDial.update(data.secondsRemaining);
    this._scoreCounter.update(data.score, deltaMs);
    this._waterBar.update(data.waterPct, data.isPumping);
    this._frenzyMeterUI.update(data.spinners);
    this._urgencyOverlay.update(data.secondsRemaining);
  }
}
