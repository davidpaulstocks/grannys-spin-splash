# Art Brief — Grannies & Guns

**For:** generating launch sprite art with Nano Banana (Gemini 2.5 Flash Image).
**Owner:** you — see CLAUDE.md §8's correction note (2026-09-11). This doc is the
delivery spec; drop finished PNGs into the exact paths below and the game will
pick them up (Sprint 3 wires the loading code against these paths/filenames).

> **Read CLAUDE.md §8.3.1 first** for the actual generation workflow — lock one
> style-template image, then chain every other image off it as a reference.
> Don't generate everything in parallel; style consistency depends on that chain.

---

## 1. Style recap (same for everyone)

- **Style:** hand-painted watercolour, thick black outlines. Ghibli warmth ×
  Animal Crossing comfort. Not flat/vector, not photoreal.
- **Palette — use only these 8 colours, nothing else:**

  | Name | Hex | Use it for |
  |---|---|---|
  | Granny Pink | `#FF6BA8` | dress/clothing accents, hero warmth |
  | Water Blue | `#4DB3E5` | water gun details, cool accents |
  | Sunny Gold | `#FFC93C` | jewellery, trim, highlights |
  | Heat Orange | `#FF8A3D` | Inferno gun only, fire accents |
  | Mint Green | `#7FD9A8` | occasional accent, not primary on any character |
  | Ink | `#1F2138` | outlines, deep shadow — never pure black |
  | Soft Slate | `#6B6F8C` | secondary shading |
  | Cloud | `#F5F2E8` | never pure white — skin highlights, trim |

- **Lighting:** single light source, upper-left. Shadow falls lower-right.
- **Outline:** ~4px Ink, consistent weight on every piece. No outline on
  transparent/alpha edges.
- **Background:** fully transparent PNG. No ground shadow baked in (the game
  draws its own).
- **Resolution:** generate at 2× the target size below, then downscale — keeps
  edges clean after `pngquant` optimisation (`npm run optimise`).

---

## 2. Grannies — 3 launch characters

Two pose tiers per granny:

- **Gameplay tier (required for launch):** front-facing standing + firing.
  This is the pose actually used in-game — Granny only ever faces the
  player; left/right movement is a horizontal flip done in code
  (`setFlipX()`), not separate art. **No separate left/right art needed.**
- **Turnaround tier (for the splash-screen carousel + an optional Frenzy
  celebration spin):** three more standing angles so she can visibly turn.
  These make the character-select carousel (CLAUDE.md §10) feel alive
  instead of a static cutout, and give the Frenzy banner moment somewhere
  fun to spend a full-body animation. Firing pose is front-only — she
  doesn't need to fire from the side/back angles.

**5 images per granny, 15 total.** Same size for all: **256×384 px, transparent PNG.**

| Pose | Filename | Notes |
|---|---|---|
| Front, standing | `front.png` | Arms at sides, relaxed, facing camera |
| Front, firing | `front_firing.png` | Arms forward holding gun position (gun itself is separate art — leave her hands in a gripping pose, gun gets composited on top) |
| 3/4 turn, standing | `three_quarter.png` | Body turned ~45°, same relaxed pose, still readable as the same character |
| Side, standing | `side.png` | Full profile, same relaxed pose |
| Back, standing | `back.png` | Facing away — same silhouette/colours from behind (curls/mohawk/mac from the back, etc.) |

**File paths** (subfolder per granny — mirrors the existing per-gun folder convention):

```
public/sprites/grannies/classic/front.png
public/sprites/grannies/classic/front_firing.png
public/sprites/grannies/classic/three_quarter.png
public/sprites/grannies/classic/side.png
public/sprites/grannies/classic/back.png

public/sprites/grannies/squirt/...        (same 5 filenames)
public/sprites/grannies/punk/...          (same 5 filenames)
```

**Generation order (per CLAUDE.md §8.3.1 — do this whole granny before starting the next):**

1. Generate Classic Granny `front.png`. Iterate until palette/outline/scale/lighting are exactly right. This is your style-lock reference for everything else.
2. Generate Classic Granny `front_firing.png` using `front.png` as reference.
3. Generate `three_quarter.png`, `side.png`, `back.png`, each using `front.png` as reference plus an explicit angle instruction (e.g. *"same character, same outfit and colours, now shown from directly behind, full profile silhouette"*).
4. Repeat steps 1–3 for Squirt Sister and Punk Granny, using Classic Granny's `front.png` as an additional style reference each time (holds outline weight/lighting consistent across characters, not just across one character's own angles).

**Character descriptions** (from CLAUDE.md §8.1 — expand into a full Nano Banana prompt, don't just paste these three words):

| Granny | Vibe | Prompt seed |
|---|---|---|
| Classic Granny | Pink dress, white curls, glasses | Tiny elderly woman, big round glasses, soft white curled hair, knee-length Granny Pink dress with a white collar, comfortable shoes, warm smile |
| The Squirt Sister | Yellow rain mac, pigtails, freckles | Tiny elderly woman, grey hair in two short pigtails, freckled cheeks, bright yellow rain mac over the outfit, rolled-up sleeves, ready for a water fight |
| Punk Granny | Mohawk, leather, attitude | Tiny elderly woman, dyed mohawk (use Granny Pink or Sunny Gold, not an off-palette colour), small leather jacket, chunky boots, confident smirk — still warm and kid-friendly, not edgy/scary |

---

## 3. Guns — 6 launch weapons

Already fully speced in CLAUDE.md §8.2/§8.3.1 — this section just consolidates
it in one place so you're not flipping between docs.

**8 angles per gun, transparent PNG, 192×128 px:** `0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°` (0° = pointing right).

```
public/sprites/guns/pistol/0.png
public/sprites/guns/pistol/45.png
public/sprites/guns/pistol/90.png
public/sprites/guns/pistol/135.png
public/sprites/guns/pistol/180.png
public/sprites/guns/pistol/225.png
public/sprites/guns/pistol/270.png
public/sprites/guns/pistol/315.png
public/sprites/guns/pistol/anchor.json   ← nozzle XY per angle, see below

public/sprites/guns/squirter/...   (same 8 angles + anchor.json)
public/sprites/guns/hose/...
public/sprites/guns/splashjr/...
public/sprites/guns/soaker3000/...
public/sprites/guns/inferno/...
```

| Tier | Name | Visual cue |
|---|---|---|
| 1 | Drip Pistol | Tiny plastic neon toy |
| 1 | The Squirter | Classic '90s super-soaker |
| 2 | Garden Hose | Coiled hose, brass nozzle |
| 2 | Splash Jr | Two-handed kid blaster |
| 3 | Soaker 3000 | Twin-barrel, retro-futuristic |
| 4 | Inferno | Red flame-painted (Heat Orange accents — this is the one gun allowed to break the "no off-palette colour" rule, since fire-theming is its whole identity) |

**Generation order:** lock Drip Pistol at 0° first (style template for every gun), generate its other 7 angles from that reference, author its `anchor.json`, then repeat per-gun for the remaining 5 (each gets its own 0° lock, then 7 angles, using Drip Pistol's 0° as a *style* reference so outline/lighting stay consistent across guns even though the gun shapes differ).

**`anchor.json` format** — the pixel coordinate of the nozzle tip in each angle's PNG, used to spawn water particles from the right spot:

```json
{
  "0": { "x": 168, "y": 60 },
  "45": { "x": 150, "y": 30 },
  "90": { "x": 96, "y": 12 },
  "135": { "x": 42, "y": 30 },
  "180": { "x": 24, "y": 60 },
  "225": { "x": 42, "y": 90 },
  "270": { "x": 96, "y": 116 },
  "315": { "x": 150, "y": 90 }
}
```

Use `tools/anchor-picker.html` (CLAUDE.md story 3.5 — a small drag-and-click
tool) once it exists to get exact values instead of eyeballing them; it isn't
built yet, so for now just open each PNG in any image editor, find the nozzle
pixel, and type the coordinates in by hand.

---

## 4. Delivery

Drop files at the exact paths above (create the folders as needed) and let me
know — I'll wire `Granny.ts`/`Gun.ts` to load and render them (sprite-based
rendering + the turnaround/flip logic + the 8-angle snap-to-nearest-cardinal
rotation are Sprint 3 stories 3.7/3.8, already scoped for this). Partial
delivery is fine — send one granny or one gun at a time if that's easier than
batching all 21 images at once; I'll integrate incrementally rather than
waiting for everything.

Run `npm run optimise` (pngquant, CLAUDE.md tools/sprite-optimise.sh) after
dropping files, before a final build — keeps the whole sprite set under the
~1 MB budget in CLAUDE.md §8.4.
