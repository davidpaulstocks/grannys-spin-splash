/**
 * Unified pointer/keyboard input — aim, fire, move, pause (CLAUDE.md §6).
 * Captures arrow keys + space so held keys never scroll the page
 * (CLAUDE.md §3 rule 10, story 1.7). Emits 'first-input' exactly once, the
 * moment the player does anything at all — GameScene wires that straight
 * to PokiSDK.gameplayStart() (§3 SDK integration, never on scene load).
 *
 * Mobile move (§6.3) comes through `setMobileMove()`, called by the edge
 * hold-buttons in `ui/MobileMoveButtons.ts` — merged into `getMoveDir()`
 * alongside the keyboard so GameScene never needs to know which source is
 * active. Two-finger tap-to-pause is tracked here too: a second
 * simultaneous pointer both emits 'pause' and suppresses that touch from
 * being read as an aim/fire input.
 */

import Phaser from 'phaser';

import { EventEmitter } from '../utils/EventEmitter';

interface TrackedKeys {
  readonly left: Phaser.Input.Keyboard.Key;
  readonly right: Phaser.Input.Keyboard.Key;
  readonly a: Phaser.Input.Keyboard.Key;
  readonly d: Phaser.Input.Keyboard.Key;
  readonly space: Phaser.Input.Keyboard.Key;
  readonly esc: Phaser.Input.Keyboard.Key;
}

export class InputManager extends EventEmitter {
  private readonly _scene: Phaser.Scene;
  private readonly _keys: TrackedKeys;

  private _pointerX = 0;
  private _pointerY = 0;
  private _pointerDown = false;
  private _autoFire = false;
  private _hasFiredFirstInput = false;
  private _mobileLeftDown = false;
  private _mobileRightDown = false;
  private readonly _activePointerIds = new Set<number>();

  constructor(scene: Phaser.Scene) {
    super();
    this._scene = scene;

    const kb = scene.input.keyboard;
    if (!kb) throw new Error('InputManager requires a scene with keyboard input enabled');

    const Keys = Phaser.Input.Keyboard.KeyCodes;
    kb.addCapture([Keys.LEFT, Keys.RIGHT, Keys.SPACE]);

    this._keys = {
      left: kb.addKey(Keys.LEFT),
      right: kb.addKey(Keys.RIGHT),
      a: kb.addKey(Keys.A),
      d: kb.addKey(Keys.D),
      space: kb.addKey(Keys.SPACE),
      esc: kb.addKey(Keys.ESC),
    };

    this._keys.space.on('down', () => {
      this._autoFire = !this._autoFire;
      this._registerFirstInput();
    });
    this._keys.esc.on('down', () => this.emit('pause'));
    for (const key of [this._keys.left, this._keys.right, this._keys.a, this._keys.d]) {
      key.on('down', () => this._registerFirstInput());
    }

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this._pointerX = pointer.x;
      this._pointerY = pointer.y;
    });
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this._activePointerIds.add(pointer.id);
      this._registerFirstInput();
      if (this._activePointerIds.size >= 2) {
        // A second simultaneous touch is the pause gesture (§6.3), not aim/fire.
        this._pointerDown = false;
        this.emit('pause');
        return;
      }
      this._pointerDown = true;
      this._pointerX = pointer.x;
      this._pointerY = pointer.y;
    });
    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      this._activePointerIds.delete(pointer.id);
      this._pointerDown = false;
    });
  }

  /** Held state for the on-screen edge buttons (`ui/MobileMoveButtons.ts`) — merged into `getMoveDir()`. */
  setMobileMove(direction: -1 | 1, down: boolean): void {
    if (direction === -1) this._mobileLeftDown = down;
    else this._mobileRightDown = down;
  }

  /** Raw pointer/touch position, pre-snap — pass through resolveAim() before using. */
  getPointer(): { x: number; y: number } {
    return { x: this._pointerX, y: this._pointerY };
  }

  /** True while the gun should be firing — held pointer/touch, or auto-fire toggled on (§6.2). */
  isFiring(): boolean {
    return this._pointerDown || this._autoFire;
  }

  /** -1 (left) / 1 (right) / 0 — both or neither held cancels out to a stop. Merges keyboard + mobile buttons. */
  getMoveDir(): -1 | 0 | 1 {
    const left = this._keys.left.isDown || this._keys.a.isDown || this._mobileLeftDown;
    const right = this._keys.right.isDown || this._keys.d.isDown || this._mobileRightDown;
    if (left === right) return 0;
    return left ? -1 : 1;
  }

  /** Detaches every listener — call from the owning scene's shutdown handler. */
  destroy(): void {
    this._scene.input.off('pointermove');
    this._scene.input.off('pointerdown');
    this._scene.input.off('pointerup');
    this._activePointerIds.clear();
    this.removeAllListeners();
  }

  private _registerFirstInput(): void {
    if (this._hasFiredFirstInput) return;
    this._hasFiredFirstInput = true;
    this.emit('first-input');
  }
}
