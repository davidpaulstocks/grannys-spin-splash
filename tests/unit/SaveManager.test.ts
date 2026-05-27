/**
 * SaveManager unit tests. Story 0.8 lands one sanity check against the
 * SaveData schema — the full localStorage try/catch coverage arrives in
 * Sprint 1 story 1.1 when SaveManager is implemented.
 */

import { describe, expect, it } from 'vitest';

import { SAVE_VERSION } from '../../src/types/save';

describe('SaveData schema', () => {
  it('starts at version 1 for the v1 launch', () => {
    expect(SAVE_VERSION).toBe(1);
  });
});
