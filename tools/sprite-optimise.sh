#!/usr/bin/env bash
# Converts every PNG/JPG under public/sprites/ to WebP, verifies each result
# against its source, deletes the source, then checks the folder against a cap.
#
# WORKFLOW FOR NEW ART: drop the new art in as PNG (or JPG) anywhere under
# public/sprites/, run `npm run optimise`, then reference the generated .webp
# path in code. The script removes the PNG/JPG it converted, so only .webp is
# ever shipped. Already-converted .webp files are left alone (re-running is a
# no-op apart from the cap check). The art in git history before the WebP
# conversion is the lossless master if you ever need it.
#
# Encoder: Pillow (python3 -m pip install pillow) — ffmpeg here has no WebP
# encoder and cwebp is not installed. ffmpeg is used only to measure SSIM.
#
# Settings (tuned for hand-illustrated art with thick dark outlines):
#   opaque (world backgrounds): lossy, quality 84
#   with alpha (grannies, guns, UI): lossy, quality 90, alpha_quality 100,
#     method 6 (slowest/smallest); alpha-channel RGB is not "exact" (we only
#     care about visible pixels).
#   Every file must reach SSIM >= 0.985 vs. its source (alpha composited onto
#   mid-grey); JPG sources use 0.975 because they already carry JPEG noise that
#   WebP would otherwise spend bytes reproducing (the result got BIGGER at 0.985). If it misses, quality is raised in steps of 3; if it still
#   misses at 100, the file is stored lossless instead.
# Pixel dimensions are never changed.
#
# The cap guards Poki's 8 MB initial-download limit (CLAUDE.md §3 rule 2).
set -euo pipefail

SPRITE_DIR="public/sprites"
# Raised from 3600 to 3900 KB on 2026-11-27 for the fifth and sixth grannies: with the rest of the
# initial download at about 3.2 MB (code, fonts, audio), 3.9 MB of sprites still leaves the build
# under 8 MB, and `npm run budget` is the check that decides. More worlds will need their art
# loaded on demand rather than a higher cap.
CAP_BYTES=$((3900 * 1024))

if [ ! -d "$SPRITE_DIR" ]; then
  echo "sprite-optimise: $SPRITE_DIR not found — run from the project root" >&2
  exit 1
fi
command -v ffmpeg >/dev/null || { echo "sprite-optimise: ffmpeg required for SSIM check" >&2; exit 1; }

python3 - "$SPRITE_DIR" "$CAP_BYTES" <<'PY'
import os
import re
import subprocess
import sys
import tempfile

from PIL import Image

sprite_dir, cap = sys.argv[1], int(sys.argv[2])

OPAQUE_QUALITY = 84
ALPHA_QUALITY = 90
ALPHA_QUALITY_CHANNEL = 100
QUALITY_STEP = 3
MIN_SSIM = 0.985
MIN_SSIM_JPEG_SOURCE = 0.975
WEBP_METHOD = 6
MATTE = (128, 128, 128)
SOURCE_EXTS = (".png", ".jpg", ".jpeg")


def flatten(im):
    rgba = im.convert("RGBA")
    bg = Image.new("RGBA", rgba.size, MATTE + (255,))
    bg.alpha_composite(rgba)
    return bg.convert("RGB")


def ssim(a, b, tmp):
    pa, pb = os.path.join(tmp, "a.png"), os.path.join(tmp, "b.png")
    flatten(a).save(pa)
    flatten(b).save(pb)
    out = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", pa, "-i", pb, "-lavfi", "ssim", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    m = re.search(r"All:([0-9.]+)", out)
    return float(m.group(1)) if m else 0.0


def encode(im, path, quality, lossless, has_alpha):
    kw = dict(method=WEBP_METHOD, lossless=lossless, exact=False)
    if not lossless:
        kw["quality"] = quality
        if has_alpha:
            kw["alpha_quality"] = ALPHA_QUALITY_CHANNEL
    else:
        kw["quality"] = 100
    im.save(path, "WEBP", **kw)


results = []
before_total = after_total = 0
with tempfile.TemporaryDirectory() as tmp:
    for root, _d, names in os.walk(sprite_dir):
        for name in sorted(names):
            if not name.lower().endswith(SOURCE_EXTS):
                continue
            src = os.path.join(root, name)
            dst = os.path.splitext(src)[0] + ".webp"
            with Image.open(src) as opened:
                im = opened.convert("RGBA" if "A" in opened.getbands() or opened.mode == "P" else "RGB")
            has_alpha = im.mode == "RGBA" and im.getchannel("A").getextrema()[0] < 255
            if im.mode == "RGBA" and not has_alpha:
                im = im.convert("RGB")
            min_ssim = MIN_SSIM_JPEG_SOURCE if name.lower().endswith((".jpg", ".jpeg")) else MIN_SSIM
            quality = ALPHA_QUALITY if has_alpha else OPAQUE_QUALITY
            lossless = False
            while True:
                encode(im, dst, quality, lossless, has_alpha)
                with Image.open(dst) as out:
                    out.load()
                    assert out.size == im.size, f"{dst}: dimensions changed"
                    score = ssim(im, out, tmp)
                if score >= min_ssim or lossless:
                    break
                if quality >= 100:
                    lossless = True
                else:
                    quality = min(100, quality + QUALITY_STEP)
            before, after = os.path.getsize(src), os.path.getsize(dst)
            before_total += before
            after_total += after
            os.remove(src)
            mode = "lossless" if lossless else f"q{quality}"
            results.append((score, dst, before, after, mode))
            print(f"  {dst}: {before / 1024:.1f} KB -> {after / 1024:.1f} KB  ({mode}, SSIM {score:.4f})")

# hero.webp files (the large gun pictures of the reveal) are fetched only when a
# reveal opens, never at start-up, so they are not counted against this cap of
# the initial download. `npm run budget` still counts them in dist/.
LAZY_NAMES = {"hero.webp"}
total = sum(
    os.path.getsize(os.path.join(r, n))
    for r, _d, ns in os.walk(sprite_dir)
    for n in ns
    if n not in LAZY_NAMES
)


def fmt(n):
    return f"{n / (1024 * 1024):.2f} MB" if n >= 1024 * 1024 else f"{n / 1024:.1f} KB"


print(f"\nsprite-optimise: {len(results)} file(s) converted, {fmt(before_total)} -> {fmt(after_total)}")
for score, dst, *_ in sorted(results)[:5]:
    print(f"  lowest SSIM {score:.4f}  {dst}")
print(f"  {fmt(total)} total in {sprite_dir}")
print(f"  {fmt(cap)} cap")

if total > cap:
    print(f"\n✗ Sprites over cap by {fmt(total - cap)} — optimise or cut art before shipping")
    sys.exit(1)
print(f"\n✓ Sprites under cap — {fmt(cap - total)} headroom")
PY
