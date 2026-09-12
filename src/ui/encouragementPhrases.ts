/**
 * Short, upbeat phrases for the in-game encouragement toasts (2026-09-12,
 * direct user request: "as a player gets a spinner spinning, well done, or
 * let's go, or yes... gives them the encouragement"). Kept deliberately
 * generic and world-agnostic — this is separate from the per-world easter
 * eggs in `entities/world/world.data.ts`, which are specific celebratory
 * moments; these are frequent, small pats on the back.
 */

const PHRASES: readonly string[] = [
  'Nice!',
  "Let's go!",
  'Yes!',
  'Well done!',
  'Great splash!',
  'Keep it up!',
  'Woohoo!',
];

let _lastIndex = -1;

/** Picks a random encouragement phrase, never repeating the immediately previous one. */
export function pickEncouragementPhrase(): string {
  let index = Math.floor(Math.random() * PHRASES.length);
  if (index === _lastIndex) index = (index + 1) % PHRASES.length;
  _lastIndex = index;
  return PHRASES[index];
}
