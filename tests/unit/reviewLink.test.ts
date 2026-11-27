import { describe, expect, it, vi } from 'vitest';

// BootScene pulls in Phaser, which needs a canvas; the function under test needs none of it.
vi.mock('phaser', () => ({
  default: {
    Scene: function Scene(): void {
      // Stand-in base class: BootScene only needs something to extend.
    },
  },
}));
vi.mock('../../src/poki', () => ({}));
vi.mock('../../src/audio/AudioOrchestra', () => ({ audioOrchestra: {} }));
vi.mock('../../src/entities/world/worldBackgrounds', () => ({
  preloadWorldBackground: () => undefined,
}));
vi.mock('../../src/ui/touchControls', () => ({ usesTouchControls: () => false }));
vi.mock('../../src/config', () => ({ GAME_WIDTH: 1280, GAME_HEIGHT: 720 }));

const { reviewLink, jamLink } = await import('../../src/scenes/BootScene');

describe('review link', () => {
  it('is off unless a real venue is named', () => {
    expect(reviewLink('')).toBeNull();
    expect(reviewLink('?gig=3')).toBeNull();
    expect(reviewLink('?venue=moon')).toBeNull();
  });

  it('opens the named venue at the named gig, counting gigs from 1', () => {
    expect(reviewLink('?venue=kitchen&gig=2')).toEqual({ worldId: 'kitchen', gig: 1 });
    expect(reviewLink('?venue=garden')).toEqual({ worldId: 'garden', gig: 0 });
  });

  it('never yields a negative or non-numeric gig', () => {
    expect(reviewLink('?venue=disco&gig=0')?.gig).toBe(0);
    expect(reviewLink('?venue=disco&gig=abc')?.gig).toBe(0);
  });
});

describe('jam link', () => {
  it('is off unless a real venue is named', () => {
    expect(jamLink('')).toBeNull();
    expect(jamLink('?jam=moon')).toBeNull();
    expect(jamLink('?venue=garden')).toBeNull();
  });

  it('opens the named venue', () => {
    expect(jamLink('?jam=garden')).toEqual({ worldId: 'garden' });
    expect(jamLink('?jam=disco')).toEqual({ worldId: 'disco' });
  });
});
