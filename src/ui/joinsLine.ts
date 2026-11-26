/**
 * The line under NEXT GIG that says why to press it: who joins the band at
 * the next gig, or which venue is next when this was the last gig of one.
 */

import { musiciansJoining } from '../audio/scores';
import { gigFor } from '../entities/world/gigs.data';
import { WORLD_DEFS } from '../entities/world/world.data';
import type { TourStop } from '../systems/Progress';

/** "The Marimba joins!", "Cello and Harp join!", "Next stop: Workshop!", or null when nobody joins. */
export function joinsLine(venueId: string, gig: number, onward: TourStop): string | null {
  const venue = WORLD_DEFS.find((w) => w.id === venueId);
  const target = WORLD_DEFS.find((w) => w.id === onward.venueId);
  if (!venue || !target) return null;
  if (onward.venueId !== venueId) return `Next stop: ${target.name}!`;

  const names = musiciansJoining(venueId, gigFor(venue, gig).band, gigFor(venue, onward.gig).band);
  const last = names[names.length - 1];
  if (last === undefined) return null;
  if (names.length === 1) return `${/^the /i.test(last) ? '' : 'The '}${last} joins!`;
  return `${names.slice(0, -1).join(', ')} and ${last} join!`;
}
