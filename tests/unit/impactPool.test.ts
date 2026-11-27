import { describe, expect, it } from 'vitest';

import {
  IMPACT_CELEBRATION_MAX_LIVE,
  IMPACT_MAX_LIVE,
  ImpactPool,
  type PieceSpec,
} from '../../src/entities/waterParticle/impactPool';

interface FakePiece {
  destroyed: boolean;
  visible: boolean;
  [k: string]: unknown;
}

/** A scene that records the tweens it is given and lets a test finish them. */
function fakeScene() {
  const created: FakePiece[] = [];
  const tweens: { onComplete: () => void }[] = [];
  const make = (): FakePiece => {
    const p: FakePiece = { destroyed: false, visible: true };
    const chain = new Proxy(p, {
      get: (target, key: string) => {
        if (key in target) return target[key];
        if (key === 'destroy') return () => (target.destroyed = true);
        if (key === 'setVisible') return (v: boolean) => ((target.visible = v), chain);
        return () => chain;
      },
    });
    created.push(p);
    return chain;
  };
  const scene = {
    add: { rectangle: make, circle: make, triangle: make, star: make },
    tweens: { add: (cfg: { onComplete: () => void }) => tweens.push(cfg) },
  };
  return { scene: scene as never, created, tweens };
}

const spec = (over: Partial<PieceSpec> = {}): PieceSpec => ({
  kind: 'hit',
  shape: 'circle',
  size: 4,
  x: 0,
  y: 0,
  colour: 0xffffff,
  alpha: 1,
  to: { scale: 0.3 },
  duration: 100,
  ease: 'Linear',
  ...over,
});

describe('ImpactPool', () => {
  it('never has more than the cap alive and drops the rest', () => {
    const { scene, created } = fakeScene();
    const pool = new ImpactPool(scene);
    let played = 0;
    for (let i = 0; i < IMPACT_MAX_LIVE * 10; i++) if (pool.play(spec())) played++;
    expect(played).toBe(IMPACT_MAX_LIVE);
    expect(pool.live).toBe(IMPACT_MAX_LIVE);
    expect(created.length).toBe(IMPACT_MAX_LIVE);
  });

  it('reuses a finished piece instead of creating another', () => {
    const { scene, created, tweens } = fakeScene();
    const pool = new ImpactPool(scene);
    for (let round = 0; round < 50; round++) {
      pool.play(spec());
      tweens.splice(0).forEach((t) => t.onComplete());
    }
    expect(created.length).toBe(1);
    expect(pool.live).toBe(0);
  });

  it('keeps celebrations to their share so hit feedback is never crowded out', () => {
    const { scene } = fakeScene();
    const pool = new ImpactPool(scene);
    let party = 0;
    for (let i = 0; i < IMPACT_MAX_LIVE; i++) if (pool.play(spec({ kind: 'celebration' }))) party++;
    expect(party).toBe(IMPACT_CELEBRATION_MAX_LIVE);
    expect(pool.play(spec())).toBe(true);
  });

  it('retires a free piece of another shape rather than growing past the cap', () => {
    const { scene, created, tweens } = fakeScene();
    const pool = new ImpactPool(scene);
    for (let i = 0; i < IMPACT_MAX_LIVE; i++) pool.play(spec({ size: 4 }));
    tweens.splice(0).forEach((t) => t.onComplete());
    expect(pool.play(spec({ size: 9 }))).toBe(true);
    expect(created.filter((p) => !p.destroyed).length).toBe(IMPACT_MAX_LIVE);
  });
});
