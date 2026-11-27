/**
 * The centre of the wall's one stage for big messages (2026-11-27). Owner,
 * watching gigs end: "overlapping text, Splash Frenzy and all the other
 * words". Every big message (the count-in, SPLASH FRENZY, the final
 * count-down, a star earned, a cheer, the Big Finish and its verdict) asks
 * the scene's stage to show it; only one is up at a time, a higher priority
 * replaces a lower one instantly (the old one is destroyed, not left fading
 * underneath), and at the final whistle everything from the gig is cleared.
 * While a message is up its box is published (`ui/stageBounds.ts`) so small
 * local texts keep out of its way. Rules: `stageRules.ts`.
 */

import type Phaser from 'phaser';

import { WALL_AREA, GAME_WIDTH } from '../../config';
import { fadeFloatingTextIn } from '../../ui/FloatingText';
import { setStageBounds, type Box } from '../../ui/stageBounds';
import { STAGE_PRIORITY, takesStage, type StagePriority, type StageTie } from './stageRules';

/** Where big messages sit: the centre of the wall. */
export const STAGE_X = GAME_WIDTH / 2;
export const STAGE_Y = WALL_AREA.y + WALL_AREA.height / 2;
const SCENE_SHUTDOWN = 'shutdown';

/** What a presented message gives back: how to remove it at once, and where it sits. */
export interface StageVisual {
  /** Removes it instantly: stops its tweens and destroys it. Safe to call twice. */
  readonly dismiss: () => void;
  /** The box it fills at full size. */
  readonly bounds: Box;
}

/** Builds a message; call `done` when it has finished by itself. Return null to show nothing. */
export type Presenter = (done: () => void) => StageVisual | null;

export class BigMessageStage {
  private _current: { readonly priority: StagePriority; readonly visual: StageVisual } | null =
    null;
  private _floor: StagePriority = STAGE_PRIORITY.other;
  /** Identifies the message on stage, so a late `done` from a replaced one is ignored. */
  private _token: object | null = null;

  /**
   * Shows a message if its priority wins the stage (see `takesStage`); returns
   * whether it did. The message it replaced is removed at once.
   */
  show(priority: StagePriority, tie: StageTie, present: Presenter): boolean {
    if (!takesStage(this._current?.priority ?? null, priority, tie, this._floor)) return false;
    this._clear();
    const token = {};
    this._token = token;
    const visual = present(() => {
      if (this._token === token) this._release();
    });
    if (!visual) {
      this._token = null;
      return false;
    }
    this._current = { priority, visual };
    setStageBounds(visual.bounds);
    fadeFloatingTextIn(visual.bounds);
    return true;
  }

  /** The priority on stage right now, or null when empty. */
  get priority(): StagePriority | null {
    return this._current?.priority ?? null;
  }

  /**
   * The final whistle: everything from the gig goes at once (no fades left
   * hanging) and only the finish and the verdict may speak from here on.
   */
  closeForFinish(): void {
    this._clear();
    this._floor = STAGE_PRIORITY.finish;
  }

  /** Back to an open, empty stage (a restarted scene keeps its object). */
  reset(): void {
    this._clear();
    this._floor = STAGE_PRIORITY.other;
  }

  private _clear(): void {
    this._token = null;
    const current = this._current;
    this._release();
    current?.visual.dismiss();
  }

  private _release(): void {
    this._current = null;
    setStageBounds(null);
  }
}

const _stages = new WeakMap<Phaser.Scene, BigMessageStage>();

/** The scene's stage, made on first use and forgotten when the scene shuts down. */
export function stageFor(scene: Phaser.Scene): BigMessageStage {
  let stage = _stages.get(scene);
  if (!stage) {
    stage = new BigMessageStage();
    _stages.set(scene, stage);
    scene.events.once(SCENE_SHUTDOWN, () => {
      _stages.delete(scene);
      setStageBounds(null);
    });
  }
  return stage;
}

/**
 * Wraps display objects as a stage visual: `dismiss` stops their tweens and
 * destroys them. `bounds` is the box they fill at full size.
 */
export function visualOf(
  scene: Phaser.Scene,
  objects: readonly Phaser.GameObjects.GameObject[],
  bounds: Box,
): StageVisual {
  return {
    bounds,
    dismiss: () => {
      for (const o of objects) {
        scene.tweens.killTweensOf(o);
        if (o.active) o.destroy();
      }
    },
  };
}

/** The box a text of its current size fills when centred on (x, y) at `scale`. */
export function textBox(label: Phaser.GameObjects.Text, x: number, y: number, scale = 1): Box {
  const halfW = (label.width * scale) / 2;
  const halfH = (label.height * scale) / 2;
  return { left: x - halfW, right: x + halfW, top: y - halfH, bottom: y + halfH };
}
