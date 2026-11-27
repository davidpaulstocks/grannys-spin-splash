#!/usr/bin/env python3
"""Cuts a granny's three painted poses into the pictures the game loads.

Usage:  npm run grannies            (every granny in tools/granny-sheets.json whose files are in the inbox)

Each granny is painted as three single pictures on pure white (front, back, back with arms out) and saved
in _art_inbox/grannies. tools/granny-sheets.json maps a granny id to those three file names (without the
extension). For each one this script:
  1. removes the white background by flood-filling inward from the border (white inside a closed ink
     outline, such as teeth or the whites of the eyes, survives);
  2. also removes any LARGE enclosed patch of flat white: the gaps between an arm and the body when her
     hands are on her hips, which the border fill cannot reach. Small enclosed whites are kept;
  3. keeps only the figure (the biggest blob), crops it tight with a 4% margin, scales it to 768 px tall
     and writes public/sprites/grannies/<id>/<pose>.webp.
Then add the id to GRANNY_ART_READY in src/entities/granny/granny.data.ts.

Needs Python 3 with Pillow.
"""

import json
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INBOX = os.path.join(ROOT, "_art_inbox", "grannies")
OUT = os.path.join(ROOT, "public", "sprites", "grannies")
SHEETS_JSON = os.path.join(ROOT, "tools", "granny-sheets.json")
POSES = ("front", "back", "back_firing")
EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp")

OUTPUT_HEIGHT = 768  # the same height as the first three grannies' pictures
CROP_MARGIN = 0.04
WHITE_TOLERANCE = 20  # background: every channel >= 255 - this, reachable from the border
HOLE_WHITE_FLOOR = 246  # an enclosed patch is "flat white" if every channel is at least this
HOLE_MIN_FRACTION = 0.0012  # ...and it covers at least this share of the whole picture
SEED_STEP = 6  # enclosed patches are looked for on a grid this fine, px
WEBP_QUALITY = 86


def border_background(rgb):
    """An L image, 255 where a pixel is whitish and connected to the picture's border."""
    floor = 255 - WHITE_TOLERANCE
    r, g, b = rgb.split()
    whitish = ImageChops.darker(ImageChops.darker(r, g), b).point(lambda v: 255 if v >= floor else 0)
    w, h = whitish.size
    framed = Image.new("L", (w + 2, h + 2), 255)  # a white frame joins every border region into one
    framed.paste(whitish, (1, 1))
    ImageDraw.floodfill(framed, (0, 0), 128)
    return framed.crop((1, 1, w + 1, h + 1)).point(lambda v: 255 if v == 128 else 0)


def enclosed_holes(rgb, background):
    """An L image, 255 over large enclosed patches of flat white (the gaps inside bent arms)."""
    r, g, b = rgb.split()
    flat = ImageChops.darker(ImageChops.darker(r, g), b).point(lambda v: 255 if v >= HOLE_WHITE_FLOOR else 0)
    candidates = ImageChops.subtract(flat, background)  # flat white that the border fill did not reach
    w, h = candidates.size
    minimum = HOLE_MIN_FRACTION * w * h
    px = candidates.load()
    holes = Image.new("L", (w, h), 0)
    for y in range(0, h, SEED_STEP):
        for x in range(0, w, SEED_STEP):
            if px[x, y] != 255:
                continue
            before = candidates.histogram()[200]
            ImageDraw.floodfill(candidates, (x, y), 200)
            filled = candidates.histogram()[200] - before
            patch = candidates.point(lambda v: 255 if v == 200 else 0)
            if filled >= minimum:
                holes = ImageChops.lighter(holes, patch)
            candidates = candidates.point(lambda v: 90 if v == 200 else v)  # looked at: not a seed again
            px = candidates.load()
    return holes


def biggest_blob(alpha):
    """Keeps only the largest connected opaque region (drops stray specks and sparkles)."""
    small = alpha.resize((alpha.width // 4, alpha.height // 4), Image.BOX).point(lambda v: 255 if v > 40 else 0)
    small = small.filter(ImageFilter.MaxFilter(5))
    px = small.load()
    best, best_count = None, 0
    for y in range(0, small.height, 3):
        for x in range(0, small.width, 3):
            if px[x, y] != 255:
                continue
            before = small.histogram()[200]
            ImageDraw.floodfill(small, (x, y), 200)
            count = small.histogram()[200] - before
            patch = small.point(lambda v: 255 if v == 200 else 0)
            if count > best_count:
                best, best_count = patch, count
            small = small.point(lambda v: 90 if v == 200 else v)
            px = small.load()
    if best is None:
        return alpha
    keep = best.resize(alpha.size, Image.BILINEAR).point(lambda v: 255 if v > 60 else 0)
    return ImageChops.multiply(alpha, keep)


def cut(path, out_path):
    """Cuts one pose and writes it. Returns its size."""
    rgb = Image.open(path).convert("RGB")
    background = border_background(rgb)
    holes = enclosed_holes(rgb, background)
    gone = ImageChops.lighter(background, holes.filter(ImageFilter.MaxFilter(3)))
    alpha = ImageChops.invert(gone)
    alpha = biggest_blob(alpha)
    # Soften the cut: pull the edge in 1 px (eats the pale fringe), then blur 1 px.
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1))
    rgba = rgb.convert("RGBA")
    rgba.putalpha(alpha)
    box = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
    if box is None:
        raise SystemExit(f"{path}: nothing left after removing the background")
    margin = round(max(box[2] - box[0], box[3] - box[1]) * CROP_MARGIN)
    box = (
        max(0, box[0] - margin),
        max(0, box[1] - margin),
        min(rgb.width, box[2] + margin),
        min(rgb.height, box[3] + margin),
    )
    figure = rgba.crop(box)
    scale = OUTPUT_HEIGHT / figure.height
    figure = figure.resize((round(figure.width * scale), OUTPUT_HEIGHT), Image.LANCZOS)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    figure.save(out_path, "WEBP", quality=WEBP_QUALITY, alpha_quality=90, method=6)
    return figure.size


def find(name):
    """The inbox file called `name` with any picture extension, or None."""
    for ext in EXTENSIONS:
        candidate = os.path.join(INBOX, name + ext)
        if os.path.isfile(candidate):
            return candidate
    return None


def main():
    with open(SHEETS_JSON) as f:
        grannies = json.load(f)["grannies"]
    done = []
    for granny_id, files in grannies.items():
        paths = {pose: find(files[pose]) for pose in POSES}
        missing = [files[pose] for pose in POSES if paths[pose] is None]
        if missing:
            print(f"skip {granny_id}: not in {INBOX}: " + ", ".join(missing))
            continue
        for pose in POSES:
            size = cut(paths[pose], os.path.join(OUT, granny_id, pose + ".webp"))
            print(f"  {granny_id}/{pose}.webp  {size[0]}x{size[1]}")
        done.append(granny_id)
    if not done:
        sys.exit("No complete granny found in " + INBOX)
    print("\nCut: " + ", ".join(done))
    print("Add them to GRANNY_ART_READY in src/entities/granny/granny.data.ts")


if __name__ == "__main__":
    main()
