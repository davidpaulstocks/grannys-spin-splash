/** The two numbers that give a gun's stream its look: how dense the shots are and how far apart twin barrels sit. Shared by the cannon and the gun reveal's demo range. */

/**
 * Visual-only stream density (2026-09-12, direct user feedback: "the water
 * guns felt much stronger... like they were blasting strongly" — the
 * prototype fires every 28ms, ~8x denser than this game's tuned 110-220ms
 * gun intervals). Rather than touch the tuned interval/power/drain balance
 * in gun.data.ts, the fire cadence, the per-particle power and the drain are
 * all scaled by the same factor, so total DPS and drain-per-second are
 * mathematically unchanged — only the granularity gets finer, which is what
 * actually reads as a dense continuous stream instead of discrete pulses.
 */
export const FIRE_DENSITY_SCALE = 4;

/**
 * Twin-barrel spacing, px (2026-09-12, direct user feedback: multi-stream
 * guns needed streams "aligning to barrels of gun," not just wobble off one
 * shared point). No gun's anchor.json authors a second nozzle position, so
 * each stream is offset a fixed distance perpendicular to the aim direction
 * — a runtime approximation, not real per-barrel art, but it reads as two
 * barrels rather than one.
 */
export const BARREL_SPACING_PX = 7;
