/**
 * Asset key registry — every load.image(), setTexture() call must
 * reference a builder here so typos become compile errors (CLAUDE.md
 * §7.3 rule 11). Grannies (3 × 3 poses) and guns (6 × 8 angles) are a
 * combinatorial set, so these are small deterministic key-builder
 * functions rather than a flat object literal — still no raw string
 * literals at any call site, which is the rule's actual intent.
 */

import type { GrannyPose } from '../entities/granny/granny.types';
import type { GunAngle } from '../entities/gun/gun.types';

export const SPRITE_KEYS = {
  /** public/sprites/grannies/<id>/<pose>.png */
  grannyPose: (grannyId: string, pose: GrannyPose): string => `granny_${grannyId}_${pose}`,
  grannyPath: (grannyId: string, pose: GrannyPose): string =>
    `sprites/grannies/${grannyId}/${pose}.png`,

  /** public/sprites/guns/<id>/<angle>.png + anchor.json */
  gunAngle: (gunId: string, angle: GunAngle): string => `gun_${gunId}_${angle}`,
  gunAnglePath: (gunId: string, angle: GunAngle): string => `sprites/guns/${gunId}/${angle}.png`,
  gunAnchorKey: (gunId: string): string => `gun_${gunId}_anchor`,
  gunAnchorPath: (gunId: string): string => `sprites/guns/${gunId}/anchor.json`,

  /** public/sprites/ui/*.png */
  titleWordmark: 'ui_wordmark',
  titleFlourish: 'ui_title_flourish',
} as const;

export const AUDIO_KEYS = {} as const;
export const ICON_KEYS = {} as const;
