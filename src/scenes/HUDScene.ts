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
 * which hid score until ResultsScene revealed it at the end.
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
import { SpinnerState } from '../entities/spinner/spinner.types';
import { BandMeter } from '../ui/BandMeter';
import { WaterBar } from '../ui/WaterBar';

/**
 * The top row, left to right: coins, the band meter (centre — it is the
 * goal, so it gets the middle), the clock, and on touch devices the pause
 * button in the corner. The meter's stars rise above its track, so the row
 * sits a little lower than the old top-8% band did.
 */
const TOP_ROW_Y = 46;
const SCORE_X = 150;
const BAND_METER_Y = 58;
/** Just right of the meter, clear of the touch pause button in the corner. */
const TIMER_X = GAME_WIDTH / 2 + 320;

export class HUDScene extends Phaser.Scene {
  private _timerDial!: TimerDial;
  private _waterBar!: WaterBar;
  private _bandMeter!: BandMeter;
  private _frenzyMeterUI!: FrenzyMeterUI;
  private _urgencyOverlay!: UrgencyOverlay;
  private _scoreCounter!: ScoreCounter;
  private _lastRefreshAt = 0;

  constructor() {
    super('HUDScene');
  }

  create(): void {
    this._timerDial = new TimerDial(this, TIMER_X, TOP_ROW_Y);
    this._scoreCounter = new ScoreCounter(this, SCORE_X, TOP_ROW_Y);
    // Below the top pill band and above the wall — see BandMeter's own
    // doc comment for why the game's objective needed stating outright.
    this._bandMeter = new BandMeter(this, GAME_WIDTH / 2, BAND_METER_Y);
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
    this._bandMeter.update(
      data.spinners.filter((s) => s.currentState === SpinnerState.FULL).length,
      data.spinners.length,
      data.stars,
    );
    this._frenzyMeterUI.update(data.spinners);
    this._urgencyOverlay.update(data.secondsRemaining);
  }
}
