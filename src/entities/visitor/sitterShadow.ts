/** The shadow that warns where a sitter is about to land: a soft dark oval on the instrument that pulses. */

import type Phaser from 'phaser';

import { COLOUR } from '../../utils/colour';
import type { Spinner } from '../spinner/Spinner';
import { VISIT_MOTION as M } from './visitorTuning.data';

const SHADOW_LOW_ALPHA = 0.5;
const SHADOW_DROP_FRACTION = 0.4;
const SHADOW_WIDTH_FRACTION = 1.7;
const SHADOW_HEIGHT_FRACTION = 0.8;

/** Redraws the shadow over `host`, `ms` into the warning. */
export function drawSitterShadow(g: Phaser.GameObjects.Graphics, host: Spinner, ms: number): void {
  const r = host.def.r;
  const pulse = 0.5 + 0.5 * Math.sin((ms / 1000) * M.sitterShadowPulseHz * Math.PI * 2);
  g.clear();
  g.fillStyle(
    COLOUR.ink,
    M.sitterShadowAlpha * (SHADOW_LOW_ALPHA + (1 - SHADOW_LOW_ALPHA) * pulse),
  );
  g.fillEllipse(
    host.x,
    host.y + r * SHADOW_DROP_FRACTION,
    r * SHADOW_WIDTH_FRACTION,
    r * SHADOW_HEIGHT_FRACTION,
  );
}
