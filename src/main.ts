/** Phaser game entry point. See CLAUDE.md §7.2 (target <80 lines). */

import Phaser from 'phaser';

import { audioBus } from './audio/AudioBus';
import { audioOrchestra } from './audio/AudioOrchestra';
import { Conductor } from './audio/orchestra/Conductor';
import { OrchestraGraph } from './audio/orchestra/OrchestraGraph';
import { sampleBank } from './audio/orchestra/SampleBank';
import { resolveScore } from './audio/scores';
import { BACKGROUND_COLOUR, fitCameraToLogicalSize, SCALE_CONFIG } from './config';
import type { BotSim } from './dev/botSim';
import type { RevealDebug } from './dev/revealDebug';
import * as poki from './poki';
import { BootScene } from './scenes/BootScene';
import { ResultsScene } from './scenes/ResultsScene';
import { GameScene } from './scenes/GameScene';
import { HomeScene } from './scenes/HomeScene';
import { HUDScene } from './scenes/HUDScene';
import { JamScene } from './scenes/JamScene';
import { PauseScene } from './scenes/PauseScene';
import { ShopScene } from './scenes/ShopScene';
import { TourScene } from './scenes/TourScene';

declare global {
  interface Window {
    /** Dev-only escape hatch for manual frame-stepping in headless/hidden-tab testing. Stripped from prod builds. */
    __gameForDebug?: Phaser.Game;
    /** Dev-only: the live audio singletons and classes. Stripped from prod builds. */
    __audioForDebug?: Record<string, unknown>;
    /** Dev-only: the balance harness (src/dev/botSim.ts). */
    __bot?: BotSim;
    /** Dev-only: opens the gun reveal for any gun without buying it (src/dev/revealDebug.ts). */
    __revealGun?: RevealDebug;
  }
}

/**
 * Waits for Fredoka to actually be usable before Phaser draws any text.
 * Canvas text (unlike DOM text) is rasterised once at creation and never
 * re-renders if the font finishes loading late, so this has to be awaited
 * up front, not left to `font-display` alone.
 */
async function loadFredoka(): Promise<void> {
  try {
    await document.fonts.load('700 32px Fredoka');
    await document.fonts.ready;
  } catch {
    // Font failed to load — Phaser text falls back to a system sans-serif. Not fatal.
  }
}

async function boot(): Promise<void> {
  // Neither the SDK handshake nor the font may keep the canvas off the page:
  // CLAUDE.md §3 rule 9's "core gameplay never gated" means an ad blocker (or
  // a font that fails to decode) degrades the experience, never blanks it.
  // poki.init() already swallows its own failures; this is belt-and-braces
  // for anything else in the pre-boot path.
  await Promise.allSettled([poki.init(), loadFredoka()]);

  // Poki's mobile branding pill defaults to a corner that overlaps our own
  // UI — a no-op on desktop, but CLAUDE.md §12 must-fix 8 requires this
  // call regardless of platform.
  poki.movePill(0, 24);

  // BootScene boots first — preloads every launch sprite once so neither
  // SplashScene nor GameScene ever shows a blank/partial frame waiting on
  // art (splash → game → game over → splash after that, Sprint 5 exit
  // criteria). HUDScene is registered but not started here — GameScene
  // launches it itself once it's running.
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    backgroundColor: BACKGROUND_COLOUR,
    scale: SCALE_CONFIG,
    // 4 concurrent touch pointers. Phaser's default of 1 can't see a second
    // simultaneous finger at all, which the two-finger pause gesture
    // (CLAUDE.md §6.3, InputManager.ts) needs; 2 was still too few in
    // practice (spec audit, 2026-09-12) — a thumb resting on the letterbox
    // bar beside the canvas ate a slot, so "hold move button + tap to fire"
    // silently dropped the fire tap. Spare Pointer objects are cheap.
    input: { activePointers: 4 },
    scene: [
      BootScene,
      HomeScene,
      TourScene,
      ShopScene,
      GameScene,
      JamScene,
      HUDScene,
      ResultsScene,
      PauseScene,
    ],
  });

  // Every scene's camera shows the 1280x720 logical area at the render
  // scale (see RENDER_SCALE). Hooked here, once, rather than in each scene's
  // create(): a scene added later cannot forget it. The camera is rebuilt on
  // every scene start, so the hook is on START; Phaser's own camera manager
  // registered for that event first, so the camera exists by the time this runs.
  game.events.once(Phaser.Core.Events.READY, () => {
    for (const scene of game.scene.scenes) {
      scene.events.on(Phaser.Scenes.Events.START, () => fitCameraToLogicalSize(scene));
      if (scene.cameras?.main) fitCameraToLogicalSize(scene);
    }
  });

  if (import.meta.env.DEV) {
    window.__gameForDebug = game;
    // Dev-only handles for measuring the orchestra (offline renders, level
    // checks) from the console. A bare dynamic import would hand back a second
    // module instance with its own empty state, so the live ones are exposed.
    window.__audioForDebug = {
      audioBus,
      audioOrchestra,
      sampleBank,
      Conductor,
      OrchestraGraph,
      resolveScore,
    };
    // Dev-only: `localStorage.__devMute = '1'` keeps the dev build silent across
    // reloads (testing while on a call); remove the key to hear it again. Never
    // in a production bundle, so SaveManager's rule on localStorage is untouched.
    try {
      if (window.localStorage.getItem('__devMute') === '1') {
        const init = audioBus.init.bind(audioBus);
        audioBus.init = () => {
          init();
          audioBus.mute();
        };
        audioBus.mute();
        audioBus.unmute = () => undefined;
      }
    } catch {
      // Storage blocked: nothing to do.
    }
    // The balance harness: see src/dev/botSim.ts. Dynamically imported so it
    // is never in a production bundle.
    void import('./dev/botSim').then(({ installBotSim }) => {
      window.__bot = installBotSim(game);
    });
    void import('./dev/revealDebug').then(({ installRevealDebug }) => {
      window.__revealGun = installRevealDebug(game);
    });
  }
}

// A throw anywhere in boot() must still surface rather than vanish into an
// unhandled rejection — but it must never be the reason nothing renders.
void boot().catch((err: unknown) => console.error('[boot] failed', err));
