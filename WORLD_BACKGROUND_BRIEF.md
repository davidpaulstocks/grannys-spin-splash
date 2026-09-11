# Art Brief — World Backgrounds

**For:** generating the 5 world backdrops with Nano Banana (Gemini 2.5 Flash Image).
**Owner:** you — same deal as [ART_BRIEF.md](ART_BRIEF.md). Drop finished images
into the exact paths below and let me know; I'll wire the loading code and swap
out the current procedural placeholders (flat muted shapes, drawn in
`src/entities/world/worldBackgrounds.ts` — that file goes away once these land).

**Why this exists:** the current backgrounds are procedural `Graphics` shading
(dot grids, stripes, checker patterns) on flat muted fills. They're fine as
scaffolding but can't read as a _place_ — no painted illustration can come out
of rectangles and circles. Five illustrated environments, one per world, in
the same hand-painted style as the grannies/guns, is what actually delivers
"I'm entering an environment."

---

## 1. Style recap (same family as ART_BRIEF.md, adapted for a backdrop)

- **Style:** hand-painted watercolour/gouache, Ghibli warmth × Animal Crossing
  comfort — the exact same visual language as the character art, not a
  different treatment. The whole game should read as one consistent
  illustrated world, characters and backgrounds alike.
- **Palette — build from these 8 colours** (tints/shades of them are expected
  and good for a background; a flat backdrop reading as 8 solid fills would
  look worse than the current placeholders, not better):

  | Name        | Hex                                                          |
  | ----------- | ------------------------------------------------------------ |
  | Granny Pink | `#FF6BA8`                                                    |
  | Water Blue  | `#4DB3E5`                                                    |
  | Sunny Gold  | `#FFC93C`                                                    |
  | Heat Orange | `#FF8A3D`                                                    |
  | Mint Green  | `#7FD9A8`                                                    |
  | Ink         | `#1F2138` (darkest value in any painting — never pure black) |
  | Soft Slate  | `#6B6F8C`                                                    |
  | Cloud       | `#F5F2E8` (lightest value — never pure white)                |

- **Depth treatment — this is the part that matters most for gameplay
  readability.** The spinner wall (12-20 small, brightly-coloured procedural
  icons) sits _on top of_ this painting and has to stay the clearest thing on
  screen — that's the whole game's design DNA (CLAUDE.md §5.8: "spinners
  cover ~60% of the visible area, they earn the space"). Treat the
  illustration like a soft-focus establishing shot, not a poster: rich detail
  and atmosphere, but gentle value contrast and no small high-contrast
  details competing in the zone where spinners will sit (the middle ~60% of
  the frame). Push your sharpest detail and darkest/lightest values to the
  edges and the ground strip; keep the mid-frame airy — soft light, gentle
  gradients, larger simple shapes rather than dense linework.
- **Lighting:** single light source, upper-left — same rule as every other
  asset in the game.
- **Framing:** landscape, camera-into-the-room — like standing in the doorway
  looking in, not a flat elevation/blueprint view. Leave the lower ~15-20% of
  the frame relatively simple/uncluttered — that's where Granny stands and
  the water-tank bar renders on top.
- **No characters, no UI, no spinners baked in.** Empty of anything that the
  game renders live on top. Establishing-shot environment only.
- **Format:** opaque (no transparency needed — this is the base layer,
  nothing sits behind it), **1536×864 px** (1.2× the 1280×720 canvas, giving
  a small safe-crop margin), PNG or high-quality JPG.

---

## 2. The 5 worlds

Generate **Garden first** — it's the style-lock reference every other world
chains off (same reference-image workflow as CLAUDE.md §8.3.1's character
pipeline: lock one image, iterate until the palette/brushwork/lighting is
exactly right, then generate the rest using it as the Nano Banana reference
so all 5 feel like rooms in the same house, not 5 different art styles).

| World    | Filename          | Scene                                                                                          | Prompt seed                                                                                                                                                                                                                                                                                           |
| -------- | ----------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Garden   | `garden_bg.png`   | A cottage back garden — the spinner wall reads as pinwheels/fans planted along a wooden fence  | Warm afternoon cottage garden, weathered wooden fence, soft flowerbeds either side, dappled sunlight through a tree just out of frame, grass underfoot, a watering can or two for flavour — calm, sunny, the _first_ world a player sees                                                              |
| Workshop | `workshop_bg.png` | A granny's garage/shed workshop — spinners read as tools and gadgets pinned to a pegboard wall | Cosy workshop interior, pegboard wall with tool silhouettes and hooks, a sturdy wooden workbench along the bottom, warm hanging bulb or string lights overhead, sawdust-and-wood-tone palette, a coiled hose or two for a knowing nod to the guns                                                     |
| Kitchen  | `kitchen_bg.png`  | A warm family kitchen — spinners read as things spinning on the countertop/wall                | Cosy kitchen, soft tiled backsplash, open shelving with jars and mixing bowls, warm cream and gold tones, a checkered or terracotta floor strip at the bottom, hanging pots for texture without clutter                                                                                               |
| Funfair  | `funfair_bg.png`  | Inside a carnival big-top tent — spinners read as carnival games/fairground wheels             | Inside a candy-striped big-top tent, canvas ceiling sweeping up out of frame, soft carnival bunting, warm string-light glow, a hint of a carousel or ticket booth at the edges — festive but not chaotic, the palette stays warm pinks/golds, not a rainbow circus explosion                          |
| Disco    | `disco_bg.png`    | A home-made basement disco — spinners read as glowing dancefloor fixtures                      | Cosy basement disco, a single soft mirror-ball glow overhead, dark moody Ink-toned walls (never pure black — keep it warm-dark, not horror-dark), a few soft colour-wash light pools (gold/pink/blue) on the back wall, a bit of tinsel or string lights — kid-friendly party energy, not a nightclub |

---

## 3. Delivery

```
public/sprites/worlds/garden_bg.png
public/sprites/worlds/workshop_bg.png
public/sprites/worlds/kitchen_bg.png
public/sprites/worlds/funfair_bg.png
public/sprites/worlds/disco_bg.png
```

Same as the character art: partial delivery is fine, send Garden first (it's
the style lock) and I'll confirm it reads well with the spinner wall live
before you spend time on the other 4. Once files land I'll wire
`worldBackgrounds.ts` to load and render them (behind the spinner wall, ahead
of the ground-plane HUD elements) and retire the current procedural
placeholders. Run `npm run optimise` after dropping files, same as the
character sprites — five ~1536×864 paintings will be the single biggest
chunk of the asset budget, so compression matters here more than anywhere
else in the game.
