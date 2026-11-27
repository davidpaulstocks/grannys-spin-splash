/** The orchestra's answer to a spinner climbing a tier — shared by the gig and Jam. */

import type { Accent } from '../../audio/orchestra/setPieces';
import { SpinnerState } from '../../entities/spinner/spinner.types';

/** The orchestra's answer to a spinner climbing a tier — bigger for each step up. */
export const LEVEL_UP_ACCENT: Readonly<Record<SpinnerState, Accent>> = {
  [SpinnerState.STOPPED]: 'wake',
  [SpinnerState.SLOW]: 'wake',
  [SpinnerState.MEDIUM]: 'spin',
  [SpinnerState.FULL]: 'full',
};
