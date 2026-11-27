/**
 * The gun reveal: a full-screen event any scene can open after a gun is
 * bought, or open as a preview of a gun not owned yet. Three beats.
 *
 * 1. Impact: the screen snaps dark, the gun is a black silhouette growing from
 *    a coloured glow, then a white flash, a camera shake, a shockwave in the
 *    rarity colour and the gun SLAMS in full colour with "NEW GUN!" stamped
 *    above it (the rarest guns hold the breath longer and ring twice).
 * 2. It blasts: the gun turns and fires its real projectile at three spinning
 *    discs (`reveal/DemoRange.ts`); the name and rarity land.
 * 3. The numbers: the blasting calms to an occasional burst; POWER counts up
 *    and the Coins / Power / Water rows count (a gun just bought, with USE IT
 *    and Later), or the price and how far the player is from it (a preview,
 *    with OK, or BUY when it is affordable and then straight on into the
 *    owned gun's numbers).
 *
 * A tap after the impact skips to beat 3. Nothing here buys or equips
 * anything: the caller's callbacks do. Everything it makes is destroyed when
 * it closes.
 */

import type Phaser from 'phaser';

import { playStarChime } from '../audio/ResultsMusic';
import { SPRITE_KEYS } from '../assets/keys';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { GUN_LADDER_DEFS } from '../entities/gun/gun.data';
import type { AnchorJSON } from '../entities/gun/gun.types';
import { powerRatingAt } from '../entities/gun/gunLevels';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { BOUNCE_OVERSHOOT, DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';
import { fitWidth } from './RewardParts';
import { DemoRange } from './reveal/DemoRange';
import { addGlow, addRays, playImpactFx } from './reveal/ImpactBeat';
import { buildTagRow, showPill } from './reveal/RevealPanels';
import { RevealEnding } from './reveal/RevealEnding';
import { RevealTracker, type RevealCtx } from './reveal/RevealTracker';
import { REVEAL_DEPTH, REVEAL_LAYOUT, revealGunScale, revealTimeline } from './reveal/revealTiming';

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
const SILHOUETTE_FROM = 0.25;
const SILHOUETTE_TO = 0.8;
const SLAM_FROM = 1.7;
const SLAM_MS = 380;
const STAMP_FROM = 2.4;
const STAMP_MS = 160;
const NAME_FROM = 1.5;
const NAME_MAX_WIDTH = 900;
const NAME_Y_RISE = 24;
const HEADLINE_NEW = 'NEW GUN!';
const HEADLINE_PREVIEW = 'COMING UP';

/** Opens the reveal for a gun just bought over `scene` and returns a handle to close it early. */
export function showGunReveal(scene: Phaser.Scene, config: GunRevealConfig): GunRevealHandle {
  return openReveal(scene, config.gunId, config, null);
}

/** Opens the "see it blast" preview of a gun not owned yet. */
export function showGunPreview(scene: Phaser.Scene, preview: GunPreviewConfig): GunRevealHandle {
  return openReveal(scene, preview.gunId, null, preview);
}

function openReveal(
  scene: Phaser.Scene,
  gunId: string,
  ownedConfig: GunRevealConfig | null,
  previewConfig: GunPreviewConfig | null,
): GunRevealHandle {
  const gun = GUN_LADDER_DEFS.find((g) => g.id === gunId);
  const root = scene.add.container(0, 0).setDepth(REVEAL_DEPTH);
  if (!gun) {
    root.destroy();
    return { close: () => undefined };
  }
  const tracker = new RevealTracker(scene);
  const ctx: RevealCtx = { scene, root, tracker };
  const timeline = revealTimeline(gun.rarity);
  const at = { x: REVEAL_LAYOUT.gun.x, y: REVEAL_LAYOUT.gun.y };
  let owned = ownedConfig;
  let preview = previewConfig;
  let open = true;
  let beat3Started = false;
  let range: DemoRange | null = null;

  const steps: {
    at: number;
    run: (instant: boolean) => void;
    done: boolean;
    timer?: Phaser.Time.TimerEvent;
  }[] = [];
  const startMs = scene.time.now;
  const schedule = (when: number, run: (instant: boolean) => void): void => {
    const step: (typeof steps)[number] = { at: when, run, done: false };
    step.timer = tracker.delay(when, () => {
      step.done = true;
      run(false);
    });
    steps.push(step);
  };
  const skip = (): void => {
    if (!open || beat3Started || scene.time.now - startMs < timeline.beat2At) return;
    steps
      .filter((s) => !s.done)
      .sort((a, b) => a.at - b.at)
      .forEach((s) => {
        if (s.timer) tracker.cancel(s.timer);
        s.done = true;
        s.run(true);
      });
  };

  const backdrop = scene.add
    .rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLOUR.ink, BACKDROP_ALPHA)
    .setInteractive();
  backdrop.on('pointerup', skip);
  root.add(backdrop);
  addGlow(ctx, at, gun.rarity);
  const rays = addRays(ctx, at, gun.rarity);

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

  const key = SPRITE_KEYS.gun(gun.id);
  const anchor = scene.cache.json.get(SPRITE_KEYS.gunAnchorKey(gun.id)) as AnchorJSON | undefined;
  let image: Phaser.GameObjects.Image | null = null;
  let finalScale = 1;
  if (scene.textures.exists(key)) {
    image = scene.add.image(at.x, at.y, key).setTintFill(COLOUR.ink);
    finalScale = revealGunScale(image.width, image.height, gun.showScale);
    image.setScale(finalScale * SILHOUETTE_FROM);
    root.add(image);
    tracker.tween({
      targets: image,
      scale: finalScale * SILHOUETTE_TO,
      duration: timeline.impactAt,
      ease: EASE.standardIn,
    });
  }

  const name = scene.add
    .text(
      CENTRE_X,
      REVEAL_LAYOUT.nameY,
      gun.name,
      textStyle('displayL', COLOUR_HEX.cloud, COLOUR_HEX.ink),
    )
    .setOrigin(0.5)
    .setAlpha(0);
  fitWidth(name, NAME_MAX_WIDTH);
  const nameScale = name.scale;
  root.add(name);

  const level = owned?.level ?? 1;
  const powerTo = powerRatingAt(gun, level);
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

  const close = (): void => {
    if (!open) return;
    open = false;
    range?.destroy();
    tracker.clear();
    scene.tweens.killTweensOf(root.list);
    root.destroy();
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

  // Beat 1: the slam.
  schedule(timeline.impactAt, () => {
    if (image) {
      image.clearTint().setScale(finalScale * SLAM_FROM);
      tracker.tween({
        targets: image,
        scale: finalScale,
        duration: SLAM_MS,
        ease: EASE.bouncy,
        easeParams: [BOUNCE_OVERSHOOT],
      });
    }
    playImpactFx(ctx, at, gun.rarity, rays);
    stamp();
    playStarChime(0);
  });
  // Beat 2: it blasts, the name and the rarity land.
  schedule(timeline.nameAt, (instant) => {
    name.setY(REVEAL_LAYOUT.nameY + (instant ? 0 : NAME_Y_RISE));
    if (instant) name.setAlpha(1).setScale(nameScale);
    else {
      name.setScale(nameScale * NAME_FROM);
      tracker.tween({
        targets: name,
        alpha: 1,
        scale: nameScale,
        y: REVEAL_LAYOUT.nameY,
        duration: DURATION.stateChange,
        ease: EASE.standardOut,
      });
    }
    playStarChime(1);
  });
  schedule(timeline.tagAt, (instant) => {
    showPill(ctx, tag, instant);
    playStarChime(2);
  });
  schedule(timeline.beat2At, () => {
    if (image && anchor) {
      range = new DemoRange(scene, root, tracker, gun, image, anchor);
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
  return { close };
}
