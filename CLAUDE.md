# Granny's Spin Splash — Poki Edition

**Status (2026-11-25):** Playable build, green on lint/test/build/budget. Mid-way through the **"Granny's Grand Tour" transformation**: the orchestra was rebuilt on real instruments and the round became a ladder of gigs with star ratings and one coin currency. Slices 1–2 are built (gig ladder and stars; Home, Tour map, Shop — `e6ab381`); slice 3 is part built (one rolling mission and the daily gift); slice 4 is begun (the Garden orchestra and the Kitchen jazz combo are built; Workshop, Funfair and Disco still use orchestral stand-ins). The UI pass (sharp text, new button and panel) and goal clarity (a band to wake, a band meter, a goal card) are done; `GameScene` is split into `src/scenes/game/`. Jam mode, the new-musician solo and the other three bands are still to come. Not yet submitted to Poki — see `BACKLOG.md` for live status and submission blockers.
**Current plan of record:** [`docs/UPLIFT_PLAN.md`](docs/UPLIFT_PLAN.md) (the orchestra, juice and assessment phases), [`docs/ENGAGEMENT_DESIGN.md`](docs/ENGAGEMENT_DESIGN.md) (round structure, scoring, economy and navigation — **authoritative over §4 and §11 where they conflict**) and [`docs/BANDS.md`](docs/BANDS.md) (one musical style per venue). This file's other sections are the original spec; where it disagrees with the code, the code and those three docs win.
**Target platform:** [Poki](https://poki.com) (100M+ MAUs, hand-curated)
**Tech:** TypeScript + Vite + Phaser 3 (bundled, not CDN)
**Mode:** Single-player only
**Launch scope:** 3 grannies, 6 guns, 5 worlds (Garden, Workshop, Kitchen, Funfair, Disco). Other content moves to post-launch.
**Sprite pipeline:** Google Nano Banana (Gemini 2.5 Flash Image) for transparent PNG generation.
**Timeline:** Focused 8–9 weeks to Poki submission.
**Reference prototype:** `/mnt/user-data/outputs/granny-spin-splash.html` — **read-only design artefact, not source code**

---

## Table of Contents

1. [Origin Story](#1-origin-story)
2. [Using the Prototype as a Reference](#2-using-the-prototype-as-a-reference)
3. [Poki Platform Requirements](#3-poki-platform-requirements)
4. [The Game in One Page](#4-the-game-in-one-page)
5. [Visual Design System](#5-visual-design-system)
6. [Easy Controls System](#6-easy-controls-system)
7. [Project Architecture](#7-project-architecture)
8. [Sprite Asset Pipeline](#8-sprite-asset-pipeline)
9. [ASMR Orchestra Audio](#9-asmr-orchestra-audio)
10. [Splash Screen Design](#10-splash-screen-design)
11. [Monetization Design](#11-monetization-design)
12. [Pre-Submission Checklist](#12-pre-submission-checklist)
13. [Product Backlog](#13-product-backlog)
14. [Open Questions](#14-open-questions)
15. [The North Star](#15-the-north-star)

---

## 1. Origin Story

A working HTML prototype was built in a single design session to prove the core loop. It accomplished three things:

1. **Validated the core mechanic** — squirting water at spinners is genuinely satisfying
2. **Generated playtest data** — a 6-year-old confirmed it's play-every-day fun
3. **Surfaced the design priorities** — what to keep, what to cut, what to amplify

What the playtest told us:
- **Favourite moment:** Splash Frenzy
- **Biggest problem:** waiting too long for it
- **Visual focus:** eyes only watch the spinners
- **HUD verdict:** too much competing info
- **Replay intent:** "Every single day!"

The prototype is now retired as a source of code. **This document is the build spec.** All work starts fresh from this brief.

### What v1 includes
- **3 grannies** (custom Nano Banana sprites): Classic Granny, The Squirt Sister, Punk Granny
- **6 guns** (custom sprites, 8 rotation angles each): Drip Pistol, The Squirter, Garden Hose, Splash Jr, Soaker 3000, Inferno
- **5 worlds** (called *venues* since the 2026-11-25 redesign), opened by total stars earned as a rating (never spent): Garden (free), Workshop (12★), Kitchen (30★), Funfair (54★, moving targets), Disco (80★, frequent Golden Spinner). Each venue is a ladder of eight gigs — see §4 and `docs/ENGAGEMENT_DESIGN.md`
- 8 spinner types (procedurally drawn)
- 5 power-ups
- 3 obstacles (cat, umbrella, duck) — spawn per-world per the roster in `entities/world/world.data.ts`
- Golden Spinner — a timed bonus spawn (own lifetime, outside the grid), more frequent in Disco
- ASMR spinner orchestra on real instruments (§9)
- Coin bank (the "vault") for buying grannies and guns; stars are the gig rating
- Splash Frenzy + mini-frenzies at 60% and 80%
- 30-second runs

### What v1 explicitly does not include
- ❌ Two-player mode
- ❌ Granddad character
- ❌ Beach Granny, Ninja Granny, GOLDEN GRANNY (post-launch)
- ❌ Aqua Seeker, Hydro Blaster, Lightning Rod, Ice Queen, Neptune's Wrath, MEGA CANNON (post-launch)
- ❌ Daily challenges, leaderboards, cloud save (post-launch)

---

## 2. Using the Prototype as a Reference

The prototype is open in another tab. Read it, don't port it. Specifically:

### Extract these data values verbatim into `src/entities/*/*.data.ts`

| Value | Source location in prototype | Target file |
|---|---|---|
| Spinner stats (decay/power/stars/r/blades/style/colors) | `const ST = { … }` | `src/entities/spinner/spinner.data.ts` |
| World configs (grid/types/obs/time) | `const WORLDS = { … }` | `src/entities/world/world.data.ts` |
| ~~Granny level thresholds~~ | `const GRANNY_LEVELS = [ … ]` | Extracted originally to `src/entities/progression/levels.ts`; **removed 2026-11-25** with the score rank ladder (replaced by star ratings in `src/systems/Progress.ts`) |
| Power-up effects | `const PU = { … }` | `src/entities/powerup/powerup.data.ts` |

> **Correction (Sprint 1):** `game prototype/granny-spin-splash.html` — the actual prototype file in this repo — has no `WEAPON_DEFS` or `GRANNY_CHARS` constant. It's single-player with one default water gun and no granny selection; guns and the 3-granny roster are original v1 designs with no prototype source. `src/entities/gun/gun.data.ts` and `src/entities/granny/granny.data.ts` carry placeholder gameplay numbers (cost/tier values are locked by CLAUDE.md §8.1/§8.2) — tune tank/drain/pump/interval/power once Sprint 2 story 2.8's playtest pass runs.

### Read these for behavioural reference (rewrite cleanly)

- **Spinner state machine** — `STOPPED → SLOW(40) → MEDIUM(80) → FULL(100)` thresholds
- **Frenzy trigger** — all spinners at FULL simultaneously
- **Mini-frenzy thresholds** — 60% and 80%
- **Combo decay** — 2-second window for combo to persist
- **Water tank** — drains while firing, 2-second pump refill
- **Aim snap radius** — 65px to nearest spinner

### Lift these one-shot SFX synth recipes from `AudioManager`

The Web Audio synth tones for splash, hit, frenzy fanfare, combo dings, pump click — these are 5-10 lines each and they sound right. Copy them as a starting point for `src/audio/SFX.ts`, then refine.

### Ignore everything else

The architecture, the rendering code, the HUD layout, the Granny drawing, the audio orchestra (there isn't one yet), the splash screen — all being built fresh from this doc.

---

## 3. Poki Platform Requirements

Source: https://sdk.poki.com/new-requirements.html

### Hard rules — game is auto-rejected if any fail

| # | Rule | Notes |
|---|---|---|
| 1 | **16:9 aspect ratio**, scales to 640×360 / 836×470 / 1031×580 | Game logical size: 1280×720 |
| 2 | **Under 8 MB initial download** | `npm run budget` checks `dist/`. About 4.64 MB at commit `e6ab381` after the WebP conversion (the orchestra sprite is about 955 KB of it), 3.36 MB under the cap; see `BACKLOG.md` and `docs/BANDS.md` §Size |
| 3 | **No external requests** — no Google Fonts, no CDNs, no jsDelivr | Bundle Phaser locally; bundle Fredoka WOFF2 locally |
| 4 | **Incognito support** — localStorage wrapped in try/catch | Single `SaveManager` class enforces this |
| 5 | **Desktop + mobile + tablet support** | Touch + mouse + keyboard |
| 6 | **No splash screens, outgoing links, studio logos** | No studio branding in-game |
| 7 | **No external ads** — only Poki SDK ads | |
| 8 | **No in-game purchase UI** for currency/ad-removal | Coins (the vault) are earn-only |
| 9 | **Works with ad blockers** — core gameplay never gated | |
| 10 | **Page-scroll prevention** for arrow keys / space | `preventDefault` in `InputManager` |

### SDK integration — required for review

```html
<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>
```

Required event firing order:
1. `PokiSDK.init()` — at game start, await before showing menu
2. `PokiSDK.gameLoadingFinished()` — when assets ready
3. `PokiSDK.gameplayStart()` — **on first player input**, NEVER on scene load
4. `PokiSDK.gameplayStop()` — on game over, pause, menu navigation
5. `PokiSDK.commercialBreak()` — between runs after intent shown
6. `PokiSDK.rewardedBreak({size:'medium'})` — optional reward boosts

All SDK calls go through `src/poki.ts`. No exceptions. Mute audio + disable input during ads.

### Quality bar

**Poki rejects:** low quality, AI-slop, unsafe content (violence/scary themes/gambling), IP clones, text-heavy UX.

**Poki loves:** originality, web-first design, polished presentation, wholesome family-friendly content, accessible controls.

---

## 4. The Game in One Page

> **Redesigned 2026-11-25.** The round structure, scoring and economy below were reworked in the "Granny's Grand Tour" transformation: each venue is a **ladder of eight gigs** (band sizes grow from a trio to the full wall, authored in `src/entities/world/gigs.data.ts`); **stars are the rating** (1–3 per gig, never spent) and **open venues**; **coins are the single currency** (the save's `vault`), earned in every gig and spent on grannies and guns; the old score rank ladder is gone. **`docs/ENGAGEMENT_DESIGN.md` is authoritative where it conflicts with this section.** Built so far: the gig ladder, star rating, results screen and coin economy (slice 1); Home, Tour map and Shop (slice 2 — the first screen is Home, or gig 1 on a first-ever launch); Granny's request and the daily gift (slice 3, part).

> **The purpose the game now communicates (2026-11-25):** *wake up the whole band, and keep them all awake at once.* Every spinner is a sleeping musician; **"awake" means a spinner at full speed** (FULL), and the gig is won by having them awake at the same moment. Three things say so on screen: a stopped spinner shows drifting "z z z" and an awake one about to drop out nods side to side; the HUD is a **band meter** (`src/ui/BandMeter.ts` — one light per musician, filling as they wake, with the three stars standing above the lights that earn them, so "5 of 8 awake" is counted, not read as a percentage); and a **YOUR GOAL card** (`src/scenes/game/GoalCard.ts`) sits beside Granny before the first squirt of every gig and leaves on the first input. Wording is the same everywhere: asleep, awake, full band.

A tiny old granny wields a custom water gun. The wall in front of her is covered in spinning targets — pinwheels, cogs, fans. Squirt them to make them spin faster. Get them all spinning at maximum simultaneously and trigger **SPLASH FRENZY!** — a 5-second bonus burst worth bonus stars.

**Round structure:** a *gig* — 20 to 30 seconds depending on its place on the ladder (20 s for gigs 1–2, 25 s for 3–4, 30 s for 5–8; `SECONDS_BY_GIG`). The clock is everything. The goal is to get the whole band playing at once: the HUD bar's 60% / 80% / 100% marks are one, two and three stars, and three stars (FULL BAND) triggers Splash Frenzy. One star passes the gig; the rest of the round is the encore.

**Audio system:** every spinner is a musician with a written part; waking spinners brings musicians in, and squirting plays the instrument. By Frenzy, you're conducting a full orchestra. This is the headline feature — see §9.

**Progression:** coins earned go into a persistent bank (the "vault"). Spend coins on new grannies (skins) and guns (mechanics): guns cost 0 / 0 / 150 / 400 / 900 / 2,000 and the Punk Granny 600 (`gun.data.ts`, `granny.data.ts`). Venues are not bought: they open at 0 / 12 / 30 / 54 / 80 total stars (`starsToOpen` in `world.data.ts`). Grannies and guns are bought in the Shop (`ShopScene.ts`); Home has one large PLAY, and the results screen's NEXT GIG goes straight into the next gig. Granny's request (one rolling mission at a time, `Missions.ts`) pays coins, and a daily gift (`DailyGift.ts`) rewards coming back.

**Difficulty curve (v1):** authored per gig. Each venue's band grows over eight gigs (Garden 3 · 4 · 5 · 6 · 8 · 9 · 10 · 12; Workshop 4 → 15; Kitchen and Funfair 4 → 16; Disco 5 → 20, plus the mirror-ball feature spinner on the last gig), spinner wind-down slows as the band grows, and obstacles and moving targets arrive through the ladder. Across venues: Garden (12 spinners, no obstacles) → Workshop (15, cat/umbrella/duck) → Kitchen (16, double cats) → Funfair (16, moving targets) → Disco (20, frequent Golden Spinner). Balance is tuned for Garden only; the other venues are untuned (`BACKLOG.md`).

**Long-tail unlocks (post-launch, not built):** GOLDEN GRANNY at 10,000 coins. GRANNY'S MEGA CANNON at 100,000 coins. (Originally specced in vault stars; prices would need re-checking against the new economy.) These exist to keep retention alive for weeks once added.

---

## 5. Visual Design System

The visual brief: **premium, kid-friendly, calm, confident**. Think Ghibli warmth × Apple polish × Animal Crossing comfort. Avoid: emoji clutter, busy backgrounds, mismatched fonts, harsh edges, over-decoration.

> **Update 2026-11-25 (UI pass, direct feedback: text hard to read, a button half off its panel, screens basic).** The canvas was 1280 px wide and stretched by the browser (about 2048 device pixels on a laptop), which blurred every glyph. It is now created at the density it is shown at, up to 2x (`RENDER_SCALE` in `src/config.ts`), and every scene's camera zooms to match (`fitCameraToLogicalSize`); layout stays in 1280x720 logical units. Text outlines dropped from about a fifth of the type size to about a tenth, tracking opened, and outlines in the text's own colour (which fattened every button label into its neighbours) were removed — see `src/utils/typography.ts`; this supersedes the 3–6 px outline note in §5.2. Buttons are one component (`Button.ts`): a face on a darker lip with a shadow and highlight, pressing down when tapped, in three sizes plus a gold `reward` look for rewarded-ad buttons. Cards use the shared `Panel.ts`, optionally with a ribbon — **the ribbon is the only element allowed to cross a panel's edge**.

### 5.1 Colour palette

Five hero colours + three neutrals. Used consistently. No exceptions.

| Role | Name | Hex | Usage |
|---|---|---|---|
| Primary | **Granny Pink** | `#FF6BA8` | Granny dress, CTAs, hero accents |
| Secondary | **Water Blue** | `#4DB3E5` | Water, brand, links |
| Accent | **Sunny Gold** | `#FFC93C` | Stars, Frenzy, rewards, success |
| Energy | **Heat Orange** | `#FF8A3D` | Mini-frenzy, fire weapons, urgency |
| Cool | **Mint Green** | `#7FD9A8` | Confirm buttons, unlock success |
| Neutral Dark | **Ink** | `#1F2138` | Text, outlines, deep shadow |
| Neutral Mid | **Soft Slate** | `#6B6F8C` | Secondary text, tertiary UI |
| Neutral Light | **Cloud** | `#F5F2E8` | Backgrounds, cards, paper |

**Rules:**
- Backgrounds use Cloud or muted variants (≤30% saturation)
- Hero objects use full-saturation hero colours
- Never use pure black `#000` — always Ink
- Never use pure white — always Cloud
- Max 3 saturated colours visible at once outside the spinner wall

### 5.2 Typography

**One font family**: [Fredoka](https://fonts.google.com/specimen/Fredoka) — **bundle locally as WOFF2** (Google Fonts is blocked by Poki).

| Style | Weight | Size | Use |
|---|---|---|---|
| Display XL | 700 | 64 px | Title, FRENZY banner |
| Display L | 700 | 48 px | Score reveal, level names |
| Display M | 600 | 32 px | Section headers |
| Body L | 500 | 20 px | Primary UI text, buttons |
| Body M | 500 | 16 px | Secondary text, labels |
| Caption | 400 | 12 px | Hints, attribution |

- Headers tracked at -0.5%, body at 0%
- Line-height: 1.2 for headers, 1.5 for body
- Stroke Ink outlines on all in-game text (3-6px depending on size)

### 5.3 Spacing scale

**8px grid.** Only use these values: `4, 8, 16, 24, 32, 48, 64, 96, 128`. No magic numbers.

### 5.4 Shape language

- **Corner radius:** 16px standard, 24px for cards, 999px (pill) for chips/CTAs
- **No sharp corners** anywhere in the UI
- **Stroke widths:** 2px fine detail, 4px emphasis, 8px hero outlines
- **Single light source:** upper-left, casts shadow lower-right at 4px blur, 25% opacity
- **No drop shadows on text** — use stroke outlines instead

### 5.5 Iconography

- **Custom SVG icons only, no emoji in production UI** — emoji renders inconsistently across OS/browser
- 24px and 32px sizes
- Same stroke weight as text (2px)
- Single-colour fills, no gradients
- Recommended set: Phosphor Icons or Lucide (both permissive licences — bundle as SVG sprite sheet)

### 5.6 Animation language

- **Standard ease:** `Quad.Out` entrances, `Quad.In` exits
- **Bouncy ease:** `Back.Out` (overshoot 1.6) for celebratory moments only
- **Durations:**
  - Hover/press feedback: 100ms
  - State changes: 200ms
  - Scene transitions: 300ms
  - Celebrations: 600ms
- **Never animate more than 3 things simultaneously**
- **Granny idle:** slow 2s breath cycle (scale 1.0 ↔ 1.02)
- **Spinner wobble near max:** 6% scale oscillation at 8Hz when speed > 75

### 5.7 Background rules

Backgrounds must **never compete with the action**. The spinners are the visual hero.

- 1-2 muted colours with subtle texture
- Saturation ≤30%
- Use parallax sparingly — slow drift, large objects only
- Never animate the background during play
- Ground plane: warm wood tone or grass, never busy patterns

### 5.8 Composition

- **Spinners cover ~60% of the visible area** — they earn the space
- **Granny:** bottom-centre, ~12% of vertical real estate
- **HUD:** 8% top (timer), 8% bottom (water bar) — that's it during play
- **Negative space matters** — never fill every corner

### 5.9 What "premium kid-friendly" means concretely

Premium signals:
- Single coherent palette (not rainbow chaos)
- Consistent corner radius and stroke weight
- Confident typography hierarchy
- Smooth animations with proper easing
- Sound design responding to every action

Kid-friendly signals:
- Big, round, soft shapes
- Friendly smiling faces
- Bright but not harsh colours
- No reading required during gameplay
- Forgiving controls (auto-aim, generous hitboxes)
- Always-celebratory feedback (no harsh failures)

Avoid:
- ❌ Emoji as primary UI (use custom icons)
- ❌ Multiple fonts (one family, three weights max)
- ❌ Stock asset packs (looks generic)
- ❌ Gradient soup
- ❌ "Edgy" or sarcastic tone
- ❌ Red flashing UI until the very end of the run

---

## 6. Easy Controls System

The game must be **playable with one finger on a phone**, **one hand on a laptop**, or **mouse only on desktop**.

### 6.1 Control principles

1. **One primary input does everything** — move, aim, fire
2. **Auto-aim assists every shot** — generous snap-to-spinner
3. **No precise drag** — tolerance is the player's friend
4. **No chords or combos** — never require holding two things
5. **No menus during play** — pause via a visible button (touch) or ESC (desktop) only
6. **Tap commits, never navigates** — every tap does something visible

### 6.2 Desktop controls

| Input | Action |
|---|---|
| **Mouse move** | Aim crosshair |
| **Left click / hold** | Fire (continuous while held) |
| **A / D** or **← / →** | Move Granny left/right |
| **Space** | Toggle auto-fire on/off (accessibility) |
| **[** / **]** | Cycle weapon (only if unlocked) |
| **ESC** | Pause |

Click-to-fire (not toggle) — more intuitive than the prototype's toggle. Toggle stays as Space for accessibility.

### 6.3 Mobile controls

```
┌──────────────────────────────────────┐
│           [spinner wall]             │
│                                      │
│         Tap wall to fire             │
│         Drag to aim                  │
│                                      │
│                                      │
│   [◀]              [▶]    [💧 50%]   │
└──────────────────────────────────────┘
```

| Input | Action |
|---|---|
| **Tap and hold spinner area** | Fire toward touch point |
| **Drag while holding** | Aim follows finger |
| **◀ / ▶ buttons** (bottom edges) | Move Granny |
| **Release** | Stop firing |
| **Pause button** (visible, `ui/PauseButton.ts`) | Pause |

Move buttons at the **edges**, not the centre — leaves the entire middle as the aim/fire zone.

> **Changed 2026-09-12 (owner request):** the two-finger-tap pause gesture was removed — it paused the game by accident (any second touch) and was the direct cause of a run-soft-locking bug. Touch devices get a visible pause button (`ui/PauseButton.ts`, shown only where `ui/touchControls.ts` says the device has touch controls); desktop keeps ESC.

### 6.4 Auto-aim implementation

Generous snap radius — 96px desktop, scaled equivalent on mobile. Visual feedback: crosshair changes to Mint Green and grows slightly when snapped.

```typescript
const SNAP_RADIUS = 96;

function resolveAim(rawX: number, rawY: number, spinners: Spinner[]): AimResult {
  let nearest = null;
  let nearestDist = SNAP_RADIUS;
  for (const s of spinners) {
    const d = distance(rawX, rawY, s.x, s.y);
    if (d < nearestDist) { nearest = s; nearestDist = d; }
  }
  return nearest
    ? { x: nearest.x, y: nearest.y, target: nearest, snapped: true }
    : { x: rawX, y: rawY, target: null, snapped: false };
}
```

### 6.5 Tutorial design

**No tutorial screen.** Instead:
- First-time splash says: *"Tap the wall to soak the spinners!"*
- Subtle ghost-finger animation taps a spinner once
- Within 3 seconds of play, the first spinner reaches FULL — players learn by doing
- Frenzy meter visibly fills — goal is understood without text

In-game text limited to: score numbers, "FRENZY!" banner, weapon/granny names. Everything else is visual.

> **Update 2026-11-25:** every gig opens with a **YOUR GOAL card** (`src/scenes/game/GoalCard.ts`): "Wake the whole band!" and what each star takes. On a player's very first run, `TutorialSequence.ts` adds two captions tied to what just happened: "Squirt a sleepy musician to wake it up!" at the start (with the ghost finger), and "Keep the whole band awake at once!" the first time a spinner reaches FULL. They replaced "Squirt the spinners to make them spin faster!" and "Get every spinner to FULL for SPLASH FRENZY!".

---

## 7. Project Architecture

### 7.1 Folder structure

> **Re-plan (Sprint 2, 2026-09-11):** the original `objects/` + `data/` +
> per-entity `types/` split (still visible in git history) grouped files by
> *technical layer*. Restructured to group by *feature/entity* instead — a
> `spinner/` folder holds `Spinner.ts`, its data, its types, and its
> renderer together, same for `granny/`, `gun/`, `world/`, `powerup/`,
> `obstacle/`, `waterParticle/`, `progression/`. `scenes/`, `systems/`,
> `ui/`, `audio/`, `utils/` stay as cross-cutting layers — they aren't
> "entities" and forcing them into entity folders would just scatter
> orchestration code across folders it doesn't belong to. `types/` now
> holds only the genuinely shared contracts nothing entity-specific owns
> (`save.ts`, `input.ts`, `hud.ts`) — CLAUDE.md §7.3 rule 12 already said
> module-internal types live alongside their code; this just applies that
> consistently. Every file's *responsibility* is unchanged, only its
> address — see §7.2 for what still does what.
>
> **Update 2026-11-25:** `progression/` (the score rank ladder) was deleted
> and replaced by `systems/Progress.ts` (star and venue rules);
> `audio/themes/` and `audio/synthPrimitives.ts` were deleted when the
> orchestra was rebuilt (§9); `GameOverScene` became `ResultsScene`. The tree
> and tables below show the current layout.

```
granny-spin-splash/
├── README.md                          # Setup + run commands
├── CLAUDE.md                          # This file (source of truth)
├── package.json
├── tsconfig.json
├── vite.config.ts                     # CRITICAL: bundle Phaser, no externals
├── .eslintrc.json
├── .prettierrc
├── index.html                         # Minimal shell, SDK script, canvas div
│
├── thumbnails/                        # Poki dashboard deliverables — NOT shipped in the game bundle (re-plan below)
│   ├── thumbnail-static.png           # 512×384 — Poki required
│   └── thumbnail-animated.webm        # 5s loop, no audio — Poki required
│
├── public/                            # Static assets, copied to dist/
│   ├── fonts/
│   │   └── fredoka.woff2              # Bundled locally, NOT from Google
│   ├── sprites/
│   │   ├── grannies/                  # per-granny subfolder — delivered 2026-09-11 as 3 poses × 3 grannies = 9 files (re-plan below)
│   │   │   ├── classic/
│   │   │   │   └── front.png / back.png / back_firing.png   # front = splash-carousel portrait; back/back_firing = actual gameplay sprites
│   │   │   ├── squirt/  … (same 3 filenames)
│   │   │   └── punk/    … (same 3 filenames)
│   │   ├── guns/
│   │   │   ├── pistol/
│   │   │   │   ├── 0.png 45.png 90.png 135.png
│   │   │   │   ├── 180.png 225.png 270.png 315.png
│   │   │   │   └── anchor.json        # nozzle XY per angle, computed automatically (extremal alpha pixel along aim direction)
│   │   │   └── … (6 launch guns × 8 angles = 48 files)
│   │   ├── worlds/                    # one illustrated background per world (WORLD_BACKGROUND_BRIEF.md, delivered 2026-09-11)
│   │   │   └── garden_bg.jpg / workshop_bg.jpg / kitchen_bg.jpg / funfair_bg.jpg / disco_bg.jpg
│   │   ├── ui/                        # splash-screen title lockup (delivered 2026-09-11)
│   │   │   └── wordmark.png / title_flourish.png
│   │   └── icons/
│   │       └── ui.svg                 # Single sprite sheet for all icons
│   └── audio/
│       ├── orchestra.mp3              # The instrument sprite (VSCO-2 CE, CC0) — built by `npm run samples`
│       ├── orchestra.json             # Sprite index: per-instrument sample offsets, measured pitch
│       ├── bands/                     # One extra sprite per non-orchestral band: kitchen.{mp3,json} (16 instruments, 363 KB)
│       └── sfx/                       # Currently empty — one-shots are synthesised
│
├── src/
│   ├── main.ts                        # Phaser config, SDK init, scene registration
│   ├── poki.ts                        # PokiSDK wrapper — single source of truth
│   ├── config.ts                      # Game constants, scale config
│   │
│   ├── dev/
│   │   └── botSim.ts                  # Dev-only balance harness (window.__bot) — loaded only when import.meta.env.DEV
│   │
│   ├── scenes/
│   │   ├── BootScene.ts               # Loads assets, fires gameLoadingFinished; first-ever launch goes straight to Garden gig 1, otherwise to Home
│   │   ├── HomeScene.ts               # First screen for returning players: venue, Granny, next-gig card, one PLAY button; Tour and Shop buttons
│   │   ├── TourScene.ts               # Venue/gig map: stars held, eight gig nodes with best ratings, locked venues say what they need
│   │   ├── ShopScene.ts               # Grannies and guns bought with coins (was SplashScene); DONE returns to Home, starts no gig
│   │   ├── GameScene.ts               # Main gameplay — now an orchestrator over the modules in game/
│   │   ├── HUDScene.ts                # Overlay (timer, water bar, frenzy meter)
│   │   ├── PauseScene.ts              # Pause overlay (ESC on desktop, visible button on touch)
│   │   └── ResultsScene.ts            # End of a gig: stars, coins, NEXT GIG / Retry / Menu → Home (replaced GameOverScene)
│   │
│   │   └── game/                      # What GameScene used to do itself (split out 2026-11-25; each file one concern)
│   │       ├── GigScore.ts            # Coins, locked-in stars, the once-per-tier rule, the encore (no Phaser dependency)
│   │       ├── MusicReactions.ts      # Spinner pulses on notes, floating notes, musician names, the gig intro
│   │       ├── FrenzyController.ts    # SPLASH FRENZY from the scene's side: start, window, per-hit flourish
│   │       ├── PowerUpEffects.ts      # Active power-up windows and applying a pickup
│   │       ├── WaterCollisions.ts     # Particles against obstacles and spinners, combo and hot-streak shake
│   │       ├── FireControl.ts         # Aim, gun, cannon, pump cycle and jet hiss
│   │       ├── FirstRunGuide.ts       # First-run ghost finger and scripted captions
│   │       ├── GoalCard.ts            # The YOUR GOAL card shown before each gig
│   │       ├── LevelUpFlair.ts        # Chanced extras on level-ups: spoken cheer, easter egg
│   │       ├── CountdownUrgency.ts    # Final-countdown tick and shake
│   │       └── bankGig.ts             # Banks a finished gig into the save, builds the results payload
│   │
│   ├── entities/                      # one folder per game entity — its class, data, types, and renderer travel together
│   │   ├── spinner/
│   │   │   ├── Spinner.ts             # Procedural Phaser.Graphics state machine
│   │   │   ├── spinnerRenderers.ts    # Per-style draw routines (module-internal)
│   │   │   ├── spinner.data.ts        # SPINNER_DEFS, state thresholds, combo/frenzy constants
│   │   │   └── spinner.types.ts       # SpinnerState enum, SpinnerDef, SpinnerStyle
│   │   ├── granny/
│   │   │   ├── Granny.ts              # Sprite-based player character
│   │   │   ├── granny.data.ts         # GRANNY_DEFS + unlock thresholds
│   │   │   └── granny.types.ts        # GrannyDef
│   │   ├── gun/
│   │   │   ├── Gun.ts                 # Sprite-based, 8-angle rotation
│   │   │   ├── gun.data.ts            # GUN_DEFS + unlock thresholds
│   │   │   └── gun.types.ts           # GunDef, AnchorJSON shape, GunTier
│   │   ├── world/
│   │   │   ├── world.data.ts          # WORLD_DEFS (incl. starsToOpen per venue)
│   │   │   ├── world.types.ts         # WorldDef
│   │   │   ├── gigs.data.ts           # The gig ladder: GIGS_PER_VENUE, band size / seconds / decay / obstacles per gig
│   │   │   ├── wallBuilder.ts         # Lays the wall out for the band size
│   │   │   └── worldBackgrounds.ts    # Painted backdrop registry + procedural fallbacks
│   │   ├── powerup/
│   │   │   ├── PowerUp.ts             # Floating pickup
│   │   │   └── powerup.data.ts        # POWERUP_DEFS
│   │   ├── obstacle/
│   │   │   ├── Obstacle.ts            # Cat, Umbrella, Duck — position/state, per-kind update + tryBlock()
│   │   │   ├── obstacleRenderers.ts   # Per-kind draw routines (module-internal)
│   │   │   └── obstacle.types.ts      # ObstacleKind
│   │   └── waterParticle/
│   │       ├── WaterParticle.ts       # Pooled particle
│   │       ├── WaterCannon.ts         # Fire cadence, stream geometry, tank, pump
│   │       ├── WaterJet.ts            # Draws the shots as one tapering ribbon
│   │       └── splashVFX.ts           # Impact burst and ripple ring
│   │
│   ├── audio/
│   │   ├── AudioOrchestra.ts          # Real-time clock + game-facing orchestra API — CORE (§9)
│   │   ├── WaterSound.ts              # Spray / splash / droplet noise layer
│   │   ├── ResultsMusic.ts            # Star chimes on the results screen
│   │   ├── SFX.ts                     # Mechanical / menu one-shots kept outside the music
│   │   ├── AudioBus.ts                # Master volume, mute, fade
│   │   ├── orchestra/                 # Engine: Conductor, OrchestraGraph, SampleBank, pattern, theory, setPieces, score.types
│   │   └── scores/                    # One written score per world + shared.ts + index.ts
│   │
│   ├── types/                         # ONLY genuinely cross-cutting contracts — nothing entity-specific lives here
│   │   ├── save.ts                    # SaveData v1 schema + migration types
│   │   ├── input.ts                   # AimResult, InputEvent union
│   │   └── hud.ts                     # HudRefreshData, HudSpinnerSnapshot (GameScene → HUDScene)
│   │
│   ├── assets/
│   │   └── keys.ts                    # SPRITE_KEYS / AUDIO_KEYS / ICON_KEYS constants
│   │
│   ├── systems/
│   │   ├── SaveManager.ts             # localStorage with try/catch
│   │   ├── InputManager.ts            # Unified keyboard/mouse/touch
│   │   ├── UnlockManager.ts           # Coin bank, grannies/guns purchases, selection
│   │   ├── Progress.ts                # Pure tour rules: stars per gig, venue opening, recordGig, nextStop
│   │   ├── Missions.ts                # Granny's request: one rolling mission, ten written, pure over the save
│   │   ├── DailyGift.ts               # Daily gift: coins for coming back, more for consecutive days, pure over the save
│   │   ├── startRound.ts              # The one gate that starts a round behind the between-runs ad
│   │   ├── FrenzyMeter.ts             # 60/80/100% thresholds
│   │   ├── ComboTracker.ts            # Combo timer + multiplier
│   │   └── AdManager.ts               # Wraps poki.ts with game logic
│   │
│   ├── ui/
│   │   ├── Button.ts                  # The button: a face on a lip, three sizes, gold `reward` look
│   │   ├── IconButton.ts              # Round version of the button carrying a drawn icon (home, retry, back)
│   │   ├── Panel.ts                   # The shared card, optional ribbon astride its top edge
│   │   ├── BandMeter.ts               # HUD band meter: one light per musician, stars above (replaced FrenzyProgress.ts)
│   │   ├── GigCard.ts                 # Home's next-gig card: venue, gig dots, who joins
│   │   ├── GigMissionBand.ts          # Granny's request as a band along the bottom of the gig card
│   │   ├── MissionCard.ts             # Granny's request as a card on the results screen
│   │   ├── TourNode.ts                # One gig on the tour map: round button or padlocked disc, best stars
│   │   ├── Carousel.ts                # ◀ item ▶ pattern — Granny/World/Gun selectors
│   │   ├── Toast.ts                   # Floating notification
│   │   ├── Banner.ts                  # FRENZY banner, level reveal
│   │   ├── WaterBar.ts                # Water tank UI
│   │   ├── TimerDial.ts               # Top-of-screen timer
│   │   ├── FrenzyMeterUI.ts           # On-wall progress rings per spinner
│   │   ├── NoteGlyph.ts               # Floating music note off a playing spinner
│   │   ├── PauseButton.ts             # Visible pause control for touch devices (§6.3)
│   │   ├── StatPill.ts                # Icon + number readout pill (coins, stars)
│   │   ├── touchControls.ts           # Does this device get on-screen touch controls? (move buttons, pause button)
│   │   └── …                          # Plus ScoreCounter, FloatingText, UrgencyOverlay, LoadoutStage, ThumbnailSelector, tutorial and icon helpers — see `ls src/ui`
│   │
│   └── utils/
│       ├── math.ts                    # distance, clamp, lerp, pillRadius, resolveAim
│       ├── tween.ts                   # Durations/easing constants
│       ├── colour.ts                  # Palette accessors + shade()
│       ├── typography.ts              # Fredoka type scale
│       ├── grid.ts                    # Even grid layout math
│       └── EventEmitter.ts            # Dependency-free pub/sub for Systems/ (no Phaser import)
│
├── tools/
│   ├── budget-check.ts                # Asserts dist/ < 8 MB after build (`npm run budget`)
│   ├── build-orchestra-samples.ts     # Builds each band's sprite from approved CC0 repositories (`npm run samples -- <band>`)
│   ├── bands/                         # <band>.manifest.json — which instruments and notes go in each sprite (orchestra, kitchen)
│   ├── generate-thumbnail.ts          # Renders Poki thumbnails (run from the browser console — see its header)
│   └── sprite-optimise.sh             # `npm run optimise`: converts PNGs dropped into public/sprites/ to WebP (verifies SSIM, lossless fallback, removes the source PNG)
│
└── tests/
    ├── unit/                          # SaveManager, FrenzyMeter, ComboTracker, UnlockManager, AdManager,
    │                                  # Progress, gigs, pattern, theory, scores, startRound
    └── integration/
        └── ad-flow.test.ts            # SDK event ordering
```

> **Re-plan (2026-09-12, thumbnails):** the two Poki thumbnails originally
> sat in `public/`, which Vite copies verbatim into `dist/` — so 742 KB of
> files the game never requests were counted against §3 rule 2's 8 MB
> *initial-download* cap, cutting headroom from 1.71 MB to 998 KB the moment
> they were produced. They're uploaded to the Poki for Developers dashboard,
> not fetched by the page, so they now live in a top-level `thumbnails/`
> folder outside the build. `budget-check.ts` still measures all of `dist/`
> honestly — nothing was excluded to make a number look better; the files
> simply aren't part of the download.

### 7.2 File-by-file responsibilities

#### Top level

| File | Responsibility | Lines target |
|---|---|---|
| `index.html` | Empty body with `<div id="game">`, Poki SDK script tag, no game code | <30 |
| `src/main.ts` | Phaser.Game config, scene registration, Poki SDK init | <80 |
| `src/poki.ts` | Wrap all `PokiSDK.*` calls; expose typed API | <100 |
| `src/config.ts` | Game constants (W=1280, H=720, scale config) | <40 |

#### Scenes (each scene is one responsibility)

| File | Responsibility |
|---|---|
| `BootScene.ts` | Load all sprites + audio, fire `PokiSDK.gameLoadingFinished()`, then go to HomeScene — or, on a first-ever launch (`save.hasPlayed === false`), straight into Garden gig 1 |
| `HomeScene.ts` | First screen for returning players: current venue, Granny, one card saying what is next, one PLAY button; small Tour and Shop buttons off the path to play |
| `TourScene.ts` | Venue/gig map: one venue per page, stars held, eight gig nodes with best rating; open gigs are tappable, locked venues say how many stars they need |
| `ShopScene.ts` | The loadout carousels: grannies and guns priced in coins, stage previews the loadout; DONE returns to Home and nothing in it starts a gig. Renamed from SplashScene |
| `GameScene.ts` | Core gameplay loop — orchestrates systems |
| `HUDScene.ts` | Renders over GameScene — timer dial, water bar, frenzy meter |
| `PauseScene.ts` | Overlay on pause — Resume, Settings, Quit. Fires `PokiSDK.gameplayStop()` |
| `ResultsScene.ts` | End of a gig: stars land one at a time with a chime, coins count up and are banked, NEXT GIG (largest) / Retry / Menu (to Home), "Double your coins" rewarded option. Starts the next round through `startRoundAfterAdGate()` |

#### Entities (one folder per game entity — class + data + types + renderer together)

| Folder | File | Responsibility |
|---|---|---|
| `spinner/` | `Spinner.ts` | Procedural spinner — state machine, decay, redraw on state change |
| | `spinnerRenderers.ts` | Per-style draw routines (module-internal, not imported outside this folder) |
| | `spinner.data.ts` | `SPINNER_DEFS: { type, decay, power, stars, r, blades, style, colors }[]`, state thresholds, combo/Frenzy constants |
| | `spinner.types.ts` | `SpinnerState` enum (`STOPPED`/`SLOW`/`MEDIUM`/`FULL`), `SpinnerDef`, `SpinnerStyle` |
| `granny/` | `Granny.ts` | Render selected granny sprite, handle movement, swap to firing pose, breath idle |
| | `granny.data.ts` | `GRANNY_DEFS: { id, name, spriteKey, unlockCost }[]` |
| | `granny.types.ts` | `GrannyDef` |
| `gun/` | `Gun.ts` | Render selected gun sprite at correct rotation angle (snap to 8 cardinals), expose nozzle position |
| | `gun.data.ts` | `GUN_DEFS: { id, name, spriteKey, tier, cost, tank, drain, pump, interval, power, streams, sz, type }[]` |
| | `gun.types.ts` | `GunDef`, `AnchorJSON` (angle → nozzle XY map), `GunTier` |
| `world/` | `world.data.ts` | `WORLD_DEFS: { id, name, bg, grid, types, obstacles, time, starsToOpen, … }[]` |
| | `world.types.ts` | `WorldDef` |
| | `gigs.data.ts` | The gig ladder: `GIGS_PER_VENUE`, `gigFor(world, index)`, `newMusicianCount` — band size, seconds, wind-down scale, hold time, obstacles, moving targets per gig |
| | `wallBuilder.ts` | Lays out the wall for the gig's band size |
| `powerup/` | `PowerUp.ts` | Floating pickup, collision, applies effect to GameScene |
| | `powerup.data.ts` | `POWERUP_DEFS: { id, label, name, duration, effect }[]` |
| `obstacle/` | `Obstacle.ts` | Cat/Umbrella/Duck — block water, special behaviours |
| `waterParticle/` | `WaterParticle.ts` | Pooled — physics, collision check, splash on impact |
| | `WaterCannon.ts` | Fire cadence, stream geometry, tank, pump refill |
| | `WaterJet.ts` | Joins the shots in flight into one tapering ribbon with a darker rim and bright core |
| | `splashVFX.ts` | Impact burst and ripple ring (throttled) |

#### Audio (the headline differentiator)

| File | Responsibility |
|---|---|
| `AudioOrchestra.ts` | Real-time clock and the game-facing orchestra API (§9) |
| `orchestra/` | Engine: `SampleBank`, `Conductor`, `OrchestraGraph`, `pattern`, `theory`, `setPieces`, `score.types` |
| `scores/` | One written score per world, `shared.ts` builders, `index.ts` resolver |
| `WaterSound.ts` | Spray, splash and droplet noise layer |
| `ResultsMusic.ts` | Star chimes on the results screen |
| `SFX.ts` | Mechanical / menu one-shots kept outside the music |
| `AudioBus.ts` | Master mute, fade-out on ad break, fade-in on resume |

#### Types (only genuinely cross-cutting contracts — everything entity-specific lives in `entities/`)

| File | Responsibility |
|---|---|
| `save.ts` | `SaveData` v1 schema (`vault` = coins, `gigStars` = best stars per gig, `hasPlayed`, …), version tag for future migration |
| `input.ts` | `AimResult`, `InputEvent` union (`fire`/`aim`/`move`/`pause`) |
| `hud.ts` | `HudRefreshData`, `HudSpinnerSnapshot` — GameScene's per-frame payload into HUDScene |
| `sceneData.ts` | `GameSceneData`, `GigResultData` — payloads between scenes |

#### Assets (string-key registry)

| File | Responsibility |
|---|---|
| `assets/keys.ts` | All asset string keys as `as const` objects — `SPRITE_KEYS`, `AUDIO_KEYS`, `ICON_KEYS`. No raw strings in `load.*()` or `setTexture()` calls anywhere in the codebase. |

#### Systems (game logic, no rendering)

| File | Responsibility |
|---|---|
| `SaveManager.ts` | All localStorage I/O — try/catch wrapped, JSON serialisation |
| `InputManager.ts` | Unified pointer/keyboard input, emits semantic events |
| `UnlockManager.ts` | Coin bank (the vault), unlocked sets, validates purchases, deducts coins |
| `Progress.ts` | Pure tour rules over `SaveData`: stars per gig, total stars, venue opening, `recordGig`, `nextStop` |
| `startRound.ts` | The one gate that starts a round behind the between-runs commercial break (shared by Home PLAY and the results screen) |
| `FrenzyMeter.ts` | Watches spinner states, emits events for thresholds (60/80/100) |
| `ComboTracker.ts` | Combo counter, timer decay, multiplier calculation |
| `AdManager.ts` | High-level "show ad between runs" — handles audio muting, input disabling |

#### UI components (visual, no game logic)

| File | Responsibility |
|---|---|
| `Button.ts` | Primary/secondary/tertiary button factory — applies palette, radius, hover/press |
| `Carousel.ts` | Generic ◀ item ▶ selector |
| `NoteGlyph.ts` | The drawn music note that floats off a spinner when its musician plays |
| `PauseButton.ts` | Visible pause control for touch devices |
| `StatPill.ts` | Small icon-and-number readout pill for coins and stars, so the two always look like a pair |
| `Toast.ts` | Floating text notification with fade |
| `Banner.ts` | FRENZY/level reveal banners with Back.Out scale-in |
| `WaterBar.ts` | Water tank UI with shimmer + pumping state |
| `TimerDial.ts` | Top-of-screen timer with countdown drama at <10s |
| `FrenzyMeterUI.ts` | The "on-wall" frenzy meter bar + per-spinner status dots |

#### Utilities (pure functions)

| File | Responsibility |
|---|---|
| `math.ts` | `distance`, `clamp`, `lerp`, `easeOut`, etc. |
| `tween.ts` | Pre-built tween configs — `BOUNCE_IN`, `FADE_OUT`, etc. |
| `colour.ts` | Palette as `{ pink: 0xFF6BA8, ... }` — accessed by name |

### 7.3 Architectural rules (non-negotiable)

1. **No file over 300 lines.** If it grows past that, split it.
2. **No `any` types.** TypeScript strict mode on.
3. **No magic numbers.** All constants live in an entity's `*.data.ts` or `config.ts`.
4. **One responsibility per file.** Spinner.ts doesn't talk to localStorage. SaveManager doesn't render.
5. **Data flows one way:** Systems → Scenes → Entities/UI. No backwards calls.
6. **No direct `PokiSDK.*` calls outside `poki.ts`** — single source of truth.
7. **No direct `localStorage.*` calls outside `SaveManager.ts`** — must be wrapped.
8. **No emoji in TS source as user-facing UI** — only in code comments. UI uses SVG icons.
9. **Every public class method has a JSDoc comment** explaining intent.
10. **Tests cover Systems/, not Scenes/** — game logic is testable, rendering is visual QA.
11. **No string literals for asset keys** — every `load.image()`, `load.audio()`, `sound.play()`, and `setTexture()` call references a constant from `src/assets/keys.ts`. Typos become compile errors, not runtime "missing texture" placeholders.
12. **Shared types live in `src/types/`**, module-internal types stay alongside the code that uses them. If two files import the same type, it belongs in `types/`.

### 7.4 Data flow diagram

```
            ┌────────────────────────────────────────────┐
            │              SaveManager                   │
            │  (localStorage I/O, try/catch wrapped)     │
            └─────────────────────┬──────────────────────┘
                                  │ reads/writes
            ┌─────────────────────▼──────────────────────┐
            │     UnlockManager  ·  FrenzyMeter  ·       │
            │     ComboTracker   ·  AdManager            │
            │            (game logic, no UI)             │
            └─────────────────────┬──────────────────────┘
                                  │ exposes API
            ┌─────────────────────▼──────────────────────┐
            │  Scenes  (BootScene → HomeScene → GameScene │
            │   → ResultsScene → next gig / Home;        │
            │   Tour and Shop hang off Home)             │
            │   Orchestrates objects + systems            │
            └──────┬───────────────────┬─────────────────┘
                   │ adds to scene      │ adds to scene
        ┌──────────▼──────────┐   ┌─────▼──────────────┐
        │  Entities/          │   │  UI/ components    │
        │  (Granny, Gun,      │   │  (Button, Toast,   │
        │   Spinner, etc.)    │   │   FrenzyMeterUI)   │
        └─────────────────────┘   └────────────────────┘
                   │                       │
                   └───────────┬───────────┘
                               ▼
                  ┌──────────────────────────┐
                  │  Utils + Audio + Data    │
                  │  (pure helpers)          │
                  └──────────────────────────┘
```

### 7.5 Coding conventions

- **Files:** PascalCase for classes (`Granny.ts`), camelCase for utilities (`math.ts`), `kebab-case.ts` for tooling
- **Classes:** PascalCase
- **Constants:** UPPER_SNAKE_CASE
- **Variables/functions:** camelCase
- **Private members:** prefix `_` (e.g., `_internalState`)
- **No default exports** — named exports only
- **Imports ordered:** Phaser → external libs → local absolute → local relative
- **`const` by default; `let` only when reassigned; never `var`**

### 7.6 Build & run

```bash
# Initial setup
npm create vite@latest granny-spin-splash -- --template vanilla-ts
cd granny-spin-splash
npm install phaser
npm install -D pngquant vitest @types/node

# Development
npm run dev          # vite dev server, http://localhost:5173
npm run test         # vitest unit tests
npm run lint         # eslint + prettier check

# Production
npm run build        # outputs dist/, gzipped
npm run budget       # node tools/budget-check.ts — fails if dist > 8 MB
npm run samples      # tools/build-orchestra-samples.ts — rebuild the instrument sprite (needs ffmpeg + lame)
npm run optimise     # tools/sprite-optimise.sh — drop a PNG into public/sprites/, run this, reference the .webp (verifies SSIM, removes the PNG)
npm run preview      # local preview of production build

# Pre-submission
npm run build && npm run budget && npm run preview
# Then upload dist/ to https://inspector.poki.dev/
```

---

## 8. Sprite Asset Pipeline

> **Correction (Sprint 1, 2026-09-11):** the user is personally creating the custom granny + gun art rather than having it generated through §8.3.1's automated Nano Banana pipeline. Sizes, filenames, the 8-angle/anchor.json convention, and the art-direction brief below still apply — they're the delivery spec either way. Treat §8.3.1 as a fallback path, not the default: don't autonomously generate final granny/gun sprites without checking in first. Everything else in this section (roster, unlock costs, why-these-N reasoning) is unchanged.

### 8.1 Grannies (3 launch, others post-launch)

> **[ART_BRIEF.md](ART_BRIEF.md)** is the full, copy-paste-ready generation spec (2026-09-11) — palette table, per-pose filenames, generation order, character prompt seeds. This section stays the summary/roster source of truth; that file is what you actually work from in Nano Banana.

> **Re-plan (2026-09-11, delivered art):** §14's camera re-plan (player stands behind Granny, looking at the same wall she is) landed *after* ART_BRIEF.md's original 5-pose turnaround spec was written, and made most of it moot — gameplay only ever renders her from behind, so the 3/4-turn and side poses have no use. Each character ships **3 poses** instead: `front` (splash-carousel portrait only), `back` (gameplay idle), `back_firing` (gameplay firing — arms extended, gun-ready). All transparent PNGs, generated at a padded working canvas then content-tight-cropped (+4% margin) before shipping so runtime sprite-fitting (`frame.height`-based scaling in `Granny.ts`) has no dead space to account for.

**Launch roster (3):**

| Unlock | Name | Vibe |
|---|---|---|
| Start | **Classic Granny** | Pink dress, white curls, glasses |
| Start | **The Squirt Sister** | Yellow rain mac, pigtails, freckles |
| 500★ | **Punk Granny** | Mohawk, leather, attitude |

**Post-launch content drops:** Beach Granny, Ninja Granny, GOLDEN GRANNY (10,000★ hero unlock), then Queen, Disco, Santa, Astro, Pirate, Cyber.

**Why these three:** two starting grannies validate the splash-screen carousel works with multiple unlocked items from run one. One 500★ unlock validates the full unlock loop within 3–5 play sessions, so the progression hook is tested in v1 even at minimum scope.

### 8.2 Guns (6 launch × 8 angles = 48 sprites)

Each gun: 8 angled sprites at 192×128 px, transparent PNGs, angles `0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°`. Plus an `anchor.json` per gun declaring nozzle XY per angle.

| Tier | Unlock | Name | Visual cue |
|---|---|---|---|
| 1 | Start | Drip Pistol | Tiny plastic neon toy |
| 1 | Start | The Squirter | Classic '90s super-soaker |
| 2 | 200★ | Garden Hose | Coiled hose, brass nozzle |
| 2 | 500★ | Splash Jr | Two-handed kid blaster |
| 3 | 1,200★ | Soaker 3000 | Twin-barrel, retro-futuristic |
| 4 | 5,000★ | Inferno | Red flame-painted (fire weapon) |

**Post-launch content drops:** Aqua Seeker, Hydro Blaster, Lightning Rod, Ice Queen, Neptune's Wrath, MEGA CANNON (100,000★ hero unlock).

**Why these six:** covers tiers 1–4, gives two start guns + four unlocks. Inferno at 5,000★ provides a meaningful stretch goal that takes ~20+ runs to hit, supporting Week 1 retention.

### 8.3 Art direction brief

- **Style:** Hand-painted watercolour with thick black outlines. Ghibli warmth × Animal Crossing comfort
- **Resolution:** Generate at 2× target size, downscale clean
- **Format:** WebP with alpha is the shipped format (all 65 sprites under `public/sprites/`, converted 2026-11-25 by `tools/sprite-optimise.sh`). PNG is the authoring format: drop it into `public/sprites/`, run `npm run optimise`, and reference the `.webp`. The original spec was PNG with `pngquant` (~25 KB per sprite).
- **Palette:** Pull only from the 8-colour palette in §5.1
- **Lighting:** Single light source upper-left, shadow lower-right
- **Outlines:** 4px Ink on edges, none on transparent boundaries
- **Consistency:** All sprites share outline weight, lighting, shadow

### 8.3.1 Nano Banana generation workflow

Google Nano Banana (Gemini 2.5 Flash Image) is the chosen tool. Its key strength is image-conditioned generation — passing a reference image holds character/style consistency far better than text-only prompts.

**Process (run in order, do not parallelise):**

1. **Lock the style template.** Generate Classic Granny standing pose first. Iterate on this *one image* until palette, outline weight, scale, and lighting are exactly right. Save the final PNG as `_reference/granny_template.png`. This is the source of truth for all 5 other granny sprites.
2. **Lock the firing template.** Generate Classic Granny firing pose using the standing PNG as image reference. Iterate until the hand position is consistent and gun-ready. Save as `_reference/granny_firing_template.png`.
3. **Batch the other grannies.** Generate Squirt Sister + Punk standing/firing using both reference images, changing only character description in the prompt. 4 PNGs.
4. **Lock the gun template.** Generate Drip Pistol at 0° (pointing right). Iterate on outline weight, palette, lighting at this single angle until perfect. Save as `_reference/gun_template_0deg.png`.
5. **Generate the 8 angles for Drip Pistol.** Use the 0° reference + explicit angle prompt for each of the other 7. Manually correct anchor positions in `anchor.json`.
6. **Batch the other 5 guns.** For each new gun, redo step 4 (one reference angle) then step 5 (the other 7).

**Do not skip step 1.** Generating all sprites in parallel will produce 54 inconsistent images. The reference-image chain is what holds the style.

**Manual cleanup expected:** plan for 20–30% of generated sprites to need touch-up in a vector/raster tool (Affinity Designer, Figma, or Photopea free in-browser). Outline weight inconsistency is the most common defect to fix.

**anchor.json authoring:** after each gun's 8 angles are generated, open each PNG, identify the nozzle pixel coordinate, and record it. A small HTML tool (drag PNG into browser, click nozzle, copy coordinates to clipboard) is worth 30 minutes to build before doing this 48 times.

### 8.4 Asset budget

| Asset | Count | Avg size | Total |
|---|---|---|---|
| Granny standing | 3 | 30 KB | 90 KB |
| Granny firing | 3 | 30 KB | 90 KB |
| Gun angles | 48 | 12 KB | 576 KB |
| Audio loops | 12 | 30 KB | 360 KB |
| Audio SFX | ~15 | 8 KB | 120 KB |
| Phaser bundle (gz) | 1 | 1.2 MB | 1.2 MB |
| Game code (gz) | 1 | 150 KB | 150 KB |
| Font (woff2) | 1 | 40 KB | 40 KB |
| Thumbnails | 2 | 200 KB | 400 KB |
| Icon SVG sprite | 1 | 8 KB | 8 KB |
| **Total** | | | **~3.0 MB** |

Well under Poki's 8 MB cap. ~750 KB cheaper than the original 6-granny/12-gun roster, which gives runway for richer audio stems or higher-quality thumbnails if needed.

---

## 9. ASMR Orchestra Audio

The headline feature. **Rebuilt 2026-11-25** (commit `8b36957`, plan in `docs/UPLIFT_PLAN.md` Phase A); this section describes the engine as built. The earlier designs are kept at the end as history only.

### 9.1 Concept

Every spinner on the wall is a **musician** with a written part in a real piece of music. Waking a spinner brings that musician in; a full wall is the full orchestra; squirting a spinner plays its instrument on the spot. Stop firing and the musicians fade out — soothing, satisfying, ASMR. By Splash Frenzy you are conducting a full orchestra.

### 9.2 The engine (`src/audio/`)

| Part | File | What it does |
|---|---|---|
| **Instruments** | `orchestra/SampleBank.ts` | Loads the orchestra sprite (`public/audio/orchestra.mp3` + `orchestra.json`), then one sprite per band after it (`BAND_SPRITES`, today `['kitchen']`, from `public/audio/bands/`; each loads in the background and fails independently, and a score may mix its band's instruments with the orchestra's), decodes each with an `OfflineAudioContext` (allowed before any user gesture), slices per-note buffers, retunes by playback rate using each sample's *measured* pitch. Fire-and-forget from `BootScene`, never blocks play. |
| **Sprite builder** | `tools/build-orchestra-samples.ts` (`npm run samples`) | Reads `tools/bands/<band>.manifest.json` (`npm run samples` builds every bank, `npm run samples -- kitchen` one), downloads from the approved CC0 repositories only (`APPROVED_SOURCES` — VSCO-2 CE, VCSL and the Karoryfer repos; any other repository is refused) into `.cache/` (gitignored), trims, normalises, resamples to mono 32 kHz, measures real pitch (YIN), prepends a sync marker so notes land on the grid in every browser, packs one MP3 + JSON index. Needs `ffmpeg` and `lame` on PATH. Orchestra sprite: 37 instruments, 119 notes, about 955 KB; Kitchen sprite: 16 instruments, about 363 KB. The orchestra bank writes `public/audio/orchestra.*`, any other bank `public/audio/bands/<bank>.*`. |
| **Conductor** | `orchestra/Conductor.ts` | Pure scheduling: given a sixteenth-note index, an audio time and each musician's charge, schedules exactly what plays. Knows nothing about clocks or game objects, so tests and offline renders drive it step by step. Also plays spray notes and stingers. |
| **Signal path** | `orchestra/OrchestraGraph.ts` | One fader and pan per musician, a generated hall reverb, a tone control that opens across the round (the last third sounds brighter, not just louder), and a limiter. Built on `BaseAudioContext` so the same graph renders offline. |
| **Notation** | `orchestra/pattern.ts` | The small language every part is written in (token table below). |
| **Theory helpers** | `orchestra/theory.ts` | Pure chord, scale and pitch maths — chord parsing, stacked and windowed voicings, slash-chord bass, scale degrees, `isInScale`, playback-rate retuning. Unit-tested (`tests/unit/theory.test.ts`). |
| **Score types** | `orchestra/score.types.ts` | `Score`, `Part`, `Line`, `InstrumentId`. |
| **Set pieces** | `orchestra/setPieces.ts` | The lean-in before Frenzy, the Frenzy fanfare, the closing chord, and the orchestra-voiced feedback accents. |
| **Scores** | `scores/{garden,workshop,kitchen,funfair,disco}.ts`, `scores/index.ts`, `scores/shared.ts` | One score per world, resolved by world id (an unknown id borrows Garden's). `shared.ts` holds the builders (`struck`, `held`, `line`) and the shared `drivingFinale` / `tuttiFrenzy` arrangements. |
| **Game-facing API** | `AudioOrchestra.ts` | Owns the real-time clock (a 25 ms scheduler with 110 ms lookahead) and the API GameScene calls: `start`, `stop`, `finish`, `updateMix`, `setRoundProgress`, `onSpinnerHit`, `onFrenzyNear`, `onFrenzyStart`, `onFrenzyEnd`, `accent`, `tick`, `pollNotes`, `beatPhase`, `seatName`. |
| **Water** | `WaterSound.ts` | See §9.5. |
| **Results chimes** | `ResultsMusic.ts` | A glockenspiel note per star (a cymbal on the third) played straight from the instrument bank after the closing chord. |
| **One-shots** | `SFX.ts` | Only the mechanical and menu sounds deliberately kept *outside* the music. |
| **Master** | `AudioBus.ts` | Shared `AudioContext`, master volume, mute, fade (ads). Unchanged role. |

**A score** (`Score`) is a short real piece: a key (`tonic` + `mode`), `bpm`, an eight-bar chord progression, a `swing` amount, a quiet always-on `bed`, the `seats` (one written `Part` per musician, each with a stable `id`, a display `name`, an optional `light` version, `with` companion lines, an `ornament`, and a short percussive `spray` instrument for squirts), a `lineup`, and the `finale` and `frenzy` lines. Keys and tempos today: Garden G major 96 BPM, Workshop A minor 108, Kitchen C major 116 (swung, triplet feel), Funfair F major 120, Disco D minor 120.

**Line-up order.** `Score.lineup` lists seat ids in the order musicians join as gigs grow (`docs/ENGAGEMENT_DESIGN.md` §3): a gig with a band of five seats the first five. The first three must already sound like music — a bass, a harmony instrument and a tune. The wall is laid out for the band size and the orchestra seats exactly that band, panned by each spinner's x position.

**Notation.** Parts never name absolute pitches; they name a note's *role* in the harmony, so one written part stays consonant over the whole progression and no combination of musicians can clash. A bar is a string of space-separated tokens that divide the bar evenly (1, 2, 4, 8 or 16 tokens). Malformed input throws, so a typo fails the test suite, not the mix.

| Token | Meaning |
|---|---|
| `.` | rest |
| `-` | hold the previous note (sustained instruments) |
| `r t f s o` | root, third, fifth, seventh (octave on triads), octave |
| `a b c d` | low, middle, high tone of the close voicing; `d` is `a` plus an octave |
| `z` | the chord's bass note (differs from the root on slash chords such as `D/F#`) |
| `1`–`7` | scale degree of the key, for written melodies |
| `x` | unpitched hit (percussion) |

Suffixes: `'` up an octave, `,` down an octave (repeatable), `!` accent, `?` ghost note. Join tones with `+` to sound them together (`a+c`).

### 9.3 The three behaviours

1. **Waking a spinner brings its musician in — tiers, not just volume.** A spinner's charge (speed as a fraction of `MAX_SPINNER_SPEED`) is its fader. Below the MEDIUM threshold the musician plays the thinned outline of the part (`light`, by default only the notes that fall on a beat); from MEDIUM they play the full part (and any `with` companions); from FULL they add the `ornament`. A stopped spinner is silent. Let it wind down and the musician fades back out.
2. **Squirting plays the instrument.** Water landing on a spinner sounds that seat's `spray` instrument on the next sixteenth, stepping through the current chord (root, third, fifth, octave, fifth, third). At most one spray note per spinner per eighth and three per step across the wall, so a wide gun never clumps; once a musician is playing their own part the spray notes step back so the part stays the hero.
3. **The round has a shape.**
   - **Finale:** from two-thirds of the round, driving spiccato strings, a timpani pulse and tambourine join regardless of wall state.
   - **Splash Frenzy:** a timpani roll and cymbal swell lean in when the wall is nearly full (`onFrenzyNear`); on the drop a fanfare lands (crash, bell tree, timpani, held horn, rising trumpet) and the tutti plays for the whole window while every seat plays as if at full charge.
   - **Closing chord:** at the final whistle `finish()` lands a closing chord on the next beat and lets it ring instead of cutting the music dead.

### 9.4 Orchestra-voiced feedback

Level-ups, combos, pickups, golden spinners, refills and the cheer are played by the orchestra itself via `AudioOrchestra.accent()`: on the next sixteenth and in the current chord, so feedback is part of the score rather than a beep laid over it. The accents are `wake`, `spin`, `full`, `combo` (climbs the chord with combo level), `powerup`, `golden`, `goldenMissed`, `refill` and `cheer`. The final-countdown `tick` is deliberately unquantised so it agrees with the on-screen clock.

### 9.5 The water sound layer

`WaterSound.ts` gives the water itself a sound, all shaped noise and sine so it costs no download: a continuous **spray** hiss while the cannon fires (its colour drifts slightly so it never sounds like a held tone), a soft **splash** where each shot lands (throttled, panned to where it lands) and an occasional rising **droplet**. It sits well under the orchestra — texture to be felt, not a layer to compete with the music.

### 9.6 Fallback

If the sprite fails to load, `SampleBank` falls back to a plain synthesised pluck for every note: the game is never silent and never waits on audio.

### 9.7 Bands per venue

The engine separates the mechanic (each spinner is a musician with a written part) from the style (which recordings, which score). A new band is a new score plus a new set of recordings — no engine change. The per-venue plan (Garden chamber orchestra, Kitchen jazz combo, Workshop garage rock, Funfair fairground band, Disco funk/disco), the sample sources awaiting approval and the size budget live in **`docs/BANDS.md`**; do not duplicate them here. Status today (2026-11-25): **Garden** (chamber orchestra) is the reference and **Kitchen** is a jazz combo — the first band that is not an orchestra: key, tempo (116 BPM), swing and line-up are in `src/audio/scores/kitchen.ts` (walking bass, ride, piano and tenor sax as the opening quartet, then brushes, vibraphone, guitar, muted trumpet and the rest as the gigs grow). Workshop, Funfair and Disco are still orchestral stand-ins in the right key, tempo and feel. The set pieces (lean-in, fanfare, closing chord) and the feedback accents are **still orchestral in every venue**, the Kitchen included. All three sample sources were approved 2026-11-25: VCSL and the Karoryfer repositories verified CC0 from their LICENSE files, VSCO-2 CE already in use; FreePats is not yet re-checked at source and not yet used.

### 9.8 Verification

Unit tests cover the notation, theory helpers and scores (scores stay in key in every tier, add music as musicians wake, seat every spinner in every world). Offline renders check peak, RMS and clipping. **Limit stated plainly: we can measure audio but not hear it.** As of 2026-11-25 David has not yet listened to the new orchestra or the Kitchen jazz combo; sign-off by ear is outstanding.

### 9.9 History (decisions superseded by the above)

- **Original concept (2026-05):** 12 perfectly-synced, loopable stems (bass+kick, hi-hat, pluck, bell, pad, arpeggio, vocal oohs, strings, brass swell, choir, drop bass, cinematic hit) at one BPM and key, triggered by aggregate thresholds ("25% of spinners FULL" and so on). Sourcing options considered: royalty-free stem packs, Suno/Udio with stem separation, a commission, or placeholder loops. All needed David's time or money before a note could exist.
- **Each spinner IS an instrument (2026-09-11):** the mapping became direct and continuous per spinner — a spinner's own speed is its layer's gain — with the bass always on and drop bass / cinematic hit reserved for Frenzy. This survives in the current design, minus stems.
- **Synthesised placeholder (2026-09-12):** option 4 taken, synthesised in Web Audio (`orchestraVoices.ts`), then generalised the same day into per-world oscillator **themes** (`src/audio/themes/`, plus `synthPrimitives.ts`). Zero asset cost, but every instrument was a raw sine/triangle/saw looping one bar over one unchanging chord, and hitting a spinner only moved a volume fader — nothing musical happened at the moment you squirted, and there was no sound of water.
- **Replaced 2026-11-25** by the engine above: real recorded instruments, written scores, squirt-plays-the-instrument, and a round shape. `themes/` and `synthPrimitives.ts` were deleted. The old "implementation pattern" pseudo-code (loop N stems, `updateMix` sets gains) and the "production options" brief (OGG stems at 96 kbps, A minor, 2.5 s loop) no longer describe anything in the code.

---

## 10. Splash Screen Design

> **Note (2026-11-25):** this is the screen as originally specced. It is superseded: slice 2 (`e6ab381`) built `HomeScene.ts` (one big PLAY button) as the first screen, and the carousel layout described here now lives in `ShopScene.ts`, with `TourScene.ts` as the venue map (`docs/ENGAGEMENT_DESIGN.md` §5). In this mock-up, read "stars in vault" as **coins**: grannies and guns are bought with coins, venues open on total stars.

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│              GRANNY'S SPIN SPLASH                       │
│                                                         │
│              🏦 12,450 stars in vault                   │
│                                                         │
│  ┌──────────────┐                  ┌──────────────┐   │
│  │              │                  │              │   │
│  │   ◀  👵  ▶  │                  │   ◀  🔫  ▶  │   │
│  │              │                  │              │   │
│  │ Punk Granny  │                  │   Inferno    │   │
│  │   ★★★★      │                  │   ★★★★      │   │
│  └──────────────┘                  └──────────────┘   │
│                                                         │
│                                                         │
│          ┌─────────────────────────────┐              │
│          │       ▶  PLAY               │              │
│          └─────────────────────────────┘              │
│                                                         │
│       🎬 Watch ad → unlock random gun                  │
└─────────────────────────────────────────────────────────┘
```

### Behaviour
- **Arrows step through unlocked items** — locked items greyed with star cost
- **Tapping a locked item** shows cost + "Earn more ★" prompt
- **PLAY button** — huge, Mint Green, centred
- **Rewarded ad** unlocks a random tier ≤ player's current tier
- **No nested menus** — settings opens as overlay
- **Worlds unlock by progression** within gameplay, not selected here

---

## 11. Monetization Design

> **Redesigned 2026-11-25.** The economy changed after this section was written: **coins are the single currency** (the save's `vault`), earned in every gig and spent on guns and grannies; **stars are the rating** (never spent) and open venues; the results screen is the "end screen" for ad purposes. Prices today: guns 0 / 0 / 150 / 400 / 900 / 2,000 coins, Punk Granny 600 (`gun.data.ts`, `granny.data.ts`). Rewarded options are being redesigned (double coins at results; more time once per failed gig; try a locked gun for one gig — each with an equal-or-larger free alternative beside it). **`docs/ENGAGEMENT_DESIGN.md` §4 and §6 are authoritative where they conflict.** The Poki rules in §11.2–11.4 are unchanged. `ADS_ENABLED` is still `false` for testing and must be `true` before submission (`BACKLOG.md`).

### 11.1 Ad placement plan

| When | Type | Rationale |
|---|---|---|
| First load → first input | none | Let SDK preload |
| Every 2nd round start (NEXT GIG / PLAY AGAIN / PLAY) | `commercialBreak()` | Natural break; one shared gate, `systems/startRound.ts` |
| Results screen → "Double your coins" | `rewardedBreak({size:'medium'})` | Player-initiated; smaller than NEXT GIG |
| Mid-run → "Watch ad to refill water" | `rewardedBreak({size:'small'})` | When tank empty |
| Splash screen → "Watch an ad for a free gun" | `rewardedBreak({size:'large'})` | Acquisition (on the splash screen, not the results screen) |

### 11.2 SDK rules

```typescript
// ✅ CORRECT
async function onPlayAgainTap() { // now startRoundAfterAdGate() in systems/startRound.ts
  await PokiSDK.commercialBreak(() => audioBus.mute());
  audioBus.unmute();
  PokiSDK.gameplayStart();
  scene.start('GameScene');
}

// ❌ WRONG: auto-restart with no input
this.time.delayedCall(2000, () => PokiSDK.gameplayStart());
```

### 11.3 Reward button UI rules

Poki has strict rules — get them wrong and you're rejected:
- Standard continue button: **Mint Green, larger or equal**, **next to or above** rewarded
- Rewarded button: **cannot be green**, must include 🎬 icon prominently
- Both visible **simultaneously**
- One reward per ad

### 11.4 Currency rules

- Coins (the vault) **earned only through gameplay** — never purchasable
- Rewarded ads grant **content** (skins, unlocks, multipliers). *Note:* "Double your coins" re-adds the gig's coins as a multiplier; check this against Poki's reading of "never raw currency" before submission
- No "buy 5000 stars for $5" UI — Poki bans this

---

## 12. Pre-Submission Checklist

### Must-fix (rejection grade)

1. ☐ Bundle Phaser locally (no CDN)
2. ☐ Add PokiSDK script + init + all events
3. ☐ `preventDefault` for arrows + space
4. ☐ `gameplayStart()` on first input, not scene load
5. ☐ `commercialBreak()` between runs after intent shown
6. ☐ Audio mutes during ads
7. ☐ Test in incognito mode
8. ☐ `PokiSDK.movePill(0, 24)` on mobile
9. ☐ Static + animated thumbnails
10. ☐ No studio splash screens

### Should-fix (quality grade)

11. ☐ Test at 640×360, 836×470, 1031×580
12. ☐ ESC and Space pause handlers
13. ☐ All cutscenes skippable
14. ☐ No text-heavy explanations
15. ☐ Profanity filter (if text input added later)

### Nice-to-have

16. ☐ Localisation framework
17. ☐ Fullscreen support
18. ☐ A/B thumbnail testing

---

## 13. Product Backlog

Sized **S** (≤1 day), **M** (2-3 days), **L** (1 week), **XL** (2+ weeks).

### 🏗 Sprint 0 — Foundation (1 week)

Get the project skeleton up. Empty scenes, working SDK, build pipeline.

| # | Story | Size | Acceptance |
|---|---|---|---|
| 0.1 | Scaffold Vite + TypeScript + Phaser 3 project | S | `npm run dev` boots empty Phaser canvas at 1280×720 |
| 0.2 | Bundle Phaser locally (no CDN) — `vite.config.ts` | S | Network tab shows zero external requests on load |
| 0.3 | Set up build size budget (`tools/budget-check.ts`) | S | `npm run build && npm run budget` exits 0 |
| 0.4 | Create empty file skeleton matching §7.1 folder structure | M | All files exist with one-line JSDoc describing purpose |
| 0.5 | Implement `src/poki.ts` SDK wrapper + integrate in `main.ts` | M | All 5 SDK events fire correctly in Poki Inspector |
| 0.6 | Extract balance data from prototype into `src/data/*.ts` | M | All `data/` files populated from prototype constants per §2 |
| 0.7 | Set up ESLint + Prettier + strict TypeScript | S | `npm run lint` passes on empty skeleton |
| 0.8 | Set up Vitest with one example test | S | `npm run test` runs `SaveManager.test.ts` and passes |

**Sprint 0 exit criteria:** Empty Phaser game boots in browser, SDK initialises, all data files populated, lint/test/build pipeline working. No gameplay yet.

### 🎮 Sprint 1 — Walking Skeleton (1 week)

Build the core loop with placeholder graphics. Make it playable end-to-end before any polish.

| # | Story | Size | Acceptance |
|---|---|---|---|
| 1.1 | Implement `SaveManager` with localStorage try/catch | S | Unit test passes; survives incognito mode |
| 1.2 | Implement `Spinner.ts` with state machine (procedural draw) | M | 4 states render distinctly; decay + hit increase work |
| 1.3 | Implement `Granny.ts` as a placeholder coloured rectangle | S | Moves left/right via `InputManager` |
| 1.4 | Implement `WaterParticle.ts` with arc physics + collision | M | Pooled (max 50), hits register on spinners |
| 1.5 | Build `GameScene` to wire spinners + Granny + water together | M | Click/tap to fire works, spinners go SLOW→FULL |
| 1.6 | Implement `FrenzyMeter` system + trigger | S | All spinners FULL triggers frenzy event |
| 1.7 | Add `preventDefault` for arrows + space in `InputManager` | S | No page scroll in Poki Inspector |
| 1.8 | Wire `PokiSDK.gameplayStart()` to first input + `gameplayStop()` to game over | S | Verified in Inspector logs |

**Sprint 1 exit criteria:** Game is playable. Ugly, but functional. Spinners spin, water flies, Frenzy triggers. SDK events fire correctly.

### 🎨 Sprint 2 — Visual Design System (1 week)

Apply the design system. Game looks premium and kid-friendly with procedural graphics.

| # | Story | Size | Acceptance |
|---|---|---|---|
| 2.1 | Bundle Fredoka WOFF2 locally; apply typography scale | S | All text uses Fredoka, sizes match §5.2 |
| 2.2 | Implement `src/utils/colour.ts` palette + apply across UI | S | No hardcoded hex outside `colour.ts` |
| 2.3 | Build `Button.ts` component with primary/secondary/tertiary variants | M | Used everywhere; consistent hover/press behaviour |
| 2.4 | Build SVG icon sprite system + replace all emoji UI | M | Zero emoji in user-facing UI |
| 2.5 | Strip in-play HUD to timer + water + frenzy meter | M | Score hidden during play, revealed at game over |
| 2.6 | Build `FrenzyMeterUI` integrated into the wall background | M | Meter feels part of the world, not floating UI |
| 2.7 | Apply 8px spacing grid + 16px radius across all UI | S | Visual review confirms consistency |
| 2.8 | Tune spinner counts/decay so Frenzy arrives in ~50% of normal runs | S | Playtest confirms pacing |

**Sprint 2 exit criteria:** Game looks premium. Visually cohesive. Plays the same as Sprint 1 but feels professional.

> **Re-plan (2026-09-12):** story 2.5's "score hidden during play" was reversed by direct user feedback — see §14's "Live score tally during play" row. The in-play HUD now includes a running score tally; timer/water/frenzy meter are unchanged.

### 🎨 Sprint 3 — Sprite Pipeline (1.5 weeks)

Replace placeholder Granny + Gun with custom Nano Banana sprite art. **See §8.3.1 for the generation workflow — do not parallelise the reference-image chain.**

| # | Story | Size | Acceptance |
|---|---|---|---|
| 3.1 | Lock Classic Granny's 5-pose set (front/front_firing/3-quarter/side/back) as style template — see [ART_BRIEF.md](ART_BRIEF.md) | M | 5 reference PNGs in `_reference/`, palette/outline/scale exactly right |
| 3.2 | Generate remaining 2 Grannies' 5-pose sets from template — see [ART_BRIEF.md](ART_BRIEF.md) | M | 10 PNGs delivered, visual consistency review passes, all in `public/sprites/grannies/<id>/` |
| 3.3 | Lock Drip Pistol 0° as gun style template | S | 1 reference PNG, outline weight and palette matched to grannies |
| 3.4 | Generate 8 angles for Drip Pistol + author `anchor.json` | M | 8 PNGs + correct nozzle XY per angle |
| 3.5 | Build small HTML anchor-picker tool (click nozzle, copy coords) | S | Tool in `tools/anchor-picker.html`, used for stories 3.4 and 3.6 |
| 3.6 | Generate remaining 5 guns × 8 angles + anchor data | L | 40 PNGs + 5 `anchor.json` files delivered, all in `public/sprites/guns/{id}/` |
| 3.7 | Implement `Granny.ts` sprite-based rendering | M | Correct sprite renders per selection; idle breath; firing pose swap |
| 3.8 | Implement `Gun.ts` with 8-angle rotation logic | M | Smoothly snaps to nearest cardinal angle following aim |
| 3.9 | Optimise all PNGs through pngquant | S | Total sprites < 1 MB |
| 3.10 | Stress-test at 640×360 — sprites crisp | S | Visual review at all three Poki canonical sizes |

**Sprint 3 exit criteria:** Game looks like a finished product. Sprite art carries the visual identity. All 54 launch sprites delivered.

### 🎵 Sprint 4 — ASMR Orchestra (1.5 weeks)

The headline feature. Layered music that builds with player progress.

| # | Story | Size | Acceptance |
|---|---|---|---|
| 4.1 | Audio source decision + procure 12-layer ASMR loop pack (see §9.3) | L | 12 OGG files, same BPM, same length, same key |
| 4.2 | Implement `AudioOrchestra.ts` mixing class | M | Smooth gain tweening; no clicks/pops at layer change |
| 4.3 | Wire orchestra to spinner state via `FrenzyMeter` events | M | Layers fade in/out as spinners progress |
| 4.4 | Implement `AudioBus` master mute + fade on ad | S | Audio mutes within 100ms of `commercialBreak()` |
| 4.5 | Port one-shot SFX from prototype synth code into `SFX.ts` | S | Hit/splash/unlock/frenzy SFX sound right |
| 4.6 | Playtest: does it feel like ASMR? | S | 5-person test, ≥4/5 say "satisfying" |

**Sprint 4 exit criteria:** Game sounds incredible. The audio is the differentiator.

### 🚀 Sprint 5 — Splash Screen + Unlocks (1 week)

Build the new SplashScene with Granny + Gun carousel.

| # | Story | Size | Acceptance |
|---|---|---|---|
| 5.1 | Implement `UnlockManager` system | S | Vault total, unlocked sets, validation logic — unit tested |
| 5.2 | Build `Carousel.ts` reusable component | M | Used for Granny, World, and Gun selectors |
| 5.3 | Build `SplashScene` matching §10 mockup | M | Three carousels, PLAY button, vault display |
| 5.4 | Wire unlock thresholds to vault total | S | Locked items show cost + unlock at threshold |
| 5.5 | Add `rewardedBreak()` for random gun unlock | M | Random tier ≤ current grants only on success |
| 5.6 | World-select carousel (re-planned 2026-09-11 — all 5 launch worlds, see §14) | M | Every world purchasable from vault stars; Garden free from run one |
| 5.7 | Create static + animated thumbnails | M | Meets Poki spec |

**Sprint 5 exit criteria:** Full game loop: splash → game → game over → splash. Unlocks feel rewarding.

### 💰 Sprint 6 — Monetization Polish (1 week)

Get the ads right. Poki rejects games that get this wrong.

| # | Story | Size | Acceptance |
|---|---|---|---|
| 6.1 | Wire `commercialBreak()` to "Play Again" button | S | Ad shows before run start; events fire correctly |
| 6.2 | Add "Watch ad → 2× score" `rewardedBreak()` on game over | M | Optional, never gates the standard "Play Again" |
| 6.3 | Add "Watch ad → refill water" mid-run when tank empty | M | Only player-initiated when water = 0 |
| 6.4 | Verify all reward buttons follow Poki UX rules | S | Mint Green standard ≥ rewarded; 🎬 icon present |
| 6.5 | Implement `AdManager` to centralise ad logic + audio mute | S | All ad flows route through this; audio guaranteed muted |
| 6.6 | Build `PauseScene` with ESC / two-finger trigger (two-finger removed 2026-09-12; see §6.3) | M | Fires correct SDK events on pause/resume |

**Sprint 6 exit criteria:** All ad flows work correctly per Poki rules. Game is technically submission-ready.

### ✨ Sprint 7 — Launch Polish (1 week)

Final QA pass and submission.

| # | Story | Size | Acceptance |
|---|---|---|---|
| 7.1 | Test all canonical sizes in Poki Inspector | S | No breakage at 640×360 / 836×470 / 1031×580 |
| 7.2 | Cross-browser smoke test (Chrome, Firefox, Safari, iOS, Android) | M | All pass; no console errors |
| 7.3 | Incognito mode test — no crashes | S | localStorage failures handled gracefully |
| 7.4 | Performance pass — 60fps on mid-range mobile | M | Profile and optimise particle pool sizes |
| 7.5 | Run full pre-submission checklist (§12) | S | All 10 must-fix rules pass |
| 7.6 | Submit to Poki for Developers | S | Game uploaded to Inspector, review requested |

**Sprint 7 exit criteria:** Game is submitted to Poki. Ready for player-fit testing.

### 📊 Post-launch backlog (v1.1+)

**Cut from v1 launch — first content drop targets:**

| # | Idea | Notes |
|---|---|---|
| C3 | Beach Granny | 1,500★ unlock |
| C4 | Ninja Granny | 4,000★ unlock |
| C5 | GOLDEN GRANNY | 10,000★ hero unlock |
| C6 | Aqua Seeker gun | Tier 3, 2,500★ |
| C7 | Hydro Blaster gun | Tier 4, 10,000★ |
| C8 | Lightning Rod gun | Tier 5, 20,000★ |
| C9 | Ice Queen gun | Tier 5, 35,000★ |
| C10 | Neptune's Wrath gun | Tier 6, 60,000★ |
| C11 | MEGA CANNON | Tier 7, 100,000★ hero unlock |
| C12 | **Space Bubble world** 🧪 | Granny in a bubble, spinning through space, blasting objects — see note below. Requested by the user's kid, 2026-09-11 |

*(C1 Workshop world and C2 Disco world shipped into v1 launch scope 2026-09-11 — see §14 — and are no longer post-launch items.)*

**C12 note — this one is not like the others.** C1–C11 are new content on the existing 2D engine (art + data + a config entry). C12 asks for real 3D (Granny "spinning around" in a bubble, blasting objects in a 3D space) — Phaser 3 has no native 3D. Before this becomes a real sprint, it needs its own design/tech spike to pick one of:
- **Three.js/Babylon.js side-mode** — a genuinely 3D scene running alongside Phaser for this one world only, switched to like any other world. Biggest scope, most flexible, doubles the render-tech surface area of the whole project.
- **Pseudo-3D in Phaser** — a fixed-camera "bubble in a starfield" with parallaxed/scaled sprites simulating depth (objects grow as they approach, Granny's aim rotates 360° instead of the current left/right slide). Reuses everything — Spinner-style state machine, the water-hit loop, Frenzy — just with a different wall shape (a sphere-ish field instead of a flat grid) and a repainted background. Much closer to a reskin than a rebuild.
- **A genuinely separate mini-game/mode**, not sharing GameScene at all, built once the core game has shipped and there's room for an experiment.

Recommendation when this gets picked up: prototype the pseudo-3D route first — it's the only option that doesn't put a second rendering engine into an 8 MB budget game, and the "spinning in a bubble blasting things" feel is achievable without true 3D geometry (think Missile Command / Star Fox-style fixed-point aiming, not a free-roam 3D camera).

**Platform / retention features:**

| # | Idea | Notes |
|---|---|---|
| P1 | Daily challenges | Drives DAU |
| P2 | Cloud save via Poki Accounts SDK | Cross-device |
| P4 | Localisation (FR, ES, DE, PT, NL, BR) | After web-fit test passes |
| P5 | Seasonal Granny variants | Halloween, Christmas |
| P6 | Speedrun leaderboards | Poki Accounts |
| P7 | Additional grannies (Queen, Disco, Santa, Astro, Pirate, Cyber) | Content drops |
| P8 | A/B thumbnail tests | Built-in Poki tool |

---

## 14. Decisions Log

Open scope questions are closed. Recorded here for posterity and for Claude Code session context.

| Decision | Resolution | Date |
|---|---|---|
| Sprite art pipeline | Google Nano Banana (Gemini 2.5 Flash Image) — reference-image chain workflow per §8.3.1 | 2026-05-27 |
| Launch scope | 3 grannies, 6 guns, 1 world (Garden). All other content moves to post-launch C1–C11 | 2026-05-27 |
| Audio pipeline | Decision deferred until Sprint 4 start — see §9.3 for shortlist (royalty-free / Suno+Udio / commission / placeholder) | 2026-05-27 |
| Studio name | New name to be chosen specifically for this game — needed before Poki Developers profile creation (Sprint 7) | 2026-05-27 |
| Timeline | Focused 8–9 weeks, priority 1 project | 2026-05-27 |
| **World scope re-plan** | User asked ("I hope you will be building the different worlds... like in the prototype") whether to pull C1/C2/P3 into v1. Chose "add all 4 remaining worlds now": Workshop/Kitchen/Funfair/Disco ship in v1 alongside Garden, unlocked by vault stars (500★/1,000★/1,500★/2,000★) via a new 3rd SplashScene carousel. Brought obstacles (cat/umbrella/duck — previously an empty stub) and the Golden Spinner (previously spec'd but unwired) fully online as part of this, since Workshop/Kitchen need obstacles and Disco needs the Golden Spinner to mean anything. C1/C2/P3 struck from post-launch backlog accordingly. | 2026-09-11 |
| **Unlock-purchase flow** | Found live-testing the new world carousel: `UnlockManager.unlockGranny/unlockGun` existed and were unit-tested but were never called from any UI — tapping a locked item only ever showed an "earn more" toast, so grannies/guns (and the new worlds) had no real way to be purchased with vault stars outside the 0★ starter set and the gun rewarded-ad grant. Fixed for all three carousels: a tap now attempts an unlock-and-select, spending vault stars on success. | 2026-09-11 |
| **Granny pose re-plan** | ART_BRIEF.md's original 5-pose-per-granny spec (front/front_firing/3-quarter/side/back, a splash-carousel turnaround set) was written before §14's camera re-plan (player stands behind Granny). Delivered art ships 3 poses instead: `front` (carousel portrait only), `back`/`back_firing` (the only views gameplay ever needs, since her body never turns toward camera). See §8.1. | 2026-09-11 |
| **Audio approach** | Took §9.3's own option 4 (placeholder for v1), synthesised in Web Audio rather than sourced from loop packs. Reason: all four shortlisted paths blocked on the user's time or money, and the headline feature (§15, "the audio is the differentiator") was an empty stub in the meantime. 11 layers written to §9.3's brief verbatim — 96 BPM, 2.5 s bar, A minor — mixed per §9.1.1's each-spinner-is-an-instrument model. Zero asset-budget cost. Superseded the same day by the per-world themes row below — see that row for where the single voice set now lives. | 2026-09-12 |
| **Gun rotation via mechanical rotation, not re-prompting** | Tested asking Nano Banana to rotate a locked 0° gun image to 45° via text prompt — result was nearly identical to 0°, unreliable for precise angles. Switched to generating one locked 0° image per gun and mechanically rotating it through the other 7 angles with PIL (`Image.rotate`), with nozzle anchors computed automatically per angle (extremal alpha pixel along the aim direction) instead of hand-picked. Reliable and used for all 6 launch guns. | 2026-09-11 |
| **Per-world orchestra themes** | §9.3's single synthesised voice set (`orchestraVoices.ts`, one row above) played the same instruments in every world. Direct user request: "a different orchestra tune for each world... so there's lovely music to unlock in each world." Generalised §9.1.1's mixing model to a theme-agnostic slot system (`foundation` + `spinner0..spinner8` + `dropBass`) and wrote five distinct per-world instrument palettes matching each world's setting — birdsong in Garden, real four-on-the-floor disco in Disco, a metallic/steel-band feel in Workshop, and so on — under `src/audio/themes/`. `AudioOrchestra.start(worldId)` resolves the theme once per round instead of using one hardcoded voice set; `orchestraVoices.ts` deleted, fully superseded. | 2026-09-12 |
| **Splash-screen selector: thumbnail carousel over inset-arrow pill** | `CompactSelector.ts`'s Granny/Gun pills were first redesigned with inset arrows to fix a z-order bug — a component's own arrow calls happening before its opaque background was added meant arrows could paint under a neighbour's, hiding or misrouting clicks (caught live, twice, by direct user observation of missing arrows). Direct user feedback then asked for something more visual regardless: "let players scroll through a carousel of different thumbnails for guns and grannies... a more visual selector with the beautiful composite visual in centre." Replaced with `ThumbnailSelector.ts` — thumbnail + arrows on one row, name on its own row below, which also incidentally fixed a long-name text-clipping bug the inset-arrow layout had introduced. `CompactSelector.ts` deleted. | 2026-09-12 |
| **Live score tally during play** | Sprint 2 story 2.5 called for the score hidden during play, revealed only at game over. Direct user feedback reversed this: "I'm also not seeing a point and gold tally add up as I'm playing, I want to see that currency get earned and be excited about how much gold I'm earning." Added `ScoreCounter.ts` to HUDScene — an exponential catch-up counter with a gold-flash pop on each gain — running alongside, not replacing, the existing per-hit floating "+N ★" combat text and the GameOverScene count-up reveal. | 2026-09-12 |

**Remaining decisions blocking submission (not blocking dev):**
1. Studio name — needed by Sprint 7

---

## 15. The North Star

> **"Every decision should ask: does this get the player to Splash Frenzy faster, or does it slow them down?"**

The 6-year-old playtest gave us the design rule. Poki gives us the production rule:

> **Originality + Polish + Wholesome + Web-first.**

If a feature passes both filters, it ships. If not, it doesn't.

---

**Total estimated build time:** ~8 weeks of focused development from Sprint 0 start to Poki submission (revised down from 8.5 weeks with the cut scope).

**Next action:** Sprint 0, story 0.1 — scaffold the Vite + TypeScript + Phaser 3 project.
