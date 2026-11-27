import { describe, expect, it } from 'vitest';

import { INSTRUMENT_ICON_IDS, iconFor } from '../../src/audio/orchestra/icons';
import { SCORES } from '../../src/audio/scores';
import {
  mountBounce,
  mountSizes,
  mountTilt,
  mountTint,
} from '../../src/entities/spinner/mountGeometry';
import { INSTRUMENT_MOUNT } from '../../src/entities/spinner/spinner.data';

describe('instrument icons', () => {
  it('resolves every seat of every score to a known icon', () => {
    for (const score of SCORES) {
      for (const seat of score.seats) {
        expect(INSTRUMENT_ICON_IDS, `${score.id}/${seat.id}`).toContain(iconFor(seat));
      }
    }
  });

  it('has no icon that no seat uses', () => {
    const used = new Set(SCORES.flatMap((s) => s.seats.map((p) => iconFor(p))));
    expect(INSTRUMENT_ICON_IDS.filter((id) => !used.has(id))).toEqual([]);
  });

  it('lets a seat override its default icon', () => {
    const drums = SCORES.flatMap((s) => s.seats).find((p) => p.id === 'drums');
    expect(drums && iconFor(drums)).toBe('drum_kit');
  });

  it('reports the distinct icons each venue uses', () => {
    const counts = SCORES.map((s) => `${s.id}=${new Set(s.seats.map(iconFor)).size}`);
    console.log(`distinct icons per venue: ${counts.join(', ')}`);
    expect(INSTRUMENT_ICON_IDS.length).toBeLessThanOrEqual(36);
  });
});

describe('instrument mount maths', () => {
  it('leaves a clear ring of blade around the picture', () => {
    const { picture, disc } = mountSizes(40);
    expect(picture).toBeCloseTo(40 * INSTRUMENT_MOUNT.pictureFactor);
    expect(disc).toBeLessThan(40 * 0.8);
    expect(picture / 2).toBeLessThan(40);
  });

  it('tilts when quiet and stands upright while playing', () => {
    expect(mountTilt(true, 1)).toBe(INSTRUMENT_MOUNT.sleepTiltDegrees);
    expect(mountTilt(true, -1)).toBe(-INSTRUMENT_MOUNT.sleepTiltDegrees);
    expect(mountTilt(false, 1)).toBe(0);
    expect(mountTint(true)).toBeLessThan(mountTint(false));
    expect(mountTint(false)).toBe(0xffffff);
  });

  it('bounces on a pulse and clamps it', () => {
    expect(mountBounce(0, 40)).toEqual({ scale: 1, lift: 0 });
    expect(mountBounce(5, 40).scale).toBeCloseTo(1 + INSTRUMENT_MOUNT.pulseScale);
    expect(mountBounce(-1, 40).scale).toBe(1);
  });
});
