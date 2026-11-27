/**
 * Dev-only balance harness: plays gigs with a scripted player, far faster
 * than real time, and reports stars, coins, the groove and drop-outs. It exists because difficulty
 * here is an emergent property of gun power, wind-down, hold time, band
 * size, visitors and how a person actually sweeps a wall — and guessing at
 * it is how the game ended up with every wall solvable in five seconds.
 *
 * Loaded only in development builds (see main.ts). From the browser console:
 *
 *   await __bot.ladder('garden')                    // all eight gigs, child and keen
 *   await __bot.ready(); __bot.play('garden', 7, __bot.KEEN, 'pistol')   // one gig, one bot
 *   await __bot.batch([{ venue: 'garden', gig: 0, gun: 'pistol', profile: 'child' }], 8, 1)
 *
 * The result of a run is the banked one: the Big Finish bonus is worked out
 * with the same pure rules the finish itself uses (bigFinishRules.planBows)
 * and added to the total, so stars include the bows. The bot does not play
 * the finish out, so it never writes the save.
 *
 * The harness stops Phaser's own frame loop and steps it by hand, so a
 * browser tab that throttles animation frames cannot corrupt a reading. Reload
 * the page to return to normal play.
 */

import type Phaser from 'phaser';

import { audioBus } from '../audio/AudioBus';
import { CHILD, EXPERT, KEEN, PROFILES, type BotProfile } from './botProfiles';
import { dropFinishListeners, finishBonus, yieldToBrowser } from './botHelpers';
import { casesFor } from './botCases';
import { seededRandom } from './botRandom';
import { summarise } from './botStats';
import type { BatchCase, BatchRow, BotSim, RunResult, SceneView, SpinnerView } from './botTypes';
import { aimFor, pickVisitor, type LiveVisitor } from './botVisitors';

const FRAME_MS = 1000 / 60;
const MAX_FRAMES = 4000;
/** A topped-up spinner is "done" for the bot from here, just short of the maximum. */
const TOPPED_UP_SPEED = 97;
/** Any of these being active means loading is over. */
const PLAYABLE_SCENES = [
  'HomeScene',
  'GameScene',
  'ResultsScene',
  'TourScene',
  'ShopScene',
] as const;
const READY_POLL_MS = 16;
const READY_MAX_POLLS = 1500;
/** Where a missed shot lands relative to its target. */
const MISS_OFFSET = { x: 150, y: 60 } as const;
const DEFAULT_BATCH_RUNS = 6;
/** A batch hands the tab back to the browser this often, so a long one does not freeze it. */
const YIELD_EVERY_MS = 2000;

export type { BotProfile };
export type { BatchCase, BatchRow, BotSim, RunResult } from './botTypes';

export function installBotSim(game: Phaser.Game): BotSim {
  let clock = 0;
  let stopped = false;
  let headless = true;

  const step = (frames: number): void => {
    if (!stopped) {
      game.loop.sleep();
      clock = game.loop.time + 100;
      stopped = true;
    }
    for (let i = 0; i < frames; i++) {
      clock += FRAME_MS;
      // Nothing in a bot run needs drawing, and drawing is most of the cost.
      if (headless) game.headlessStep(clock, FRAME_MS);
      else game.loop.step(clock);
    }
  };

  const isLoaded = (): boolean => PLAYABLE_SCENES.some((key) => game.scene.isActive(key));

  /**
   * Resolves once the game has finished loading. Drives the frame loop itself
   * while it waits: Phaser's loader only pulls its next batch of files on a
   * frame, so in a tab that throttles animation frames (any background tab,
   * and the Claude browser pane) loading otherwise stalls part-way.
   */
  const ready = async (): Promise<void> => {
    for (let i = 0; i < READY_MAX_POLLS && !isLoaded(); i++) {
      if (!stopped) game.loop.step(performance.now());
      await new Promise((resolve) => setTimeout(resolve, READY_POLL_MS));
    }
    if (!isLoaded()) throw new Error('game did not finish loading');
  };

  const playRun = (
    worldId: string,
    gig: number,
    bot: BotProfile,
    gunId = 'pistol',
    gunLevel = 1,
  ): RunResult | string => {
    // Starting before the first screen is up would stop BootScene mid-load: await `ready()` first.
    if (!isLoaded()) return 'still loading - await __bot.ready() first';
    audioBus.init();
    audioBus.mute();
    step(10);
    for (const active of game.scene.getScenes(true)) game.scene.stop(active.scene.key);
    step(10);
    game.scene.start('GameScene', { worldId, gig, grannyId: 'classic', gunId, gunLevel });
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
    const noticed = new WeakMap<object, boolean>();
    /** Who it is aiming at: a visitor, or a spinner. */
    let visitor: LiveVisitor | null = null;
    let target: SpinnerView | null = null;
    let since = 0;
    let freeAt = 0;
    /** A missed shot at a visitor is tried again after this long. */
    let retryAt = Infinity;
    let pending: { at: number; x: number; y: number; missed: boolean } | null = null;
    let grooveSum = 0;
    let groovePeak = 0;
    let grooveFrames = 0;

    /** Walks the pointer to a point (touch aim: 1:1, no reach assist). */
    const aimAt = (x: number, y: number): void => {
      scene._input._pointerX = x;
      scene._input._pointerY = y;
      scene._input._hasAimed = true;
      scene._input._lastWasTouch = true;
    };

    for (let frame = 0; frame < MAX_FRAMES && !scene._roundOver; frame++) {
      const elapsed = roundMs - scene._timeRemainingMs;
      const wanted = pickVisitor(scene._visitors, noticed, bot, Math.random);
      const wantedAim = wanted ? aimFor(wanted) : null;
      const onVisitor = visitor ? aimFor(visitor) : null;
      let decide = false;
      if (elapsed >= freeAt) {
        if (visitor) {
          decide =
            !onVisitor ||
            elapsed >= retryAt ||
            (wantedAim !== null && wantedAim.priority < onVisitor.priority);
        } else if (wanted) {
          decide = true;
        } else {
          decide =
            !target || target.currentSpeed >= TOPPED_UP_SPEED || elapsed - since > bot.maxDwell;
        }
      }
      if (decide) {
        since = elapsed + bot.reactMs;
        freeAt = since;
        retryAt = Infinity;
        const missed = Math.random() > bot.skill;
        if (wanted) {
          visitor = wanted;
          target = null;
          const aim = wantedAim;
          pending = { at: since, x: aim?.x ?? 0, y: aim?.y ?? 0, missed };
          if (missed) retryAt = since + bot.reactMs;
        } else {
          visitor = null;
          let lowest: SpinnerView | null = null;
          for (const spinner of scene._spinners) {
            if (spinner === target || spinner.silenced) continue;
            if (!lowest || spinner.currentSpeed < lowest.currentSpeed) lowest = spinner;
          }
          target = lowest ?? scene._spinners[0] ?? null;
          if (target) pending = { at: since, x: target.x, y: target.y, missed };
        }
      }
      if (pending && elapsed >= pending.at) {
        const live = visitor ? aimFor(visitor) : null;
        const x = live ? live.x : pending.x;
        const y = live ? live.y : pending.y;
        aimAt(x + (pending.missed ? MISS_OFFSET.x : 0), y + (pending.missed ? MISS_OFFSET.y : 0));
        pending = visitor && !pending.missed ? { ...pending, at: elapsed } : null;
      }
      step(1);
      const groove = scene._reward.groove.level;
      grooveSum += groove;
      grooveFrames++;
      groovePeak = Math.max(groovePeak, groove);
      for (let k = 0; k < starAt.length; k++) {
        if (starAt[k] === null && scene._reward.stars > k) starAt[k] = Math.round(elapsed / 1000);
      }
    }
    dropFinishListeners(scene);
    const preFinishCoins = scene._reward.coins;
    const preFinishStars = scene._reward.stars;
    scene._reward.addCoins(finishBonus(scene));
    return {
      coins: scene._reward.coins,
      stars: scene._reward.stars,
      preFinishCoins,
      preFinishStars,
      dropOuts: scene._reward.dropOuts,
      groovePeak,
      grooveAvg: grooveFrames > 0 ? grooveSum / grooveFrames : 0,
      peakFull: scene._peakFullSpinners,
      band: scene._spinners.length,
      starAtSeconds: starAt,
    };
  };

  const play = (
    worldId: string,
    gig: number,
    bot: BotProfile,
    gunId = 'pistol',
    gunLevel = 1,
  ): string => {
    const run = playRun(worldId, gig, bot, gunId, gunLevel);
    if (typeof run === 'string') return run;
    const times = run.starAtSeconds.map((t) => (t === null ? '-' : String(t))).join('/');
    return `${run.stars} stars at ${times}s, ${run.coins} coins (${run.preFinishCoins} before the finish), groove avg ${run.grooveAvg.toFixed(1)} peak ${run.groovePeak}, ${run.dropOuts} drop-outs, peak full ${run.peakFull}/${run.band}`;
  };

  const ladder = async (
    worldId: string,
    gunId = 'pistol',
    gigs: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 7],
  ): Promise<string[]> => {
    await ready();
    const lines: string[] = [];
    for (const gig of gigs) {
      lines.push(
        `${worldId} gig ${gig + 1} (${gunId}) | child: ${play(worldId, gig, CHILD, gunId)} | keen: ${play(worldId, gig, KEEN, gunId)}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return lines;
  };

  const batch = async (
    cases: readonly BatchCase[],
    runs = DEFAULT_BATCH_RUNS,
    seed?: number,
  ): Promise<BatchRow[]> => {
    await ready();
    const realRandom = Math.random;
    const rows: BatchRow[] = [];
    let lastYield = Date.now();
    try {
      for (const [caseIndex, c] of cases.entries()) {
        const bot = PROFILES[c.profile] ?? CHILD;
        const results: RunResult[] = [];
        for (let run = 0; run < runs; run++) {
          // Reseeded per run so a case gives the same numbers wherever it sits in a batch.
          if (seed !== undefined)
            Math.random = seededRandom(seed + caseIndex * 7919 + run * 104729);
          const result = playRun(c.venue, c.gig, bot, c.gun, c.gunLevel ?? 1);
          if (typeof result === 'string') throw new Error(result);
          results.push(result);
          Reflect.set(window, '__botProgress', `${caseIndex + 1}/${cases.length} run ${run + 1}`);
          // Yield only now and then, so a long batch does not freeze the tab.
          if (Date.now() - lastYield > YIELD_EVERY_MS) {
            lastYield = Date.now();
            await yieldToBrowser();
          }
        }
        rows.push(summarise(c, results));
      }
    } finally {
      Math.random = realRandom;
    }
    return rows;
  };

  const setHeadless = (on: boolean): void => {
    headless = on;
  };

  const sweep = async (
    venue: string,
    gigs: readonly number[],
    runs: number,
    seed?: number,
  ): Promise<(string | number | readonly number[])[][]> => {
    const rows = await batch(casesFor(venue, gigs), runs, seed);
    return rows.map((r, i) => [
      r.gig,
      r.gun,
      r.profile + (i % 4 === 3 ? '^' : ''),
      r.coinList,
      r.starList,
    ]);
  };

  return { CHILD, KEEN, EXPERT, ready, play, playRun, ladder, batch, sweep, setHeadless };
}
