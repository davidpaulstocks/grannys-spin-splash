# Granny's Spin Splash — Poki Edition

**Status:** Design validated → fresh production build (scope locked, ready for Sprint 0)
**Target platform:** [Poki](https://poki.com) (100M+ MAUs, hand-curated)
**Tech:** TypeScript + Vite + Phaser 3 (bundled, not CDN)
**Mode:** Single-player only
**Launch scope:** 3 grannies, 6 guns, 1 world (Garden). Other content moves to post-launch.
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
- **1 world**: Garden
- 8 spinner types (procedurally drawn)
- 5 power-ups
- 3 obstacles (cat, umbrella, duck)
- Layered ASMR audio orchestra
- Granny Gold Vault with unlock progression
- Splash Frenzy + mini-frenzies at 60% and 80%
- 30-second runs

### What v1 explicitly does not include
- ❌ Two-player mode
- ❌ Granddad character
- ❌ Workshop + Disco + Funfair + Kitchen worlds (post-launch)
- ❌ Beach Granny, Ninja Granny, GOLDEN GRANNY (post-launch)
- ❌ Aqua Seeker, Hydro Blaster, Lightning Rod, Ice Queen, Neptune's Wrath, MEGA CANNON (post-launch)
- ❌ Daily challenges, leaderboards, cloud save (post-launch)

---

## 2. Using the Prototype as a Reference

The prototype is open in another tab. Read it, don't port it. Specifically:

### Extract these data values verbatim into `src/data/*.ts`

| Value | Source location in prototype | Target file |
|---|---|---|
| Spinner stats (decay/power/stars/r/blades/style/colors) | `const ST = { … }` | `src/data/spinners.ts` |
| World configs (grid/types/obs/time) | `const WORLDS = { … }` | `src/data/worlds.ts` |
| Granny level thresholds | `const GRANNY_LEVELS = [ … ]` | `src/data/levels.ts` |
| Power-up effects | `const PU = { … }` | `src/data/powerups.ts` |

> **Correction (Sprint 1):** `game prototype/granny-spin-splash.html` — the actual prototype file in this repo — has no `WEAPON_DEFS` or `GRANNY_CHARS` constant. It's single-player with one default water gun and no granny selection; guns and the 3-granny roster are original v1 designs with no prototype source. `src/data/guns.ts` and `src/data/grannies.ts` carry placeholder gameplay numbers (cost/tier values are locked by CLAUDE.md §8.1/§8.2) — tune tank/drain/pump/interval/power once Sprint 2 story 2.8's playtest pass runs.

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
| 2 | **Under 8 MB initial download** | Projected ~4 MB — comfortable |
| 3 | **No external requests** — no Google Fonts, no CDNs, no jsDelivr | Bundle Phaser locally; bundle Fredoka WOFF2 locally |
| 4 | **Incognito support** — localStorage wrapped in try/catch | Single `SaveManager` class enforces this |
| 5 | **Desktop + mobile + tablet support** | Touch + mouse + keyboard |
| 6 | **No splash screens, outgoing links, studio logos** | No studio branding in-game |
| 7 | **No external ads** — only Poki SDK ads | |
| 8 | **No in-game purchase UI** for currency/ad-removal | Vault stars are earn-only |
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

A tiny old granny wields a custom water gun. The wall in front of her is covered in spinning targets — pinwheels, cogs, fans. Squirt them to make them spin faster. Get them all spinning at maximum simultaneously and trigger **SPLASH FRENZY!** — a 5-second bonus burst worth bonus stars.

**Round structure:** 30-second sprint. The clock is everything.

**Audio system:** as more spinners reach full speed, more musical layers fade in. By Frenzy, you're conducting a full orchestra. This is the headline feature.

**Progression:** stars earned go into a persistent Granny Gold Vault. Spend stars to unlock new grannies (skins) and new guns (mechanics). Splash screen has two carousels — pick your Granny, pick your Gun, press PLAY.

**Difficulty curve (v1):** Single world — Garden. Difficulty ramps via spinner density and decay rates across the 30-second run, not via world unlocks. Workshop and Disco move to post-launch content drops.

**Long-tail unlocks (post-launch):** GOLDEN GRANNY at 10,000★ vault. GRANNY'S MEGA CANNON at 100,000★. These exist to keep retention alive for weeks once added.

---

## 5. Visual Design System

The visual brief: **premium, kid-friendly, calm, confident**. Think Ghibli warmth × Apple polish × Animal Crossing comfort. Avoid: emoji clutter, busy backgrounds, mismatched fonts, harsh edges, over-decoration.

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
5. **No menus during play** — pause via gesture only
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
| **Two-finger tap** | Pause |

Move buttons at the **edges**, not the centre — leaves the entire middle as the aim/fire zone.

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

---

## 7. Project Architecture

### 7.1 Folder structure

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
├── public/                            # Static assets, copied to dist/
│   ├── fonts/
│   │   └── fredoka.woff2              # Bundled locally, NOT from Google
│   ├── thumbnail-static.png           # 512×384 — Poki required
│   ├── thumbnail-animated.webm        # 5s loop, no audio — Poki required
│   ├── sprites/
│   │   ├── grannies/                  # per-granny subfolder (ART_BRIEF.md, 2026-09-11) — 5 poses × 3 grannies = 15 files
│   │   │   ├── classic/
│   │   │   │   ├── front.png / front_firing.png   # 256×384, gameplay tier
│   │   │   │   └── three_quarter.png / side.png / back.png  # turnaround tier — carousel + Frenzy spin
│   │   │   ├── squirt/  … (same 5 filenames)
│   │   │   └── punk/    … (same 5 filenames)
│   │   ├── guns/
│   │   │   ├── pistol/
│   │   │   │   ├── 0.png 45.png 90.png 135.png
│   │   │   │   ├── 180.png 225.png 270.png 315.png
│   │   │   │   └── anchor.json        # nozzle XY per angle
│   │   │   └── … (12 guns × 8 angles = 96 files)
│   │   └── icons/
│   │       └── ui.svg                 # Single sprite sheet for all icons
│   └── audio/
│       ├── layer_01_bass.ogg          # Always playing
│       ├── layer_02_hihat.ogg
│       ├── … (12 stems total)
│       └── sfx/
│           ├── splash.ogg
│           ├── unlock.ogg
│           └── …
│
├── src/
│   ├── main.ts                        # Phaser config, SDK init, scene registration
│   ├── poki.ts                        # PokiSDK wrapper — single source of truth
│   ├── config.ts                      # Game constants, scale config
│   │
│   ├── scenes/
│   │   ├── BootScene.ts               # Loads assets, fires gameLoadingFinished
│   │   ├── SplashScene.ts             # Granny + Gun carousel, PLAY button
│   │   ├── GameScene.ts               # Main gameplay
│   │   ├── HUDScene.ts                # Overlay (timer, water bar, frenzy meter)
│   │   ├── PauseScene.ts              # ESC/2-finger pause overlay
│   │   └── GameOverScene.ts           # Score reveal, unlocks, Play Again
│   │
│   ├── objects/
│   │   ├── Granny.ts                  # Sprite-based player character
│   │   ├── Gun.ts                     # Sprite-based, 8-angle rotation
│   │   ├── Spinner.ts                 # Procedural Phaser.Graphics
│   │   ├── WaterParticle.ts           # Pooled particle
│   │   ├── PowerUp.ts                 # Floating pickup
│   │   └── Obstacle.ts                # Cat, Umbrella, Duck
│   │
│   ├── audio/
│   │   ├── AudioOrchestra.ts          # 12-layer ASMR mixing — CORE
│   │   ├── SFX.ts                     # One-shot sound effects
│   │   └── AudioBus.ts                # Master volume, mute, fade
│   │
│   ├── data/
│   │   ├── grannies.ts                # GRANNY_DEFS + unlock thresholds
│   │   ├── guns.ts                    # GUN_DEFS + unlock thresholds
│   │   ├── spinners.ts                # SPINNER_DEFS
│   │   ├── worlds.ts                  # WORLD_DEFS
│   │   ├── powerups.ts                # POWERUP_DEFS
│   │   └── levels.ts                  # GRANNY_LEVELS
│   │
│   ├── types/
│   │   ├── spinner.ts                 # SpinnerState enum, SpinnerDef, SpinnerStyle
│   │   ├── save.ts                    # SaveData v1 schema + migration types
│   │   ├── gun.ts                     # GunDef, AnchorJSON shape, GunTier
│   │   ├── granny.ts                  # GrannyDef
│   │   ├── world.ts                   # WorldDef
│   │   └── input.ts                   # AimResult, InputEvent union
│   │
│   ├── assets/
│   │   └── keys.ts                    # SPRITE_KEYS / AUDIO_KEYS / ICON_KEYS constants
│   │
│   ├── systems/
│   │   ├── SaveManager.ts             # localStorage with try/catch
│   │   ├── InputManager.ts            # Unified keyboard/mouse/touch
│   │   ├── UnlockManager.ts           # Vault, unlocks, progression
│   │   ├── FrenzyMeter.ts             # 60/80/100% thresholds
│   │   ├── ComboTracker.ts            # Combo timer + multiplier
│   │   └── AdManager.ts               # Wraps poki.ts with game logic
│   │
│   ├── ui/
│   │   ├── Button.ts                  # Reusable button factory
│   │   ├── Carousel.ts                # ◀ item ▶ pattern
│   │   ├── Toast.ts                   # Floating notification
│   │   ├── Banner.ts                  # FRENZY banner, level reveal
│   │   ├── WaterBar.ts                # Water tank UI
│   │   ├── TimerDial.ts               # Top-of-screen timer
│   │   └── FrenzyMeterUI.ts           # On-wall meter bar + dots
│   │
│   └── utils/
│       ├── math.ts                    # distance, clamp, lerp
│       ├── tween.ts                   # Common tween presets
│       └── colour.ts                  # Palette accessors
│
├── tools/
│   ├── budget-check.ts                # Asserts dist/ < 8 MB after build
│   ├── generate-thumbnail.ts          # Renders Poki thumbnails
│   └── sprite-optimise.sh             # pngquant over public/sprites/
│
└── tests/
    ├── unit/
    │   ├── SaveManager.test.ts
    │   ├── FrenzyMeter.test.ts
    │   └── ComboTracker.test.ts
    └── integration/
        └── ad-flow.test.ts            # SDK event ordering
```

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
| `BootScene.ts` | Load all sprites + audio, fire `PokiSDK.gameLoadingFinished()`, transition to SplashScene |
| `SplashScene.ts` | Display Granny + Gun carousels, PLAY button, rewarded ad option |
| `GameScene.ts` | Core gameplay loop — orchestrates systems |
| `HUDScene.ts` | Renders over GameScene — timer dial, water bar, frenzy meter |
| `PauseScene.ts` | Overlay on pause — Resume, Settings, Quit. Fires `PokiSDK.gameplayStop()` |
| `GameOverScene.ts` | Score count-up, level reveal, vault save, unlock shop, Play Again → `commercialBreak()` |

#### Objects (Phaser game objects)

| File | Responsibility |
|---|---|
| `Granny.ts` | Render selected granny sprite, handle movement, swap to firing pose, breath idle |
| `Gun.ts` | Render selected gun sprite at correct rotation angle (snap to 8 cardinals), expose nozzle position |
| `Spinner.ts` | Procedural spinner — state machine, decay, redraw on state change |
| `WaterParticle.ts` | Pooled — physics, collision check, splash on impact |
| `PowerUp.ts` | Floating pickup, collision, applies effect to GameScene |
| `Obstacle.ts` | Cat/Umbrella/Duck — block water, special behaviours |

#### Audio (the headline differentiator)

| File | Responsibility |
|---|---|
| `AudioOrchestra.ts` | Loads 12 OGG stems, starts all silent and synced, mixes via `gain.value` |
| `SFX.ts` | One-shot effects — splash, hit, unlock, frenzy, etc. |
| `AudioBus.ts` | Master mute, fade-out on ad break, fade-in on resume |

#### Data (no logic, pure config)

| File | Responsibility |
|---|---|
| `grannies.ts` | `GRANNY_DEFS: { id, name, spriteKey, unlockCost }[]` |
| `guns.ts` | `GUN_DEFS: { id, name, spriteKey, tier, cost, tank, drain, pump, interval, power, streams, sz, type }[]` |
| `spinners.ts` | `SPINNER_DEFS: { type, decay, power, stars, r, blades, style, colors }[]` |
| `worlds.ts` | `WORLD_DEFS: { id, name, bg, grid, types, obstacles, time, unlockThreshold }[]` |
| `powerups.ts` | `POWERUP_DEFS: { id, label, name, duration, effect }[]` |
| `levels.ts` | `GRANNY_LEVELS: { min, label, emoji, col, desc }[]` |

#### Types (shared interfaces, no runtime code)

| File | Responsibility |
|---|---|
| `spinner.ts` | `SpinnerState` enum (`STOPPED`/`SLOW`/`MEDIUM`/`FULL`), `SpinnerDef`, `SpinnerStyle` |
| `save.ts` | `SaveData` v1 schema, version tag for future migration |
| `gun.ts` | `GunDef`, `AnchorJSON` (angle → nozzle XY map), `GunTier` |
| `granny.ts` | `GrannyDef` |
| `world.ts` | `WorldDef` |
| `input.ts` | `AimResult`, `InputEvent` union (`fire`/`aim`/`move`/`pause`) |

#### Assets (string-key registry)

| File | Responsibility |
|---|---|
| `assets/keys.ts` | All asset string keys as `as const` objects — `SPRITE_KEYS`, `AUDIO_KEYS`, `ICON_KEYS`. No raw strings in `load.*()` or `setTexture()` calls anywhere in the codebase. |

#### Systems (game logic, no rendering)

| File | Responsibility |
|---|---|
| `SaveManager.ts` | All localStorage I/O — try/catch wrapped, JSON serialisation |
| `InputManager.ts` | Unified pointer/keyboard input, emits semantic events |
| `UnlockManager.ts` | Vault total, unlocked sets, validates unlock attempts, deducts gold |
| `FrenzyMeter.ts` | Watches spinner states, emits events for thresholds (60/80/100) |
| `ComboTracker.ts` | Combo counter, timer decay, multiplier calculation |
| `AdManager.ts` | High-level "show ad between runs" — handles audio muting, input disabling |

#### UI components (visual, no game logic)

| File | Responsibility |
|---|---|
| `Button.ts` | Primary/secondary/tertiary button factory — applies palette, radius, hover/press |
| `Carousel.ts` | Generic ◀ item ▶ — used for grannies, guns, settings |
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
3. **No magic numbers.** All constants live in `data/*.ts` or `config.ts`.
4. **One responsibility per file.** Spinner.ts doesn't talk to localStorage. SaveManager doesn't render.
5. **Data flows one way:** Systems → Scenes → Objects/UI. No backwards calls.
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
            │  Scenes  (BootScene → SplashScene →        │
            │           GameScene → GameOverScene)        │
            │   Orchestrates objects + systems            │
            └──────┬───────────────────┬─────────────────┘
                   │ adds to scene      │ adds to scene
        ┌──────────▼──────────┐   ┌─────▼──────────────┐
        │  Objects/           │   │  UI/ components    │
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
npm run thumbnail    # generates required Poki thumbnails
npm run optimise     # tools/sprite-optimise.sh — pngquant all sprites
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

Each character needs 5 poses (front standing/firing is what gameplay actually uses; the other 3 are a turnaround set for the splash-screen carousel and an optional Frenzy-trigger spin — left/right movement is a code-side horizontal flip, not separate art):
- **Front standing + front firing** — 256×384 px, transparent PNG
- **3/4 turn, side, and back — standing only** — 256×384 px, transparent PNG

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
- **Format:** PNG with alpha, optimised with `pngquant` (~25 KB per sprite)
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

The headline feature.

### 9.1 Concept

The soundtrack is **12 perfectly-synced musical layers** (stems). Each is a loopable bar at the same BPM, key, and length.

| Layer | Name | Triggers at |
|---|---|---|
| 1 | Bass + kick | Always playing |
| 2 | Hi-hat | First spinner reaches SLOW |
| 3 | Pluck | First spinner reaches MEDIUM |
| 4 | Bell | First spinner reaches FULL |
| 5 | Pad | 25% of spinners FULL |
| 6 | Arpeggio | 40% FULL |
| 7 | Vocal "oohs" | 55% FULL |
| 8 | Strings | 70% FULL |
| 9 | Brass swell | 85% FULL |
| 10 | Choir | Just before FRENZY |
| 11 | Drop bass | FRENZY peak |
| 12 | Cinematic hit | FRENZY one-shot |

Every spinner adds an instrument. By Splash Frenzy you're conducting a full orchestra. Stop firing and layers fade out — soothing, satisfying, ASMR.

### 9.2 Implementation pattern

```typescript
class AudioOrchestra {
  private layers: { source: AudioBufferSourceNode; gain: GainNode }[] = [];
  private bpm = 96;
  private barLength = 2.5;

  async init(ctx: AudioContext, buffers: AudioBuffer[]) {
    // 1. Load all 12 stems (same length, same BPM)
    // 2. Start them ALL silently at the same audio context time
    // 3. Loop forever — mixing via gain.value only guarantees perfect sync
  }

  updateMix(spinners: Spinner[]) {
    const fullCount = spinners.filter(s => s.state === FULL).length;
    const fullPct = fullCount / spinners.length;
    const targets = this._computeTargetVolumes(fullPct, spinners);
    this._smoothTo(targets, 250);  // 250ms gain tween
  }
}
```

### 9.3 Production

**Decision needed before Sprint 4 starts.** Google Gemini does not currently provide consumer-accessible music generation suitable for 12 perfectly-synced stems at matching BPM/key/length. Realistic v1 options, in order of recommendation:

1. **Royalty-free stem packs.** Splice, Loopcloud, or BBC Sound Effects archive. Hand-pick 12 loops at the same BPM and remix into matching keys with a free DAW (Reaper, GarageBand). Lowest cost, highest control. ~1–2 days work.
2. **Suno or Udio with stem extraction.** Generate a single ambient track at 96 BPM in A minor, then use AI stem separation (LALAL.AI, free tier) to pull out 4–6 layers. Repeat with different track variants to build up to 12. Quality is variable; iteration is fast.
3. **Commission via Fiverr/Soundbetter (~$300–800).** Highest quality, longest lead time (2–3 weeks).
4. **Placeholder audio for v1 launch.** Use 2–3 royalty-free loops only, ship the game, commission proper 12-stem pack as the first post-launch update.

Whichever path: format is **OGG Vorbis at 96 kbps mono** (~30 KB per stem), and the brief stays the same: *"Lo-fi ambient with watery percussion. Each layer must work alone and stacked. 96 BPM, 2.5s loop, key of A minor. Reference: Tycho, Helios, Boards of Canada, Animal Crossing soundtrack."*

---

## 10. Splash Screen Design

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

### 11.1 Ad placement plan

| When | Type | Rationale |
|---|---|---|
| First load → first input | none | Let SDK preload |
| Every 2nd run end → "Play Again" tap | `commercialBreak()` | Natural break |
| Run end → "Watch ad → 2× score" | `rewardedBreak({size:'medium'})` | Player-initiated |
| Mid-run → "Watch ad to refill water" | `rewardedBreak({size:'small'})` | When tank empty |
| End screen → "Unlock random gun" | `rewardedBreak({size:'large'})` | Acquisition |

### 11.2 SDK rules

```typescript
// ✅ CORRECT
async function onPlayAgainTap() {
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

- Vault stars **earned only through gameplay** — never purchasable
- Rewarded ads grant **content** (skins, unlocks, multipliers), never raw stars
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
| 5.2 | Build `Carousel.ts` reusable component | M | Used for both Granny and Gun selectors |
| 5.3 | Build `SplashScene` matching §10 mockup | M | Two carousels, PLAY button, vault display |
| 5.4 | Wire unlock thresholds to vault total | S | Locked items show cost + unlock at threshold |
| 5.5 | Add `rewardedBreak()` for random gun unlock | M | Random tier ≤ current grants only on success |
| 5.6 | Garden world only for v1 (no world-select scene) | S | First run starts in Garden; no unlock screen for additional worlds |
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
| 6.6 | Build `PauseScene` with ESC / two-finger trigger | M | Fires correct SDK events on pause/resume |

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
| C1 | Workshop world | Second world, unlocks at 500★ |
| C2 | Disco world | Third world, unlocks at 2,000★ |
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
| P3 | Funfair + Kitchen worlds | Expand world pool beyond C1/C2 |
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

**Remaining decisions blocking submission (not blocking dev):**
1. Studio name — needed by Sprint 7
2. Audio approach — needed by Sprint 4 start (week 4 of dev)

---

## 15. The North Star

> **"Every decision should ask: does this get the player to Splash Frenzy faster, or does it slow them down?"**

The 6-year-old playtest gave us the design rule. Poki gives us the production rule:

> **Originality + Polish + Wholesome + Web-first.**

If a feature passes both filters, it ships. If not, it doesn't.

---

**Total estimated build time:** ~8 weeks of focused development from Sprint 0 start to Poki submission (revised down from 8.5 weeks with the cut scope).

**Next action:** Sprint 0, story 0.1 — scaffold the Vite + TypeScript + Phaser 3 project.
