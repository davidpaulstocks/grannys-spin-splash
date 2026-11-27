/**
 * One venue on Home's strip: a rounded thumbnail of its painted backdrop, its
 * name, and either the stars held in it ("5 / 24") or, when it is still
 * locked, a padlock and the stars it needs. The selected tile wears a Granny
 * Pink ring and sits a little higher than its neighbours.
 *
 * The thumbnail is baked once into a rounded canvas texture (rather than
 * masked at draw time) so it needs no mask object and moves with its container.
 */

import type Phaser from 'phaser';

import { GIGS_PER_VENUE } from '../entities/world/gigs.data';
import type { WorldDef } from '../entities/world/world.types';
import { standInTileFill, worldBackgroundKey } from '../entities/world/worldBackgrounds';
import { MAX_STARS_PER_GIG } from '../systems/Progress';
import { COLOUR, COLOUR_HEX } from '../utils/colour';
import { DURATION, EASE } from '../utils/tween';
import { textStyle } from '../utils/typography';
import { drawLockIcon, drawStarIcon } from './icons';

export interface VenueTileConfig {
  /** Centre of the tile when it is not raised. */
  readonly x: number;
  readonly y: number;
  readonly venue: WorldDef;
  /** Stars held in this venue. */
  readonly earned: number;
  readonly open: boolean;
  readonly selected: boolean;
  /** Called on a tap, open or locked alike; the strip decides what a locked tap means. */
  readonly onTap: () => void;
}

export interface VenueTile {
  readonly container: Phaser.GameObjects.Container;
  /** Raises the tile and rings it in pink, or lowers it again. */
  setSelected(selected: boolean): void;
  /** A small sideways shake: "not yet". */
  shake(): void;
}

export const VENUE_TILE_WIDTH = 216;
export const VENUE_TILE_HEIGHT = 124;
const HALF_WIDTH = VENUE_TILE_WIDTH / 2;
const HALF_HEIGHT = VENUE_TILE_HEIGHT / 2;
const CORNER_RADIUS = 20;
const RAISE_PX = 8;
const PRESS_SCALE = 0.95;
const SHADOW_ALPHA = 0.2;
const SHADOW_DROP = 6;
const OUTLINE_PX = 4;
const RING_PX = 5;
const RING_HALO_PX = 10;
/** Resolution the thumbnail is baked at, relative to the tile's logical size. */
const THUMB_TEXTURE_SCALE = 2;
const THUMB_KEY_SUFFIX = '_tile';
const FALLBACK_FILL = 0x8a8a9a;

const BAND_HEIGHT = 52;
const BAND_ALPHA = 0.64;
const LOCKED_DIM_ALPHA = 0.5;
const NAME_Y = HALF_HEIGHT - BAND_HEIGHT + 17;
const STARS_Y = HALF_HEIGHT - 13;
const LOCK_Y = -22;
const LOCK_SIZE = 34;
const STAR_RADIUS = 9;
const STAR_OUTLINE_PX = 2;
const STAR_TEXT_GAP = 6;
const SHAKE_PX = 8;
const SHAKE_MS = 50;
const SHAKE_REPEATS = 2;

/** Builds one tile and returns its container plus the two things the strip does to it. */
export function createVenueTile(scene: Phaser.Scene, config: VenueTileConfig): VenueTile {
  const { venue, open } = config;
  const parts: Phaser.GameObjects.GameObject[] = [];

  const shadow = scene.add.graphics();
  shadow.fillStyle(COLOUR.ink, SHADOW_ALPHA);
  shadow.fillRoundedRect(
    -HALF_WIDTH,
    -HALF_HEIGHT + SHADOW_DROP,
    VENUE_TILE_WIDTH,
    VENUE_TILE_HEIGHT,
    CORNER_RADIUS,
  );
  parts.push(shadow, buildThumb(scene, venue.id));

  const overlay = scene.add.graphics();
  if (!open) {
    overlay.fillStyle(COLOUR.ink, LOCKED_DIM_ALPHA);
    overlay.fillRoundedRect(
      -HALF_WIDTH,
      -HALF_HEIGHT,
      VENUE_TILE_WIDTH,
      VENUE_TILE_HEIGHT,
      CORNER_RADIUS,
    );
  }
  overlay.fillStyle(COLOUR.ink, BAND_ALPHA);
  overlay.fillRoundedRect(-HALF_WIDTH, HALF_HEIGHT - BAND_HEIGHT, VENUE_TILE_WIDTH, BAND_HEIGHT, {
    tl: 0,
    tr: 0,
    bl: CORNER_RADIUS,
    br: CORNER_RADIUS,
  });
  parts.push(overlay);

  parts.push(
    scene.add
      .text(0, NAME_Y, venue.name, textStyle('bodyL', COLOUR_HEX.cloud, COLOUR_HEX.ink))
      .setOrigin(0.5),
  );
  parts.push(
    ...buildStarsRow(
      scene,
      open ? `${config.earned} / ${GIGS_PER_VENUE * MAX_STARS_PER_GIG}` : String(venue.starsToOpen),
    ),
  );
  if (!open) {
    const lock = scene.add.graphics({ x: 0, y: LOCK_Y });
    drawLockIcon(lock, LOCK_SIZE, COLOUR.cloud);
    parts.push(lock);
  }

  const ring = scene.add.graphics();
  parts.push(ring);
  // Added last: in a Container the last child wins input where children overlap.
  const zone = scene.add.zone(0, 0, VENUE_TILE_WIDTH, VENUE_TILE_HEIGHT);
  parts.push(zone);

  const container = scene.add.container(config.x, config.y, parts);
  container.setSize(VENUE_TILE_WIDTH, VENUE_TILE_HEIGHT);

  const drawRing = (selected: boolean): void => {
    ring.clear();
    if (selected) {
      ring.lineStyle(RING_HALO_PX, COLOUR.ink, 1);
      ring.strokeRoundedRect(
        -HALF_WIDTH,
        -HALF_HEIGHT,
        VENUE_TILE_WIDTH,
        VENUE_TILE_HEIGHT,
        CORNER_RADIUS,
      );
      ring.lineStyle(RING_PX, COLOUR.grannyPink, 1);
    } else {
      ring.lineStyle(OUTLINE_PX, COLOUR.ink, 1);
    }
    ring.strokeRoundedRect(
      -HALF_WIDTH,
      -HALF_HEIGHT,
      VENUE_TILE_WIDTH,
      VENUE_TILE_HEIGHT,
      CORNER_RADIUS,
    );
  };
  drawRing(config.selected);
  container.setY(config.y - (config.selected ? RAISE_PX : 0));

  let pressed = false;
  zone.setInteractive({ useHandCursor: true });
  zone.on('pointerdown', () => {
    pressed = true;
    scene.tweens.add({
      targets: container,
      scale: PRESS_SCALE,
      duration: DURATION.hoverPress,
      ease: EASE.standardOut,
    });
  });
  const release = (): void => {
    pressed = false;
    scene.tweens.add({
      targets: container,
      scale: 1,
      duration: DURATION.hoverPress,
      ease: EASE.standardOut,
    });
  };
  zone.on('pointerup', () => {
    if (!pressed) return;
    release();
    config.onTap();
  });
  zone.on('pointerout', () => {
    if (pressed) release();
  });

  return {
    container,
    setSelected: (selected: boolean): void => {
      drawRing(selected);
      scene.tweens.add({
        targets: container,
        y: config.y - (selected ? RAISE_PX : 0),
        duration: DURATION.hoverPress,
        ease: EASE.standardOut,
      });
    },
    shake: (): void => {
      // From where the tile stands now: the strip may have paged it since it was built.
      const restX = container.x;
      scene.tweens.add({
        targets: container,
        x: restX + SHAKE_PX,
        duration: SHAKE_MS,
        yoyo: true,
        repeat: SHAKE_REPEATS,
        onComplete: () => container.setX(restX),
      });
    },
  };
}

/** The star icon and a count, centred as a pair on the band's second row. */
function buildStarsRow(scene: Phaser.Scene, label: string): Phaser.GameObjects.GameObject[] {
  const text = scene.add
    .text(0, STARS_Y, label, textStyle('bodyM', COLOUR_HEX.cloud, COLOUR_HEX.ink))
    .setOrigin(0, 0.5);
  const iconWidth = (STAR_RADIUS + STAR_OUTLINE_PX) * 2;
  const left = -(iconWidth + STAR_TEXT_GAP + text.width) / 2;
  const icon = scene.add.graphics({ x: left + iconWidth / 2, y: STARS_Y });
  drawStarIcon(icon, STAR_RADIUS + STAR_OUTLINE_PX, COLOUR.ink);
  drawStarIcon(icon, STAR_RADIUS, COLOUR.sunnyGold);
  text.setX(left + iconWidth + STAR_TEXT_GAP);
  return [icon, text];
}

/** The venue's backdrop, cropped to the tile's shape with rounded corners; a flat swatch if the art is missing. */
function buildThumb(scene: Phaser.Scene, venueId: string): Phaser.GameObjects.GameObject {
  const key = ensureThumbTexture(scene, venueId);
  if (key) return scene.add.image(0, 0, key).setDisplaySize(VENUE_TILE_WIDTH, VENUE_TILE_HEIGHT);
  const swatch = scene.add.graphics();
  swatch.fillStyle(standInTileFill(venueId) ?? FALLBACK_FILL, 1);
  swatch.fillRoundedRect(
    -HALF_WIDTH,
    -HALF_HEIGHT,
    VENUE_TILE_WIDTH,
    VENUE_TILE_HEIGHT,
    CORNER_RADIUS,
  );
  return swatch;
}

/** Bakes the rounded, cover-cropped thumbnail once per venue; returns its texture key, or null without art. */
export function ensureThumbTexture(scene: Phaser.Scene, venueId: string): string | null {
  const source = worldBackgroundKey(venueId);
  if (!source || !scene.textures.exists(source)) return null;
  const key = `${source}${THUMB_KEY_SUFFIX}`;
  if (scene.textures.exists(key)) return key;

  const width = VENUE_TILE_WIDTH * THUMB_TEXTURE_SCALE;
  const height = VENUE_TILE_HEIGHT * THUMB_TEXTURE_SCALE;
  const canvas = scene.textures.createCanvas(key, width, height);
  const ctx = canvas?.getContext();
  if (!canvas || !ctx) return null;

  const image = scene.textures.get(source).getSourceImage() as CanvasImageSource & {
    width: number;
    height: number;
  };
  const radius = CORNER_RADIUS * THUMB_TEXTURE_SCALE;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.arcTo(width, 0, width, height, radius);
  ctx.arcTo(width, height, 0, height, radius);
  ctx.arcTo(0, height, 0, 0, radius);
  ctx.arcTo(0, 0, width, 0, radius);
  ctx.closePath();
  ctx.clip();
  const cover = Math.max(width / image.width, height / image.height);
  const drawW = image.width * cover;
  const drawH = image.height * cover;
  ctx.drawImage(image, (width - drawW) / 2, (height - drawH) / 2, drawW, drawH);
  canvas.refresh();
  return key;
}
