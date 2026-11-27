#!/usr/bin/env python3
"""Slices Nano Banana sheets into one transparent 256x256 picture each.

Usage:  npm run instruments           (reads _art_inbox/instruments/<sheet name>.png, .jpg, .jpeg or .webp)
        npm run visitors              (the same for the visitors: --set visitors)
        npm run guns                  (the same for the guns: --set guns)

--set instruments (the default) cuts the instrument sheets named in tools/instrument-sheets.json
into public/sprites/instruments. --set visitors cuts the two visitor sheets named in
tools/visitor-sheets.json (hurdles, then treats) from _art_inbox/visitors into public/sprites/visitors.

For every sheet named in the set's JSON file that exists in the inbox:
  1. Removes the pure-white background by flood-filling inward from the image
     border (within a tolerance), so white INSIDE a closed ink outline (piano
     keys, drum skins) survives.
  2. Softens the cut edge by about 1 px.
  3. Finds the six instruments as blobs (nearby pieces, such as a bow or drum
     sticks, are grouped with their instrument), largest six, ordered by row
     then column.
  4. Crops each tight with a 4% margin, pads to a square, resizes to 256x256
     and writes public/sprites/instruments/<icon>.png.
The grid is worked out from where the six blobs sit (rows by vertical centre, each row left to right), so a
sheet may be 3x2 or 2x3.

--set guns cuts tools/gun-sheets.json from _art_inbox/guns into public/sprites/guns/<id>/0.png. A gun is wide,
so it is cropped tight (same margin), scaled to fit a 384x256 canvas without squashing and centred. A sheet
entry may be {"ids": [...], "flip": [ids]}: ids listed in "flip" are mirrored left to right first (painted
nozzle-left). The nozzle point (mean of the right-most opaque pixels, or a per-gun
"nozzle": {"id": [x, y]} override in the sheet's entry, in picture pixels) goes to <id>/anchor.json as
{"x": .., "y": ..} in picture pixels. Gun pictures all face right; Gun.ts turns them in code.
Then it runs `npm run optimise` (PNG -> WebP, PNG removed) and prints the ids to add to
INSTRUMENT_ART_READY (src/entities/spinner/instrumentArt.data.ts) or, for visitors,
VISITOR_ART_READY (src/entities/visitor/visitorArt.data.ts).

--set guns also writes public/sprites/guns/<id>/hero.webp: the same crop as the small picture, cut from the
sheet at its full resolution onto a 768x512 canvas (never squashed) and encoded straight to WebP
(HERO_QUALITY, written here, not by `npm run optimise`). It is loaded only when a gun reveal opens.
A sheet entry with "file" (a path from the project root) and "hero_only": true is a single-gun original
(the six old guns: _reference/guns/<id>_0_raw.jpg); it writes only the hero picture, on a canvas exactly
twice the size of that gun's existing 0.webp, so the two frame the gun identically. --hero-only skips
the small pictures and anchors (leaves the shipped 0.webp and anchor.json untouched).

Needs Python 3 with Pillow. Options: --set instruments|visitors|guns  --inbox DIR  --out DIR  --no-optimise  --hero-only
"""

import argparse
import json
import os
import subprocess
import sys
from collections import deque

from PIL import Image, ImageChops, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# What each --set reads, where it writes and which list the printed ids go into.
SETS = {
    "instruments": {
        "sheets_json": os.path.join(ROOT, "tools", "instrument-sheets.json"),
        "inbox": os.path.join(ROOT, "_art_inbox", "instruments"),
        "out": os.path.join(ROOT, "public", "sprites", "instruments"),
        "ready_list": "INSTRUMENT_ART_READY in src/entities/spinner/instrumentArt.data.ts",
    },
    "visitors": {
        "sheets_json": os.path.join(ROOT, "tools", "visitor-sheets.json"),
        "inbox": os.path.join(ROOT, "_art_inbox", "visitors"),
        "out": os.path.join(ROOT, "public", "sprites", "visitors"),
        "ready_list": "VISITOR_ART_READY in src/entities/visitor/visitorArt.data.ts",
    },
    "guns": {
        "sheets_json": os.path.join(ROOT, "tools", "gun-sheets.json"),
        "inbox": os.path.join(ROOT, "_art_inbox", "guns"),
        "out": os.path.join(ROOT, "public", "sprites", "guns"),
        "ready_list": "GUN_ART_READY in src/entities/gun/gun.data.ts",
        "wide": True,
    },
}

CELLS_PER_SHEET = 6
HERO_FACTOR = 3  # a hero picture is this many times the small picture, same framing
HERO_CANVAS = (384 * HERO_FACTOR, 256 * HERO_FACTOR)
HERO_QUALITY = 78  # WebP quality of hero pictures (about 50 to 90 KB each)
HERO_ALPHA_QUALITY = 80
HERO_METHOD = 6
ROW_GAP_FRACTION = 0.5  # a new row starts when the next blob's centre is this far (x median blob height) below
GUN_CANVAS = (384, 256)  # guns are wide: fitted into this, centred, never squashed
NOZZLE_EDGE_PX = 4  # the nozzle is the mean of the opaque pixels within this many px of the right-most one
NOZZLE_ALPHA = 128
MAX_SHEET_SIDE = 2048  # bigger sheets are scaled down to this
CHECKER_COLOUR_SPREAD = 24  # a pixel whose channels differ by more than this is paint, not chequerboard grey
CHECKER_SPECK = 5  # paint marks smaller than this (JPEG noise, ghost marks) are dropped
CHECKER_OUTLINE_PX = 10  # the gun's black outline reaches this far (full-resolution px) beyond its paint
CHECKER_DARK_BELOW = 75  # darker than every light grey square, so it can be outline
CHECKER_WHITE_FROM = 200  # lighter than every chequerboard square, so it is a highlight on the gun
WHITE_TOLERANCE = 20  # a pixel is background-white if every channel >= 255 - this
OUTPUT_SIZE = 256
CROP_MARGIN = 0.04
GROUP_SCALE = 8  # blobs are found at 1/8 size...
GROUP_DILATE = 7  # ...after growing by this many low-res px, so a bow joins its violin
GUN_GROUP_DILATE = 3  # a gun is one piece, and its neighbours sit close: group less
MIN_BLOB_FRACTION = 0.04  # the sixth blob must be at least this fraction of the biggest


def background_mask(rgb):
    """Returns a bytearray, 1 where a pixel is background: whitish AND reachable from the border."""
    w, h = rgb.size
    floor = 255 - WHITE_TOLERANCE
    lightest_channel = ImageChops.darker(ImageChops.darker(*rgb.split()[:2]), rgb.split()[2])
    whitish = lightest_channel.point(lambda v: 255 if v >= floor else 0).tobytes()
    bg = bytearray(w * h)
    stack = []

    def seed(i):
        if whitish[i] and not bg[i]:
            bg[i] = 1
            stack.append(i)

    for x in range(w):
        seed(x)
        seed((h - 1) * w + x)
    for y in range(h):
        seed(y * w)
        seed(y * w + w - 1)
    while stack:
        i = stack.pop()
        x = i % w
        if x > 0 and whitish[i - 1] and not bg[i - 1]:
            bg[i - 1] = 1
            stack.append(i - 1)
        if x < w - 1 and whitish[i + 1] and not bg[i + 1]:
            bg[i + 1] = 1
            stack.append(i + 1)
        if i >= w and whitish[i - w] and not bg[i - w]:
            bg[i - w] = 1
            stack.append(i - w)
        if i < w * (h - 1) and whitish[i + w] and not bg[i + w]:
            bg[i + w] = 1
            stack.append(i + w)
    return bg


def checker_foreground(rgb):
    """Foreground of an original with a chequerboard baked in as its "transparent" background.

    The dark squares are as dark as the gun's own outline, so colour alone cannot tell them apart. Instead:
    the gun is where there is colour (not neutral grey); its outline is the black band of CHECKER_OUTLINE_PX
    around that colour; everything else (grey squares, the holes in a trigger guard or a hose coil, stray marks)
    is background. Near-white highlights are kept.
    """
    r, g, b = rgb.split()
    top = ImageChops.lighter(ImageChops.lighter(r, g), b)
    low = ImageChops.darker(ImageChops.darker(r, g), b)
    coloured = ImageChops.subtract(top, low).point(lambda v: 255 if v > CHECKER_COLOUR_SPREAD else 0)
    coloured = coloured.filter(ImageFilter.MinFilter(CHECKER_SPECK)).filter(ImageFilter.MaxFilter(CHECKER_SPECK))
    near = coloured
    for _ in range(CHECKER_OUTLINE_PX):
        near = near.filter(ImageFilter.MaxFilter(3))
    dark = top.point(lambda v: 255 if v < CHECKER_DARK_BELOW else 0)
    white = low.point(lambda v: 255 if v >= CHECKER_WHITE_FROM else 0)
    wanted = ImageChops.lighter(ImageChops.lighter(coloured, dark), white)
    return ImageChops.multiply(near, wanted)


def find_blobs(foreground, dilate=GROUP_DILATE):
    """Groups foreground pixels into blobs. Returns [(area, (x0, y0, x1, y1), labels_lowres)] biggest first."""
    w, h = foreground.size
    small_w, small_h = max(1, w // GROUP_SCALE), max(1, h // GROUP_SCALE)
    small = foreground.resize((small_w, small_h), Image.BOX).point(lambda v: 255 if v > 0 else 0)
    small = small.filter(ImageFilter.MaxFilter(dilate))
    sdata = small.tobytes()
    label = [0] * (small_w * small_h)
    count = 0
    for start in range(small_w * small_h):
        if not sdata[start] or label[start]:
            continue
        count += 1
        label[start] = count
        queue = deque([start])
        while queue:
            i = queue.popleft()
            x, y = i % small_w, i // small_w
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < small_w and 0 <= ny < small_h:
                        j = ny * small_w + nx
                        if sdata[j] and not label[j]:
                            label[j] = count
                            queue.append(j)
    return label, count, small_w, small_h


def order_by_grid(ranked, boxes):
    """Orders blobs row by row (top first), each row left to right, whatever the grid shape."""
    centres = {k: ((boxes[k][0] + boxes[k][2]) / 2, (boxes[k][1] + boxes[k][3]) / 2) for k in ranked}
    heights = sorted(boxes[k][3] - boxes[k][1] for k in ranked)
    gap = heights[len(heights) // 2] * ROW_GAP_FRACTION
    by_y = sorted(ranked, key=lambda k: centres[k][1])
    rows, last_y = [], None
    for k in by_y:
        if last_y is None or centres[k][1] - last_y > gap:
            rows.append([])
        rows[-1].append(k)
        last_y = centres[k][1]
    print(f"  grid: {len(rows)} rows of " + ", ".join(str(len(r)) for r in rows))
    ordered = []
    for row in rows:
        ordered += sorted(row, key=lambda k: centres[k][0])
    return ordered


def keep_only_blob(tile, box, label, sw, sh, scale_x, scale_y, k):
    """Clears the pixels of the crop that belong to a neighbouring gun (the crop margin can reach one)."""
    keep = bytearray(tile.width * tile.height)
    for y in range(tile.height):
        ly = min(sh - 1, int((box[1] + y) / scale_y)) * sw
        for x in range(tile.width):
            if label[ly + min(sw - 1, int((box[0] + x) / scale_x))] == k:
                keep[y * tile.width + x] = 255
    mask = Image.frombytes("L", tile.size, bytes(keep))
    alpha = ImageChops.multiply(tile.getchannel("A"), mask)
    tile = tile.copy()
    tile.putalpha(alpha)
    return tile


def fit_gun(tile, flip, nozzle_override=None, canvas_size=GUN_CANVAS):
    """Fits a cropped gun into the canvas (no squashing) and finds its nozzle. Returns (image, (x, y))."""
    if flip:
        tile = tile.transpose(Image.FLIP_LEFT_RIGHT)
    cw, ch = canvas_size
    scale = min(cw / tile.width, ch / tile.height)
    tile = tile.resize((max(1, round(tile.width * scale)), max(1, round(tile.height * scale))), Image.LANCZOS)
    canvas = Image.new("RGBA", canvas_size, (0, 0, 0, 0))
    ox, oy = (cw - tile.width) // 2, (ch - tile.height) // 2
    canvas.paste(tile, (ox, oy))
    alpha = canvas.getchannel("A").tobytes()
    rightmost = max((i % cw for i, a in enumerate(alpha) if a >= NOZZLE_ALPHA), default=cw - 1)
    pts = [(i % cw, i // cw) for i, a in enumerate(alpha) if a >= NOZZLE_ALPHA and i % cw >= rightmost - NOZZLE_EDGE_PX]
    nozzle = (round(sum(p[0] for p in pts) / len(pts)), round(sum(p[1] for p in pts) / len(pts)))
    return canvas, (tuple(nozzle_override) if nozzle_override else nozzle)


def place_like_small(tile, small_path):
    """Hero canvas of an old gun: twice the existing 0.webp, the gun's tight box scaled and placed at twice where
    the small picture has it, so the two frame the gun identically whatever margin the small one was cut with."""
    with Image.open(small_path) as small:
        small = small.convert("RGBA")
        sw, sh = small.size
        sx0, sy0, sx1, sy1 = small.getchannel("A").point(lambda v: 255 if v >= NOZZLE_ALPHA else 0).getbbox()
    tight = tile.crop(tile.getchannel("A").point(lambda v: 255 if v >= NOZZLE_ALPHA else 0).getbbox())
    target = ((sx1 - sx0) * HERO_FACTOR, (sy1 - sy0) * HERO_FACTOR)
    tight = tight.resize(target, Image.LANCZOS)
    canvas = Image.new("RGBA", (sw * HERO_FACTOR, sh * HERO_FACTOR), (0, 0, 0, 0))
    canvas.paste(tight, (sx0 * HERO_FACTOR, sy0 * HERO_FACTOR))
    return canvas


def slice_sheet(path, icons, out_dir, wide=False, flip=(), nozzles=None, hero=False, hero_only=False):
    """Cuts one sheet into its icons. Returns the ids written.

    hero: write <id>/hero.webp (full-resolution sheet, HERO_CANVAS) instead of the small picture.
    hero_only: a single-gun original; the canvas is twice the gun's existing 0.webp.
    """
    sheet = Image.open(path)
    if sheet.mode in ("RGBA", "LA", "P"):
        flat = Image.new("RGB", sheet.size, (255, 255, 255))
        flat.paste(sheet.convert("RGBA"), mask=sheet.convert("RGBA").getchannel("A"))
        sheet = flat
    rgb = sheet.convert("RGB")
    if max(rgb.size) > MAX_SHEET_SIDE and not hero:
        scale = MAX_SHEET_SIDE / max(rgb.size)
        rgb = rgb.resize((round(rgb.width * scale), round(rgb.height * scale)), Image.LANCZOS)
    w, h = rgb.size

    if hero_only:
        foreground = checker_foreground(rgb)
    else:
        bg = background_mask(rgb)
        foreground = Image.frombytes("L", (w, h), bytes(0 if b else 255 for b in bg))
    # Soften the cut: pull the edge in 1 px (eats the pale fringe), then blur 1 px.
    alpha = foreground.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1))
    rgba = rgb.convert("RGBA")
    rgba.putalpha(alpha)

    label, count, sw, sh = find_blobs(foreground, GUN_GROUP_DILATE if wide else GROUP_DILATE)
    scale_x, scale_y = w / sw, h / sh
    areas = [0] * (count + 1)
    boxes = [None] * (count + 1)
    fdata = foreground.tobytes()
    for y in range(h):
        row = y * w
        ly = min(sh - 1, int(y / scale_y)) * sw
        for x in range(w):
            if fdata[row + x]:
                lab = label[ly + min(sw - 1, int(x / scale_x))]
                if lab:
                    areas[lab] += 1
                    b = boxes[lab]
                    if b is None:
                        boxes[lab] = [x, y, x, y]
                    else:
                        if x < b[0]: b[0] = x
                        if y < b[1]: b[1] = y
                        if x > b[2]: b[2] = x
                        if y > b[3]: b[3] = y
    wanted = len(icons) if hero_only else CELLS_PER_SHEET
    ranked = sorted(range(1, count + 1), key=lambda k: areas[k], reverse=True)[:wanted]
    if len(ranked) < wanted:
        raise SystemExit(f"{path}: found only {len(ranked)} instruments, expected {wanted}")
    if areas[ranked[-1]] < MIN_BLOB_FRACTION * areas[ranked[0]]:
        print(f"  warning: the smallest instrument found is tiny - check {os.path.basename(path)}")

    centres = {k: ((boxes[k][0] + boxes[k][2]) / 2, (boxes[k][1] + boxes[k][3]) / 2) for k in ranked}
    ordered = order_by_grid(ranked, boxes)

    os.makedirs(out_dir, exist_ok=True)
    written = []
    for k, icon in zip(ordered, icons):
        x0, y0, x1, y1 = boxes[k]
        margin = 0 if hero_only else round(max(x1 - x0, y1 - y0) * CROP_MARGIN)
        box = (max(0, x0 - margin), max(0, y0 - margin), min(w, x1 + margin + 1), min(h, y1 + margin + 1))
        tile = rgba.crop(box)
        if wide:
            tile = keep_only_blob(tile, box, label, sw, sh, scale_x, scale_y, k)
            gun_dir = os.path.join(out_dir, icon)
            os.makedirs(gun_dir, exist_ok=True)
            if hero:
                canvas_size = HERO_CANVAS
                if hero_only:
                    canvas = place_like_small(tile, os.path.join(gun_dir, "0.webp"))
                else:
                    canvas, _ = fit_gun(tile, icon in flip, None, canvas_size)
                canvas.save(os.path.join(gun_dir, "hero.webp"), "WEBP", quality=HERO_QUALITY,
                            alpha_quality=HERO_ALPHA_QUALITY, method=HERO_METHOD, exact=False)
                written.append(icon)
                continue
            canvas, nozzle = fit_gun(tile, icon in flip, (nozzles or {}).get(icon))
            canvas.save(os.path.join(gun_dir, "0.png"))
            with open(os.path.join(gun_dir, "anchor.json"), "w") as f:
                json.dump({"x": nozzle[0], "y": nozzle[1]}, f)
                f.write("\n")
            written.append(icon)
            continue
        side = max(tile.size)
        square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        square.paste(tile, ((side - tile.width) // 2, (side - tile.height) // 2))
        square = square.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.LANCZOS)
        square.save(os.path.join(out_dir, f"{icon}.png"))
        written.append(icon)
    return written


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--set", dest="art_set", choices=sorted(SETS), default="instruments",
                        help="which sheets to cut (default: instruments)")
    parser.add_argument("--inbox", help="where the sheets are (default depends on --set)")
    parser.add_argument("--out", help="where the pictures go (default depends on --set)")
    parser.add_argument("--hero-only", action="store_true",
                        help="guns: cut only the hero pictures, leave 0.webp and anchor.json alone")
    parser.add_argument("--no-optimise", action="store_true", help="skip `npm run optimise` (PNG -> WebP)")
    args = parser.parse_args()
    chosen = SETS[args.art_set]
    args.inbox = args.inbox or chosen["inbox"]
    args.out = args.out or chosen["out"]

    with open(chosen["sheets_json"]) as f:
        sheets = json.load(f)["sheets"]
    done = []
    for name, entry in sheets.items():
        icons, flip = (entry["ids"], entry.get("flip", [])) if isinstance(entry, dict) else (entry, [])
        nozzles = entry.get("nozzle") if isinstance(entry, dict) else None
        # Nano Banana often saves a JPG whatever the file is called, so take any of these.
        hero_only_entry = isinstance(entry, dict) and entry.get("hero_only", False)
        if hero_only_entry:
            candidates = [os.path.join(ROOT, entry["file"])]
        else:
            candidates = [os.path.join(args.inbox, name + ext) for ext in (".png", ".jpg", ".jpeg", ".webp")]
        path = next((c for c in candidates if os.path.isfile(c)), None)
        if path is None:
            print(f"skip {name}: not in {args.inbox}")
            continue
        print(f"slicing {name} ...")
        wide = chosen.get("wide", False)
        written = []
        if not hero_only_entry and not args.hero_only:
            written = slice_sheet(path, icons, args.out, wide, flip, nozzles)
            print("  wrote " + ", ".join(written))
        if wide:
            heroes = slice_sheet(path, icons, args.out, wide, flip, nozzles, hero=True, hero_only=hero_only_entry)
            print("  hero pictures: " + ", ".join(heroes))
            written = written or heroes
        done += written
    if not done:
        sys.exit("No sheets found - save them as <sheet name>.png in " + args.inbox)

    if not args.no_optimise:
        print("optimising ...")
        subprocess.run(["bash", "tools/sprite-optimise.sh"], cwd=ROOT, check=True)

    if chosen.get("wide"):
        ready = sorted(
            d for d in os.listdir(args.out)
            if os.path.isfile(os.path.join(args.out, d, "0.webp")) or os.path.isfile(os.path.join(args.out, d, "0.png"))
        )
    else:
        ready = sorted(
            os.path.splitext(n)[0] for n in os.listdir(args.out) if n.endswith((".webp", ".png"))
        )
    print("\nIcons sliced this run: " + ", ".join(done))
    print(f"\nSet {chosen['ready_list']} to:")
    print("[" + ", ".join(f"'{i}'" for i in ready) + "]")


if __name__ == "__main__":
    main()
