# Art Brief — Instruments

> **Note (2026-11-27): how art is actually made now.** Instruments, visitors and guns are painted as sheets on pure white, dropped in `_art_inbox/<instruments|visitors|guns>/` and cut by `npm run instruments`, `npm run visitors` or `npm run guns` (`tools/slice-instrument-sheet.py`; the sheets are named in `tools/*-sheets.json`), which remove the white (keeping white inside a closed outline), crop, size and convert to WebP, then print the ids to add to the matching `*_ART_READY` list. This brief's six-by-six plan is how the instruments were made; the 36 pictures are done.

**For:** painting the 36 instrument pictures that sit in the middle of every spinner, with Nano Banana (Gemini 2.5 Flash Image).
**Owner:** you — same deal as [ART_BRIEF.md](ART_BRIEF.md) and [WORLD_BACKGROUND_BRIEF.md](WORLD_BACKGROUND_BRIEF.md). The code is already built and waiting; each picture you drop in switches on by itself (section 6).

**Why this exists:** the little drawn badges in the spinners' hubs are hard to tell apart ("some of them look the same"). Every spinner is a musician, so it now wears a **painted instrument** in the middle of a spinning disc. The blades keep turning behind it in the section colour (so speed still reads), but the instrument itself stays upright, bounces on its notes, and slumps to one side while its musician is asleep. A spinner shows at roughly **100 px across** on a laptop screen, so the instrument has to be read at a glance: chunky, simple, one clear silhouette.

**To save your time you paint six sheets, not 36 singles.** Each sheet is a 3 x 2 grid of six instruments. A small script cuts them up.

---

## 1. Style lock (same family as the grannies, guns and backdrops)

- **Style:** hand-painted watercolour, thick Ink outlines, Ghibli warmth x Animal Crossing comfort. Friendly and chunky: round it, simplify it, make it slightly bigger in the middle than a real one. Not flat vector, not photoreal.
- **Palette — only these eight colours (tints and shades are fine inside an instrument, nothing outside them):**

  | Name        | Hex       | Good for                                    |
  | ----------- | --------- | ------------------------------------------- |
  | Granny Pink | `#FF6BA8` | warm wood glow, drum shells, accents        |
  | Water Blue  | `#4DB3E5` | cool accents, drum shells                   |
  | Sunny Gold  | `#FFC93C` | brass, cymbals, bells, strings, trim        |
  | Heat Orange | `#FF8A3D` | wood (violin, guitar bodies), warm woods    |
  | Mint Green  | `#7FD9A8` | occasional accent only                      |
  | Ink         | `#1F2138` | outlines, deepest shadow — never pure black |
  | Soft Slate  | `#6B6F8C` | metal, shading, hardware                    |
  | Cloud       | `#F5F2E8` | highlights, piano keys, drum skins          |

- **Lighting:** one light, upper-left; shadow falls lower-right, inside the object (no cast shadow on the ground).
- **Outline:** thick Ink (about 4 px at 256 px output), the same weight on every instrument, **fully closed** with no gaps.
- **Objects only:** no faces, no hands, no players, no stands, no text, no music notes, no sparkles, no ground shadow. Just the instrument.
- **Readable at 100 px:** if a detail disappears when you squint, leave it out (no tiny fret markers, no sheet-music, no fine engraving).

---

## 2. The sheet format (every sheet the same)

- **Grid:** 3 columns x 2 rows = six instruments, generous even spacing, **nothing touching, overlapping or running off the edge**, a wide empty margin round the whole sheet.
- **Each instrument fills its cell** (about 80% of the cell's width or height, centred), so they come out roughly the same size.
- **View:** 3/4 view, at whichever angle makes that instrument most recognisable. Long instruments (cello, trombone, clarinet) stand or lie at a slight diagonal so they fill the cell.
- **Background: pure white (`#FFFFFF`), flat, no gradient, no floor, no shadow.** The slicer removes the white by flooding in **from the edges only**. That means white _inside_ a closed ink outline (piano keys, drum skins, a cymbal's shine) is kept, and that is exactly why the outline must be closed. Do not use a transparent or checkerboard background: the tool bakes the checkerboard in.
- **Size:** square, as big as the tool allows (2048 x 2048 ideal; 1536 or 1024 still works).
- **Save as PNG** to `_art_inbox/instruments/<sheet file name>` (names below). The folder is not part of the game and is not committed.

### Workflow (the same reference-chain as CLAUDE.md §8.3.1)

1. **Sheet 1 (strings) first.** Iterate on it until the outline weight, palette, lighting and chunkiness are exactly right.
2. **Then use sheet 1 as the reference image for every other sheet.** Attach it and add _"Match the style, outline weight, palette and lighting of the attached sheet exactly."_
3. Generate the other five in any order. Do not run them in parallel against different references: the chain is what keeps all 36 looking like one set.
4. If one instrument in a sheet is wrong, don't redo the sheet: regenerate it and tell me (or say "this cell only" in the prompt and re-roll), then drop the corrected sheet in. About one in five cells usually needs a second go.

---

## 3. The master prompt

Paste this at the top of every sheet prompt, then add that sheet's own list from section 4:

```
A sheet of six musical instruments laid out in a 3 by 2 grid (three across, two
down) on a perfectly flat pure white background (#FFFFFF). Each instrument sits
in its own cell, centred, filling about 80% of its cell, with wide empty
white space between instruments and around the edges. No instrument touches
or overlaps another or the edge of the image.

Style: hand-painted watercolour with thick, fully closed dark navy-ink (#1F2138)
outlines of identical weight on every object, Ghibli warmth and Animal
Crossing comfort. Chunky, friendly, slightly exaggerated round shapes, simple
enough to read at 100 pixels wide. Single light source from the upper left with
soft shading toward the lower right. Palette limited to: pink #FF6BA8, blue
#4DB3E5, gold #FFC93C, orange #FF8A3D, mint #7FD9A8, ink #1F2138, slate
#6B6F8C, cream #F5F2E8 (and tints of those). Each instrument is drawn at a
three-quarter angle at its most recognisable view.

Strictly no people, no hands, no faces, no stands, no text, no letters, no music
notes, no sparkles, no floor, no cast shadows, no gradient background. Only the
six objects on plain white.

The six instruments, reading left to right, top row first:
```

(then the numbered list from the sheet, as below.)

---

## 4. The six sheets

Cell order is **row 1 left to right, then row 2 left to right**: cells 1 2 3 on top, 4 5 6 underneath. The slicer relies on that order, so get the instruments into the right cells (if a cell is wrong, move the instrument in an image editor or re-roll).

### Sheet 1 — Strings

**Save as:** `_art_inbox/instruments/sheet-1-strings.png`
**This is the style-lock sheet; no reference image.**

```
1. A violin, held at a slight tilt, orange-brown glossy wood, gold strings, a
   small chin rest and a curled scroll at the top. Do not draw the bow.
2. A cello, standing upright and slightly tilted, deeper red-orange wood, tall
   neck with a scroll, a gold tailpiece and a short slate endpin at the bottom.
   Larger and rounder than the violin. No bow.
3. A double bass, standing upright, the biggest body of the set, dark warm wood
   with sloping shoulders, a long neck and a slate endpin. No bow.
4. A concert harp, a tall tilted triangle frame in gold and cream with a curved
   column, a curved top neck and a row of long gold strings.
5. An acoustic guitar, orange-gold wood, a round sound hole, six strings, a
   cream pick-guard, head turned up at an angle.
6. An electric guitar, pink body with a cream pick-guard and a few slate knobs,
   a slim neck and a pointed head. Clearly different from cell 5: a solid
   body, no sound hole.
```

| Cell | Icon              | What makes it recognisable / different from its neighbour                                                             |
| ---- | ----------------- | --------------------------------------------------------------------------------------------------------------------- |
| 1    | `violin`          | Small, scroll top, chin rest. **Also stands in for violas, violins and the pizzicato strings** — don't paint a viola. |
| 2    | `cello`           | Bigger, upright, endpin. Taller and deeper-coloured than the violin.                                                  |
| 3    | `double_bass`     | Biggest, sloped shoulders (not a cello's round ones).                                                                 |
| 4    | `harp`            | Triangle frame and strings: nothing else has this silhouette.                                                         |
| 5    | `acoustic_guitar` | Hollow body with sound hole.                                                                                          |
| 6    | `electric_guitar` | Solid pointed body, knobs, no sound hole.                                                                             |

### Sheet 2 — Woodwind and first brass

**Save as:** `_art_inbox/instruments/sheet-2-woodwind-brass.png` — attach sheet 1 as the style reference.

```
1. A flute, a slim silver-slate side-blown tube lying at a slight diagonal, a
   round mouth hole near one end and a row of small round keys.
2. A clarinet, a black-ink tube with a flared bell, round slate keys down the
   body and a small cream mouthpiece. Standing at a slight diagonal. Plain
   straight tube with a flared bell: not curved.
3. A bassoon, a tall dark-wood body made of a long folded tube (two parallel
   columns joined at the bottom), slate keys and a thin curved gold crook at the top.
4. A tenor saxophone, shiny gold, an S-shaped curved body ending in an upturned
   flared bell, with a curved neck and mouthpiece and a row of round slate keys.
5. A trumpet, shiny gold, a compact looped tube with a flared bell at the front
   and three round valves on top.
6. A trombone, shiny gold, a long sliding U-shaped tube with a big flared bell
   and a long straight slide, no valves.
```

| Cell | Icon        | Recognisable / different from neighbours                                                         |
| ---- | ----------- | ------------------------------------------------------------------------------------------------ |
| 1    | `flute`     | Thin silver side-blown tube; **also the piccolo**.                                               |
| 2    | `clarinet`  | Black tube with flared bell; straight, not curved like the sax. (Also oboe if one ever appears.) |
| 3    | `bassoon`   | Tall folded body and thin crook: not a sax.                                                      |
| 4    | `saxophone` | Gold S-curve with upturned bell. The tenor and the baritone are the same picture.                |
| 5    | `trumpet`   | Small, compact loop, three valves. **Also the muted trumpet and the "Horns" seat.**              |
| 6    | `trombone`  | Long slide, no valves: the one thing that makes it not a trumpet.                                |

### Sheet 3 — Brass and keys

**Save as:** `_art_inbox/instruments/sheet-3-brass-keys.png` — attach sheet 1 as the style reference.

```
1. A French horn, shiny gold, a tight coiled circle of tubing with a wide round
   flaring bell facing the viewer and three small valve levers.
2. A tuba, shiny gold, very large and round, tall coiled body, a huge upward-
   pointing bell, a curved mouthpiece pipe and three valves on top.
3. A euphonium, shiny gold, a medium-sized rounded body, a smaller upward bell
   than the tuba, three valves, a compact squat shape.
4. An upright piano seen from the front three-quarter, warm orange-brown wood
   case, a row of cream keys with a few dark ink black keys, music desk above.
5. A chunky retro organ (like a Hammond), cream and orange wood cabinet, two
   rows of keys, a few round slate drawbars on top, short wooden legs.
6. An electric piano, a flat slate and pink slab case with one row of cream
   and ink keys, two round slate knobs on the left, short slate legs.
```

| Cell | Icon             | Recognisable / different from neighbours                                                    |
| ---- | ---------------- | ------------------------------------------------------------------------------------------- |
| 1    | `french_horn`    | A coiled circle with a wide bell facing you: not a straight-tube brass.                     |
| 2    | `tuba`           | Huge, tall, with a large upward bell.                                                       |
| 3    | `euphonium`      | Same family but smaller and squatter than the tuba — keep it clearly _smaller and rounder_. |
| 4    | `piano`          | Upright case, black-and-white keys.                                                         |
| 5    | `organ`          | Chunky cabinet, two keyboards, drawbars. **Also the Fairground Organ** (no pipes needed).   |
| 6    | `electric_piano` | Flat slab with one keyboard and knobs: not the organ. **Also the Clavinet.**                |

### Sheet 4 — Mallets and the rhythm section

**Save as:** `_art_inbox/instruments/sheet-4-mallets-rhythm.png` — attach sheet 1 as the style reference.

```
1. A glockenspiel, a flat slate-blue trapezoid frame holding two rows of
   shiny silver and gold metal bars that shorten left to right, two small round-
   headed cream mallets lying across the front.
2. A marimba, a wooden trapezoid frame with a row of warm orange wood bars that
   shorten left to right and a few gold resonator tubes hanging underneath.
   Two soft mallets resting on top.
3. A vibraphone, a slate frame with two rows of shiny gold metal bars, long
   slate resonator tubes underneath and a round spinning-fan disc at the end of
   the tubes. Two soft mallets.
4. A bass guitar, a long slim solid body in blue, a very long four-string neck,
   a cream pick-guard and slate knobs. Clearly longer and slimmer than a normal
   guitar, held at a diagonal.
5. A drum kit seen from the front three-quarter: a big pink bass drum in front,
   a snare drum, two small tom drums on top and a gold cymbal on a slate stand,
   cream drum skins. All compact in one tight group.
6. A single bass drum seen at a three-quarter angle, a big round blue shell with
   a cream drum skin facing us, slate tension rods around the rim, and a
   fat felt beater leaning against it.
```

| Cell | Icon           | Recognisable / different from neighbours                                      |
| ---- | -------------- | ----------------------------------------------------------------------------- |
| 1    | `glockenspiel` | Small, bright metal bars in a flat frame. **Also the bell tree.**             |
| 2    | `marimba`      | Warm _wood_ bars and tubes. **Also the Xylophone.** Don't make it metal.      |
| 3    | `vibraphone`   | Gold _metal_ bars plus the spinning fan discs.                                |
| 4    | `bass_guitar`  | Longer and slimmer than the guitars on sheet 1.                               |
| 5    | `drum_kit`     | A cluster: more than one drum and a cymbal.                                   |
| 6    | `bass_drum`    | One big drum, no cymbal. **Also the kick drum and the bass drum and cymbal.** |

### Sheet 5 — Drums and percussion

**Save as:** `_art_inbox/instruments/sheet-5-drums-percussion.png` — attach sheet 1 as the style reference.

```
1. A snare drum, a shallow drum with a cream skin, shiny slate metal rim and
   tension rods, two cream drumsticks crossed on top of the skin.
2. A hi-hat cymbal pair on a slim slate stand: two shiny gold cymbals stacked
   one above the other, seen at a slight angle, a slate rod beneath. No pedal.
3. A pair of tom-tom drums side by side, two round drums of different sizes in
   pink and blue with cream skins and slate rims, mounted on a short slate bar.
4. A pair of congas, two tall barrel-shaped drums, deep orange wood with slate
   hoops, cream skins on top, the taller one behind the shorter one.
5. A tambourine, a round wooden orange frame with a cream skin and a ring of
   shiny gold jingle discs set into the frame. Seen at a slight tilt.
6. A cowbell, a trapezoid hollow slate-metal bell tapered toward the top with a
   thick handle bar and a dark open mouth showing.
```

| Cell | Icon         | Recognisable / different from neighbours                                        |
| ---- | ------------ | ------------------------------------------------------------------------------- |
| 1    | `snare_drum` | Shallow drum with sticks on top. **Also brushes, rimshot and "Snare & Claps".** |
| 2    | `cymbal`     | Gold stacked discs on a stand. **Also the Ride, Crash, Cymbals and Hi-Hats.**   |
| 3    | `tom_toms`   | Two round drums side by side.                                                   |
| 4    | `congas`     | Tall barrels, different heights.                                                |
| 5    | `tambourine` | Frame with jingle discs. **Also the triangle and sleigh bells.**                |
| 6    | `cowbell`    | A tapered metal bell: not a drum.                                               |

### Sheet 6 — Shakers, kitchen and the odd ones

**Save as:** `_art_inbox/instruments/sheet-6-shakers-kitchen-odd.png` — attach sheet 1 as the style reference.

```
1. A pair of maracas crossed in an X: two round pink and gold egg-shaped shakers
   with short cream handles.
2. A pair of wooden hand clappers: two flat orange-wood paddle shapes each with
   a short handle, held slightly apart as if about to clap. Just the paddles,
   nobody holding them.
3. A balloon whisk, a slate-metal handle with a loop of thin curved slate wires
   forming a teardrop cage.
4. A small stack of two cooking pots and a frying pan, slate-metal pots with a
   gold rim and handles, one pan on top, a wooden spoon leaning against them.
5. A blacksmith's anvil, a heavy dark slate and ink shape with a flat top, a
   pointed horn on one side and a sturdy base, and a small cream wooden
   woodblock sitting on top of it.
6. A disco mirror ball, a round ball covered in small shiny silver and cream
   square tiles with a hint of pink and blue, a little metal cap and a ring on
   top. Round, simple, and chunky.
```

| Cell | Icon          | Recognisable / different from neighbours                                                          |
| ---- | ------------- | ------------------------------------------------------------------------------------------------- |
| 1    | `maracas`     | A crossed pair of shakers. **Also the Garden's "Percussion" and any shaker.**                     |
| 2    | `clappers`    | Flat wooden paddles: Finger Snaps and Handclaps (stand in for hands, since no hands are allowed). |
| 3    | `whisk`       | A wire teardrop cage: the Kitchen's whisk.                                                        |
| 4    | `pots`        | Pots, a pan and a spoon: the Kitchen's Pots & Pans.                                               |
| 5    | `anvil`       | Heavy anvil with a woodblock: the Workshop's Anvil & Woodblocks.                                  |
| 6    | `mirror_ball` | The Disco's mirror ball. (It sits in the backdrop's own mirror ball spot; see the note below.)    |

> **Shapes with holes (harp, whisk, hi-hat stack):** the cut-out keeps white that is inside a closed outline, so the gaps between a harp's strings or inside the whisk can stay white. That is fine for the game (it sits on a cream disc). If one looks wrong, tell me and I'll add a hole-punch to the slicer.

---

## 5. Common prompt problems and fixes

- **Instruments touch or are cropped:** add "much more white space between the instruments, each instrument smaller, at 70% of its cell".
- **A person or hand appears:** repeat "no people, no hands, no players" at the end; for the clappers, "paddles lying alone".
- **Background is off-white or has a floor shadow:** "perfectly flat pure white background, no shadows, no ground".
- **Outline gaps or fuzzy outlines:** "thick, fully closed, solid ink outline, no gaps".
- **Style drifts on later sheets:** re-attach sheet 1 and say "same style as the attached sheet".

---

## 6. What happens next

1. Save the sheets as above into `_art_inbox/instruments/` (the folder is git-ignored). You can do one sheet at a time; the ones that are missing are skipped.
2. Run **one command** from the project root:

   ```bash
   npm run instruments
   ```

3. It does this, for each sheet it finds:
   - removes the white background (from the edges inward, so enclosed white stays),
   - finds the six instruments, crops each tight with a small margin, pads it square and shrinks it to 256 x 256,
   - writes `public/sprites/instruments/<icon>.png`, then runs `npm run optimise`, which turns them into `.webp` and removes the PNGs,
   - prints the **list of icon ids that now exist**.
4. Paste that list into `INSTRUMENT_ART_READY` in `src/entities/spinner/instrumentArt.data.ts` (or tell me and I will). Until an icon is listed, its spinners keep today's drawn badge, so you can ship half-finished and nothing breaks.
5. Play: the spinners for those instruments now show the painted instrument in a cream disc, with the blades turning round it. Each is 256 x 256 and about 10-25 KB, so all 36 add well under 1 MB (the cap is checked by `npm run budget`).

Spot-check each result at **100 px wide** before moving on: can you still tell what it is? If two look alike when small, that is a reason to repaint one.

---

## 7. Checklist — every icon, its sheet and cell, and who wears it

Venues: **G** Garden, **W** Workshop, **K** Kitchen, **F** Funfair, **D** Disco.

| Icon              | Sheet | Cell | Worn by (venue: seats)                                            |
| ----------------- | ----- | ---- | ----------------------------------------------------------------- |
| `violin`          | 1     | 1    | G: Violins, Pizzicato, Violas · D: Disco Strings, Violins, Violas |
| `cello`           | 1     | 2    | G: Cellos · D: Cellos                                             |
| `double_bass`     | 1     | 3    | G: Double Bass · K: Double Bass                                   |
| `harp`            | 1     | 4    | G: Harp · D: Harp                                                 |
| `acoustic_guitar` | 1     | 5    | K: Jazz Guitar · F: Guitar                                        |
| `electric_guitar` | 1     | 6    | W: Rhythm, Lead, Second Guitar · D: Rhythm Guitar                 |
| `flute`           | 2     | 1    | G: Flute · K: Flute · F: Piccolo · D: Flute                       |
| `clarinet`        | 2     | 2    | G: Clarinet · K: Clarinet · F: Clarinets, Solo Clarinet           |
| `bassoon`         | 2     | 3    | F: Bassoon                                                        |
| `saxophone`       | 2     | 4    | W: Saxophone · K: Tenor Sax · F: Saxophone · D: Saxophone         |
| `trumpet`         | 2     | 5    | W: Horns · K: Muted Trumpet · F: Trumpet · D: Trumpet             |
| `trombone`        | 2     | 6    | K: Trombone · F: Trombone · D: Trombone                           |
| `french_horn`     | 3     | 1    | G: French Horn · F: French Horn                                   |
| `tuba`            | 3     | 2    | F: Tuba                                                           |
| `euphonium`       | 3     | 3    | F: Euphonium                                                      |
| `piano`           | 3     | 4    | W: Piano · K: Piano                                               |
| `organ`           | 3     | 5    | W: Organ · F: Fairground Organ                                    |
| `electric_piano`  | 3     | 6    | D: Electric Piano, Clavinet                                       |
| `glockenspiel`    | 4     | 1    | G: Glockenspiel · F: Glockenspiel · D: Glockenspiel               |
| `marimba`         | 4     | 2    | G: Marimba · K: Marimba · F: Xylophone                            |
| `vibraphone`      | 4     | 3    | K: Vibraphone                                                     |
| `bass_guitar`     | 4     | 4    | W: Bass Guitar · D: Bass Guitar                                   |
| `drum_kit`        | 4     | 5    | W: Drum Kit                                                       |
| `bass_drum`       | 4     | 6    | K: Kick Drum · F: Bass Drum & Cymbal · D: Kick Drum               |
| `snare_drum`      | 5     | 1    | K: Brushes · F: Snare Drum · D: Snare & Claps                     |
| `cymbal`          | 5     | 2    | W: Cymbals · K: Ride Cymbal · D: Hi-Hats                          |
| `tom_toms`        | 5     | 3    | W: Tom-Toms                                                       |
| `congas`          | 5     | 4    | D: Congas                                                         |
| `tambourine`      | 5     | 5    | W: Tambourine · D: Tambourine                                     |
| `cowbell`         | 5     | 6    | W: Cowbell · D: Cowbell                                           |
| `maracas`         | 6     | 1    | G: Percussion                                                     |
| `clappers`        | 6     | 2    | W: Handclaps · K: Finger Snaps                                    |
| `whisk`           | 6     | 3    | K: Whisk                                                          |
| `pots`            | 6     | 4    | K: Pots & Pans                                                    |
| `anvil`           | 6     | 5    | W: Anvil & Woodblocks                                             |
| `mirror_ball`     | 6     | 6    | D: Mirror Ball (the grand-finale feature spinner)                 |

**Per venue:** Garden 10 different pictures, Workshop 13, Kitchen 16, Funfair 15, Disco 18 (36 in all; the three most-used are `violin`, `saxophone` and `trumpet`, so get those right first).

> **Note on the mirror ball:** the Disco's last-gig feature spinner already sits on the mirror ball painted into the backdrop, and for now it keeps its own look. The `mirror_ball` picture is painted anyway so that spinner can switch over later if you want it to.
