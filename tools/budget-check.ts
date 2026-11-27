/**
 * Asserts the game's initial download is under Poki's 8 MB cap (CLAUDE.md §3
 * rule 2). Excludes .map files (sourcemaps are dev-only, not served to
 * players) and the files the game fetches only on demand, after it is
 * playing: today the large `hero.webp` gun pictures, loaded when a gun reveal
 * opens (src/ui/reveal/HeroArt.ts) and never in BootScene. Both figures are
 * printed, so the on-demand weight is never hidden.
 */

import { statSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

const BUDGET_BYTES = 8 * 1024 * 1024;
const DIST_DIR = 'dist';
const EXCLUDED_SUFFIXES = ['.map'];
/** Fetched on demand, never at start-up: not part of the initial download. */
const ON_DEMAND_SUFFIXES = ['/hero.webp'];

interface FileEntry {
  path: string;
  bytes: number;
}

function walk(dir: string): FileEntry[] {
  const out: FileEntry[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walk(full));
    } else if (stat.isFile()) {
      if (EXCLUDED_SUFFIXES.some((suffix) => full.endsWith(suffix))) continue;
      out.push({ path: full, bytes: stat.size });
    }
  }
  return out;
}

function format(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

try {
  statSync(DIST_DIR);
} catch {
  console.error(`✗ ${DIST_DIR}/ not found — run \`npm run build\` first`);
  process.exit(1);
}

const files = walk(DIST_DIR).sort((a, b) => b.bytes - a.bytes);
const isOnDemand = (path: string): boolean =>
  ON_DEMAND_SUFFIXES.some((suffix) => path.split('\\').join('/').endsWith(suffix));
const onDemand = files.filter((f) => isOnDemand(f.path)).reduce((sum, f) => sum + f.bytes, 0);
const total = files.reduce((sum, f) => sum + f.bytes, 0) - onDemand;

console.log(`\nBuild payload (${DIST_DIR}/, sourcemaps excluded):`);
for (const f of files) {
  console.log(`  ${format(f.bytes).padStart(10)}  ${relative(DIST_DIR, f.path)}`);
}
console.log(`  ${'-'.repeat(10)}`);
console.log(`  ${format(total).padStart(10)}  initial download`);
console.log(
  `  ${format(onDemand).padStart(10)}  fetched on demand (gun reveal pictures), not counted`,
);
console.log(`  ${format(BUDGET_BYTES).padStart(10)}  budget (Poki 8 MB cap)`);

if (total > BUDGET_BYTES) {
  const over = total - BUDGET_BYTES;
  console.error(`\n✗ Build is over budget by ${format(over)}`);
  process.exit(1);
}

const headroom = BUDGET_BYTES - total;
console.log(`\n✓ Build under budget — ${format(headroom)} headroom\n`);
