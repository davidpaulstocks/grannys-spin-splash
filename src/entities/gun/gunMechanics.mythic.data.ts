/**
 * How the six mythic guns past MEGA CANNON shoot, one character each: the Volcano Blaster slow and
 * heavy, the Unicorn Sparkler fast and light, the Kraken three tentacle streams, the Star Pony twin
 * ribbons, Robo-Rex one very wide beam and the Phoenix Fury the fastest and widest of all. The
 * numbers keep the ladder's rule (`power x streams` and `tank / drain` never go down, a tank lasts a
 * whole gig); the gentle rise in damage is deliberate, the steep rise is in coins (gun.data.ts).
 */

import { COLOUR, shade } from '../../utils/colour';
import type { GunMechanics } from './gun.types';

const LAVA = shade(COLOUR.heatOrange, 1.05);
const LAVA_CRUST = shade(COLOUR.ink, 1.4);
const INK_TENTACLE = shade(COLOUR.ink, 1.25);
const SUCKER = shade(COLOUR.grannyPink, 1.15);
const KRAKEN_SPACING = 26;
const PONY_SPACING = 14;
const GLITTER_PINK = shade(COLOUR.grannyPink, 1.2);

export const MYTHIC_MECHANICS: Readonly<Record<string, GunMechanics>> = {
  volcano_blaster: {
    tier: 6,
    tank: 2200,
    drain: 5,
    interval: 150,
    power: 42,
    streams: 1,
    sz: 26,
    type: 'fire',
    projectile: 'lava',
    particleColour: LAVA,
    accentColour: LAVA_CRUST,
  },
  unicorn_sparkler: {
    tier: 6,
    tank: 2600,
    drain: 5,
    interval: 60,
    power: 44,
    streams: 1,
    sz: 5,
    type: 'water',
    projectile: 'glitter',
    particleColour: GLITTER_PINK,
    accentColour: COLOUR.sunnyGold,
  },
  kraken_cannon: {
    tier: 6,
    tank: 2800,
    drain: 5,
    interval: 100,
    power: 15,
    streams: 3,
    sz: 9,
    type: 'water',
    projectile: 'kraken',
    particleColour: INK_TENTACLE,
    accentColour: SUCKER,
    barrelSpacing: KRAKEN_SPACING,
  },
  star_pony: {
    tier: 7,
    tank: 3000,
    drain: 5,
    interval: 90,
    power: 23,
    streams: 2,
    sz: 10,
    type: 'water',
    projectile: 'starpony',
    particleColour: COLOUR.grannyPink,
    accentColour: COLOUR.sunnyGold,
    barrelSpacing: PONY_SPACING,
  },
  robo_rex: {
    tier: 7,
    tank: 3200,
    drain: 5,
    interval: 90,
    power: 50,
    streams: 1,
    sz: 18,
    type: 'water',
    projectile: 'vortex',
    particleColour: COLOUR.waterBlue,
    accentColour: COLOUR.mintGreen,
  },
  phoenix_fury: {
    tier: 7,
    tank: 3500,
    drain: 5,
    interval: 55,
    power: 56,
    streams: 1,
    sz: 22,
    type: 'fire',
    projectile: 'phoenix',
    particleColour: COLOUR.sunnyGold,
    accentColour: COLOUR.grannyPink,
  },
};
