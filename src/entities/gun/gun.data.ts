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
 * the rest (they keep decaying the whole time you're elsewhere). A second
 * pass reached ~136/s and 4 of 12 FULL, which was where it was left.
 *
 * **Third pass (2026-09-12), measured against the prototype rather than
 * against itself.** A clean bot round (Phaser's own rAF stopped so only
 * stepped frames advance the clock — without that, throttled rAF injects
 * ~1s-delta frames that decay the whole wall and silently invalidate every
 * reading) reproduced ~136/s exactly: 4 of 12 FULL, no Frenzy, in a full
 * 30s round. Two things were then found by reading the prototype:
 *
 * 1. It fires a particle every **28 ms** and each hit adds the SPINNER's
 *    own `power` (pinwheel 28, fan 32) — roughly **1000 units/s**, against
 *    a Garden wall that decays at 108/s total. Nearly 10x headroom. Ours
 *    had 1.26x, and only ~44/s actually landed once pipeline overflow is
 *    counted (~0.6 s of water is always in flight, so every target switch
 *    dumps charge onto a spinner that is already full).
 * 2. The prototype canvas is 960x540 against this game's 1280x720 — see
 *    WATER_PARTICLE_SPEED in config.ts for the 4/3 rescale that fixes the
 *    travel-time half of the same regression.
 *
 * Powers now target a monotonic effective DPS of 409 → 460 → 519 → 573 →
 * 615 → 700 (pistol through Inferno). Measured with an in-flight-aware bot
 * (it counts water already committed to a spinner instead of waiting to
 * *see* FULL, which is what a human sweeping the wall actually does):
 * pistol at 409/s reaches Frenzy twice in a 30s Garden round, and the
 * identical bot at the old 136/s reaches it zero times with only 4 of 12
 * ever FULL — so the ladder, not the bot, is what unlocks the mechanic.
 *
 * **Why the top end is compressed to 1.7x rather than the ~2.5x spread a
 * straight power-scaling suggested.** At 846/s a mid-tier gun hit Frenzy
 * 8 times in one Disco round and Inferno at 1018/s hit it 12 times in
 * Garden — legitimately re-earned each time (FrenzyMeter's rising edge is
 * sound), but a wall that is permanently full flatlines the thing the game
 * is actually built around: §9.1.1 drives every instrument's gain from its
 * own spinner's charge, so the ASMR build-and-release only exists while the
 * wall still breathes. Frenzy also stops reading as a payoff if it is the
 * default state. The remaining guns still feel distinct through tank size,
 * fire interval, stream count and particle colour — DPS is not the only
 * axis, and it is the one that most directly trades against the audio.
 *
 * Still not a substitute for a real playtest: the bot has perfect aim and
 * never gets distracted, and it uses no power-ups (Spin Lock suspends decay
 * outright, which is close to a free Frenzy). Expect a real seven-year-old
 * to land well under the bot's rate — confirm "~50% of runs" with a person,
 * ideally the original 6-year-old.
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
    power: 90,
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
    power: 92,
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
    power: 83,
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
    power: 43,
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
    power: 40,
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
    power: 77,
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
