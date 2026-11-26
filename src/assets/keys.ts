/**
 * Asset key registry — every load.image(), setTexture() call must
 * reference a builder here so typos become compile errors (CLAUDE.md
 * §7.3 rule 11). Grannies (3 × 3 poses) and guns (6 × 8 angles) are a
 * combinatorial set, so these are small deterministic key-builder
 * functions rather than a flat object literal — still no raw string
 * literals at any call site, which is the rule's actual intent.
 */

import type { InstrumentIconId } from '../audio/orchestra/icons';
import type { VisitorId } from '../entities/visitor/visitor.types';
import type { GrannyPose } from '../entities/granny/granny.types';
import type { GunAngle } from '../entities/gun/gun.types';

export const SPRITE_KEYS = {
  /** public/sprites/grannies/<id>/<pose>.webp */
  grannyPose: (grannyId: string, pose: GrannyPose): string => `granny_${grannyId}_${pose}`,
  grannyPath: (grannyId: string, pose: GrannyPose): string =>
    `sprites/grannies/${grannyId}/${pose}.webp`,

  /** public/sprites/guns/<id>/<angle>.webp + anchor.json */
  gunAngle: (gunId: string, angle: GunAngle): string => `gun_${gunId}_${angle}`,
  gunAnglePath: (gunId: string, angle: GunAngle): string => `sprites/guns/${gunId}/${angle}.webp`,
  gunAnchorKey: (gunId: string): string => `gun_${gunId}_anchor`,
  gunAnchorPath: (gunId: string): string => `sprites/guns/${gunId}/anchor.json`,

  /** public/sprites/instruments/<icon>.webp — one painted instrument per icon id (INSTRUMENT_ART_BRIEF.md). */
  instrumentIcon: (icon: InstrumentIconId): string => `instrument_${icon}`,
  instrumentIconPath: (icon: InstrumentIconId): string => `sprites/instruments/${icon}.webp`,

  /** public/sprites/visitors/<id>.webp — one painted visitor per id (entities/visitor/visitorArt.data.ts). */
  visitor: (id: VisitorId): string => `visitor_${id}`,
  visitorPath: (id: VisitorId): string => `sprites/visitors/${id}.webp`,

  /** public/sprites/ui/*.webp */
  titleWordmark: 'ui_wordmark',
  titleFlourish: 'ui_title_flourish',

  /** public/sprites/ui/buttons/pause.webp — the touch-only pause control. */
  pauseButton: 'ui_pause',
  pauseButtonPath: 'sprites/ui/buttons/pause.webp',
} as const;

export const AUDIO_KEYS = {} as const;
export const ICON_KEYS = {} as const;
