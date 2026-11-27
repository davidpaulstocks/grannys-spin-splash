/**
 * Who gets the stage (pure, no Phaser). The centre of the wall carries one big
 * message at a time. Higher priority replaces lower at once; an equal one
 * either replaces (a count-down number replaces the last) or is dropped (a
 * chance cheer does not butt in); a lower one is dropped. After the final
 * whistle only the finish and the verdict may speak.
 */

/** Priority, high to low: verdict, finish banner, Frenzy, count-in, count-down, stars, everything else. */
export const STAGE_PRIORITY = {
  other: 0,
  star: 1,
  countdown: 2,
  countIn: 3,
  frenzy: 4,
  finish: 5,
  verdict: 6,
} as const;

export type StagePriority = (typeof STAGE_PRIORITY)[keyof typeof STAGE_PRIORITY];

/** What an equal-priority newcomer does to the message already up. */
export type StageTie = 'replace' | 'drop';

/**
 * Whether `incoming` takes the stage. `current` is the priority on stage now
 * (null when empty); `floor` is the lowest priority allowed to speak (0 until
 * the final whistle).
 */
export function takesStage(
  current: StagePriority | null,
  incoming: StagePriority,
  tie: StageTie,
  floor: StagePriority = STAGE_PRIORITY.other,
): boolean {
  if (incoming < floor) return false;
  if (current === null) return true;
  if (incoming > current) return true;
  return incoming === current && tie === 'replace';
}
