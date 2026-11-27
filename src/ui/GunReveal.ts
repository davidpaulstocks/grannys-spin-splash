/**
 * The gun reveal: a full-screen moment any scene can open after a gun is
 * bought. A dimmed backdrop, soft gold rays turning behind the gun, the gun
 * scaling in large, its name, then three stat rows (Coins, Power, Water) that
 * count from the previous gun's value to this one's, one after another, with
 * the gain in Mint Green. USE IT equips it; Later keeps the old gun. Nothing
 * here buys or equips anything: the caller's callbacks do.
 */

import Phaser from 'phaser';

import { playStarChime } from '../audio/ResultsMusic';
import { SPRITE_KEYS } from '../assets/keys';
import { GAME_HEIGHT, GAME_WIDTH } from '../config';
import { GUN_DEFS } from '../entities/gun/gun.data';
import { gunStats, statRows } from '../systems/gunStats';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { BOUNCE_OVERSHOOT, DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';
import { createButton } from './Button';
import { buildRow, playRow } from './GunRevealRows';
import { fitWidth } from './RewardParts';
import { spawnSparkles } from './sparkle';

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

export interface GunRevealHandle {
  close(): void;
}

const DEPTH = 1000;
const CENTRE_X = GAME_WIDTH / 2;
const BACKDROP_ALPHA = 0.94;
const RAY_COUNT = 12;
const RAY_RADIUS = 760;
const RAY_HALF_ANGLE = 0.09;
const RAY_ALPHA = 0.1;
const RAY_TURN_MS = 26000;
const GUN_X = CENTRE_X;
const GUN_Y = 232;
const GUN_MAX_W = 400;
const GUN_MAX_H = 210;
const GUN_START_SCALE = 0.15;
const HEADLINE_Y = 64;
const NAME_Y = 384;
const NAME_MAX_WIDTH = 780;
const ROWS_Y = 452;
const ROW_GAP = 56;
const ROWS_START_MS = 750;
const ROW_STEP_MS = 450;
const BUTTONS_Y = 664;
const USE_X = 560;
const LATER_X = 800;
const USE_MIN_WIDTH = 240;
const BUTTONS_AT_MS = ROWS_START_MS + ROW_STEP_MS * 2 + 200;
const CHIME_GAP_MS = 180;
const CHIME_COUNT = 3;

/** Opens the reveal over `scene` and returns a handle to close it early. */
export function showGunReveal(scene: Phaser.Scene, config: GunRevealConfig): GunRevealHandle {
  const next = GUN_DEFS.find((g) => g.id === config.gunId);
  const before = GUN_DEFS.find((g) => g.id === config.previousGunId) ?? next;
  const root = scene.add.container(0, 0).setDepth(DEPTH);
  const handle: GunRevealHandle = { close: () => undefined };
  if (!next || !before) return handle;
  const rows = statRows(
    gunStats(before, config.previousLevel ?? 1),
    gunStats(next, config.level ?? 1),
  );
  const timers: Phaser.Time.TimerEvent[] = [];
  const tweenList: Phaser.Tweens.Tween[] = [];
  let open = true;

  const backdrop = scene.add
    .rectangle(CENTRE_X, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, COLOUR.ink, BACKDROP_ALPHA)
    .setInteractive();
  root.add(backdrop);

  const rays = scene.add.graphics({ x: GUN_X, y: GUN_Y });
  rays.fillStyle(COLOUR.sunnyGold, RAY_ALPHA);
  for (let i = 0; i < RAY_COUNT; i++) {
    const a = (i / RAY_COUNT) * Math.PI * 2;
    rays.fillTriangle(
      0,
      0,
      Math.cos(a - RAY_HALF_ANGLE) * RAY_RADIUS,
      Math.sin(a - RAY_HALF_ANGLE) * RAY_RADIUS,
      Math.cos(a + RAY_HALF_ANGLE) * RAY_RADIUS,
      Math.sin(a + RAY_HALF_ANGLE) * RAY_RADIUS,
    );
  }
  root.add(rays);
  tweenList.push(
    scene.tweens.add({ targets: rays, angle: 360, duration: RAY_TURN_MS, repeat: -1 }),
  );

  const headline = scene.add
    .text(
      CENTRE_X,
      HEADLINE_Y,
      'NEW GUN!',
      textStyle('displayM', COLOUR_HEX.sunnyGold, COLOUR_HEX.ink),
    )
    .setOrigin(0.5);
  root.add(headline);

  const key = SPRITE_KEYS.gunAngle(next.id, 0);
  if (scene.textures.exists(key)) {
    const image = scene.add.image(GUN_X, GUN_Y, key);
    const scale = Math.min(GUN_MAX_W / image.width, GUN_MAX_H / image.height);
    image.setScale(scale * GUN_START_SCALE);
    root.add(image);
    tweenList.push(
      scene.tweens.add({
        targets: image,
        scale,
        duration: DURATION.celebration,
        ease: EASE.bouncy,
        easeParams: [BOUNCE_OVERSHOOT],
      }),
    );
  }
  const name = scene.add
    .text(CENTRE_X, NAME_Y, next.name, textStyle('displayL', COLOUR_HEX.cloud, COLOUR_HEX.ink))
    .setOrigin(0.5);
  fitWidth(name, NAME_MAX_WIDTH);
  root.add(name);

  const parts = rows.map((row, i) => buildRow(scene, root, row, ROWS_Y + i * ROW_GAP));
  parts.forEach((p, i) => {
    timers.push(
      scene.time.delayedCall(ROWS_START_MS + i * ROW_STEP_MS, () => {
        if (open) tweenList.push(playRow(scene, p));
      }),
    );
  });

  const close = (): void => {
    if (!open) return;
    open = false;
    timers.forEach((t) => t.remove(false));
    tweenList.forEach((t) => t.remove());
    scene.tweens.killTweensOf(root.list);
    root.destroy();
    config.onClosed?.();
  };
  const use = createButton(scene, {
    x: USE_X,
    y: BUTTONS_Y,
    label: 'USE IT',
    variant: 'primary',
    size: 'md',
    minWidth: USE_MIN_WIDTH,
    onClick: () => {
      if (!open) return;
      config.onUse();
      close();
    },
  });
  const later = createButton(scene, {
    x: LATER_X,
    y: BUTTONS_Y,
    label: 'Later',
    variant: 'secondary',
    size: 'sm',
    onClick: () => {
      if (!open) return;
      config.onLater();
      close();
    },
  });
  [use, later].forEach((b) => {
    b.setAlpha(0).setVisible(false);
    root.add(b);
  });
  timers.push(
    scene.time.delayedCall(BUTTONS_AT_MS, () => {
      if (!open) return;
      [use, later].forEach((b) => b.setVisible(true));
      tweenList.push(
        scene.tweens.add({ targets: [use, later], alpha: 1, duration: DURATION.stateChange }),
      );
    }),
  );

  for (let i = 0; i < CHIME_COUNT; i++) {
    timers.push(scene.time.delayedCall(i * CHIME_GAP_MS, () => playStarChime(i)));
  }
  spawnSparkles(scene, GUN_X, GUN_Y, DEPTH + 1);
  return { close };
}
