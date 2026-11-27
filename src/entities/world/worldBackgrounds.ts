/**
 * World backdrops (CLAUDE.md §5.7 / WORLD_BACKGROUND_BRIEF.md). Real
 * illustrated art (WORLD_BG_ASSETS below) takes priority once delivered;
 * the procedural drawers below it (muted, low-saturation, never animated)
 * stay as the fallback for any world that doesn't have art yet.
 */

import Phaser from 'phaser';

import { GAME_HEIGHT, GAME_WIDTH } from '../../config';
import { COLOUR, shade } from '../../utils/colour';

/*
 * Removed 2026-09-12: a soft cream scrim used to be painted over the wall
 * band to keep dim spinners legible against busy illustrated art. It
 * worked, but it read as exactly what it was — a lighter rectangle pasted
 * over the painting, with visible straight edges cutting through the
 * scene. Direct user feedback ("match scene style carefully so they feel
 * native not add on") made that trade the wrong way round. Legibility now
 * comes from the spinners themselves instead: thick Ink outlines and a
 * contact shadow per spinner (spinnerRenderers.ts), which is how the
 * backgrounds' own hand-drawn objects hold up against their backdrops.
 */

/**
 * worldId → texture key + file path for every world's illustrated backdrop
 * (WORLD_BACKGROUND_BRIEF.md), painted or not. Only the worlds named in
 * WORLD_BG_READY are loaded; the rest are drawn in code below.
 */
const WORLD_BG_ASSETS: Readonly<Record<string, { key: string; path: string }>> = {
  garden: { key: 'world_garden_bg', path: 'sprites/worlds/garden_bg.webp' },
  workshop: { key: 'world_workshop_bg', path: 'sprites/worlds/workshop_bg.webp' },
  kitchen: { key: 'world_kitchen_bg', path: 'sprites/worlds/kitchen_bg.webp' },
  funfair: { key: 'world_funfair_bg', path: 'sprites/worlds/funfair_bg.webp' },
  disco: { key: 'world_disco_bg', path: 'sprites/worlds/disco_bg.webp' },
  ship: { key: 'world_ship_bg', path: 'sprites/worlds/ship_bg.webp' },
};

/**
 * Worlds whose painting has been delivered and shipped. To switch a new
 * painting on: put `public/sprites/worlds/<id>_bg.webp` in place and add the
 * world's id here (for the Pirate Ship, 'ship'). Nothing else changes.
 */
const WORLD_BG_READY: ReadonlySet<string> = new Set([
  'garden',
  'workshop',
  'kitchen',
  'funfair',
  'disco',
  'ship',
]);

/** The colour a world's tile on Home shows until its painting arrives. */
const STAND_IN_TILE_FILL: Readonly<Record<string, number>> = {
  ship: 0x6fb6d9,
};

/** The flat colour for a world's venue tile while it has no painting, if the world has its own. */
export function standInTileFill(worldId: string): number | undefined {
  return STAND_IN_TILE_FILL[worldId];
}

function readyAsset(worldId: string): { key: string; path: string } | undefined {
  return WORLD_BG_READY.has(worldId) ? WORLD_BG_ASSETS[worldId] : undefined;
}

/** Loads the world's background image if real art exists for it — no-op otherwise (procedural fallback needs no asset). */
export function preloadWorldBackground(scene: Phaser.Scene, worldId: string): void {
  const asset = readyAsset(worldId);
  if (asset && !scene.textures.exists(asset.key)) {
    scene.load.image(asset.key, asset.path);
  }
}

/** The loaded texture key for a world's illustrated background, if art has landed for it — for carousel swatches etc. */
export function worldBackgroundKey(worldId: string): string | undefined {
  return readyAsset(worldId)?.key;
}

/** Ground plane occupies the bottom slice of the canvas — where Granny stands. */
const GROUND_HEIGHT_RATIO = 0.24;

function drawGarden(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(-100);
  const groundY = GAME_HEIGHT * (1 - GROUND_HEIGHT_RATIO);

  // Two large, soft "hedge" shapes in the back corners — depth cue only,
  // never animated (§5.7), low enough opacity to stay out of the way.
  g.fillStyle(shade(COLOUR.mintGreen, 0.75), 0.1);
  g.fillCircle(-40, GAME_HEIGHT * 0.15, 260);
  g.fillCircle(GAME_WIDTH + 40, GAME_HEIGHT * 0.1, 220);

  // Ground plane: warm muted grass green (CLAUDE.md §5.7 — "warm wood tone or grass").
  g.fillStyle(shade(COLOUR.mintGreen, 0.55), 1);
  g.fillRect(0, groundY, GAME_WIDTH, GAME_HEIGHT - groundY);

  // A soft seam so the ground reads as a plane, not a hard-edged rectangle.
  g.fillStyle(shade(COLOUR.mintGreen, 0.4), 0.35);
  g.fillRect(0, groundY, GAME_WIDTH, 8);
}

function drawWorkshop(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(-100);
  const groundY = GAME_HEIGHT * (1 - GROUND_HEIGHT_RATIO);

  // Pegboard wall — a faint dot grid, low enough opacity to read as texture, not detail.
  g.fillStyle(shade(COLOUR.softSlate, 1.3), 0.08);
  for (let x = 40; x < GAME_WIDTH; x += 56) {
    for (let y = 30; y < groundY; y += 56) {
      g.fillCircle(x, y, 3);
    }
  }

  // Workbench ground — warm wood tone (§5.7).
  g.fillStyle(shade(COLOUR.heatOrange, 0.5), 1);
  g.fillRect(0, groundY, GAME_WIDTH, GAME_HEIGHT - groundY);
  g.fillStyle(shade(COLOUR.heatOrange, 0.38), 0.35);
  g.fillRect(0, groundY, GAME_WIDTH, 8);
}

function drawKitchen(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(-100);
  const groundY = GAME_HEIGHT * (1 - GROUND_HEIGHT_RATIO);

  // Soft tile checker on the back wall.
  const tile = 64;
  for (let x = 0; x < GAME_WIDTH; x += tile) {
    for (let y = 0; y < groundY; y += tile) {
      const even = (Math.round(x / tile) + Math.round(y / tile)) % 2 === 0;
      g.fillStyle(shade(COLOUR.sunnyGold, even ? 1.25 : 1.15), 0.06);
      g.fillRect(x, y, tile, tile);
    }
  }

  // Countertop ground — warm cream tone.
  g.fillStyle(shade(COLOUR.sunnyGold, 0.65), 1);
  g.fillRect(0, groundY, GAME_WIDTH, GAME_HEIGHT - groundY);
  g.fillStyle(shade(COLOUR.sunnyGold, 0.5), 0.35);
  g.fillRect(0, groundY, GAME_WIDTH, 8);
}

function drawFunfair(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(-100);
  const groundY = GAME_HEIGHT * (1 - GROUND_HEIGHT_RATIO);

  // Big-top tent stripes — alternating muted pink/cloud wedges from a peak above the wall.
  const peakX = GAME_WIDTH / 2;
  const peakY = -80;
  const stripes = 12;
  for (let i = 0; i < stripes; i++) {
    const a0 = (i / stripes) * Math.PI - Math.PI / 2 - Math.PI / 2;
    const a1 = ((i + 1) / stripes) * Math.PI - Math.PI / 2 - Math.PI / 2;
    const reach = 1400;
    g.fillStyle(i % 2 === 0 ? shade(COLOUR.grannyPink, 1.5) : COLOUR.cloud, i % 2 === 0 ? 0.1 : 1);
    g.beginPath();
    g.moveTo(peakX, peakY);
    g.lineTo(peakX + Math.cos(a0) * reach, peakY + Math.sin(a0) * reach);
    g.lineTo(peakX + Math.cos(a1) * reach, peakY + Math.sin(a1) * reach);
    g.closePath();
    g.fillPath();
  }

  // Sawdust-ring ground.
  g.fillStyle(shade(COLOUR.heatOrange, 0.7), 1);
  g.fillRect(0, groundY, GAME_WIDTH, GAME_HEIGHT - groundY);
  g.fillStyle(shade(COLOUR.heatOrange, 0.55), 0.35);
  g.fillRect(0, groundY, GAME_WIDTH, 8);
}

function drawDisco(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(-100);
  const groundY = GAME_HEIGHT * (1 - GROUND_HEIGHT_RATIO);

  // Dance-floor dark backdrop (Ink is a neutral, not a saturated hero colour — stays within §5.1's rules).
  g.fillStyle(shade(COLOUR.ink, 1.15), 1);
  g.fillRect(0, 0, GAME_WIDTH, groundY);

  // Soft mirror-ball glow pools — low opacity, never animated (§5.7).
  const glowSpots: readonly (readonly [number, number, number])[] = [
    [GAME_WIDTH * 0.2, GAME_HEIGHT * 0.15, 180],
    [GAME_WIDTH * 0.8, GAME_HEIGHT * 0.1, 150],
    [GAME_WIDTH * 0.5, GAME_HEIGHT * 0.3, 220],
  ];
  const glowColours = [COLOUR.sunnyGold, COLOUR.grannyPink, COLOUR.waterBlue];
  glowSpots.forEach(([x, y, r], i) => {
    g.fillStyle(glowColours[i % glowColours.length], 0.08);
    g.fillCircle(x, y, r);
  });

  // Tiny sparkle dots — a still starfield, not a twinkle animation.
  g.fillStyle(COLOUR.cloud, 0.15);
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * GAME_WIDTH;
    const y = Math.random() * groundY;
    g.fillCircle(x, y, Math.random() * 1.5 + 0.5);
  }

  // Chequered dance floor.
  g.fillStyle(shade(COLOUR.ink, 1.35), 1);
  g.fillRect(0, groundY, GAME_WIDTH, GAME_HEIGHT - groundY);
  g.fillStyle(COLOUR.sunnyGold, 0.12);
  g.fillRect(0, groundY, GAME_WIDTH, 8);
}

/** Pirate Ship stand-in: sky and sea behind, a sail-cloth wall, a rail and a wooden deck — until the painting arrives. */
function drawShip(scene: Phaser.Scene): void {
  const g = scene.add.graphics().setDepth(-100);
  const groundY = GAME_HEIGHT * (1 - GROUND_HEIGHT_RATIO);
  const seaY = GAME_HEIGHT * 0.52;

  g.fillStyle(shade(COLOUR.waterBlue, 1.45), 1);
  g.fillRect(0, 0, GAME_WIDTH, seaY);
  g.fillStyle(shade(COLOUR.waterBlue, 1.2), 1);
  g.fillRect(0, GAME_HEIGHT * 0.2, GAME_WIDTH, seaY - GAME_HEIGHT * 0.2);
  // The sea, with a few still wave lines.
  g.fillStyle(shade(COLOUR.waterBlue, 0.8), 1);
  g.fillRect(0, seaY, GAME_WIDTH, groundY - seaY);
  g.fillStyle(COLOUR.cloud, 0.2);
  for (let i = 0; i < 14; i++) {
    g.fillRoundedRect(40 + i * 92, seaY + 24 + (i % 3) * 22, 48, 5, 2);
  }
  // Sail-cloth behind the wall, hung from a yard.
  g.fillStyle(COLOUR.cloud, 0.55);
  g.fillRoundedRect(110, 100, GAME_WIDTH - 220, 420, 20);
  g.fillStyle(shade(COLOUR.heatOrange, 0.5), 1);
  g.fillRoundedRect(90, 84, GAME_WIDTH - 180, 18, 9);
  // The rail along the front of the deck.
  g.fillStyle(shade(COLOUR.heatOrange, 0.42), 1);
  g.fillRect(0, groundY - 20, GAME_WIDTH, 20);
  for (let x = 30; x < GAME_WIDTH; x += 120) g.fillRect(x, groundY - 64, 14, 48);
  // Deck planks.
  g.fillStyle(shade(COLOUR.heatOrange, 0.6), 1);
  g.fillRect(0, groundY, GAME_WIDTH, GAME_HEIGHT - groundY);
  g.fillStyle(shade(COLOUR.heatOrange, 0.45), 0.5);
  for (let y = groundY + 36; y < GAME_HEIGHT; y += 36) g.fillRect(0, y, GAME_WIDTH, 3);
}

const BACKGROUND_DRAWERS: Readonly<Record<string, (scene: Phaser.Scene) => void>> = {
  garden: drawGarden,
  workshop: drawWorkshop,
  kitchen: drawKitchen,
  funfair: drawFunfair,
  disco: drawDisco,
  ship: drawShip,
};

/** Draws an already-loaded illustrated background, scaled to cover the canvas with no distortion (may crop slightly). */
function drawIllustratedBackground(scene: Phaser.Scene, textureKey: string): void {
  const image = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, textureKey).setDepth(-100);
  const scale = Math.max(GAME_WIDTH / image.width, GAME_HEIGHT / image.height);
  image.setScale(scale);
}

/** Renders the named world's backdrop — real illustrated art if it's loaded, else the procedural placeholder. */
export function drawWorldBackground(scene: Phaser.Scene, worldId: string): void {
  const asset = readyAsset(worldId);
  if (asset && scene.textures.exists(asset.key)) {
    drawIllustratedBackground(scene, asset.key);
    return;
  }
  BACKGROUND_DRAWERS[worldId]?.(scene);
}
