/** Which renderer draws which projectile style. */

import type { ProjectileStyle } from '../../gun/gun.types';
import { drawGlitter, drawLava } from './moltenJets';
import { drawIce, drawLaser, drawLightning } from './beamJets';
import { drawBubbles, drawSlime } from './blobJets';
import { drawDragon, drawFlame } from './fireJets';
import { drawPhoenix, drawVortex } from './roarJets';
import { drawKraken, drawStarPony } from './seaJets';
import type { JetRenderer } from './projectile.types';
import { drawMega, drawRainbow, drawShark, drawTornado, drawTrident, drawWater } from './waterJets';

export const JET_RENDERERS: Readonly<Record<ProjectileStyle, JetRenderer>> = {
  water: drawWater,
  bubbles: drawBubbles,
  slime: drawSlime,
  shark: drawShark,
  ice: drawIce,
  lightning: drawLightning,
  flame: drawFlame,
  rainbow: drawRainbow,
  tornado: drawTornado,
  dragon: drawDragon,
  trident: drawTrident,
  laser: drawLaser,
  mega: drawMega,
  lava: drawLava,
  glitter: drawGlitter,
  kraken: drawKraken,
  starpony: drawStarPony,
  vortex: drawVortex,
  phoenix: drawPhoenix,
};
