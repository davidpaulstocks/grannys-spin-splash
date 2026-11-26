#!/usr/bin/env python3
"""Slices Nano Banana instrument sheets into one transparent 256x256 icon each.

Usage:  npm run instruments           (reads _art_inbox/instruments/<sheet name>.png, .jpg, .jpeg or .webp)

For every sheet named in tools/instrument-sheets.json that exists in the inbox:
  1. Removes the pure-white background by flood-filling inward from the image
     border (within a tolerance), so white INSIDE a closed ink outline (piano
     keys, drum skins) survives.
  2. Softens the cut edge by about 1 px.
  3. Finds the six instruments as blobs (nearby pieces, such as a bow or drum
     sticks, are grouped with their instrument), largest six, ordered by row
     then column.
  4. Crops each tight with a 4% margin, pads to a square, resizes to 256x256
     and writes public/sprites/instruments/<icon>.png.
Then it runs `npm run optimise` (PNG -> WebP, PNG removed) and prints the icon
ids to add to INSTRUMENT_ART_READY in src/entities/spinner/instrumentArt.data.ts.

Needs Python 3 with Pillow. Options: --inbox DIR  --out DIR  --no-optimise
"""

import argparse
import json
import os
import subprocess
import sys
from collections import deque

from PIL import Image, ImageChops, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHEETS_JSON = os.path.join(ROOT, "tools", "instrument-sheets.json")

CELLS_PER_SHEET = 6
COLUMNS = 3
MAX_SHEET_SIDE = 2048  # bigger sheets are scaled down to this
WHITE_TOLERANCE = 20  # a pixel is background-white if every channel >= 255 - this
OUTPUT_SIZE = 256
CROP_MARGIN = 0.04
GROUP_SCALE = 8  # blobs are found at 1/8 size...
GROUP_DILATE = 7  # ...after growing by this many low-res px, so a bow joins its violin
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


def find_blobs(foreground):
    """Groups foreground pixels into blobs. Returns [(area, (x0, y0, x1, y1), labels_lowres)] biggest first."""
    w, h = foreground.size
    small_w, small_h = max(1, w // GROUP_SCALE), max(1, h // GROUP_SCALE)
    small = foreground.resize((small_w, small_h), Image.BOX).point(lambda v: 255 if v > 0 else 0)
    small = small.filter(ImageFilter.MaxFilter(GROUP_DILATE))
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


def slice_sheet(path, icons, out_dir):
    """Cuts one sheet into its icons. Returns the ids written."""
    sheet = Image.open(path)
    if sheet.mode in ("RGBA", "LA", "P"):
        flat = Image.new("RGB", sheet.size, (255, 255, 255))
        flat.paste(sheet.convert("RGBA"), mask=sheet.convert("RGBA").getchannel("A"))
        sheet = flat
    rgb = sheet.convert("RGB")
    if max(rgb.size) > MAX_SHEET_SIDE:
        scale = MAX_SHEET_SIDE / max(rgb.size)
        rgb = rgb.resize((round(rgb.width * scale), round(rgb.height * scale)), Image.LANCZOS)
    w, h = rgb.size

    bg = background_mask(rgb)
    fg_bytes = bytes(0 if b else 255 for b in bg)
    foreground = Image.frombytes("L", (w, h), fg_bytes)
    # Soften the cut: pull the edge in 1 px (eats the pale fringe), then blur 1 px.
    alpha = foreground.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1))
    rgba = rgb.convert("RGBA")
    rgba.putalpha(alpha)

    label, count, sw, sh = find_blobs(foreground)
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
    ranked = sorted(range(1, count + 1), key=lambda k: areas[k], reverse=True)[:CELLS_PER_SHEET]
    if len(ranked) < CELLS_PER_SHEET:
        raise SystemExit(f"{path}: found only {len(ranked)} instruments, expected {CELLS_PER_SHEET}")
    if areas[ranked[-1]] < MIN_BLOB_FRACTION * areas[ranked[0]]:
        print(f"  warning: the smallest instrument found is tiny - check {os.path.basename(path)}")

    centres = {k: ((boxes[k][0] + boxes[k][2]) / 2, (boxes[k][1] + boxes[k][3]) / 2) for k in ranked}
    by_row = sorted(ranked, key=lambda k: centres[k][1])
    rows_count = CELLS_PER_SHEET // COLUMNS
    ordered = []
    for r in range(rows_count):
        row = by_row[r * COLUMNS:(r + 1) * COLUMNS]
        ordered += sorted(row, key=lambda k: centres[k][0])

    os.makedirs(out_dir, exist_ok=True)
    written = []
    for k, icon in zip(ordered, icons):
        x0, y0, x1, y1 = boxes[k]
        margin = round(max(x1 - x0, y1 - y0) * CROP_MARGIN)
        box = (max(0, x0 - margin), max(0, y0 - margin), min(w, x1 + margin + 1), min(h, y1 + margin + 1))
        tile = rgba.crop(box)
        side = max(tile.size)
        square = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        square.paste(tile, ((side - tile.width) // 2, (side - tile.height) // 2))
        square = square.resize((OUTPUT_SIZE, OUTPUT_SIZE), Image.LANCZOS)
        square.save(os.path.join(out_dir, f"{icon}.png"))
        written.append(icon)
    return written


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--inbox", default=os.path.join(ROOT, "_art_inbox", "instruments"))
    parser.add_argument("--out", default=os.path.join(ROOT, "public", "sprites", "instruments"))
    parser.add_argument("--no-optimise", action="store_true", help="skip `npm run optimise` (PNG -> WebP)")
    args = parser.parse_args()

    with open(SHEETS_JSON) as f:
        sheets = json.load(f)["sheets"]
    done = []
    for name, icons in sheets.items():
        # Nano Banana often saves a JPG whatever the file is called, so take any of these.
        candidates = [os.path.join(args.inbox, name + ext) for ext in (".png", ".jpg", ".jpeg", ".webp")]
        path = next((c for c in candidates if os.path.isfile(c)), None)
        if path is None:
            print(f"skip {name}: not in {args.inbox}")
            continue
        print(f"slicing {name} ...")
        written = slice_sheet(path, icons, args.out)
        print("  wrote " + ", ".join(written))
        done += written
    if not done:
        sys.exit("No sheets found - save them as <sheet name>.png in " + args.inbox)

    if not args.no_optimise:
        print("optimising ...")
        subprocess.run(["bash", "tools/sprite-optimise.sh"], cwd=ROOT, check=True)

    ready = sorted(
        os.path.splitext(n)[0] for n in os.listdir(args.out) if n.endswith((".webp", ".png"))
    )
    print("\nIcons sliced this run: " + ", ".join(done))
    print("\nSet INSTRUMENT_ART_READY in src/entities/spinner/instrumentArt.data.ts to:")
    print("[" + ", ".join(f"'{i}'" for i in ready) + "]")


if __name__ == "__main__":
    main()
