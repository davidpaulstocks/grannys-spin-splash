/** Small plumbing for the dev balance bot (botSim.ts). */

import { planBows } from '../scenes/game/bigFinishRules';
import type { SceneView } from './botTypes';

/**
 * The Big Finish hooks the scene's update and input events and lets go only
 * when it completes. The bot never plays it out (that would bank the gig into
 * the save), so its hooks are removed here by name; left in, each run would
 * leave one more redrawing the HUD every frame and the batch would slow down.
 */
export function dropFinishListeners(scene: SceneView): void {
  const emitters = [scene.events, scene.input, scene.input.keyboard];
  for (const emitter of emitters) {
    for (const name of emitter?.eventNames() ?? []) {
      for (const fn of emitter?.listeners(name) ?? []) {
        if (fn.name === '_onUpdate' || fn.name === '_onSkip') emitter?.off(name, fn);
      }
    }
  }
}

/** Hands the thread back for a moment through a message channel, which a hidden tab does not slow down the way it does a timer. */
export function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = (): void => {
      channel.port1.close();
      resolve();
    };
    channel.port2.postMessage(0);
  });
}

/** What the Big Finish would add at the whistle: every bow's bonus, worked out by the same pure rules (bigFinishRules.ts). */
export function finishBonus(scene: SceneView): number {
  const plan = planBows(
    scene._spinners.map((s) => ({ x: s.x, state: s.playingState })),
    scene._reward.groove.level,
    scene._gun.coinBoost,
  );
  return plan.bows.reduce((sum, bow) => sum + bow.bonus, 0);
}
