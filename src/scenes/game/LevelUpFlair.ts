/**
 * The rare, chanced extras layered on top of a level-up: a quiet spoken
 * "well done!" and the world's easter egg.
 */

import Phaser from 'phaser';

import { audioOrchestra } from '../../audio/AudioOrchestra';
import { GAME_HEIGHT } from '../../config';
import type { Spinner } from '../../entities/spinner/Spinner';
import { EASTER_EGG_CHANCE, WORLD_EASTER_EGG } from '../../entities/world/world.data';
import type { WorldDef } from '../../entities/world/world.types';
import { SpinnerState } from '../../entities/spinner/spinner.types';
import { spawnConfetti, spawnSparks } from '../../entities/waterParticle/splashVFX';
import { pickEncouragementPhrase } from '../../ui/encouragementPhrases';
import { spawnFloatingText } from '../../ui/FloatingText';
import { showToast } from '../../ui/Toast';
import { stageFor, STAGE_X, textBox, visualOf } from './BigMessageStage';
import { STAGE_PRIORITY } from './stageRules';
import { COLOUR } from '../../utils/colour';

/** How often a spinner reaching FULL also gets a spoken "well done!" — rare enough to stay a nice surprise. */
const ENCOURAGEMENT_CHANCE = 0.18;

export class LevelUpFlair {
  constructor(
    private readonly _scene: Phaser.Scene,
    private readonly _world: WorldDef,
  ) {}

  /**
   * Spark burst on the spinner itself — a state upgrade is the single
   * most rewarding moment in the loop and previously had no VFX beyond
   * the SFX + a flat glow-colour swap (2026-09-12, direct user feedback:
   * spinners needed more "juice, momentum, sparks"). FULL gets Sunny
   * Gold sparks (matches its glow); every earlier tier gets the
   * spinner's own base colour. No scale-punch tween here deliberately —
   * Spinner._updateWobble() already writes this.scale every frame past
   * WOBBLE_SPEED_THRESHOLD, which would fight a separate tween on the
   * same property and read as a flicker rather than a punch.
   */
  sparkBurst(spinner: Spinner, newState: SpinnerState): void {
    const sparkColour =
      newState === SpinnerState.FULL
        ? COLOUR.sunnyGold
        : Phaser.Display.Color.HexStringToColor(spinner.def.colors[0]).color;
    spawnSparks(this._scene, spinner.x, spinner.y, sparkColour);
  }

  /**
   * A rare, quiet "well done!" on a spinner reaching FULL (2026-09-12,
   * direct user request: "as a player gets a spinner spinning, well done,
   * or let's go... encouragement, perhaps a little sound effect, without
   * disrupting the actual orchestra sound, which is the hero"). Chanced
   * rather than constant for the same reason as the world easter eggs —
   * every FULL transition already has its own spark burst and floating
   * star text; this is occasional extra warmth on top, not a new habit to
   * get used to (and never a new SFX layer loud enough to compete with the
   * orchestra it's meant to sit quietly underneath).
   */
  maybeEncourage(): void {
    if (Math.random() >= ENCOURAGEMENT_CHANCE) return;
    const y = GAME_HEIGHT * 0.3;
    // A low-priority stage message: it waits its turn and never speaks over a bigger one.
    const shown = stageFor(this._scene).show(STAGE_PRIORITY.other, 'drop', (done) => {
      const toast = showToast(this._scene, STAGE_X, y, pickEncouragementPhrase(), done);
      return visualOf(this._scene, [toast], textBox(toast, STAGE_X, y));
    });
    if (shown) audioOrchestra.accent('cheer');
  }

  /**
   * This world's rare surprise moment (CLAUDE.md §1's worlds as distinct
   * playgrounds) — a one-in-ten level-up fires the world's own shout and
   * confetti palette, so Kitchen's "SIZZLE!" is instantly recognisable as
   * Kitchen's. Rare by design: at every level-up it'd be wallpaper.
   */
  maybeEasterEgg(spinner: Spinner): void {
    if (Math.random() >= EASTER_EGG_CHANCE) return;
    const egg = WORLD_EASTER_EGG[this._world.id];
    if (!egg) return;
    spawnConfetti(this._scene, spinner.x, spinner.y, egg.confetti);
    spawnFloatingText(
      this._scene,
      spinner.x,
      spinner.y - spinner.def.r - 40,
      egg.text,
      egg.textColour,
    );
  }
}
