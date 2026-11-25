/**
 * The game's button. One component, used everywhere, so every button in the
 * game presses the same way.
 *
 * It is a chunky, physical thing: a coloured face sitting on a darker lip,
 * with a soft shadow under it and a highlight across its top. Pressing it
 * pushes the face down onto the lip. That depth is the point — a flat
 * outlined pill reads as a label, not as something to press (2026-11-25,
 * direct user feedback: the buttons looked "very basic").
 *
 * Three sizes and four looks. A screen has exactly one large primary
 * button; everything else is smaller or quieter. Rewarded-ad buttons use
 * the `reward` look: gold, never green, with the play glyph Poki requires
 * (CLAUDE.md §11.3).
 *
 * Pill radii come from `pillRadius()`, never a literal 999: Phaser's
 * Graphics does not clamp a radius to the box the way CSS does.
 */

import Phaser from 'phaser';

import { COLOUR, COLOUR_HEX, shade } from '../utils/colour';
import { pillRadius } from '../utils/math';
import { DURATION, EASE } from '../utils/tween';
import { textStyle, type TYPE_SCALE } from '../utils/typography';
import { drawPlayIcon } from './icons';

export type ButtonVariant = 'primary' | 'secondary' | 'reward' | 'tertiary';
export type ButtonSize = 'lg' | 'md' | 'sm';

export interface ButtonConfig {
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly onClick: () => void;
  readonly variant?: ButtonVariant;
  /** `lg` is for a screen's one main action. Defaults to `md`. */
  readonly size?: ButtonSize;
  readonly minWidth?: number;
  /**
   * False keeps the tap zone at the drawn size. Needed only where two
   * buttons sit so close that an enlarged zone on one would steal taps meant
   * for the other.
   */
  readonly expandHitArea?: boolean;
  /**
   * In-game buttons share the screen with aim-and-fire input. A guard lets
   * the scene's input manager ignore the finger that is on this button.
   * Menu-scene buttons leave it undefined.
   */
  readonly pointerGuard?: {
    claimPointer(id: number): void;
    releasePointer(id: number): void;
  };
  /** Draws the play glyph before the label — required on every rewarded-ad button (CLAUDE.md §11.3). */
  readonly showPlayIcon?: boolean;
}

interface SizeSpec {
  readonly height: number;
  readonly paddingX: number;
  /** How far the face sits above its base; also how far it travels when pressed. */
  readonly lip: number;
  readonly type: keyof typeof TYPE_SCALE;
  readonly iconRadius: number;
}

const SIZES: Readonly<Record<ButtonSize, SizeSpec>> = {
  lg: { height: 84, paddingX: 48, lip: 9, type: 'buttonL', iconRadius: 16 },
  md: { height: 64, paddingX: 34, lip: 7, type: 'buttonM', iconRadius: 13 },
  sm: { height: 52, paddingX: 26, lip: 6, type: 'buttonS', iconRadius: 11 },
};

interface VariantSpec {
  readonly face: number;
  /** The lip is the face colour, darkened by this factor. */
  readonly lipShade: number;
  readonly text: string;
}

const VARIANTS: Readonly<Record<Exclude<ButtonVariant, 'tertiary'>, VariantSpec>> = {
  // Mint Green is the palette's confirm colour (CLAUDE.md §5.1) — the main action.
  primary: { face: COLOUR.mintGreen, lipShade: 0.7, text: COLOUR_HEX.ink },
  secondary: { face: COLOUR.cloud, lipShade: 0.8, text: COLOUR_HEX.ink },
  reward: { face: COLOUR.sunnyGold, lipShade: 0.74, text: COLOUR_HEX.ink },
};

const OUTLINE_PX = 4;
const SHADOW_ALPHA = 0.2;
const SHADOW_DROP = 6;
const HIGHLIGHT_ALPHA = 0.28;
const HIGHLIGHT_INSET = 7;
const HIGHLIGHT_HEIGHT_FRACTION = 0.4;
const ICON_GAP = 12;
const HOVER_SCALE = 1.03;
/**
 * Minimum tappable height, logical px: 88 is 44 CSS px at Poki's smallest
 * canonical size (640x360), the floor for a finger. Only the invisible zone
 * grows; the drawn button keeps its size.
 */
const MIN_HIT_HEIGHT = 88;

/** Builds a button centred on (x, y) and returns its container, so callers can move, pulse or destroy it. */
export function createButton(
  scene: Phaser.Scene,
  config: ButtonConfig,
): Phaser.GameObjects.Container {
  const size = SIZES[config.size ?? 'md'];
  if (config.variant === 'tertiary') return createTextButton(scene, config, size);
  const variant = VARIANTS[config.variant ?? 'primary'];

  const iconSpace = config.showPlayIcon ? size.iconRadius * 2 + ICON_GAP : 0;
  const label = scene.add
    .text(iconSpace / 2, 0, config.label, textStyle(size.type, variant.text, variant.text))
    .setOrigin(0.5);
  const width = Math.max(config.minWidth ?? 0, label.width + iconSpace + size.paddingX * 2);
  const { height, lip } = size;
  const radius = pillRadius(width, height);
  const left = -width / 2;
  const top = -height / 2;

  // Underneath: the shadow, then the lip the face sits on.
  const base = scene.add.graphics();
  base.fillStyle(COLOUR.ink, SHADOW_ALPHA);
  base.fillRoundedRect(left, top + lip + SHADOW_DROP, width, height, radius);
  base.fillStyle(shade(variant.face, variant.lipShade), 1);
  base.fillRoundedRect(left, top + lip, width, height, radius);
  base.lineStyle(OUTLINE_PX, COLOUR.ink, 1);
  base.strokeRoundedRect(left, top + lip, width, height, radius);

  // On top: the face, its highlight, and what is written on it. These move together when pressed.
  const faceGfx = scene.add.graphics();
  faceGfx.fillStyle(variant.face, 1);
  faceGfx.fillRoundedRect(left, top, width, height, radius);
  const highlightHeight = height * HIGHLIGHT_HEIGHT_FRACTION;
  faceGfx.fillStyle(0xffffff, HIGHLIGHT_ALPHA);
  faceGfx.fillRoundedRect(
    left + HIGHLIGHT_INSET,
    top + HIGHLIGHT_INSET,
    width - HIGHLIGHT_INSET * 2,
    highlightHeight,
    pillRadius(width - HIGHLIGHT_INSET * 2, highlightHeight),
  );
  faceGfx.lineStyle(OUTLINE_PX, COLOUR.ink, 1);
  faceGfx.strokeRoundedRect(left, top, width, height, radius);

  const faceParts: Phaser.GameObjects.GameObject[] = [faceGfx, label];
  if (config.showPlayIcon) {
    const icon = scene.add.graphics({
      x: label.x - label.width / 2 - ICON_GAP - size.iconRadius,
      y: 0,
    });
    drawPlayIcon(icon, size.iconRadius, COLOUR.ink);
    faceParts.push(icon);
  }
  const face = scene.add.container(0, 0, faceParts);

  const container = scene.add.container(config.x, config.y, [base, face]);
  container.setSize(width, height + lip);
  attachPress(scene, container, config, width, height + lip, lip / 2, (pressed) =>
    face.setY(pressed ? lip - 2 : 0),
  );
  return container;
}

/** The quietest button: a label with no body, for actions that should be findable but never inviting. */
function createTextButton(
  scene: Phaser.Scene,
  config: ButtonConfig,
  size: SizeSpec,
): Phaser.GameObjects.Container {
  const label = scene.add
    .text(0, 0, config.label, textStyle(size.type, COLOUR_HEX.softSlate, COLOUR_HEX.softSlate))
    .setOrigin(0.5);
  const width = Math.max(config.minWidth ?? 0, label.width + size.paddingX * 2);
  const container = scene.add.container(config.x, config.y, [label]);
  container.setSize(width, size.height);
  attachPress(scene, container, config, width, size.height, 0, () => undefined);
  return container;
}

/**
 * Wires hover, press and click onto a button body. Shared with `IconButton`
 * so round and pill buttons respond identically. `zoneOffsetY` centres the
 * tap zone on the whole drawn body, lip included.
 */
export function attachPress(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  config: Pick<ButtonConfig, 'onClick' | 'expandHitArea' | 'pointerGuard'>,
  width: number,
  height: number,
  zoneOffsetY: number,
  setPressed: (pressed: boolean) => void,
): void {
  const hitHeight = config.expandHitArea === false ? height : Math.max(height, MIN_HIT_HEIGHT);
  const hitWidth = config.expandHitArea === false ? width : Math.max(width, MIN_HIT_HEIGHT);
  // Added last: in a Container the last child wins input where children overlap.
  const zone = scene.add
    .zone(0, zoneOffsetY, hitWidth, hitHeight)
    .setInteractive({ useHandCursor: true });
  container.add(zone);

  const scaleTo = (scale: number): void => {
    scene.tweens.add({
      targets: container,
      scale,
      duration: DURATION.hoverPress,
      ease: EASE.standardOut,
    });
  };
  if (config.pointerGuard) {
    const guard = config.pointerGuard;
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => guard.claimPointer(p.id));
    zone.on('pointerup', (p: Phaser.Input.Pointer) => guard.releasePointer(p.id));
    zone.on('pointerout', (p: Phaser.Input.Pointer) => guard.releasePointer(p.id));
  }
  zone.on('pointerover', () => scaleTo(HOVER_SCALE));
  zone.on('pointerout', () => {
    setPressed(false);
    scaleTo(1);
  });
  zone.on('pointerdown', () => setPressed(true));
  zone.on('pointerup', () => {
    setPressed(false);
    config.onClick();
  });
}

/** Shared by `IconButton`, which draws the same body as a circle. */
export const BUTTON_STYLE = {
  outlinePx: OUTLINE_PX,
  shadowAlpha: SHADOW_ALPHA,
  shadowDrop: SHADOW_DROP,
  highlightAlpha: HIGHLIGHT_ALPHA,
  variants: VARIANTS,
} as const;
