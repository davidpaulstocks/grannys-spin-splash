/**
 * Asserts dist/ total payload is under Poki's 8 MB initial-download cap.
 * Excludes .map files (sourcemaps are dev-only, not served to players).
 * CLAUDE.md §3 rule 2.
 */

import { statSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import process from 'node:process';

const BUDGET_BYTES = 8 * 1024 * 1024;
const DIST_DIR = 'dist';
const EXCLUDED_SUFFIXES = ['.map'];

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
const total = files.reduce((sum, f) => sum + f.bytes, 0);

console.log(`\nBuild payload (${DIST_DIR}/, sourcemaps excluded):`);
for (const f of files) {
  console.log(`  ${format(f.bytes).padStart(10)}  ${relative(DIST_DIR, f.path)}`);
}
console.log(`  ${'-'.repeat(10)}`);
console.log(`  ${format(total).padStart(10)}  total`);
console.log(`  ${format(BUDGET_BYTES).padStart(10)}  budget (Poki 8 MB cap)`);

if (total > BUDGET_BYTES) {
  const over = total - BUDGET_BYTES;
  console.error(`\n✗ Build is over budget by ${format(over)}`);
  process.exit(1);
}

const headroom = BUDGET_BYTES - total;
console.log(`\n✓ Build under budget — ${format(headroom)} headroom\n`);
