/** The per-frame payload GameScene hands the HUD (src/types/hud.ts), assembled from the round's live state. */

import type { WaterCannon } from '../../entities/waterParticle/WaterCannon';
import type { GunDef } from '../../entities/gun/gun.types';
import type { Spinner } from '../../entities/spinner/Spinner';
import type { HudRefreshData } from '../../types/hud';
import type { RewardLoop } from './RewardLoop';

const PERCENT = 100;

/** What the snapshot is read from. */
export interface HudSources {
  readonly timeRemainingMs: number;
  readonly now: number;
  readonly cannon: WaterCannon;
  readonly gun: GunDef;
  readonly spinners: readonly Spinner[];
  readonly reward: RewardLoop;
}

/** Builds one frame's HUD data: clock, water, the wall's spinners, and the coin/stars/groove readout. */
export function buildHudData(s: HudSources): HudRefreshData {
  return {
    secondsRemaining: s.timeRemainingMs / 1000,
    waterPct: (s.cannon.tank / s.gun.tank) * PERCENT,
    isPumping: s.cannon.isPumping,
    spinners: s.spinners.map((sp) => ({
      x: sp.x,
      y: sp.y,
      r: sp.def.r,
      currentSpeed: sp.playingSpeed,
      currentState: sp.playingState,
    })),
    coins: s.reward.displayedCoins(s.now),
    starTargets: s.reward.targets,
    stars: s.reward.stars,
    grooveLevel: s.reward.groove.level,
    grooveRing: s.reward.groove.ring,
    jackpot: s.reward.jackpot,
  };
}
