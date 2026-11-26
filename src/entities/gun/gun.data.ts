/**
 * GUN_DEFS — launch roster of 6 guns × 8 angles each (CLAUDE.md §8.2).
 * Tier + cost are locked by spec.
 *
 * **`tank` is sized so continuous fire lasts the whole round** (2026-09-12,
 * direct user feedback: "the water tank empties and then everything stops...
 * the water tank should last for the 30 seconds"). Each value is
 * `drain / (interval/1000) × ROUND_LENGTH_SECONDS × ~1.05`. Before this the
 * pistol ran dry after 13s of a 30s round and Inferno after **4.4s** — so the
 * better your gun, the more the run stopped dead, which is exactly backwards,
 * and with aim-to-fire it happened every round. Worse, it gutted the headline
 * feature: every instrument's gain tracks its spinner's charge (§9.1.1), so a
 * dry tank silences the orchestra mid-build.
 *
 * The pump is now a safety net for edge cases (a power-up burst, a very
 * trigger-happy player) rather than a rhythm the round is built around, and
 * the water bar becomes a second clock: it drains to nearly empty exactly as
 * time runs out, warming Water Blue → Gold → Heat Orange on the way
 * (`ui/WaterBar.ts`), which gives the round a visible tension curve for free.
 *
 * `power` was tuned against a live-simulated player (manual frame-stepping —
 * see BACKLOG.md) who commits to one spinner at a time until it hits FULL,
 * then moves to whichever spinner is lowest, swept against Garden's
 * 12-spinner wall.
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
 * **Fourth pass (2026-11-25), with the gig ladder.** The third pass solved
 * "Frenzy is unreachable on a twelve-spinner wall" by making every gun so
 * strong that a spinner went from stopped to full in a quarter of a second.
 * Measured with a bot playing like a child (retargets every 0.9 s, lands 80%
 * of the time): three stars on every Garden wall inside five seconds, and
 * the round then had nothing left in it. It also flattened the orchestra —
 * a musician's three tiers (outline, full part, ornament) flashed past
 * unheard — and left the six guns within 1.7x of each other, so buying one
 * changed nothing you could feel.
 *
 * The ladder removes the original problem at its root: the first gig is a
 * trio, not twelve, and `gigs.data.ts` slows each spinner's wind-down as the
 * band grows. So powers come back down to where a spinner takes about a
 * second to bring in with the starter gun, and the guns spread to 2.5x:
 * effective DPS 118 -> 140 -> 175 -> 200 -> 246 -> 300. Same child bot,
 * starter gun: trio full at ~5 s, six-piece at ~15 s, and the twelve-piece
 * Grand Concert gives one star to the child and three to a sharp player
 * near the end — which is what a better gun is then for.
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

/** Upgrade levels (see `gunLevels.ts`): every owned gun runs from level 1 to this. */
export const MIN_GUN_LEVEL = 1;
export const MAX_GUN_LEVEL = 5;
/** Each level above 1 adds this share of the gun's base `coinBoost` (level 5 = base x 1.6). */
export const GUN_LEVEL_COIN_STEP = 0.15;
/** Each level above 1 adds this share of the gun's base fill `power` (level 5 = base x 1.32). */
export const GUN_LEVEL_POWER_STEP = 0.08;
/** Upgrade price: `max(min, gun cost x share) x growth ^ (level - 1)`, rounded to the nearest `rounding`. */
export const GUN_UPGRADE_MIN_COST = 1500;
export const GUN_UPGRADE_BASE_COST_SHARE = 0.3;
export const GUN_UPGRADE_COST_GROWTH = 2;
export const GUN_UPGRADE_ROUNDING = 100;

export const GUN_DEFS: readonly GunDef[] = [
  {
    id: 'pistol',
    name: 'Drip Pistol',
    spriteKey: 'gun_pistol',
    tier: 1,
    cost: 0,
    tank: 150,
    drain: 1,
    interval: 220,
    power: 26,
    streams: 1,
    coinBoost: 1,
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
    tank: 160,
    drain: 1,
    interval: 200,
    power: 28,
    streams: 1,
    coinBoost: 1,
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
    cost: 6000,
    tank: 395,
    drain: 2,
    interval: 160,
    power: 28,
    streams: 1,
    coinBoost: 1.5,
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
    cost: 20000,
    tank: 420,
    drain: 2,
    interval: 150,
    power: 15,
    streams: 2,
    coinBoost: 2,
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
    cost: 60000,
    tank: 490,
    drain: 2,
    interval: 130,
    power: 16,
    streams: 2,
    coinBoost: 3,
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
    cost: 200000,
    tank: 865,
    drain: 3,
    interval: 110,
    power: 33,
    streams: 1,
    coinBoost: 5,
    sz: 12,
    type: 'fire',
    // The one fire-type weapon — heat orange makes the "fire" flavour
    // actually visible instead of shooting the same blue as everything else.
    particleColour: COLOUR.heatOrange,
  },
];

/** First-run default — appears selected on splash screen for new players. */
export const DEFAULT_GUN_ID = 'pistol';
