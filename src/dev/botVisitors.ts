/**
 * How the dev balance bot deals with visitors: finds the live ones in the
 * scene's VisitorDirector (private, read at runtime like the rest of the bot's
 * view of GameScene), decides which it has noticed, and says where to aim to
 * shift it. Order of importance: a thief (it steals every half second), a
 * blocker covering instruments, then a treat (or balloons) in flight.
 */

import type { BotProfile } from './botProfiles';

/** The slice of a Visitor the bot reads. */
export interface LiveVisitor {
  readonly def: { readonly kind: string };
  readonly _phase: string;
  readonly occupied: readonly { readonly x: number; readonly y: number }[];
  readonly aimPoint: { readonly x: number; readonly y: number } | null;
}

/** The slice of VisitorDirector the bot reads. */
export interface DirectorView {
  readonly _live: readonly LiveVisitor[];
}

/** Lower is more urgent. */
export const PRIORITY = { thief: 0, blocker: 1, treat: 2 } as const;

/** Where to aim to deal with `visitor` right now, and how urgent it is; null if it is not something to aim at yet. */
export function aimFor(
  visitor: LiveVisitor,
): { readonly x: number; readonly y: number; readonly priority: number } | null {
  const { kind } = visitor.def;
  if (kind === 'sitter') {
    const host = visitor.occupied[0];
    const sitting = visitor._phase === 'drop' || visitor._phase === 'active';
    return host && sitting ? { x: host.x, y: host.y, priority: PRIORITY.thief } : null;
  }
  const point = visitor.aimPoint;
  if (!point) return null;
  // Balloons are a blocker that covers nothing: worth popping, but a treat's worth.
  const covers = kind === 'blocker' && visitor.occupied.length > 0;
  return { x: point.x, y: point.y, priority: covers ? PRIORITY.blocker : PRIORITY.treat };
}

/**
 * The most urgent live visitor this player has noticed. Each visitor is
 * noticed or not once, the first time it can be aimed at, by chance.
 */
export function pickVisitor(
  director: DirectorView,
  noticed: WeakMap<object, boolean>,
  bot: BotProfile,
  random: () => number,
): LiveVisitor | null {
  let best: LiveVisitor | null = null;
  let bestPriority = Infinity;
  for (const visitor of director._live) {
    const aim = aimFor(visitor);
    if (!aim) continue;
    let seen = noticed.get(visitor);
    if (seen === undefined) {
      seen = random() < bot.notice;
      noticed.set(visitor, seen);
    }
    if (seen && aim.priority < bestPriority) {
      best = visitor;
      bestPriority = aim.priority;
    }
  }
  return best;
}
