/** SDK event ordering — verifies init → gameLoadingFinished → gameplayStart → commercialBreak fires correctly. Populated in Sprint 6. */

import { describe, it } from 'vitest';

describe('Poki SDK ad flow', () => {
  it.todo('fires gameplayStart only on first input, never on scene load');
  it.todo('mutes audio before commercialBreak resolves');
  it.todo('unmutes audio + restarts gameplay after commercialBreak resolves');
});
