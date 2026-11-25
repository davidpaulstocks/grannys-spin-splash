/**
 * Dev-only balance harness: plays gigs with a scripted player, far faster
 * than real time, and reports stars and coins. It exists because difficulty
 * here is an emergent property of gun power, wind-down, hold time, band
 * size, obstacles and how a person actually sweeps a wall — and guessing at
 * it is how the game ended up with every wall solvable in five seconds.
 *
 * Loaded only in development builds (see main.ts). From the browser console:
 *
 *   await __bot.ladder('garden')                    // all eight gigs, both bots
 *   await __bot.ladder('workshop', 'hose', [0, 3, 7])
 *   __bot.play('garden', 7, __bot.KEEN, 'pistol')   // one gig, one bot
 *
 * The harness stops Phaser's own frame loop and steps it by hand, so a
 * browser tab that throttles animation frames cannot corrupt a reading. Reload
 * the page to return to normal play.
 */

import type Phaser from 'phaser';

import { audioBus } from '../audio/AudioBus';

const FRAME_MS = 1000 / 60;
const MAX_FRAMES = 4000;
/** A topped-up spinner is "done" for the bot from here, just short of the maximum. */
const TOPPED_UP_SPEED = 97;
/** Where a missed shot lands relative to its target. */
const MISS_OFFSET = { x: 150, y: 60 } as const;

export interface BotProfile {
  /** Time lost between deciding to move and the water arriving on the next spinner. */
  readonly reactMs: number;
  /** Chance a move lands on its spinner at all. */
  readonly skill: number;
  /** Longest it will stay on one spinner before giving up and moving on. */
  readonly maxDwell: number;
}

/** A seven-year-old: slow to move, sometimes misses, sticks at a spinner. */
const CHILD: BotProfile = { reactMs: 450, skill: 0.85, maxDwell: 1800 };
/** A sharp, practised player. */
const KEEN: BotProfile = { reactMs: 180, skill: 0.97, maxDwell: 1400 };

/** The slice of GameScene the bot drives. All private in the real class; this is a test double's view of it. */
interface SceneView {
  readonly scene: Phaser.Scenes.ScenePlugin;
  _roundOver: boolean;
  _started: boolean;
  _timeRemainingMs: number;
  _stars: number;
  _score: number;
  _peakFullSpinners: number;
  readonly _gig: { readonly seconds: number };
  readonly _spinners: readonly { readonly x: number; readonly y: number; currentSpeed: number }[];
  readonly _input: { _pointerX: number; _pointerY: number };
  _onFirstInput(): void;
}

export interface BotSim {
  readonly CHILD: BotProfile;
  readonly KEEN: BotProfile;
  play(worldId: string, gig: number, bot: BotProfile, gunId?: string): string;
  ladder(worldId: string, gunId?: string, gigs?: readonly number[]): Promise<string[]>;
}

export function installBotSim(game: Phaser.Game): BotSim {
  let clock = 0;
  let stopped = false;

  const step = (frames: number): void => {
    if (!stopped) {
      game.loop.sleep();
      clock = game.loop.time + 100;
      stopped = true;
    }
    for (let i = 0; i < frames; i++) {
      clock += FRAME_MS;
      game.loop.step(clock);
    }
  };

  const play = (worldId: string, gig: number, bot: BotProfile, gunId = 'pistol'): string => {
    audioBus.init();
    audioBus.mute();
    step(10);
    for (const active of game.scene.getScenes(true)) game.scene.stop(active.scene.key);
    step(10);
    game.scene.start('GameScene', { worldId, gig, grannyId: 'classic', gunId });
    const scene = game.scene.getScene('GameScene') as unknown as SceneView;
    let waits = 0;
    do {
      step(5);
      waits++;
    } while ((!scene.scene.isActive() || scene._roundOver || scene._started) && waits < 40);
    if (waits >= 40) return 'scene did not start';

    scene._onFirstInput();
    const roundMs = scene._gig.seconds * 1000;
    const starAt: (number | null)[] = [null, null, null];
    let target: SceneView['_spinners'][number] | null = null;
    let since = 0;
    let freeAt = 0;
    let pending: { at: number; x: number; y: number } | null = null;

    for (let frame = 0; frame < MAX_FRAMES && !scene._roundOver; frame++) {
      const elapsed = roundMs - scene._timeRemainingMs;
      const finished =
        !target || target.currentSpeed >= TOPPED_UP_SPEED || elapsed - since > bot.maxDwell;
      if (finished && elapsed >= freeAt) {
        let lowest: SceneView['_spinners'][number] | null = null;
        for (const spinner of scene._spinners) {
          if (spinner !== target && (!lowest || spinner.currentSpeed < lowest.currentSpeed)) {
            lowest = spinner;
          }
        }
        target = lowest ?? scene._spinners[0] ?? null;
        since = elapsed + bot.reactMs;
        freeAt = since;
        if (target) {
          const missed = Math.random() > bot.skill;
          pending = {
            at: since,
            x: target.x + (missed ? MISS_OFFSET.x : 0),
            y: target.y + (missed ? MISS_OFFSET.y : 0),
          };
        }
      }
      if (pending && elapsed >= pending.at) {
        scene._input._pointerX = pending.x;
        scene._input._pointerY = pending.y;
        pending = null;
      }
      step(1);
      for (let k = 0; k < starAt.length; k++) {
        if (starAt[k] === null && scene._stars > k) starAt[k] = Math.round(elapsed / 1000);
      }
    }
    const times = starAt.map((t) => (t === null ? '-' : String(t))).join('/');
    return `${scene._stars} stars at ${times}s, peak ${scene._peakFullSpinners}/${scene._spinners.length}, ${scene._score} coins`;
  };

  const ladder = async (
    worldId: string,
    gunId = 'pistol',
    gigs: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7],
  ): Promise<string[]> => {
    const lines: string[] = [];
    for (const gig of gigs) {
      lines.push(
        `${worldId} gig ${gig + 1} (${gunId}) | child: ${play(worldId, gig, CHILD, gunId)} | keen: ${play(worldId, gig, KEEN, gunId)}`,
      );
      // Yield between gigs so a long ladder never blocks the tab.
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return lines;
  };

  return { CHILD, KEEN, play, ladder };
}
