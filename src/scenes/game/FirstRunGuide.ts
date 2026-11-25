/**
 * First-run onboarding (CLAUDE.md §6.5), which is deliberately not a
 * tutorial: a ghost finger that taps a spinner until the player fires, and
 * the scripted-moments captions. Both are gated on the player's very first
 * run and dismissed or advanced by what the player actually does.
 */

import type Phaser from 'phaser';

import { wallAreaFor } from '../../entities/world/wallBuilder';
import type { Spinner } from '../../entities/spinner/Spinner';
import type { WorldDef } from '../../entities/world/world.types';
import { saveManager } from '../../systems/SaveManager';
import { showGhostFinger } from '../../ui/GhostFinger';
import { TutorialSequence } from '../../ui/TutorialSequence';
import { distance } from '../../utils/math';

export class FirstRunGuide {
  /** First-run onboarding gesture (CLAUDE.md §6.5) — null unless this is the player's very first run. */
  private _dismissGhostFinger: (() => void) | null = null;
  /** The scripted-moments tutorial captions (direct user request, 2026-09-12) — null unless this is the player's very first run. */
  private _tutorial: TutorialSequence | null = null;

  constructor(
    private readonly _scene: Phaser.Scene,
    private readonly _world: WorldDef,
  ) {}

  /**
   * CLAUDE.md §6.5's tutorial, which is deliberately not a tutorial: on a
   * first-ever run a ghost finger taps a spinner on a loop until the player
   * fires. Aimed at the spinner nearest the middle of the wall so the
   * gesture points at the thing they're meant to hit, not at empty space.
   */
  maybeShowGhostFinger(spinners: readonly Spinner[]): void {
    if (saveManager.load().hasPlayed || spinners.length === 0) return;
    const area = wallAreaFor(this._world);
    const midX = area.x + area.width / 2;
    const midY = area.y + area.height / 2;
    const target = spinners.reduce((best, s) =>
      distance(s.x, s.y, midX, midY) < distance(best.x, best.y, midX, midY) ? s : best,
    );
    this._dismissGhostFinger = showGhostFinger(this._scene, target.x, target.y);
  }

  /**
   * The scripted-moments tutorial (direct user request, 2026-09-12) — see
   * TutorialSequence.ts. Same first-ever-run gate as the ghost finger, but
   * a separate check: instantiating it here (rather than folding it into
   * `maybeShowGhostFinger`) keeps "gesture demo" and "caption sequencing"
   * as two things this scene wires up, not one thing doing both.
   */
  maybeStartTutorial(): void {
    if (saveManager.load().hasPlayed) return;
    this._tutorial = new TutorialSequence();
    this._tutorial.playHowToPlay(this._scene);
  }

  /** The player's first real input — the ghost finger has done its job. */
  dismissGhostFinger(): void {
    this._dismissGhostFinger?.();
    this._dismissGhostFinger = null;
  }

  /** A spinner reached FULL — the tutorial may explain what that was for. */
  onSpinnerFull(): void {
    this._tutorial?.maybeShowPurpose(this._scene);
  }
}
