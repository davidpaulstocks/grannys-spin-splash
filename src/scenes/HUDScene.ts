/**
 * Overlay on top of GameScene — the score bar (coins, star targets, groove),
 * timer dial, water bar and on-wall Frenzy rings (CLAUDE.md §7.2). No game
 * logic of its own: GameScene calls `refresh()` once per frame with fresh
 * state (CLAUDE.md §7.1 one-way data flow — HUDScene is a leaf, it never
 * reads GameScene back).
 *
 * The coin total is visible throughout the run (2026-09-12 re-plan, direct
 * user feedback: "I want to see that currency get earned and be excited about
 * how much gold I'm earning"), and since 2026-11-26 it is the largest thing on
 * the screen (docs/REWARD_LOOP.md).
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
import { ScoreBar } from '../ui/ScoreBar';
import { TimerDial } from '../ui/TimerDial';
import { UrgencyOverlay } from '../ui/UrgencyOverlay';
import { WaterBar } from '../ui/WaterBar';

/**
 * Top-right, left of the touch pause button's corner (96 px wide, 16 px
 * margin). The score bar owns the centre of the top strip.
 */
const TIMER_X = GAME_WIDTH - 16 - 96 - 16 - 48;
const TIMER_Y = 46;

export class HUDScene extends Phaser.Scene {
  private _timerDial!: TimerDial;
  private _waterBar!: WaterBar;
  private _scoreBar!: ScoreBar;
  private _frenzyMeterUI!: FrenzyMeterUI;
  private _urgencyOverlay!: UrgencyOverlay;
  private _lastRefreshAt = 0;

  constructor() {
    super('HUDScene');
  }

  create(): void {
    this._timerDial = new TimerDial(this, TIMER_X, TIMER_Y);
    this._scoreBar = new ScoreBar(this);
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
    this._scoreBar.update(data, deltaMs);
    this._waterBar.update(data.waterPct, data.isPumping);
    this._frenzyMeterUI.update(data.spinners);
    this._urgencyOverlay.update(data.secondsRemaining);
  }
}
