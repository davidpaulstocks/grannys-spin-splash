/**
 * Banks a finished gig into the save and builds the results-screen payload:
 * best rating kept, coins added, newly earned stars paid.
 */

import { starTargets, type GigDef } from '../../entities/world/gigs.data';
import type { WorldDef } from '../../entities/world/world.types';
import { recordGig } from '../../systems/Progress';
import { saveManager } from '../../systems/SaveManager';
import type { GigResultData } from '../../types/sceneData';

/** What a finished gig leaves behind, as the scene saw it. */
export interface FinishedGig {
  readonly world: WorldDef;
  readonly gig: GigDef;
  readonly score: number;
  readonly stars: number;
  readonly peakFullSpinners: number;
  readonly totalSpinners: number;
  readonly reachedFrenzy: boolean;
}

/** Writes the gig to the save and returns the data ResultsScene is started with. */
export function bankGig(finished: FinishedGig): GigResultData {
  const { world, gig, score, stars } = finished;
  // Bank the gig: best rating kept, coins added, newly earned stars paid.
  const result = recordGig(saveManager.load(), world.id, gig.index, stars, score);
  const save = result.save;
  const { previousBest, isNewBest } = result;
  // The world-wide best stays alongside the per-gig one (the dev harness and highScore read it).
  const beatsWorldBest = score > (save.bestByWorld[world.id] ?? 0);
  saveManager.save({
    ...save,
    highScore: Math.max(save.highScore, score),
    bestByWorld: beatsWorldBest ? { ...save.bestByWorld, [world.id]: score } : save.bestByWorld,
  });

  return {
    score,
    worldId: world.id,
    previousBest,
    isNewBest,
    targets: starTargets(gig),
    peakFullSpinners: finished.peakFullSpinners,
    totalSpinners: finished.totalSpinners,
    reachedFrenzy: finished.reachedFrenzy,
    gig: gig.index,
    stars,
    newStars: result.newStars,
    starCoins: result.starCoins,
  };
}
