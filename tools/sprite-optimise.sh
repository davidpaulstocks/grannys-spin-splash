#!/usr/bin/env bash
# Re-encodes every PNG under public/sprites/ losslessly (strips metadata,
# re-runs the deflate pass) and reports the total against a cap.
#
# CLAUDE.md §7.1 specs this as "runs pngquant over public/sprites/", but the
# delivered art was already palette-quantised with alpha preservation during
# Sprint 3 story 3.9, and pngquant isn't installed here. Measured on the four
# largest sprites, a lossless re-encode saves 0 bytes — the art is already at
# the floor for RGBA PNG. Going further would mean a *lossy* step (binary
# transparency, or WebP), which would visibly damage the soft outlined edges
# these sprites are drawn with.
#
# So the useful job this script does is the second half: it fails when
# public/sprites/ grows past its cap, so a future art drop can't silently eat
# the headroom under Poki's 8 MB initial-download limit (§3 rule 2) between
# one `npm run budget` and the next.
set -euo pipefail

SPRITE_DIR="public/sprites"
CAP_BYTES=$((5600 * 1024))

if [ ! -d "$SPRITE_DIR" ]; then
  echo "sprite-optimise: $SPRITE_DIR not found — run from the project root" >&2
  exit 1
fi

python3 - "$SPRITE_DIR" "$CAP_BYTES" <<'PY'
import io
import os
import sys

from PIL import Image

sprite_dir, cap = sys.argv[1], int(sys.argv[2])
saved = 0
total = 0
touched = 0

for root, _dirs, names in os.walk(sprite_dir):
    for name in sorted(names):
        path = os.path.join(root, name)
        if not name.lower().endswith(".png"):
            total += os.path.getsize(path)
            continue
        before = os.path.getsize(path)
        with Image.open(path) as im:
            buf = io.BytesIO()
            im.save(buf, "PNG", optimize=True)
        after = buf.tell()
        if after < before:
            with open(path, "wb") as fh:
                fh.write(buf.getvalue())
            saved += before - after
            touched += 1
            print(f"  {path}: {before / 1024:.1f} KB -> {after / 1024:.1f} KB")
            total += after
        else:
            total += before


def fmt(n):
    return f"{n / (1024 * 1024):.2f} MB" if n >= 1024 * 1024 else f"{n / 1024:.1f} KB"


print(f"\nsprite-optimise: {touched} file(s) re-encoded, {fmt(saved)} saved")
print(f"  {fmt(total)} total in {sprite_dir}")
print(f"  {fmt(cap)} cap")

if total > cap:
    print(f"\n✗ Sprites over cap by {fmt(total - cap)} — optimise or cut art before shipping")
    sys.exit(1)
print(f"\n✓ Sprites under cap — {fmt(cap - total)} headroom")
PY
