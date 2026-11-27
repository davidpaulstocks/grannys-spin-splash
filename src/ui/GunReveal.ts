/**
 * The gun reveal: a full-screen product film any scene can open after a gun is
 * bought, or open as a preview of a gun not owned yet.
 *
 * 1. From black, an extreme close-up: the gun fades up so large only part fits,
 *    and the camera glides from the handle to the nozzle while a band of light
 *    sweeps the paintwork (`reveal/filmMaths.ts` is the camera, `FilmRig.ts`
 *    the picture, `Sheen.ts` the light). The rarest guns pan more slowly.
 * 2. At the nozzle it FIRES: its real projectile, drawn large, streams off the
 *    screen with a flash, a shake and a recoil (`CloseUpFire.ts`).
 * 3. A fast pull-back to the whole gun over slow rays in its rarity colour; the
 *    name slams in beneath it with an underline and the rarity tag, and a
 *    shockwave rings out (`HeroShot.ts`, `ImpactBeat.ts`).
 * 4. It shrinks to its place; the target discs pop in and it blasts them
 *    (`reveal/DemoRange.ts`); then the numbers: POWER counts up and the Coins /
 *    Power / Water rows (a gun just bought, with USE IT and Later), or the price
 *    and how far the player is from it (a preview, with OK, or BUY when it is
 *    affordable and then straight on into the owned gun's numbers).
 *
 * A tap once the pull-back has started skips to step 4's numbers. Nothing here
 * buys or equips anything: the caller's callbacks do. The big hero picture is
 * loaded when the reveal opens (`reveal/HeroArt.ts`) and everything the film
 * makes is destroyed when it closes.
 */

import Phaser from 'phaser';

import { playStarChime } from '../audio/ResultsMusic';
import { playUpgrade } from '../audio/SFX';
import { SPRITE_KEYS } from '../assets/keys';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { GUN_LADDER_DEFS } from '../entities/gun/gun.data';
import type { AnchorJSON, GunDef } from '../entities/gun/gun.types';
import { powerRatingAt } from '../entities/gun/gunLevels';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';
import { DemoRange } from './reveal/DemoRange';
import { FilmRig } from './reveal/FilmRig';
import { SHRINK_MS } from './reveal/filmMaths';
import { loadHeroArt } from './reveal/HeroArt';
import { HeroShot } from './reveal/HeroShot';
import { addRays, burstRays, fireFlash, heroRings } from './reveal/ImpactBeat';
import { buildTagRow, showPill } from './reveal/RevealPanels';
import { RevealEnding } from './reveal/RevealEnding';
import { RevealTracker, type RevealCtx } from './reveal/RevealTracker';
import { REVEAL_DEPTH, REVEAL_LAYOUT, revealTimeline } from './reveal/revealTiming';

export interface GunRevealConfig {
  /** The gun just bought. */
  readonly gunId: string;
  /** Its level (1 for a gun just bought). */
  readonly level?: number;
  /** The gun that was equipped before, and its level: what the rows compare against. */
  readonly previousGunId: string;
  readonly previousLevel?: number;
  /** USE IT: the caller equips the new gun. */
  readonly onUse: () => void;
  /** Later: the caller keeps the old gun equipped. */
  readonly onLater: () => void;
  /** Runs after either, once the overlay has closed. */
  readonly onClosed?: () => void;
}

/** A gun not owned yet, shown blasting with its price. */
export interface GunPreviewConfig {
  readonly gunId: string;
  /** Coins held, and the gun's price. */
  readonly have: number;
  readonly price: number;
  /** BUY (shown only when affordable): buys it and returns what the owned reveal needs, or null when it failed. */
  readonly onBuy?: () => GunRevealConfig | null;
}

export interface GunRevealHandle {
  close(): void;
}

const CENTRE_X = GAME_WIDTH / 2;
const BACKDROP_ALPHA = 1;
const STAMP_FROM = 2.4;
const STAMP_MS = 160;
const HEADLINE_NEW = 'NEW GUN!';
const HEADLINE_PREVIEW = 'COMING UP';
/** The soft rising tones under the pan: where in the pan each plays, and which chord. */
const RISE_TONES = [
  { at: 0.05, chord: 1 },
  { at: 0.55, chord: 2 },
] as const;
const FALLBACK_ANCHOR_X = 0.95;

/** Opens the reveal for a gun just bought over `scene` and returns a handle to close it early. */
export function showGunReveal(scene: Phaser.Scene, config: GunRevealConfig): GunRevealHandle {
  return openReveal(scene, config.gunId, config, null);
}

/** Opens the "see it blast" preview of a gun not owned yet. */
export function showGunPreview(scene: Phaser.Scene, preview: GunPreviewConfig): GunRevealHandle {
  return openReveal(scene, preview.gunId, null, preview);
}

interface Step {
  at: number;
  run: (instant: boolean) => void;
  done: boolean;
}

function openReveal(
  scene: Phaser.Scene,
  gunId: string,
  ownedConfig: GunRevealConfig | null,
  previewConfig: GunPreviewConfig | null,
): GunRevealHandle {
  const found = GUN_LADDER_DEFS.find((g) => g.id === gunId);
  if (!found) return { close: () => undefined };
  const gun: GunDef = found;
  const root = scene.add.container(0, 0).setDepth(REVEAL_DEPTH);
  const tracker = new RevealTracker(scene);
  const ctx: RevealCtx = { scene, root, tracker };
  const timeline = revealTimeline(gun.rarity);
  const film = timeline.film;
  const at = { x: REVEAL_LAYOUT.gun.x, y: REVEAL_LAYOUT.gun.y };
  const hero = { x: REVEAL_LAYOUT.hero.x, y: REVEAL_LAYOUT.hero.y };
  let owned = ownedConfig;
  let preview = previewConfig;
  let open = true;
  let started = false;
  let beat3Started = false;
  let startMs = 0;
  let range: DemoRange | null = null;
  let rig: FilmRig | null = null;
  const steps: Step[] = [];

  /** Steps are run from the frame update against the film's own clock, so they can never drift from the picture. */
  const schedule = (when: number, run: (instant: boolean) => void): void => {
    steps.push({ at: when, run, done: false });
  };
  const skip = (): void => {
    if (!open || !started || beat3Started || scene.time.now - startMs < film.pullAt) return;
    steps
      .filter((s) => !s.done)
      .sort((a, b) => a.at - b.at)
      .forEach((s) => {
        s.done = true;
        s.run(true);
      });
  };

  const backdrop = scene.add
    .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLOUR.ink, BACKDROP_ALPHA)
    .setInteractive();
  backdrop.on('pointerup', skip);
  root.add(backdrop);
  const rays = addRays(ctx, hero, gun.rarity);

  const headline = scene.add
    .text(
      CENTRE_X,
      REVEAL_LAYOUT.headlineY,
      preview ? HEADLINE_PREVIEW : HEADLINE_NEW,
      textStyle('displayM', COLOUR_HEX.sunnyGold, COLOUR_HEX.ink),
    )
    .setOrigin(0.5)
    .setAlpha(0);
  root.add(headline);

  const level = owned?.level ?? 1;
  const powerTo = powerRatingAt(gun, level);
  const heroShot = new HeroShot(ctx, gun);
  const tag = buildTagRow(ctx, gun, powerTo);

  const stamp = (): void => {
    headline.setAlpha(0).setScale(STAMP_FROM);
    tracker.tween({
      targets: headline,
      scale: 1,
      alpha: 1,
      duration: STAMP_MS,
      ease: EASE.standardIn,
    });
  };

  const art = loadHeroArt(scene, tracker, gun.id, (key) => startFilm(key));

  const close = (): void => {
    if (!open) return;
    open = false;
    scene.events.off(Phaser.Scenes.Events.UPDATE, onUpdate);
    art.cancel();
    range?.destroy();
    rig?.destroy();
    tracker.clear();
    scene.tweens.killTweensOf(root.list);
    root.destroy();
    art.release();
    owned?.onClosed?.();
  };

  const ending = new RevealEnding(ctx, gun, tag, timeline, at, {
    isOpen: () => open,
    close,
    becameOwned: (cfg) => {
      owned = cfg;
      preview = null;
      headline.setText(HEADLINE_NEW);
      stamp();
    },
  });

  const onUpdate = (): void => {
    if (!open || !started) return;
    const elapsed = scene.time.now - startMs;
    rig?.update(elapsed);
    for (const step of steps) {
      if (!open) return;
      if (!step.done && step.at <= elapsed) {
        step.done = true;
        step.run(false);
      }
    }
  };

  /** Starts the film once the picture to show is ready (the hero, or the small one after a short wait). */
  function startFilm(key: string): void {
    if (!open) return;
    const anchorJson = scene.cache.json.get(SPRITE_KEYS.gunAnchorKey(gun.id)) as
      | AnchorJSON
      | undefined;
    const small = scene.textures.getFrame(SPRITE_KEYS.gun(gun.id));
    if (scene.textures.exists(key)) {
      const smallWidth = small?.width ?? scene.textures.getFrame(key).width;
      const anchor = anchorJson ?? {
        x: smallWidth * FALLBACK_ANCHOR_X,
        y: small ? small.height / 2 : 0,
      };
      rig = new FilmRig(ctx, gun, gun.rarity, key, anchor, smallWidth);
    }
    started = true;
    startMs = scene.time.now;
    scene.events.on(Phaser.Scenes.Events.UPDATE, onUpdate);
    scheduleFilm();
  }

  function scheduleFilm(): void {
    RISE_TONES.forEach((tone) =>
      schedule(film.panEnd * tone.at, (instant) => {
        if (!instant) playUpgrade(tone.chord);
      }),
    );
    // Shot 2: it fires at the nozzle.
    schedule(film.fireAt, () => fireFlash(ctx));
    // Shot 3: the pull-back brings the rays up; the name and tag land as it settles.
    schedule(film.pullAt, () => burstRays(ctx, rays));
    schedule(timeline.nameAt, (instant) => {
      heroShot.landName(instant);
      if (!instant) {
        heroRings(ctx, hero, gun.rarity);
        playStarChime(0);
      }
    });
    schedule(timeline.tagAt, (instant) => {
      heroShot.landTag(instant);
      if (!instant) playStarChime(1);
    });
    // Shot 4: it shrinks to its place, then blasts the targets.
    schedule(film.shrinkAt, (instant) => {
      heroShot.leave(instant);
      stamp();
      if (instant) rays.setPosition(at.x, at.y).setScale(1).setAlpha(1);
      else
        tracker.tween({
          targets: rays,
          x: at.x,
          y: at.y,
          duration: SHRINK_MS,
          ease: 'Cubic.InOut',
        });
    });
    schedule(timeline.beat2At, () => {
      rig?.finish();
      if (rig) {
        range = new DemoRange(scene, root, tracker, gun, rig.image, rig.anchor);
        range.start();
      }
    });
    // Beat 3: the numbers.
    schedule(timeline.beat3At, (instant) => {
      beat3Started = true;
      range?.setMode('idle');
      if (owned) ending.startOwned(owned, instant);
      else if (preview) ending.startPreview(preview, instant);
    });
    // The tag row's own pill pops with the numbers' layout, as it always did.
    schedule(timeline.beat2At + 1, (instant) => showPill(ctx, tag, instant));
  }

  return { close };
}
