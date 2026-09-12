# Art Brief — Mobile/Tablet Move Buttons

> **✅ Delivered and wired in, 2026-09-12.** All four buttons (both required
> + both optional pressed states) were generated, cut out, and are live in
> `MobileMoveButtons.ts`. The art arrived as checkerboard-flattened JPEG
> exports with no alpha channel, so transparency was reconstructed rather
> than used as-is: threshold the near-neutral light checkerboard, erode 3 px
> to drop JPEG-blended boundary pixels, then resample through premultiplied
> alpha so no background grey bleeds into the soft edges (verified — 0% of
> semi-transparent edge pixels read grey; they average the Ink outline
> colour). Palette-quantised to 128 colours: 270 KB → 90 KB total, mean
> per-channel delta 1.7/255. **If regenerating these, export true
> transparent PNGs and this whole step disappears.** The brief below is
> retained as the spec for any future button art.

**For:** generating custom art for the on-screen ◀ / ▶ move buttons with Nano
Banana (Gemini 2.5 Flash Image), matching the granny/gun/world art already
delivered. **Owner:** you, same as `ART_BRIEF.md` — drop the finished PNGs
into the path below and the game will pick them up (this is a small follow-up
wire-in, not a new pipeline).

Right now these two buttons are procedural — a plain Mint Green rounded
square with an Ink arrow, drawn in code (`src/ui/MobileMoveButtons.ts`).
Functional, chunky, high-contrast, but not "lovely" — no watercolour warmth,
no character. This brief gets you there.

---

## 1. Style recap (same as every other asset)

- Hand-painted watercolour, thick black (Ink, `#1F2138`, never pure black)
  outlines. Ghibli warmth × Animal Crossing comfort — not flat/vector.
- Palette — pull only from CLAUDE.md §5.1's 8 colours. For these buttons
  specifically: **Mint Green `#7FD9A8`** as the hero fill (§5.1 names Mint
  Green for "confirm buttons, unlock success" — a move button is exactly
  that category), Ink outline, Cloud `#F5F2E8` for any highlight.
- Single light source, upper-left; shadow lower-right.
- Fully transparent PNG background, no baked-in drop shadow (the game can
  add its own if wanted).
- Generate at 2× target size, downscale clean.

## 2. What to generate

**2 images, 256×256 px each, transparent PNG:**

| Button | Filename | Prompt seed |
|---|---|---|
| Move left | `move_left.png` | "A chunky, rounded, hand-painted watercolour button shaped like a friendly rounded-square badge, Mint Green (#7FD9A8) fill with a thick Ink (#1F2138) outline, containing one bold arrow pointing LEFT. Playful kids'-game style, single upper-left light source, soft shadow lower-right inside the badge, no gradient soup, no text. Transparent background. Think: a big satisfying button a 6-year-old would love to mash." |
| Move right | `move_right.png` | Same seed, mirrored — arrow points RIGHT. Generate as a true mirror of `move_left.png` (or regenerate with the same locked reference image, flipping only the arrow direction) so the two buttons read as one consistent pair, not two independent designs. |

Optional stretch (not required for launch, only if you want extra polish):
a **pressed/active variant** of each (`move_left_pressed.png` /
`move_right_pressed.png`) — same design, Granny Pink `#FF6BA8` fill instead
of Mint Green, very slightly "squashed" (a hair shorter/wider), for the
tactile down-state. The game already does a code-driven pressed state
(colour swap + scale) as a fallback if you skip these.

## 3. Delivery path

```
public/sprites/ui/buttons/
├── move_left.png
├── move_right.png
├── move_left_pressed.png   # optional
└── move_right_pressed.png  # optional
```

Drop the files there and flag it — wiring them into `BootScene.ts`'s preload
and swapping `MobileMoveButtons.ts` from procedural graphics to these sprites
is a small, fast follow-up once they exist.
