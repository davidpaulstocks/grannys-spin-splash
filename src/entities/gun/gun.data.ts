/**
 * GUN_DEFS — launch roster of 6 guns × 8 angles each (CLAUDE.md §8.2).
 * Tier + cost are locked by spec; tank/drain/interval/streams/sz are
 * still first-pass placeholders. `power` values were tuned in Sprint 2
 * story 2.8 against a live-simulated player (manual frame-stepping —
 * see BACKLOG.md's Sprint 2 notes) who commits to one spinner at a time
 * until it hits FULL, then moves to whichever spinner is lowest, swept
 * against Garden's 12-spinner wall.
 *
 * The original placeholders gave pistol an effective DPS
 * (power × streams / interval) of ~27/s — confirmed live to never reach
 * SPLASH FRENZY in a 30s round; 10 of 12 spinners still read STOPPED at
 * round end. A first retune to ~82/s (the "charge every spinner exactly
 * once, back-to-back, zero decay" arithmetic minimum) still only reached
 * 1 spinner FULL at round end — the arithmetic minimum badly undersells
 * the real problem, which is maintaining earlier spinners while sweeping
 * the rest (they keep decaying the whole time you're elsewhere). Pushed
 * further and re-measured empirically until the simulated sweep showed
 * real convergence (4 of 12 FULL, zero STOPPED, at ~136/s) — that's the
 * number pistol now uses. The other 5 guns scale from it by the same
 * factor, keeping the original tier-cost ordering (effective DPS: 136 →
 * 185 → 294 → 493 → 662 → 754, pistol through Inferno).
 *
 * Still a first pass, not a final balance pass: this measures one
 * synthetic "commits and doesn't miss" strategy, not real human variance
 * (aim misses, distraction, exploring the wall) — needs a real playtest
 * to confirm "~50% of runs" specifically, not just "convergence is
 * possible for a disciplined player."
 */

import { COLOUR, shade } from '../../utils/colour';
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
    interval: 220,
    power: 30,
    streams: 1,
    sz: 6,
    type: 'water',
    // `sz`/`particleColour` were dead fields until 2026-09-12 (direct user
    // feedback: the 6 guns needed to "feel super different") — every gun
    // fired an identical blue dot regardless. Colours below are an
    // escalating ladder through CLAUDE.md §5.1's existing palette, no new
    // hex values: pale/thin water blue for the starter toy pistol.
    particleColour: shade(COLOUR.waterBlue, 1.3),
  },
  {
    id: 'squirter',
    name: 'The Squirter',
    spriteKey: 'gun_squirter',
    tier: 1,
    cost: 0,
    tank: 80,
    drain: 1,
    interval: 200,
    power: 37,
    streams: 1,
    sz: 8,
    type: 'water',
    // A punchier, deeper blue than the pistol — same tier, still a step up.
    particleColour: shade(COLOUR.waterBlue, 0.85),
  },
  {
    id: 'hose',
    name: 'Garden Hose',
    spriteKey: 'gun_hose',
    tier: 2,
    cost: 200,
    tank: 100,
    drain: 2,
    interval: 160,
    power: 47,
    streams: 1,
    sz: 10,
    type: 'water',
    // Garden/nature association for the coiled brass-nozzle hose.
    particleColour: COLOUR.mintGreen,
  },
  {
    id: 'splashjr',
    name: 'Splash Jr',
    spriteKey: 'gun_splashjr',
    tier: 2,
    cost: 500,
    tank: 110,
    drain: 2,
    interval: 150,
    power: 37,
    streams: 2,
    sz: 8,
    type: 'water',
    // Playful two-handed kid blaster — bright pink stands out against the
    // otherwise blue-family lineup, matching its already-visible dual stream.
    particleColour: COLOUR.grannyPink,
  },
  {
    id: 'soaker3000',
    name: 'Soaker 3000',
    spriteKey: 'gun_soaker3000',
    tier: 3,
    cost: 1200,
    tank: 140,
    drain: 2,
    interval: 130,
    power: 43,
    streams: 2,
    sz: 10,
    type: 'water',
    // Retro-futuristic twin-barrel — gold reads as the "big unlock" reward tier.
    particleColour: COLOUR.sunnyGold,
  },
  {
    id: 'inferno',
    name: 'Inferno',
    spriteKey: 'gun_inferno',
    tier: 4,
    cost: 5000,
    tank: 120,
    drain: 3,
    interval: 110,
    power: 83,
    streams: 1,
    sz: 12,
    type: 'fire',
    // The one fire-type weapon — heat orange makes the "fire" flavour
    // actually visible instead of shooting the same blue as everything else.
    particleColour: COLOUR.heatOrange,
  },
];

/** First-run default — appears selected on splash screen for new players. */
export const DEFAULT_GUN_ID = 'pistol';
