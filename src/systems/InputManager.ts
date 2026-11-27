/**
 * Unified pointer/keyboard input — aim, fire, move, pause (CLAUDE.md §6).
 * Captures arrow keys + space so held keys never scroll the page
 * (CLAUDE.md §3 rule 10, story 1.7). Emits 'first-input' exactly once, the
 * moment the player does anything at all — GameScene wires that straight
 * to PokiSDK.gameplayStart() (§3 SDK integration, never on scene load).
 *
 * Granny does not walk (2026-09-12): aim is the only input. Nothing in the
 * game could ever *require* repositioning — the umbrella opens and closes on
 * a timer, the cat is shooed by aiming near it, the duck paddles — and the
 * two-thumb grip walking forced was the direct cause of two of the three
 * critical input bugs the spec audit found. Arrow keys are still captured so
 * they can't scroll the page (§3 rule 10), they just don't drive anything.
 *
 * There is no two-finger pause gesture (removed 2026-09-12, direct user
 * feedback: "if two fingers touch the screen on touch, it pauses the game.
 * very annoying! There should be a pause button instead"). CLAUDE.md §6.3
 * specced it, but an invisible gesture that hijacks an ordinary second touch
 * is hostile on a device a child holds in two hands — and it was the direct
 * cause of the worst bug in the game (one accidental two-finger contact
 * permanently soft-locked the run; see resetPointerState). Touch devices get
 * a visible pause button instead (`ui/PauseButton.ts`); desktop keeps ESC.
 */

import Phaser from 'phaser';

import { usesTouchControls } from '../ui/touchControls';
import { EventEmitter } from '../utils/EventEmitter';

interface TrackedKeys {
  readonly left: Phaser.Input.Keyboard.Key;
  readonly right: Phaser.Input.Keyboard.Key;
  readonly a: Phaser.Input.Keyboard.Key;
  readonly d: Phaser.Input.Keyboard.Key;
  readonly space: Phaser.Input.Keyboard.Key;
  readonly esc: Phaser.Input.Keyboard.Key;
  /** Unused by gameplay — captured only so an accidental press can't scroll the page (CLAUDE.md §3 rule 10). */
  readonly up: Phaser.Input.Keyboard.Key;
  readonly down: Phaser.Input.Keyboard.Key;
}

export class InputManager extends EventEmitter {
  private readonly _scene: Phaser.Scene;
  private readonly _keys: TrackedKeys;

  private _pointerX = 0;
  private _pointerY = 0;
  /** False until a pointer or finger has moved or touched down — until then the aim is the scene's default. */
  private _hasAimed = false;
  /** Whether the latest aim input was a finger — decides if the mouse reach assist applies. */
  private _lastWasTouch: boolean;
  /** The water fires by itself from the start of a gig; Space switches it off and on (§6.2, accessibility). */
  private _firing = true;
  private _hasFiredFirstInput = false;
  /**
   * Pointer ids held down on an on-screen control (the pause button). The
   * scene-wide listeners below treat EVERY touch as aim/fire input regardless
   * of what it landed on, so without this, tapping a button also fired the
   * water cannon and counted toward the two-finger PAUSE gesture. A pointer
   * id in this set is excluded from both.
   */
  private readonly _excludedPointerIds = new Set<number>();

  constructor(scene: Phaser.Scene) {
    super();
    this._scene = scene;
    this._lastWasTouch = usesTouchControls(scene.game);

    const kb = scene.input.keyboard;
    if (!kb) throw new Error('InputManager requires a scene with keyboard input enabled');

    const Keys = Phaser.Input.Keyboard.KeyCodes;
    // All 4 arrows + space, not just the 2 this game actually binds — the
    // page-scroll-prevention rule covers arrow keys generally, and an
    // unbound UP/DOWN press would otherwise scroll straight past Phaser.
    kb.addCapture([Keys.LEFT, Keys.RIGHT, Keys.UP, Keys.DOWN, Keys.SPACE]);

    this._keys = {
      left: kb.addKey(Keys.LEFT),
      right: kb.addKey(Keys.RIGHT),
      a: kb.addKey(Keys.A),
      d: kb.addKey(Keys.D),
      space: kb.addKey(Keys.SPACE),
      esc: kb.addKey(Keys.ESC),
      up: kb.addKey(Keys.UP),
      down: kb.addKey(Keys.DOWN),
    };

    this._keys.space.on('down', () => {
      // The press that is the player's first input only starts the gig; it must not also switch the water off.
      if (this._hasFiredFirstInput) this._firing = !this._firing;
      this._registerFirstInput();
    });
    this._keys.esc.on('down', () => this.emit('pause'));
    for (const key of [this._keys.left, this._keys.right, this._keys.a, this._keys.d]) {
      key.on('down', () => this._registerFirstInput());
    }

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      // Excluded ids are fingers resting on a move/pause button. Without this
      // check the crosshair tracked THEM: in the standard mobile grip (left
      // thumb on the move button, right thumb firing) the aim snapped to the
      // bottom-left corner on every micro-movement of the moving thumb, so
      // moving and firing at once — the whole §6.3 control scheme — sprayed
      // water at the floor. `pointerdown` had this guard; `pointermove` did not.
      if (this._excludedPointerIds.has(pointer.id)) return;
      this._lastWasTouch = pointer.wasTouch;
      this._hasAimed = true;
      this._pointerX = pointer.worldX;
      this._pointerY = pointer.worldY;
    });
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this._registerFirstInput();
      // A touch already claimed by a move button (see `claimPointer`) is
      // real gameplay input for "has the player started," but must never
      // register as aim/fire or count toward the two-finger pause gesture.
      if (this._excludedPointerIds.has(pointer.id)) return;
      this._lastWasTouch = pointer.wasTouch;
      this._hasAimed = true;
      this._pointerX = pointer.worldX;
      this._pointerY = pointer.worldY;
    });
    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      // The scene-wide listener, not the button's own zone handler, clears a
      // claimed finger: the zone's handler fires first for the same native
      // event, so releasing there would make the id look un-excluded here.
      this._excludedPointerIds.delete(pointer.id);
    });
  }

  /**
   * Drops every piece of held pointer state. Required around a scene pause:
   * `scene.pause()` runs synchronously inside the pointerdown that triggered
   * it, and a paused Phaser scene receives NO input at all (InputPlugin.update
   * bails while `canInput()` is false, and events are dispatched live with no
   * queue or replay). So the touchends that end the two-finger pause gesture
   * are discarded outright, leaving held state stuck: `_pointerDown` true so
   * the cannon fires by itself on resume, or an excluded id never released so
   * that finger is deadened for the rest of the round. Found by spec audit,
   * 2026-09-12 — the two-finger gesture that made this catastrophic is gone
   * now, but a pause can still land mid-touch via the button or ESC.
   */
  resetPointerState(): void {
    this._excludedPointerIds.clear();
  }

  /**
   * Marks a touch as belonging to a move button, not aim/fire — called by
   * an on-screen control on its own zone's `pointerdown`. Phaser fires an
   * interactive object's own listener before the scene-wide one below for
   * the same native event, so this always lands in time to suppress it.
   */
  claimPointer(pointerId: number): void {
    this._excludedPointerIds.add(pointerId);
  }

  /**
   * Releases a pointer claimed by `claimPointer` — call ONLY from that same
   * button's `pointerout` (finger dragged off the button without lifting).
   * Never call this from a `pointerup` handler: the scene-wide `pointerup`
   * listener above must be the one to observe and clear the exclusion for
   * a lifted pointer, or its own check races against an early release (see
   * that handler's comment).
   */
  releasePointer(pointerId: number): void {
    this._excludedPointerIds.delete(pointerId);
  }

  /** Raw pointer/touch position, pre-snap — pass through resolveAim() before using. */
  getPointer(): { x: number; y: number } {
    return { x: this._pointerX, y: this._pointerY };
  }

  /** True when the latest aim input was a finger (1:1 aim, no reticle); false for mouse/trackpad. */
  isTouchAim(): boolean {
    return this._lastWasTouch;
  }

  /** True once a pointer or finger has moved or touched down; before that the scene aims by default. */
  hasAimed(): boolean {
    return this._hasAimed;
  }

  /** True while the gun should be firing: always, unless Space has switched it off. Holding or clicking does nothing extra. */
  isFiring(): boolean {
    return this._firing;
  }

  /** Detaches every listener — call from the owning scene's shutdown handler. */
  destroy(): void {
    this._scene.input.off('pointermove');
    this._scene.input.off('pointerdown');
    this._scene.input.off('pointerup');
    this._excludedPointerIds.clear();
    this.removeAllListeners();
  }

  private _registerFirstInput(): void {
    if (this._hasFiredFirstInput) return;
    this._hasFiredFirstInput = true;
    this.emit('first-input');
  }
}
