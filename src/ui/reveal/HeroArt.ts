/**
 * Loads a gun's big "hero" picture when a reveal opens (never at boot: eighteen of
 * them are about 0.6 MB the player may never need). The film waits for it, but
 * only briefly: if it has not arrived in `HERO_WAIT_MS` the reveal starts with
 * the small in-game picture rather than making the player wait. The hero texture
 * is removed when the reveal closes.
 */

import type Phaser from 'phaser';

import { SPRITE_KEYS } from '../../assets/keys';
import type { RevealTracker } from './RevealTracker';

/** How long the reveal waits for the hero picture before using the small one. */
export const HERO_WAIT_MS = 400;

export interface HeroArt {
  /** Cancels a load still waiting (the reveal closed). */
  cancel(): void;
  /** Frees the hero texture this reveal loaded. */
  release(): void;
}

/**
 * Makes `onReady(textureKey)` run once: with the hero picture's key as soon as
 * it is loaded, or with the small picture's key after `HERO_WAIT_MS`.
 */
export function loadHeroArt(
  scene: Phaser.Scene,
  tracker: RevealTracker,
  gunId: string,
  onReady: (textureKey: string) => void,
): HeroArt {
  const heroKey = SPRITE_KEYS.gunHero(gunId);
  const smallKey = SPRITE_KEYS.gun(gunId);
  let settled = false;
  let loadedHere = false;
  const eventName = `filecomplete-image-${heroKey}`;
  const settle = (key: string): void => {
    if (settled) return;
    settled = true;
    scene.load.off(eventName, onFile);
    onReady(key);
  };
  const onFile = (): void => settle(heroKey);

  if (scene.textures.exists(heroKey)) {
    settle(heroKey);
  } else {
    scene.load.once(eventName, onFile);
    scene.load.image(heroKey, SPRITE_KEYS.gunHeroPath(gunId));
    loadedHere = true;
    if (!scene.load.isLoading()) scene.load.start();
    tracker.delay(HERO_WAIT_MS, () => settle(scene.textures.exists(smallKey) ? smallKey : heroKey));
  }
  return {
    cancel: () => {
      settled = true;
      scene.load.off(eventName, onFile);
    },
    release: () => {
      if (loadedHere && scene.textures.exists(heroKey)) scene.textures.remove(heroKey);
    },
  };
}
