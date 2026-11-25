/**
 * Builds the "spinner orchestra" audio sprite from VSCO-2 Community Edition (CC0).
 *
 *   node tools/build-orchestra-samples.ts            build public/audio/orchestra.{mp3,json}
 *   node tools/build-orchestra-samples.ts --probe <repo path>...   print pitch/onset/envelope of raw files
 *
 * Reads tools/orchestra-manifest.json, downloads (cached in .cache/vsco/), processes each
 * sample (mono, 32 kHz, onset trim, max-length cut + fade, -3 dBFS peak), measures the real
 * fundamental of pitched samples (YIN) and packs everything into one mono MP3 + JSON index.
 * Zero npm dependencies: needs ffmpeg and lame on PATH. Idempotent.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------- constants
const SAMPLE_RATE = 32000;
const REPO_RAW_BASE = 'https://raw.githubusercontent.com/sgossner/VSCO-2-CE/master/';
const LEAD_SILENCE_S = 0.1;
const SYNC_BURST_S = 0.002;
const SYNC_FREQ_HZ = 1000;
const POST_SYNC_SILENCE_S = 0.3;
const SAMPLE_GAP_S = 0.08;
const ONSET_THRESHOLD_DB = -45;
const ONSET_PREROLL_S = 0.004;
const TAIL_SILENCE_DB = -60;
const TAIL_WINDOW_S = 0.01;
const NATURAL_END_FADE_S = 0.008;
const CUT_FADE_S = 0.12;
const SHORT_CUT_FADE_S = 0.04;
const SHORT_CUT_LIMIT_S = 0.6;
const PEAK_TARGET_DB = -3;
const STEADY_START_FRAC = 0.15;
const STEADY_END_FRAC = 0.7;
const YIN_WINDOWS = 5;
const YIN_THRESHOLD = 0.15;
const YIN_MIN_HZ = 28;
const YIN_MAX_HZ = 4500;
const DOWNLOAD_CONCURRENCY = 6;
const DOWNLOAD_RETRIES = 4;
const LAME_VBR_QUALITY = process.env.ORCHESTRA_VBR ?? '5';
const FLAT_CENTS_WARN = 30;
const ROLE_WARN_SEMITONES = 3;
const SUBHARMONIC_WINDOW = 8192;
const SUBHARMONIC_RATIO = 0.1;
const SUBHARMONIC_MAX_STEPS = 2;

const TOOLS_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(TOOLS_DIR, '..');
const CACHE_DIR = join(ROOT, '.cache', 'vsco');
const WORK_DIR = join(ROOT, '.cache', 'orchestra');
const MANIFEST_PATH = join(TOOLS_DIR, 'orchestra-manifest.json');
const OUT_DIR = join(ROOT, 'public', 'audio');
const OUT_MP3 = join(OUT_DIR, 'orchestra.mp3');
const OUT_JSON = join(OUT_DIR, 'orchestra.json');

// ---------------------------------------------------------------- types
interface ManifestSample {
  file: string;
  role: string;
  /** Override of ONSET_THRESHOLD_DB for samples with a deliberately quiet lead-in. */
  onsetDb?: number;
  /** Override of SUBHARMONIC_RATIO for samples whose real fundamental is weak (verified by spectrum). */
  subharmonicRatio?: number;
}
interface ManifestInstrument {
  priority: 'P1' | 'P2' | 'P3';
  pitched: boolean;
  maxLength: number;
  /** false for inharmonic instruments (mallets, drums) where the sub-octave check is meaningless. */
  octaveCheck?: boolean;
  samples: ManifestSample[];
}
interface Manifest {
  source: { repo: string; branch: string; license: string };
  instruments: Record<string, ManifestInstrument>;
}
interface Processed {
  id: string;
  role: string;
  file: string;
  pcm: Float32Array;
  midi: number | null;
  cents: number;
  measuredHz: number | null;
  rms: number;
  nameDoubt: string | null;
}
interface IndexSample {
  midi: number | null;
  cents: number;
  start: number;
  duration: number;
  rms: number;
}

// ---------------------------------------------------------------- download / decode
function cachePath(repoPath: string): string {
  return join(CACHE_DIR, repoPath);
}

async function downloadOne(repoPath: string): Promise<void> {
  const dest = cachePath(repoPath);
  if (existsSync(dest) && statSync(dest).size > 0) return;
  const url = REPO_RAW_BASE + repoPath.split('/').map(encodeURIComponent).join('/');
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= DOWNLOAD_RETRIES; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      const buf = Buffer.from(await res.arrayBuffer());
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest + '.part', buf);
      // atomic-ish rename
      execFileSync('mv', [dest + '.part', dest]);
      return;
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 500 * attempt));
    }
  }
  throw new Error(`download failed: ${repoPath}: ${String(lastErr)}`);
}

async function downloadAll(paths: string[]): Promise<void> {
  const queue = [...new Set(paths)];
  let done = 0;
  const workers = Array.from({ length: DOWNLOAD_CONCURRENCY }, async () => {
    for (;;) {
      const next = queue.shift();
      if (next === undefined) return;
      await downloadOne(next);
      done++;
      if (done % 10 === 0) console.log(`  downloaded ${done}`);
    }
  });
  await Promise.all(workers);
}

function decodeMono32k(repoPath: string): Float32Array {
  const out = execFileSync(
    'ffmpeg',
    [
      '-v',
      'error',
      '-i',
      cachePath(repoPath),
      '-ac',
      '1',
      '-ar',
      String(SAMPLE_RATE),
      '-f',
      'f32le',
      '-',
    ],
    { maxBuffer: 1 << 29 },
  );
  const copy = new Uint8Array(out).buffer;
  return new Float32Array(copy, 0, Math.floor(copy.byteLength / 4));
}

// ---------------------------------------------------------------- DSP helpers
function peakOf(x: Float32Array): number {
  let p = 0;
  for (const v of x) {
    const a = Math.abs(v);
    if (a > p) p = a;
  }
  return p;
}

function dbToLin(db: number): number {
  return Math.pow(10, db / 20);
}

function findOnset(x: Float32Array, thresholdDb: number = ONSET_THRESHOLD_DB): number {
  const thr = peakOf(x) * dbToLin(thresholdDb);
  for (let i = 0; i < x.length; i++) {
    if (Math.abs(x[i] ?? 0) > thr) return i;
  }
  return 0;
}

function findLastAudible(x: Float32Array): number {
  const thr = peakOf(x) * dbToLin(TAIL_SILENCE_DB);
  const win = Math.round(TAIL_WINDOW_S * SAMPLE_RATE);
  for (let end = x.length; end > 0; end -= win) {
    const from = Math.max(0, end - win);
    for (let i = from; i < end; i++) {
      if (Math.abs(x[i] ?? 0) > thr) return end;
    }
  }
  return x.length;
}

function applyFadeOut(x: Float32Array, fadeS: number): void {
  const n = Math.min(x.length, Math.round(fadeS * SAMPLE_RATE));
  for (let i = 0; i < n; i++) {
    const idx = x.length - n + i;
    const g = 0.5 * (1 + Math.cos((Math.PI * (i + 1)) / n));
    x[idx] = (x[idx] ?? 0) * g;
  }
}

/** YIN on one window; returns frequency in Hz and the aperiodicity at the chosen lag. */
function yinWindow(
  x: Float32Array,
  start: number,
  tauMax: number,
  integ: number,
): { hz: number; d: number } | null {
  const tauMin = Math.floor(SAMPLE_RATE / YIN_MAX_HZ);
  const d = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let sum = 0;
    for (let j = 0; j < integ; j++) {
      const diff = (x[start + j] ?? 0) - (x[start + j + tau] ?? 0);
      sum += diff * diff;
    }
    d[tau] = sum;
  }
  const cmnd = new Float32Array(tauMax + 1);
  cmnd[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    running += d[tau] ?? 0;
    cmnd[tau] = running === 0 ? 1 : ((d[tau] ?? 0) * tau) / running;
  }
  let chosen = -1;
  for (let tau = tauMin; tau < tauMax; tau++) {
    if ((cmnd[tau] ?? 1) < YIN_THRESHOLD) {
      while (tau + 1 < tauMax && (cmnd[tau + 1] ?? 1) < (cmnd[tau] ?? 1)) tau++;
      chosen = tau;
      break;
    }
  }
  if (chosen < 0) {
    let best = Infinity;
    for (let tau = tauMin; tau < tauMax; tau++) {
      if ((cmnd[tau] ?? 1) < best) {
        best = cmnd[tau] ?? 1;
        chosen = tau;
      }
    }
    if (chosen < 0 || best > 0.5) return null;
  }
  const a = cmnd[chosen - 1] ?? 1;
  const b = cmnd[chosen] ?? 1;
  const c = cmnd[chosen + 1] ?? 1;
  const denom = a - 2 * b + c;
  const shift = denom !== 0 ? (0.5 * (a - c)) / denom : 0;
  const tauRefined = chosen + Math.max(-1, Math.min(1, shift));
  return { hz: SAMPLE_RATE / tauRefined, d: b };
}

function measurePitchHz(clip: Float32Array): number | null {
  const from = Math.floor(clip.length * STEADY_START_FRAC);
  const to = Math.floor(clip.length * STEADY_END_FRAC);
  const tauMax = Math.floor(SAMPLE_RATE / YIN_MIN_HZ);
  const integ = 2048;
  const need = integ + tauMax + 2;
  const results: number[] = [];
  const span = to - from - need;
  if (span < 0) {
    const r = yinWindow(clip, Math.max(0, Math.min(from, clip.length - need)), tauMax, integ);
    return r ? r.hz : null;
  }
  for (let w = 0; w < YIN_WINDOWS; w++) {
    const start = from + Math.floor((span * w) / Math.max(1, YIN_WINDOWS - 1));
    const r = yinWindow(clip, start, tauMax, integ);
    if (r && r.d < 0.35) results.push(r.hz);
  }
  if (results.length === 0) return null;
  results.sort((p, q) => p - q);
  return results[Math.floor(results.length / 2)] ?? null;
}

/** Hann-windowed single-frequency magnitude (Goertzel-style DFT bin) at `hz`. */
function binMagnitude(x: Float32Array, start: number, n: number, hz: number): number {
  let re = 0;
  let im = 0;
  const w = (2 * Math.PI * hz) / SAMPLE_RATE;
  for (let i = 0; i < n; i++) {
    const win = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
    const v = win * (x[start + i] ?? 0);
    re += v * Math.cos(w * i);
    im -= v * Math.sin(w * i);
  }
  return Math.hypot(re, im);
}

/**
 * YIN locks onto a strong 2nd harmonic on plucked/spiccato strings. If `hz`/2 is the true fundamental
 * then the odd harmonics of `hz`/2 (1, 3, 5) carry real energy; a signal truly periodic at `hz` has none.
 */
function correctOctaveDown(
  clip: Float32Array,
  hz: number,
  ratio: number = SUBHARMONIC_RATIO,
): number {
  let f = hz;
  const from = Math.floor(clip.length * STEADY_START_FRAC);
  const n = Math.min(SUBHARMONIC_WINDOW, clip.length - from - 1);
  if (n < 2048) return f;
  for (let step = 0; step < SUBHARMONIC_MAX_STEPS; step++) {
    const g = f / 2;
    if (g < YIN_MIN_HZ) break;
    const odd = [1, 3, 5].reduce((s, k) => s + binMagnitude(clip, from, n, g * k), 0);
    const even = [2, 4, 6].reduce((s, k) => s + binMagnitude(clip, from, n, g * k), 0);
    if (even > 0 && odd / even > ratio) f = g;
    else break;
  }
  return f;
}

function hzToMidiFloat(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

const PC_NAMES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

/** Pitch class (0-11) from the file-name note, e.g. "..._F#3_v1..." -> 6. Null if none. */
function pitchClassFromName(repoPath: string): number | null {
  const base = repoPath.split('/').pop() ?? '';
  const m = base.match(/(?:^|_)([A-G])(#?)(-?\d)(?=[_.]|$)/);
  if (!m) return null;
  const letter = m[1] ?? 'C';
  return ((PC_NAMES[letter] ?? 0) + (m[2] === '#' ? 1 : 0)) % 12;
}

/** Intended sounding MIDI note from a role like "F#5" (C4 = 60); null for non-note roles. */
function roleToMidi(role: string): number | null {
  const m = role.match(/^([A-G])(#?)(-?\d)$/);
  if (!m) return null;
  return (Number(m[3]) + 1) * 12 + (PC_NAMES[m[1] ?? 'C'] ?? 0) + (m[2] === '#' ? 1 : 0);
}

// ---------------------------------------------------------------- per-sample processing
function processSample(id: string, inst: ManifestInstrument, s: ManifestSample): Processed {
  const raw = decodeMono32k(s.file);
  if (raw.length === 0) throw new Error(`empty decode: ${s.file}`);
  const start = Math.max(0, findOnset(raw, s.onsetDb) - Math.round(ONSET_PREROLL_S * SAMPLE_RATE));
  let clip = raw.slice(start);

  const maxSamples = Math.round(inst.maxLength * SAMPLE_RATE);
  let fadeS = NATURAL_END_FADE_S;
  if (clip.length > maxSamples) {
    clip = clip.slice(0, maxSamples);
    fadeS = inst.maxLength < SHORT_CUT_LIMIT_S ? SHORT_CUT_FADE_S : CUT_FADE_S;
  } else {
    clip = clip.slice(0, findLastAudible(clip));
  }

  // Pitch is measured on the steady part, before the fade is baked in.
  let midi: number | null = null;
  let cents = 0;
  let measuredHz: number | null = null;
  let nameDoubt: string | null = null;
  if (inst.pitched) {
    measuredHz = measurePitchHz(clip);
    if (measuredHz !== null && inst.octaveCheck !== false) {
      measuredHz = correctOctaveDown(clip, measuredHz, s.subharmonicRatio);
    }
    if (measuredHz === null) {
      nameDoubt = 'pitch measurement failed';
    } else {
      const mf = hzToMidiFloat(measuredHz);
      midi = Math.round(mf);
      cents = Math.round((mf - midi) * 100);
      const pc = pitchClassFromName(s.file);
      if (pc !== null) {
        const diff = (((midi - pc) % 12) + 12) % 12;
        if (diff !== 0) nameDoubt = `measured pitch class ${midi % 12} != file-name class ${pc}`;
      }
    }
  }

  applyFadeOut(clip, fadeS);
  const gain = dbToLin(PEAK_TARGET_DB) / (peakOf(clip) || 1);
  let sumSq = 0;
  for (let i = 0; i < clip.length; i++) {
    clip[i] = (clip[i] ?? 0) * gain;
    sumSq += (clip[i] ?? 0) * (clip[i] ?? 0);
  }
  const rms = Math.sqrt(sumSq / clip.length);
  return { id, role: s.role, file: s.file, pcm: clip, midi, cents, measuredHz, rms, nameDoubt };
}

// ---------------------------------------------------------------- sprite / encode
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function writeWav16(path: string, pcm: Float32Array): void {
  const data = Buffer.alloc(pcm.length * 2);
  for (let i = 0; i < pcm.length; i++) {
    const v = Math.max(-1, Math.min(1, pcm[i] ?? 0));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const head = Buffer.alloc(44);
  head.write('RIFF', 0);
  head.writeUInt32LE(36 + data.length, 4);
  head.write('WAVEfmt ', 8);
  head.writeUInt32LE(16, 16);
  head.writeUInt16LE(1, 20);
  head.writeUInt16LE(1, 22);
  head.writeUInt32LE(SAMPLE_RATE, 24);
  head.writeUInt32LE(SAMPLE_RATE * 2, 28);
  head.writeUInt16LE(2, 32);
  head.writeUInt16LE(16, 34);
  head.write('data', 36);
  head.writeUInt32LE(data.length, 40);
  writeFileSync(path, Buffer.concat([head, data]));
}

interface Packed {
  sprite: Float32Array;
  index: Record<string, { pitched: boolean; samples: IndexSample[] }>;
}

function packSprite(manifest: Manifest, processed: Processed[]): Packed {
  const gap = Math.round(SAMPLE_GAP_S * SAMPLE_RATE);
  const lead = Math.round(LEAD_SILENCE_S * SAMPLE_RATE);
  const burst = Math.round(SYNC_BURST_S * SAMPLE_RATE);
  const post = Math.round(POST_SYNC_SILENCE_S * SAMPLE_RATE);
  let total = lead + burst + post;
  for (const p of processed) total += p.pcm.length + gap;
  const sprite = new Float32Array(total);
  for (let i = 0; i < burst; i++) {
    sprite[lead + i] = Math.sin((2 * Math.PI * SYNC_FREQ_HZ * i) / SAMPLE_RATE);
  }
  let cursor = lead + burst + post;
  const index: Packed['index'] = {};
  for (const id of Object.keys(manifest.instruments)) {
    const inst = manifest.instruments[id];
    if (!inst) continue;
    const mine = processed.filter((p) => p.id === id);
    if (mine.length === 0) continue;
    if (inst.pitched) mine.sort((a, b) => (a.midi ?? 0) - (b.midi ?? 0));
    const samples: IndexSample[] = [];
    for (const p of mine) {
      sprite.set(p.pcm, cursor);
      samples.push({
        midi: p.midi,
        cents: p.cents,
        start: round4(cursor / SAMPLE_RATE),
        duration: round4(p.pcm.length / SAMPLE_RATE),
        rms: Math.round(p.rms * 1000) / 1000,
      });
      cursor += p.pcm.length + gap;
    }
    index[id] = { pitched: inst.pitched, samples };
  }
  return { sprite, index };
}

function encodeMp3(sprite: Float32Array): void {
  mkdirSync(WORK_DIR, { recursive: true });
  mkdirSync(OUT_DIR, { recursive: true });
  const wav = join(WORK_DIR, 'sprite.wav');
  writeWav16(wav, sprite);
  execFileSync('lame', [
    '--silent',
    '-V',
    LAME_VBR_QUALITY,
    '-m',
    'm',
    '-q',
    '0',
    '--resample',
    '32',
    wav,
    OUT_MP3,
  ]);
}

// ---------------------------------------------------------------- probe mode
function probe(paths: string[]): void {
  for (const p of paths) {
    const raw = decodeMono32k(p);
    const onset = findOnset(raw);
    const clip = raw.slice(Math.max(0, onset - Math.round(ONSET_PREROLL_S * SAMPLE_RATE)));
    const seg = clip.slice(0, Math.min(clip.length, 2.4 * SAMPLE_RATE));
    const hz0 = measurePitchHz(seg);
    const hz = hz0 === null ? null : correctOctaveDown(seg, hz0);
    const env: string[] = [];
    const step = Math.round(0.25 * SAMPLE_RATE);
    const pk = peakOf(seg) || 1;
    for (let i = 0; i < seg.length && env.length < 12; i += step) {
      let s2 = 0;
      const e = Math.min(seg.length, i + step);
      for (let j = i; j < e; j++) s2 += (seg[j] ?? 0) * (seg[j] ?? 0);
      env.push((20 * Math.log10(Math.sqrt(s2 / (e - i)) / pk + 1e-9)).toFixed(0));
    }
    const mf = hz ? hzToMidiFloat(hz) : NaN;
    console.log(
      `${p.split('/').pop()}  len=${(raw.length / SAMPLE_RATE).toFixed(2)}s onset=${((onset / SAMPLE_RATE) * 1000).toFixed(0)}ms ` +
        `f0=${hz ? hz.toFixed(1) : '-'}Hz midi=${Number.isNaN(mf) ? '-' : mf.toFixed(2)} env(dB/250ms)=${env.join(',')}`,
    );
  }
}

// ---------------------------------------------------------------- main
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args[0] === '--probe') {
    const paths = args.slice(1);
    await downloadAll(paths);
    probe(paths);
    return;
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')) as Manifest;
  const all: { id: string; inst: ManifestInstrument; s: ManifestSample }[] = [];
  for (const [id, inst] of Object.entries(manifest.instruments)) {
    for (const s of inst.samples) all.push({ id, inst, s });
  }
  console.log(
    `[orchestra] ${all.length} samples, ${Object.keys(manifest.instruments).length} instruments`,
  );
  await downloadAll(all.map((a) => a.s.file));

  const processed: Processed[] = [];
  for (const { id, inst, s } of all) {
    const p = processSample(id, inst, s);
    processed.push(p);
    const note =
      p.midi === null
        ? ''
        : ` midi=${p.midi} ${p.cents >= 0 ? '+' : ''}${p.cents}c (${p.measuredHz?.toFixed(1)}Hz)`;

    const want = roleToMidi(s.role);
    const delta = want !== null && p.midi !== null ? p.midi - want : null;
    const dTxt = delta === null ? '' : ` d${delta >= 0 ? '+' : ''}${delta}`;
    const roleWarn =
      delta !== null && Math.abs(delta) > ROLE_WARN_SEMITONES
        ? `  !! ${Math.abs(delta)} semitones from role`
        : '';
    const warn = (p.nameDoubt ? `  !! ${p.nameDoubt}` : '') + roleWarn;
    console.log(
      `  ${id.padEnd(14)} ${s.role.padEnd(5)} ${(p.pcm.length / SAMPLE_RATE).toFixed(2)}s${note}${dTxt}${warn}`,
    );
  }

  const { sprite, index } = packSprite(manifest, processed);
  encodeMp3(sprite);
  const doc = {
    version: 1,
    file: 'orchestra.mp3',
    sampleRate: SAMPLE_RATE,
    syncMarker: LEAD_SILENCE_S,
    duration: round4(sprite.length / SAMPLE_RATE),
    instruments: index,
  };
  writeFileSync(OUT_JSON, JSON.stringify(doc, null, 2) + '\n');
  const bytes = statSync(OUT_MP3).size;
  console.log(
    `[orchestra] sprite ${doc.duration}s, ${bytes} bytes (${(bytes / 1048576).toFixed(3)} MiB), lame -V ${LAME_VBR_QUALITY}`,
  );
  const off = processed.filter((p) => p.midi !== null && Math.abs(p.cents) > FLAT_CENTS_WARN);
  for (const p of off)
    console.log(`[orchestra] >${FLAT_CENTS_WARN}c off: ${p.id} ${p.role} ${p.cents}c`);
  writeFileSync(
    join(WORK_DIR, 'report.json'),
    JSON.stringify(
      processed.map((p) => ({
        id: p.id,
        role: p.role,
        file: p.file,
        midi: p.midi,
        cents: p.cents,
        hz: p.measuredHz,
        dur: p.pcm.length / SAMPLE_RATE,
        doubt: p.nameDoubt,
      })),
      null,
      1,
    ),
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
