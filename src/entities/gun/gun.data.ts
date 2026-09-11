/**
 * GUN_DEFS — launch roster of 6 guns × 8 angles each (CLAUDE.md §8.2).
 * Tier + cost are locked by spec; gameplay numbers (tank/drain/pump/
 * interval/power/streams/sz) are placeholder values that ramp loosely with
 * tier and will be tuned during Sprint 2 story 2.8 playtest pacing pass.
 */

import type { GunDef } from './gun.types';

export const GUN_DEFS: readonly GunDef[] = [
  {
    id: 'pistol',
    name: 'Drip Pistol',
    spriteKey: 'gun_pistol',
    tier: 1,
    cost: 0,
    tank: 60,
    drain: 1,
    pump: 25,
    interval: 220,
    power: 6,
    streams: 1,
    sz: 6,
    type: 'water',
  },
  {
    id: 'squirter',
    name: 'The Squirter',
    spriteKey: 'gun_squirter',
    tier: 1,
    cost: 0,
    tank: 80,
    drain: 1,
    pump: 25,
    interval: 200,
    power: 8,
    streams: 1,
    sz: 8,
    type: 'water',
  },
  {
    id: 'hose',
    name: 'Garden Hose',
    spriteKey: 'gun_hose',
    tier: 2,
    cost: 200,
    tank: 100,
    drain: 2,
    pump: 30,
    interval: 160,
    power: 10,
    streams: 1,
    sz: 10,
    type: 'water',
  },
  {
    id: 'splashjr',
    name: 'Splash Jr',
    spriteKey: 'gun_splashjr',
    tier: 2,
    cost: 500,
    tank: 110,
    drain: 2,
    pump: 35,
    interval: 150,
    power: 12,
    streams: 2,
    sz: 8,
    type: 'water',
  },
  {
    id: 'soaker3000',
    name: 'Soaker 3000',
    spriteKey: 'gun_soaker3000',
    tier: 3,
    cost: 1200,
    tank: 140,
    drain: 2,
    pump: 40,
    interval: 130,
    power: 14,
    streams: 2,
    sz: 10,
    type: 'water',
  },
  {
    id: 'inferno',
    name: 'Inferno',
    spriteKey: 'gun_inferno',
    tier: 4,
    cost: 5000,
    tank: 120,
    drain: 3,
    pump: 35,
    interval: 110,
    power: 20,
    streams: 1,
    sz: 12,
    type: 'fire',
  },
];

/** First-run default — appears selected on splash screen for new players. */
export const DEFAULT_GUN_ID = 'pistol';
