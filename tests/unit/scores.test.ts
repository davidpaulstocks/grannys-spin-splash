import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

import { Conductor } from '../../src/audio/orchestra/Conductor';
import {
  HALL_ROOM,
  resolveRoom,
  type OrchestraGraph,
} from '../../src/audio/orchestra/OrchestraGraph';
import {
  ORCHESTRAL_PALETTE,
  PITCHED_ROLES,
  resolvePalette,
  ROLE_RANGES,
  UNPITCHED_ROLES,
} from '../../src/audio/orchestra/palette';
import { STEPS_PER_BAR } from '../../src/audio/orchestra/pattern';
import type { SampleBank } from '../../src/audio/orchestra/SampleBank';
import { BARS_PER_FORM, type PaletteRole } from '../../src/audio/orchestra/score.types';
import { isInScale, pitchClass } from '../../src/audio/orchestra/theory';
import { resolveScore, SCORES } from '../../src/audio/scores';

interface Played {
  readonly instrument: string;
  readonly midi: number;
  readonly gain: number;
}

/** Runs a score through its whole form with every musician at the given charge and records each note. */
function perform(
  scoreId: string,
  charge: number,
  flags = { frenzy: false, finale: false },
): Played[] {
  const played: Played[] = [];
  const bank = {
    play: (
      _c: unknown,
      _d: unknown,
      instrument: string,
      midi: number,
      _w: number,
      o: { gain: number },
    ) => played.push({ instrument, midi, gain: o.gain }),
  } as unknown as SampleBank;
  const graph = { channel: () => ({}) } as unknown as OrchestraGraph;
  const score = resolveScore(scoreId);
  const conductor = new Conductor(score, bank);
  const charges = new Array<number>(conductor.seatCount).fill(charge);
  for (let step = 0; step < STEPS_PER_BAR * BARS_PER_FORM; step++) {
    conductor.scheduleStep({} as BaseAudioContext, graph, step, step, { charges, ...flags });
  }
  return played;
}

describe.each(SCORES.map((score) => [score.id, score] as const))('score: %s', (id, score) => {
  it('compiles', () => {
    expect(() => perform(id, 1)).not.toThrow();
  });

  it('stays in its key in every tier, the finale and the frenzy', () => {
    const tonic = pitchClass(score.tonic);
    const everything = [
      ...perform(id, 0.2),
      ...perform(id, 0.6),
      ...perform(id, 1, { frenzy: true, finale: true }),
    ];
    const strays = everything.filter((n) => n.midi > 0 && !isInScale(n.midi, tonic, score.mode));
    expect(strays).toEqual([]);
  });

  it('keeps every pitched note inside a playable range', () => {
    const pitched = perform(id, 1, { frenzy: true, finale: true }).filter((n) => n.midi > 0);
    expect(Math.min(...pitched.map((n) => n.midi))).toBeGreaterThanOrEqual(26);
    expect(Math.max(...pitched.map((n) => n.midi))).toBeLessThanOrEqual(100);
  });

  it('adds music as musicians wake: silent wall < waking < spinning < full speed', () => {
    const counts = [0, 0.2, 0.6, 1].map((charge) => perform(id, charge).length);
    expect(counts[0]).toBeGreaterThan(0); // the bed never stops
    expect(counts[1]).toBeGreaterThan(counts[0] ?? 0);
    expect(counts[2]).toBeGreaterThan(counts[1] ?? 0);
    expect(counts[3]).toBeGreaterThan(counts[2] ?? 0);
  });

  it('gives every seat a unique id and a name to show the player', () => {
    const ids = score.seats.map((seat) => seat.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(score.seats.every((seat) => seat.name.length > 0)).toBe(true);
  });
});

/** What each recorded instrument is and how far it reaches, read from the shipped sprite indexes. */
interface RecordedInstrument {
  readonly pitched: boolean;
  readonly low: number;
  readonly high: number;
}

function readBank(path: string): Map<string, RecordedInstrument> {
  const index = JSON.parse(readFileSync(path, 'utf8')) as {
    instruments: Record<string, { pitched: boolean; samples: readonly { midi: number | null }[] }>;
  };
  return new Map(
    Object.entries(index.instruments).map(([id, instrument]) => {
      const notes = instrument.samples.flatMap((s) => (s.midi === null ? [] : [s.midi]));
      return [
        id,
        { pitched: instrument.pitched, low: Math.min(...notes), high: Math.max(...notes) },
      ] as const;
    }),
  );
}

const ORCHESTRA = readBank('public/audio/orchestra.json');
const KITCHEN = readBank('public/audio/bands/kitchen.json');
const KIT = readBank('public/audio/bands/kit.json');

/** Every bank loads at boot whatever the venue (SampleBank, BAND_SPRITES), so any venue's set pieces may use any recorded instrument. */
const ALL_BANKS = [ORCHESTRA, KITCHEN, KIT];

/** How far beyond its recorded notes an instrument may be retuned before it stops sounding like itself. */
const MAX_RETUNE_SEMITONES = 12;

function recorded(_venue: string, instrument: string): RecordedInstrument | undefined {
  for (const bank of ALL_BANKS) {
    const found = bank.get(instrument);
    if (found) return found;
  }
  return undefined;
}

describe('rooms and palettes', () => {
  it('gives Garden the hall and the orchestra', () => {
    const garden = resolveScore('garden');
    expect(resolveRoom(garden)).toEqual(HALL_ROOM);
    expect(resolvePalette(garden).instruments).toEqual(ORCHESTRAL_PALETTE);
    expect(resolvePalette(garden).leadDrive).toBe(0);
    for (const role of Object.keys(ORCHESTRAL_PALETTE) as PaletteRole[]) {
      expect(resolvePalette(garden).shift(role)).toBe(0);
    }
  });

  it('puts each band in a different room from the hall, as specified', () => {
    const hall = HALL_ROOM;
    const send = (id: string): number =>
      resolveRoom(resolveScore(id)).reverbSendMin / hall.reverbSendMin;
    expect(send('kitchen')).toBeCloseTo(0.5);
    expect(send('workshop')).toBeCloseTo(0.25);
    expect(send('funfair')).toBeCloseTo(2 / 3);
    expect(send('disco')).toBeGreaterThan(1);
    expect(send('ship')).toBeCloseTo(0.3);
    expect(resolveRoom(resolveScore('ship')).toneMinHz).toBeGreaterThanOrEqual(6500 - 1);
    expect(resolveRoom(resolveScore('workshop')).toneMinHz).toBeGreaterThanOrEqual(7000 - 1);
    expect(resolveRoom(resolveScore('disco')).toneMinHz).toBeGreaterThanOrEqual(6000 - 1);
    for (const score of SCORES) {
      const room = resolveRoom(score);
      expect(room.reverbSendMax).toBeGreaterThanOrEqual(room.reverbSendMin);
      expect(room.toneMinHz).toBeGreaterThan(0);
    }
  });

  describe.each(SCORES.map((score) => [score.id, score] as const))('palette: %s', (id, score) => {
    const palette = resolvePalette(score);
    const roles = Object.keys(ORCHESTRAL_PALETTE) as PaletteRole[];

    it('names an instrument the venue can load for every role', () => {
      for (const role of roles) {
        expect(
          recorded(id, palette.instruments[role]),
          `${role}: ${palette.instruments[role]}`,
        ).toBeDefined();
      }
    });

    it('puts unpitched roles on unpitched instruments and pitched roles on pitched ones', () => {
      for (const role of UNPITCHED_ROLES) {
        expect(recorded(id, palette.instruments[role])?.pitched, role).toBe(false);
      }
      for (const role of PITCHED_ROLES) {
        expect(recorded(id, palette.instruments[role])?.pitched, role).toBe(true);
      }
    });

    it('keeps every pitched role within retuning distance of what the instrument recorded', () => {
      const pitchedRoles: PaletteRole[] = [...PITCHED_ROLES];
      if (recorded(id, palette.instruments.boom)?.pitched) pitchedRoles.push('boom');
      for (const role of pitchedRoles) {
        const range = ROLE_RANGES[role];
        const instrument = recorded(id, palette.instruments[role]);
        if (!range || !instrument) throw new Error(`no range for ${role}`);
        const shift = palette.shift(role);
        expect(Math.abs(shift % 12), `${role} shift stays in key`).toBe(0);
        expect(range.low + shift, `${role} low`).toBeGreaterThanOrEqual(
          instrument.low - MAX_RETUNE_SEMITONES,
        );
        expect(range.high + shift, `${role} high`).toBeLessThanOrEqual(
          instrument.high + MAX_RETUNE_SEMITONES,
        );
      }
    });
  });

  it('seats the Workshop as a rock band: drums, bass, rhythm guitar, lead guitar first', () => {
    const workshop = resolveScore('workshop');
    expect(workshop.lineup.slice(0, 4)).toEqual(['drums', 'bass', 'rhythm', 'lead']);
    expect(workshop.bpm).toBeLessThanOrEqual(140);
    expect(workshop.seats).toHaveLength(15);
    expect(new Set(workshop.lineup)).toEqual(new Set(workshop.seats.map((seat) => seat.id)));
    const drums = workshop.seats.find((seat) => seat.id === 'drums');
    const loudest = Math.max(...workshop.seats.map((seat) => seat.level));
    expect(drums?.level).toBe(loudest);
  });

  it('plays the Workshop guitars through the amp in the frenzy too', () => {
    const driven = resolveScore('workshop').frenzy.filter((l) => (l.drive ?? 0) > 0);
    expect(driven.length).toBeGreaterThanOrEqual(2);
  });

  it('seats the Pirate Ship as a sea-shanty band: bass, harmony and tune first, eighteen in all', () => {
    const ship = resolveScore('ship');
    expect(ship.lineup.slice(0, 3)).toEqual(['bass', 'squeezebox', 'fiddle']);
    expect(ship.seats).toHaveLength(18);
    expect(ship.bpm).toBeGreaterThanOrEqual(100);
    expect(ship.bpm).toBeLessThanOrEqual(108);
    expect(ship.swing).toBeGreaterThan(0);
  });
});
