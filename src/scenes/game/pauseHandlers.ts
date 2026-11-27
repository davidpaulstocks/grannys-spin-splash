/**
 * The scene's pause and resume handlers, taken off again when it shuts down.
 * A Phaser scene object survives every restart, so a listener added in
 * `create()` and never removed is added again for every gig.
 */

import Phaser from 'phaser';

/**
 * A paused scene never sees fingers lift, so held pointer state is dropped
 * both ways (see InputManager.resetPointerState); `onPause` also gives the OS
 * cursor back. Both handlers are removed on shutdown.
 */
export function bindPauseHandlers(
  scene: Phaser.Scene,
  onPause: () => void,
  onResume: () => void,
): void {
  scene.events.on(Phaser.Scenes.Events.PAUSE, onPause);
  scene.events.on(Phaser.Scenes.Events.RESUME, onResume);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.PAUSE, onPause);
    scene.events.off(Phaser.Scenes.Events.RESUME, onResume);
  });
}
