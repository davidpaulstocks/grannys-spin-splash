# Granny's Spin Splash — Poki Edition

**Status (2026-11-27):** Playable build. The **"Granny's Grand Tour" transformation** is largely built: the orchestra on real instruments, a ladder of eight gigs per venue, one coin currency, and a band for each of the five venues (Garden chamber orchestra, Kitchen jazz combo, Workshop garage rock, Funfair brass band, Disco funk band, each in its own room with its own fanfare and chimes). Built after David's play-test of 2026-11-26 (commits `b3aa058` to `4b4cd4e`): **magnetic aim** and faster water; a **venue strip on Home**; a **painted instrument** on every spinner (36 pictures); the **reward loop** (every spinning instrument throws coins, a groove multiplier you can lose, stars from the coin total, a "saving for" strip on Home); a **note fountain**; and **gun upgrade levels**. Built on 2026-11-27 after his morning play-test ("where's the jeopardy… can you lose?", "the end just suddenly finishes"; commits `ceda261` to `d2c87af`): **18 painted visitors** from a venue's first gig that replaced the fixed cat, umbrella and duck (coin **thieves** that steal from the gig total, **blockers** that silence two or three instruments, **treats**); **real jeopardy** (star targets raised to 0.8 / 3.0 / 6.0 of par, and a gig under one star is not passed: "Almost!" and TRY AGAIN); the **Big Finish** (at the whistle each instrument still playing takes a bow and pays a bonus, doubled for a full band, then the stars land on the wall); a **rebuilt results screen** (one layout, a NEW WORLD card, **"Double coins" removed**); **eighteen guns** in four rarities with a POWER rating, each firing its own projectile, with a full-screen reveal on purchase, a paged gun rack and upgrades bought only in the Shop; and a **band count-in** ("3, 2, 1, GO!") that opens every gig, after which **the water fires by itself**. Later the same day (commits `ca0d0ed` to `9d9fed9`): the **gun reveal became a short product film** (David asked for "a big impact moment… show it blasting" and then an "Apple-esque" reveal: a close-up pan along the gun with a sheen of light, a charge-up and muzzle burst at the nozzle in each gun's own style, a pull-back to a hero shot with the name, then the gun shrinks and fires its real projectile at target discs), with a large hero picture of each of the eighteen guns and a **SEE IT BLAST** preview of a gun not yet owned; **star targets now follow the gun a player is expected to hold**, and the balance bot plays visitors and was run over all five venues; a shot aimed at a visitor now flies over the instruments in the way (a blocker over the wall's outer columns could not be cleared before); and **Jam mode** (a venue's whole band with no timer, score, coins, stars or visitors, opened by passing its last gig). The wake/sleep framing is gone: the goal is to **keep the band playing**. **Not built:** the new-musician solo, true wind-down under a blocker (covered instruments are frozen and the wind-down is counted for them). The gun-on-Granny's-back idea is superseded: guns are held and turned in code. **Not confirmed by David:** he has not played or heard anything built on 2026-11-27 after his morning play-test: not the thieves, blockers, Big Finish, new results screen, gun reveal (either version), the eighteen guns and their projectiles, the count-in, auto-fire, the new star targets or Jam mode. It was checked in the browser by Claude only, with the sound off (a dev-only mute), and nothing from today was heard; the shark, ice, trident and Inferno projectiles were not looked at on screen at all. The 2026-11-26 batch (aim feel, urgency, reward loop, note fountain, per-band set pieces) is likewise unconfirmed. **Balance:** retuned on 2026-11-27 against the dev bot in all five venues (a child-speed bot passes 92% or more of runs on every gig; measurements and limits in `docs/REWARD_LOOP.md`); that is bot-measured, not human-tested, and a child-speed player cannot afford the expected guns from the Funfair onward without replaying (prices unchanged). **Other open items:** (the six original guns were repainted by David the same afternoon as `sheet-3-guns`, so all eighteen now share one style and one pipeline, and the fake-transparency checkerboard in two of the old tanks is gone; seen by Claude, not yet by him); the Disco's mirror-ball feature spinner is drawn as a grey checkered disc and reads like a missing picture. **Before Poki submission:** a rewarded-ad placement to replace "Double coins" has to be designed; `ADS_ENABLED` is still `false`; the two test links (`?venue=&gig=` and `?jam=`) must be removed and the studio name chosen. Not yet submitted to Poki — see `BACKLOG.md` for live status and submission blockers.
**Current plan of record:** [`docs/UPLIFT_PLAN.md`](docs/UPLIFT_PLAN.md) (the orchestra, juice and assessment phases), [`docs/ENGAGEMENT_DESIGN.md`](docs/ENGAGEMENT_DESIGN.md) (round structure, economy and navigation — **authoritative over §4 and §11 where they conflict**, except for scoring, stars, earning and prices), [`docs/REWARD_LOOP.md`](docs/REWARD_LOOP.md) (**authoritative for scoring, stars, coin earning, the groove, gun coin boosts and upgrade levels, and prices; it supersedes `ENGAGEMENT_DESIGN.md` §3's star rule and §4's earning table and prices**) and [`docs/BANDS.md`](docs/BANDS.md) (one musical style per venue). This file's other sections are the original spec; where it disagrees with the code, the code and those four docs win.
**Target platform:** [Poki](https://poki.com) (100M+ MAUs, hand-curated)
**Tech:** TypeScript + Vite + Phaser 3 (bundled, not CDN)
**Mode:** Single-player only
**Launch scope:** 3 grannies, 18 guns, 5 worlds (Garden, Workshop, Kitchen, Funfair, Disco). Other content moves to post-launch.
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
- **18 guns** (painted by David, one side-on picture each, turned in code to face the aim; ladder in `src/entities/gun/gun.data.ts`): Drip Pistol, The Squirter, Garden Hose, Bubble Blitz, Splash Jr, Hydro Blaster, Slime Slinger, Soaker 3000, Shark Soaker, Blizzard Blaster, Thunder Soaker, Inferno, Rainbow Rocket, Turbo Tornado, Dragon Drencher, Neptune's Trident, Galaxy Blaster and MEGA CANNON, in four rarities (common, rare, epic, legendary) with a POWER rating. Each multiplies coins (x1 up to x12) and fires its own projectile, and can be upgraded to level 5 with coins
- **5 worlds** (called *venues* since the 2026-11-25 redesign), opened by total stars earned as a rating (never spent): Garden (free), Workshop (12★), Kitchen (30★), Funfair (54★, moving targets), Disco (80★, frequent Golden Spinner). Each venue is a ladder of eight gigs — see §4 and `docs/ENGAGEMENT_DESIGN.md`
- 8 spinner types (procedurally drawn)
- 5 power-ups
- 18 **visitors** (`src/entities/visitor/`, painted by David): surprise blockers (park over two or three instruments), coin thieves (sit on one and steal from the gig total) and treats (fly across and pay when popped), each venue with its own cast, from the venue's very first gig. They replaced the fixed cat, umbrella and duck obstacles (2026-11-27)
- **Jam mode** — a venue's whole band with no timer, score, coins, stars or visitors, opened when its last gig has been passed (2026-11-27, §4)
- Golden Spinner — a timed bonus spawn (own lifetime, outside the grid), more frequent in Disco
- ASMR spinner orchestra on real instruments (§9)
- Coin bank (the "vault") for buying guns and grannies and upgrading guns (upgrades in the Shop only); stars are the gig rating, set by the gig's coin total
- Splash Frenzy when the whole band is at full speed at once (the 60% and 80% mini-frenzies were removed 2026-11-26; the 80% mark now only cues the music's lean-in)
- The groove: a x1 to x5 multiplier on every coin, lost when an instrument falls out of full speed
- 20 to 30 second gigs, opened by a band count-in and closed by the Big Finish

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
| 2 | **Under 8 MB initial download** | `npm run budget` checks `dist/`. About 5.8 MB at `dc38f8c` (about 2.19 MB under the cap; measured then, not re-measured since): art is WebP, the orchestra sprite is about 955 KB, Kitchen 363 KB, kit 200 KB, and the 36 painted instruments are about 0.6 MB; see `BACKLOG.md` and `docs/BANDS.md` §Size |
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
3. `PokiSDK.gameplayStart()` — **on first player input**, NEVER on scene load (since 2026-11-27: on GO of the count-in, which starts after a real click; a launch with no click shows TAP TO START first)
4. `PokiSDK.gameplayStop()` — on game over, pause, menu navigation
5. `PokiSDK.commercialBreak()` — between runs after intent shown
6. `PokiSDK.rewardedBreak({size:'medium'})` — optional reward boosts

All SDK calls go through `src/poki.ts`. No exceptions. Mute audio + disable input during ads.

### Quality bar

**Poki rejects:** low quality, AI-slop, unsafe content (violence/scary themes/gambling), IP clones, text-heavy UX.

**Poki loves:** originality, web-first design, polished presentation, wholesome family-friendly content, accessible controls.

---

## 4. The Game in One Page

> **Redesigned 2026-11-25.** The round structure, scoring and economy below were reworked in the "Granny's Grand Tour" transformation: each venue is a **ladder of eight gigs** (band sizes grow from a trio to the full wall, authored in `src/entities/world/gigs.data.ts`); **stars are the rating** (1–3 per gig, never spent) and **open venues**; **coins are the single currency** (the save's `vault`), earned in every gig and spent on grannies and guns; the old score rank ladder is gone. **`docs/ENGAGEMENT_DESIGN.md` is authoritative where it conflicts with this section.** Built so far: the gig ladder, star rating, results screen and coin economy (slice 1); Home, Tour map and Shop (slice 2 — the first screen is Home, or gig 1 on a first-ever launch); Granny's request and the daily gift (slice 3, part). **Scoring, stars, coin earning, the groove, guns and prices were reworked again on 2026-11-26 and are now governed by `docs/REWARD_LOOP.md`; the paragraphs below describe the current rules and point there for the numbers.**

> **The purpose the game communicates (rewritten 2026-11-26):** *keep the band playing — get as many instruments going at once as you can, and keep them going.* David on 2026-11-26: "I don't think waking the band is the right term… It's getting everything playing, create as much music as possible." Every spinner is a musician carrying a painted instrument; a spinning one plays and pays coins, a stopped one is quiet, and a spinner at full speed pays most. The words are **playing**, **quiet** and **full band**; the "asleep / awake" words and the drifting "z z z" are gone. Three things say it on screen: the HUD **score bar** (`src/ui/ScoreBar.ts`: the gig's coin total as the largest text on screen, a bar under it with a star at each of the three coin targets) with the **groove badge** (`src/ui/GrooveBadge.ts`: the x1 to x5 multiplier and a ring filling toward the next level), which replaced the band meter (`BandMeter.ts`, deleted); coins flying from each paying instrument to the counter (`CoinFountain.ts`); and a **YOUR GOAL** line (`src/scenes/game/GoalCard.ts`; since 2026-11-27 one line, "Keep the band playing!", on a small plate beside Granny while the count-in plays, leaving on GO) while the coin total each star takes stands in small type under that star on the score bar (the coin total, star bar and groove badge share one plate). An instrument about to drop out of full speed rocks side to side inside a pulsing Heat Orange ring, so the player can see which one needs them next.

A tiny old granny wields a custom water gun. The wall in front of her is covered in spinning targets — pinwheels, cogs, fans. Squirt them to make them spin faster. Get them all spinning at maximum simultaneously and trigger **SPLASH FRENZY!** — a 5-second bonus burst worth bonus stars.

**Round structure:** a *gig* — 20 to 30 seconds depending on its place on the ladder (20 s for gigs 1–2, 25 s for 3–4, 30 s for 5–8; `SECONDS_BY_GIG`). The clock is everything. Every 500 ms each spinning instrument pays coins by its speed (slow 1, medium 2, full 4), multiplied by the groove; stars are locked in as the gig's coin total passes three targets (`starTargets` in `gigs.data.ts`, shown on the goal card before the gig). One star passes the gig (a gig under one star is not passed: "Almost!" and TRY AGAIN); three takes a good run with the groove built up. Since 2026-11-27 the targets are 0.8 / 3.0 / 6.0 of "par" (the whole band at full speed all gig with no groove), and par is scaled by the coin boost of the gun a first pass is expected to hold at that gig (`FIRST_PASS_GUNS`, so buying the next gun early makes a gig easier) and by small per-gig and per-venue factors (the formula, constants and bot measurements are in `docs/REWARD_LOOP.md`), and the last ten seconds show "N to go!" for the next star. The whole band at full speed at once triggers Splash Frenzy, which adds a groove level and doubles coins for its window. The 60% / 80% / 100% star rule and the hit-streak combo of 2026-11-25 are gone (`docs/REWARD_LOOP.md`).

**Gig shape (2026-11-27):** every gig opens with a **band count-in** ("3, 2, 1, GO!" on the beat at the venue's tempo, `src/scenes/game/CountIn.ts`, `countInTiming.ts`); it starts by itself after any click, and a first-ever launch or the review link shows TAP TO START first. The clock, the pay tick, visitors and `poki.gameplayStart()` begin on GO, and **the water fires by itself** from GO (no click or hold; Space switches it off and on), so the player only aims. **Visitors** (`VisitorDirector`, `visitorSchedule`) come from a venue's first gig, whose first visitor is always a treat: **treats** pay coins when popped; **thieves** (cat, squirrel, seagull, pigeon) land on one instrument, silence it and steal coins from the gig total every half second until squirted off (they give the coins back) or about 6 s pass (they leave with them); **blockers** park over two or three instruments (never more than half of a small band), silence them and cost groove unless washed away with sustained water. At the whistle comes the **Big Finish** (`BigFinish.ts`, `bigFinishRules.ts`): each instrument still playing takes a bow from left to right and pays a bonus, doubled if the whole band is at full speed, then the stars land on the wall and the results screen opens. A shot fired while the aim is on a visitor flies over the instruments in the way and is tested only against visitors (`src/utils/shotLock.ts`), because a blocker parked over the wall's outer columns could not be reached otherwise. The numbers are in `docs/REWARD_LOOP.md`.

**Jam mode (2026-11-27, `JamScene.ts`, `src/scenes/jam/`, `JamTile.ts`):** a venue's whole band, laid out as its last gig lays it, with no timer, score, coins, stars or visitors and no way to fail; the instruments wind down at half the last gig's rate and hold full speed twice as long (`JAM_DECAY_FACTOR`, `JAM_HOLD_FACTOR` in `jamRules.ts`), Splash Frenzy still celebrates and pays nothing, and nothing is written to the save. It has a Home button and a button that cycles through the guns the player owns. A venue's Jam opens when its last gig has been passed with one star or more (`isJamUnlocked` in `Progress.ts`); there is a JAM button beside PLAY on Home, a tile on the Tour map, and a `?jam=<venue>` test link that bypasses the lock (to be removed before submission with the `?venue=&gig=` link). The owner has not played it.

**Audio system:** every spinner is a musician with a written part; spinning spinners bring musicians in, and squirting plays the instrument. By Frenzy, you're conducting a full band. This is the headline feature — see §9. Each note the band plays is also drawn (the note fountain, `src/scenes/game/NoteFountain.ts`): strings throw ribbons, brass bursts, drums rings, more as an instrument spins faster, gold in Frenzy, so what is heard and what is seen match.

**Progression:** coins earned go into a persistent bank (the "vault"). Spend coins on new grannies (skins) and guns (mechanics): there are eighteen guns costing 0 / 0 / 6,000 and rising to 2,000,000 (the ladder, with each gun's rarity, `coinBoost` from x1 to x12 and POWER rating, is in `gun.data.ts` and `docs/REWARD_LOOP.md`) and the Punk Granny costs 30,000 (`granny.data.ts`). Each gun multiplies every coin it earns and each owned gun can be **upgraded to level 5** **in the Shop only**: a level adds 15% of the gun's base coin boost and 8% fill power, and an upgrade costs the larger of 1,500 and 30% of the gun's price, doubling per level (`gunLevels.ts`, stored per gun in the save's `gunLevels`). Venues are not bought: they open at 0 / 12 / 30 / 54 / 80 total stars (`starsToOpen` in `world.data.ts`). Grannies and guns are bought in the Shop (`ShopScene.ts`, `GunShopping.ts`); buying a gun plays a full-screen reveal, a short product film (`GunReveal.ts`, `src/ui/reveal/`): from black, a close-up pan along the gun with a sheen of light, a charge-up and muzzle burst at the nozzle in the gun's own style, a pull-back to a hero shot with the name, then the gun shrinks and fires its real projectile at target discs, then POWER, the stat rows and USE IT / Later. **SEE IT BLAST** (on the Shop's gun card; the picture on the results card and Home's strip does the same) plays the film as a preview of a gun not yet owned, with BUY when it is affordable; guns far up the ladder stay a mystery (`scenes/shop/mystery.ts`). Home has one large PLAY, a row of five venue tiles to switch venue, and a "saving for" strip naming the next gun or granny not yet owned (never an upgrade, `Rewards.ts`); the results screen shows the same, a NEW WORLD card when the gig's stars open a venue, and its NEXT GIG goes straight into the next gig. A first-time star pays 200 coins (`COINS_PER_NEW_STAR`). Granny's request (one rolling mission at a time, `Missions.ts`, rewards 1,000 to 2,400 coins) pays coins, and a daily gift (`DailyGift.ts`, 800 coins plus 400 per consecutive day, growing for up to a week) rewards coming back. The tables and the reasoning are in `docs/REWARD_LOOP.md`; do not duplicate them here.

**Difficulty curve (v1):** authored per gig. Each venue's band grows over eight gigs (Garden 3 · 4 · 5 · 6 · 8 · 9 · 10 · 12; Workshop 4 → 15; Kitchen and Funfair 4 → 16; Disco 5 → 20, plus the mirror-ball feature spinner on the last gig). Instruments hold full speed for less time and wind down faster than before (2026-11-26: David asked for "a bit more of a rush to go back and re-spin it"), most of all in small bands, and visitors and moving targets arrive through the ladder (visitors from gig 1, two at once from gig 6). Across venues: Garden (12 spinners) → Workshop (15) → Kitchen (16) → Funfair (16, moving targets) → Disco (20, frequent Golden Spinner). The star targets were retuned on 2026-11-27 against the dev bot in all five venues (a child-speed bot passes 92% or more of runs on every gig; see `docs/REWARD_LOOP.md`), which is a measurement, not a human play-test; a child-speed player is short of the expected guns from the Funfair on (`BACKLOG.md`).

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
| **Mouse move** | Aim; the water goes to the instrument nearest the pointer (magnetic aim, below) |
| **Left click / hold** | Does nothing extra: the water fires by itself from GO (a click only starts the count-in when TAP TO START is showing) |
| **A / D** or **← / →** | Move Granny left/right |
| **Space** | Switch the automatic water off and on (accessibility) |
| **[** / **]** | Cycle weapon (only if unlocked) |
| **ESC** | Pause |

**Changed 2026-11-27:** the water fires by itself from GO of the count-in (`FireControl.ts`, `InputManager.isFiring`); the player only aims. Space remains as the accessibility toggle. Not heard or played by David.

**Aim assist (2026-11-26).** David: "the actual gameplay of aiming isn't very fun… quite hard work to reach the spinners at the top." The water now always goes to a musician: the **nearest instrument to the aim point, with no distance limit** (`resolveMagneticAim` in `utils/math.ts`; there are no dead gaps), and the current target is kept until another is nearer by 28 px (`AIM_MAGNET_MARGIN`) so the choice does not flicker between two. A ring shows what is targeted. A **mouse or trackpad** gets a **reach boost**: the aim point is the pointer pushed 1.3x away from the wall's bottom-centre (`AIM_REACH_GAIN`, `scaleAboutPivot`), so the top row needs less hand travel; touch stays 1:1 and shows no reticle. A power-up pickup near the aim point takes the aim before the magnet does. Water flies 1.6x faster (`WATER_SPEED_BOOST`) so it keeps up with the hand. None of this has been confirmed by David since it was built.

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
| **Touch or drag the spinner area** | Aim toward the touch point (the water fires by itself from GO) |
| **◀ / ▶ buttons** (bottom edges) | Move Granny |
| **Pause button** (visible, `ui/PauseButton.ts`) | Pause |

Move buttons at the **edges**, not the centre — leaves the entire middle as the aim/fire zone.

> **Changed 2026-09-12 (owner request):** the two-finger-tap pause gesture was removed — it paused the game by accident (any second touch) and was the direct cause of a run-soft-locking bug. Touch devices get a visible pause button (`ui/PauseButton.ts`, shown only where `ui/touchControls.ts` says the device has touch controls); desktop keeps ESC.

### 6.4 Auto-aim implementation (superseded 2026-11-26)

Generous snap radius — 96px desktop, scaled equivalent on mobile. Visual feedback: crosshair changes to Mint Green and grows slightly when snapped.

> **Superseded 2026-11-26:** the snap radius and the code below are the original spec. The game now uses the magnetic aim described under §6.2 (`resolveMagneticAim` in `src/utils/math.ts`), which has no radius limit. `resolveAim` and `AIM_SNAP_RADIUS` remain in the code.

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

> **Update 2026-11-26, revised 2026-11-27:** every gig opens with a one-line **YOUR GOAL** plate (`src/scenes/game/GoalCard.ts`): "Keep the band playing!"; the coin total each of the three stars takes stands under that star on the score bar. A count-in ("3, 2, 1, GO!") plays first. On a player's very first run, `TutorialSequence.ts` adds two captions tied to what just happened: "Point at an instrument to make it play!" ("Tap" on touch) at GO (with the ghost finger), and "Spinning instruments throw coins. Keep them all going!" the first time a spinner reaches FULL. (The 2026-11-25 wording, "Wake the whole band!" and "Squirt a sleepy musician to wake it up!", went with the wake/sleep framing.)

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
│   │   │   │   ├── 0.webp             # ONE side-on picture, nozzle pointing right; Gun.ts turns it in code (the eight pre-turned angle pictures were removed 2026-11-27)
│   │   │   │   ├── anchor.json        # the nozzle's {x, y} in picture pixels, found by `npm run guns`
│   │   │   │   └── hero.webp          # three times the size of 0.webp, same framing; loaded only when a gun reveal opens (`ui/reveal/HeroArt.ts`), left out of the start-up cap in `sprite-optimise.sh` (the whole-build budget still counts it); about 1 MB for the eighteen
│   │   │   └── … (18 guns, one folder each)
│   │   ├── worlds/                    # one illustrated background per world (WORLD_BACKGROUND_BRIEF.md, delivered 2026-09-11)
│   │   │   └── garden_bg.jpg / workshop_bg.jpg / kitchen_bg.jpg / funfair_bg.jpg / disco_bg.jpg
│   │   ├── instruments/               # The 36 painted instruments, one square WebP each, worn on the spinners (`INSTRUMENT_ART_BRIEF.md`; cut from David's sheets by `npm run instruments`)
│   │   ├── visitors/                  # The 18 painted visitors, one WebP each (cut from David's sheets by `npm run visitors`)
│   │   ├── ui/                        # splash-screen title lockup (delivered 2026-09-11)
│   │   │   └── wordmark.png / title_flourish.png
│   │   └── icons/
│   │       └── ui.svg                 # Single sprite sheet for all icons
│   └── audio/
│       ├── orchestra.mp3              # The instrument sprite (VSCO-2 CE, CC0) — built by `npm run samples`
│       ├── orchestra.json             # Sprite index: per-instrument sample offsets, measured pitch
│       ├── bands/                     # One extra sprite per non-orchestral band: kitchen.{mp3,json} (16 instruments, 363 KB) and kit.{mp3,json} (13 shared rhythm-section instruments, about 200 KB, used by Workshop and Disco)
│       └── sfx/                       # Currently empty — one-shots are synthesised
│
├── src/
│   ├── main.ts                        # Phaser config, SDK init, scene registration
│   ├── poki.ts                        # PokiSDK wrapper — single source of truth
│   ├── config.ts                      # Game constants, scale config
│   │
│   ├── dev/                           # Dev-only; loaded only when import.meta.env.DEV
│   │   ├── botSim.ts                  # The balance harness (window.__bot): plays gigs headless, far faster than real time
│   │   ├── botProfiles.ts             # CHILD / KEEN / EXPERT players
│   │   ├── botCases.ts                # The cases a venue run plays: the expected gun at each gig, and the gun two rungs above
│   │   ├── botVisitors.ts             # How the bot sees and shoos thieves, clears blockers and chases treats
│   │   ├── botHelpers.ts / botRandom.ts / botStats.ts / botTypes.ts  # Finish bonus and yielding, seeded randomness, the numbers it prints, its types
│   │   └── revealDebug.ts             # window.__revealGun(id, opts): opens the gun reveal for any gun without buying it
│   │
│   ├── scenes/
│   │   ├── BootScene.ts               # Loads assets, fires gameLoadingFinished; first-ever launch goes straight to Garden gig 1, otherwise to Home
│   │   ├── HomeScene.ts               # First screen for returning players: venue strip, Granny, next-gig card, "saving for" strip, one PLAY button; ALL GIGS and SHOP buttons, a JAM button once the venue's last gig is passed, the daily gift button
│   │   ├── TourScene.ts               # Venue/gig map: stars held, eight gig nodes with best ratings, a Jam tile per venue, locked venues say what they need
│   │   ├── JamScene.ts                # Jam mode: a venue's whole band, no timer, score, coins, stars or visitors (composes the pieces GameScene uses, minus the scoring ones)
│   │   ├── ShopScene.ts               # Grannies and guns bought with coins, gun card with level pips and BUY / UPGRADE (was SplashScene); DONE returns to Home, starts no gig
│   │   ├── GameScene.ts               # Main gameplay — now an orchestrator over the modules in game/
│   │   ├── HUDScene.ts                # Overlay (score bar with groove badge, timer, water bar, Frenzy rings)
│   │   ├── PauseScene.ts              # Pause overlay (ESC on desktop, visible button on touch)
│   │   └── ResultsScene.ts            # End of a gig: coin total and stars ("Almost!" and TRY AGAIN on a miss), a NEW WORLD card or what to save for next, the venue's path; NEXT GIG / Retry / Home. No rewarded option (replaced GameOverScene)
│   │
│   │   └── jam/                       # JamControls.ts (the JAM tag and the Home and gun-cycle buttons), jamRules.ts (the wall, the gentler wind-down and the gun cycle: pure, unit-tested)
│   │   └── results/                   # ResultsBackdrop.ts, resultsButtons.ts (the action row), resultsLayout.ts (where everything sits, pure numbers, unit-tested)
│   │
│   │   └── game/                      # What GameScene used to do itself (split out 2026-11-25; each file one concern)
│   │       ├── GigScore.ts            # Coins from the pay clock, stars locked in as the total passes each target (no Phaser dependency)
│   │       ├── RewardLoop.ts          # The in-gig reward loop from the scene's side: pay tick, groove, drop-out warnings, coin fountain
│   │       ├── CoinFountain.ts        # Pooled coins flying from each paying instrument to the HUD counter
│   │       ├── NoteFountain.ts        # Draws each note the band plays, in its section's colour and shape
│   │       ├── NoteEffects.ts         # Short-lived extras of the fountain: the fan on a squirt, drum strikes, hub rings, sparks
│   │       ├── NotePool.ts            # The fountain's one capped pool of reusable images
│   │       ├── noteFountainRules.ts   # What each section throws, how many notes get a visual (no Phaser, unit-tested)
│   │       ├── noteMotion.ts          # Where a fountain visual is, how big and how visible over its life (pure maths)
│   │       ├── MusicReactions.ts      # Spinner pulses on notes, musician names, the gig intro
│   │       ├── FrenzyController.ts    # SPLASH FRENZY from the scene's side: start, window, per-hit flourish
│   │       ├── PowerUpEffects.ts      # Active power-up windows and applying a pickup
│   │       ├── VisitorDirector.ts     # Decides when a visitor comes and which, owns the live ones, turns what happens to them into coins, groove drops and feedback
│   │       ├── CountIn.ts             # The band count-in "3, 2, 1, GO!" that opens every gig (and TAP TO START when nothing has been clicked); countInTiming.ts holds the numbers
│   │       ├── BigFinish.ts           # The ending on the wall at the whistle: each instrument still playing bows and pays; bigFinishRules.ts holds the rules (no Phaser)
│   │       ├── hudSnapshot.ts         # The per-frame payload GameScene hands the HUD
│   │       ├── WaterCollisions.ts     # Particles against visitors and spinners: power, splash, sound, Frenzy flourish (coins are not paid here)
│   │       ├── FireControl.ts         # Magnetic aim and its ring, mouse reach boost, gun, cannon (fires by itself from GO), pump cycle and jet hiss
│   │       ├── FirstRunGuide.ts       # First-run ghost finger and scripted captions
│   │       ├── GoalCard.ts            # The one-line YOUR GOAL plate beside Granny while the gig opens
│   │       ├── LevelUpFlair.ts        # Chanced extras on level-ups: spoken cheer, easter egg
│   │       ├── CountdownUrgency.ts    # Final-countdown tick and shake
│   │       ├── pauseHandlers.ts       # Pause and resume handlers, removed again on shutdown (shared by GameScene and JamScene)
│   │       ├── levelUpAccent.ts       # The accent a level-up plays (shared by GameScene and JamScene)
│   │       └── bankGig.ts             # Banks a finished gig into the save, builds the results payload
│   │   └── shop/
│   │       ├── GunShopping.ts         # The Shop's gun transactions: BUY / UPGRADE
│   │       ├── mystery.ts             # Which guns are still a silhouette with no preview (pure over the save)
│   │       ├── gunCardState.ts        # What the gun card says: next level before → after, or what a gun does and costs
│   │       ├── shopItems.ts           # The carousel items for grannies, guns and the venue on the stage
│   │       └── shopTitle.ts           # The Shop's backdrop and title
│   │
│   ├── entities/                      # one folder per game entity — its class, data, types, and renderer travel together
│   │   ├── spinner/
│   │   │   ├── Spinner.ts             # Procedural Phaser.Graphics state machine
│   │   │   ├── spinnerRenderers.ts    # Per-style draw routines (module-internal)
│   │   │   ├── InstrumentMount.ts     # A painted instrument on the spinner's hub: the disc turns behind it, it stays upright and bounces on its notes
│   │   │   ├── instrumentArt.data.ts  # Which instrument pictures have been painted and shipped (only these are loaded)
│   │   │   ├── mountGeometry.ts       # Pure maths of the mount: size, lean when stopped, bounce on a note
│   │   │   ├── instrumentBadge.ts     # The drawn badge, kept as the fallback for an instrument with no painting
│   │   │   ├── spinner.data.ts        # SPINNER_DEFS, state thresholds, Frenzy constants, instrument-mount constants
│   │   │   └── spinner.types.ts       # SpinnerState enum, SpinnerDef, SpinnerStyle
│   │   ├── granny/
│   │   │   ├── Granny.ts              # Sprite-based player character
│   │   │   ├── granny.data.ts         # GRANNY_DEFS + unlock thresholds
│   │   │   └── granny.types.ts        # GrannyDef
│   │   ├── gun/
│   │   │   ├── Gun.ts                 # Sprite-based: one picture turned in code to the aim
│   │   │   ├── gun.data.ts            # The eighteen-gun ladder (cost, coinBoost, rarity, POWER), GUN_ART_READY, the upgrade-level constants
│   │   │   ├── gunMechanics.data.ts   # How each gun shoots (tank, drain, interval, power, streams) and its projectile style
│   │   │   ├── gunLevels.ts           # Pure upgrade maths: the gun at a level, the cost of the next level
│   │   │   └── gun.types.ts           # GunDef, AnchorJSON shape, GunTier, GunRarity, ProjectileStyle
│   │   ├── world/
│   │   │   ├── world.data.ts          # WORLD_DEFS (incl. starsToOpen per venue)
│   │   │   ├── world.types.ts         # WorldDef
│   │   │   ├── gigs.data.ts           # The gig ladder: GIGS_PER_VENUE, band size / seconds / decay / moving targets per gig, and the star targets
│   │   │   ├── wallBuilder.ts         # Lays the wall out for the band size
│   │   │   └── worldBackgrounds.ts    # Painted backdrop registry + procedural fallbacks
│   │   ├── powerup/
│   │   │   ├── PowerUp.ts             # Floating pickup
│   │   │   └── powerup.data.ts        # POWERUP_DEFS
│   │   ├── visitor/                   # The 18 visitors (replaced the fixed cat, umbrella and duck obstacles, 2026-11-27)
│   │   │   ├── Visitor.ts             # What every visitor shares: slides in with a peek, wobbles when hit, tryBlock()
│   │   │   ├── BlockerVisitor.ts / BalloonsVisitor.ts / ThiefVisitor.ts / TreatVisitor.ts  # The kinds; createVisitor.ts builds the right one
│   │   │   ├── VisitorBody.ts         # The painted picture (or the drawn stand-in) and its swell, shrink and fade
│   │   │   ├── blockerCluster.ts / BlockerMeter.ts / sitterShadow.ts / theft.ts  # Where a blocker parks, its drain ring, a sitter's warning shadow, what a thief steals
│   │   │   ├── visitorSchedule.ts     # When a visitor comes and which (pure, unit-tested)
│   │   │   ├── visitor.data.ts        # Who they are, each venue's cast, VISIT_SCHEDULE
│   │   │   ├── visitorTuning.data.ts  # Every timing, size and payout of a visit (VISIT_MOTION, VISIT_PAY, SITTER_HITS, BLOCKER, THIEF)
│   │   │   ├── visitorArt.data.ts     # Which pictures are painted and shipped
│   │   │   └── visitor.types.ts / visitorDrawings.ts / classicDrawings.ts / treatDrawings.ts / drawKit.ts  # Ids and kinds, and the drawn stand-ins
│   │   └── waterParticle/
│   │       ├── WaterParticle.ts       # Pooled particle
│   │       ├── WaterCannon.ts         # Fire cadence, stream geometry, tank, pump
│   │       ├── WaterJet.ts            # Draws the shots as one tapering ribbon, in the gun's own projectile style
│   │       ├── fireDensity.ts         # How dense a gun's stream is and how far apart twin barrels sit (shared by the cannon and the reveal's demo range)
│   │       ├── impactPool.ts          # The one pool, capped at 120 pieces, for every impact extra (splash, each projectile's burst, sparks, confetti)
│   │       ├── projectiles/           # One renderer per projectile style (water, bubbles, slime, shark, ice, lightning, flame, rainbow, tornado, dragon, trident, laser, mega) and impacts.ts
│   │       └── splashVFX.ts           # Impact burst and ripple ring
│   │
│   ├── audio/
│   │   ├── AudioOrchestra.ts          # Real-time clock + game-facing orchestra API — CORE (§9)
│   │   ├── WaterSound.ts              # Spray / splash / droplet noise layer
│   │   ├── ResultsMusic.ts            # Star chimes on the results screen
│   │   ├── SFX.ts                     # Mechanical / menu one-shots kept outside the music
│   │   ├── AudioBus.ts                # Master volume, mute, fade
│   │   ├── orchestra/                 # Engine: Conductor, OrchestraGraph (with rooms), SampleBank, pattern, theory, setPieces, palette (who plays the set pieces), icons (instrument → painted picture), families, score.types
│   │   └── scores/                    # One written score per world + shared.ts + rooms.ts (the room each band plays in) + index.ts resolver
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
│   │   ├── Groove.ts                  # The groove: the x1–x5 multiplier, its ring, and the level lost when an instrument drops out (pure)
│   │   ├── Rewards.ts                 # "What are you saving for": the cheapest next gun, upgrade or granny, and the next locked venue (pure over the save)
│   │   └── AdManager.ts               # Wraps poki.ts with game logic
│   │
│   ├── ui/
│   │   ├── Button.ts                  # The button: a face on a lip, three sizes, gold `reward` look
│   │   ├── IconButton.ts              # Round version of the button carrying a drawn icon (home, retry, back)
│   │   ├── Panel.ts                   # The shared card, optional ribbon astride its top edge
│   │   ├── ScoreBar.ts                # HUD score bar: coin total, star bar with each target under its star, groove badge, "N to go!" (replaced BandMeter.ts)
│   │   ├── GrooveBadge.ts             # The groove badge: x1–x5 with a filling ring; shakes on a drop-out, gold JACKPOT in Frenzy
│   │   ├── ResultsScore.ts            # Results beat one: the coin total counting up, stars landing, NEW BEST
│   │   ├── NextRewardCard.ts          # Results beat two: the next thing to save for, a bar or a BUY button
│   │   ├── TourPath.ts                # Results beat three: the venue's eight gigs with stars, and the next venue at the end
│   │   ├── SavingForStrip.ts          # Home's "saving for" strip (the same reward as the results card)
│   │   ├── RewardParts.ts             # Shared pieces of the above: the picture of the gun or granny, the progress bar
│   │   ├── joinsLine.ts               # The line under NEXT GIG: who joins the band at the next gig
│   │   ├── VenueStrip.ts              # The row of five venue tiles along the bottom of Home
│   │   ├── VenueTile.ts               # One venue tile: backdrop thumbnail, name, stars held or padlock
│   │   ├── GunCard.ts                 # The Shop's gun card: five level pips, the perk in words, one BUY / UPGRADE button with its price and before → after
│   │   ├── GunRack.ts                 # The Shop's paged gun rack: rarity frames, POWER, silhouettes for guns far ahead; gunRarity.ts holds rarity colours and the POWER number
│   │   ├── GunReveal.ts               # The gun reveal, a product film, after a purchase or as a SEE IT BLAST preview (GunRevealRows.ts; gunPurchase.ts is the glue every purchase goes through)
│   │   ├── reveal/                    # The film's parts: filmMaths.ts (camera, pure), revealTiming.ts (beats, pure), FilmRig.ts, Sheen.ts, HeroArt.ts (loads the hero picture on demand), MuzzleBurst.ts / muzzleBits.ts / muzzleStyles.data.ts (the burst, one style per projectile), CloseUpFire.ts, HeroShot.ts, DemoRange.ts / DemoTarget.ts (the target discs), ImpactBeat.ts, RevealPanels.ts, RevealEnding.ts, RevealTracker.ts
│   │   ├── JamTile.ts                 # A venue's Jam on the Tour map: a JAM button, or a padlocked plate saying what opens it
│   │   ├── DailyGiftButton.ts         # Home's daily gift: a gold, breathing button only when there is a gift to take
│   │   ├── NewWorldCard.ts / NextVenueTile.ts / resultsLines.ts  # Results: the NEW WORLD card with GO THERE, the venue at the end of the path as a button, the words under the score
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
│   │   ├── noteShapes.ts              # The note fountain's drawn shapes (five notes, ribbon, ring, starburst, streak, spark), painted once into textures
│   │   ├── PauseButton.ts             # Visible pause control for touch devices (§6.3)
│   │   ├── StatPill.ts                # Icon + number readout pill (coins, stars)
│   │   ├── touchControls.ts           # Does this device get on-screen touch controls? (move buttons, pause button)
│   │   └── …                          # Plus ScoreCounter, FloatingText, UrgencyOverlay, LoadoutStage, ThumbnailSelector, tutorial and icon helpers — see `ls src/ui`
│   │
│   └── utils/
│       ├── math.ts                    # distance, clamp, lerp, pillRadius, resolveAim, resolveMagneticAim, scaleAboutPivot
│       ├── shotLock.ts                # What a shot may hit, decided when it is fired: a shot locked onto a visitor flies over the instruments (pure, unit-tested)
│       ├── tween.ts                   # Durations/easing constants
│       ├── colour.ts                  # Palette accessors + shade()
│       ├── typography.ts              # Fredoka type scale
│       ├── grid.ts                    # Even grid layout math
│       └── EventEmitter.ts            # Dependency-free pub/sub for Systems/ (no Phaser import)
│
├── tools/
│   ├── budget-check.ts                # Asserts dist/ < 8 MB after build (`npm run budget`)
│   ├── build-orchestra-samples.ts     # Builds each band's sprite from approved CC0 repositories (`npm run samples -- <band>`)
│   ├── bands/                         # <band>.manifest.json — which instruments and notes go in each sprite (orchestra, kitchen, kit)
│   ├── generate-thumbnail.ts          # Renders Poki thumbnails (run from the browser console — see its header)
│   ├── slice-instrument-sheet.py      # `npm run instruments` / `npm run visitors` / `npm run guns`: cuts David's JPG/PNG sheets into transparent pictures (sheets listed in instrument-sheets.json, visitor-sheets.json, gun-sheets.json); `npm run guns` also writes each gun's hero.webp, and `npm run guns -- --hero-only` writes only those
│   └── sprite-optimise.sh             # `npm run optimise`: converts PNGs dropped into public/sprites/ to WebP (verifies SSIM, lossless fallback, removes the source PNG); its start-up size cap leaves hero.webp out
│
└── tests/
    ├── unit/                          # SaveManager, FrenzyMeter, Groove, GigScore, Rewards, UnlockManager, AdManager,
    │                                  # Progress, Missions, gigs, gunLevels, gunLadder, gunStats, magneticAim, visitors, thievesAndBlockers, bigFinishRules, countIn, resultsLayout, jam, shotLock, impactPool, filmMaths, revealTiming, noteFountain, instrumentIcons, families, pattern, theory, scores, startRound, reviewLink
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
| `JamScene.ts` | Jam mode: a venue's whole band, no timer, score, coins, stars or visitors; Home and gun-cycle buttons; composes the modules in `scenes/game/` (wall, aim and fire, orchestra, note fountain, Frenzy, count-in, pause) without the scoring ones; rules in `scenes/jam/jamRules.ts` |
| `GameScene.ts` | Core gameplay loop — orchestrates systems and the modules in `scenes/game/`: the count-in, visitors, the reward loop, the Big Finish |
| `HUDScene.ts` | Renders over GameScene — score bar with groove badge, timer dial, water bar, Frenzy rings |
| `PauseScene.ts` | Overlay on pause — Resume, Settings, Quit. Fires `PokiSDK.gameplayStop()` |
| `ResultsScene.ts` | End of a gig (rebuilt 2026-11-27, one layout; the Big Finish has already played on the wall): the coin total counting up with the stars landing (and NEW BEST; "Almost!" and TRY AGAIN under one star), then ONE "what next" slot (a NEW WORLD card with GO THERE when these stars opened a venue, otherwise the next gun or granny not owned: a bar, or a BUY button when affordable, with a full-screen reveal on purchase), the venue's eight gigs as a path with the next venue as a button, who joins at the next gig, and the action row: NEXT GIG or TRY AGAIN (the only green button), Retry, Home. **No rewarded option** ("Double coins" removed). Starts the next round through `startRoundAfterAdGate()`; helpers in `scenes/results/` |

#### Entities (one folder per game entity — class + data + types + renderer together)

| Folder | File | Responsibility |
|---|---|---|
| `spinner/` | `Spinner.ts` | Procedural spinner — state machine, decay, redraw on state change |
| | `spinnerRenderers.ts` | Per-style draw routines (module-internal, not imported outside this folder) |
| | `spinner.data.ts` | `SPINNER_DEFS: { type, decay, power, stars, r, blades, style, colors }[]`, state thresholds, Frenzy constants, instrument-mount constants |
| | `InstrumentMount.ts` | The painted instrument on a spinner's hub: the disc turns behind it, it stays upright, bounces on its notes and leans when stopped |
| | `instrumentArt.data.ts` | Which instrument pictures have been painted and shipped; only these are loaded and mounted |
| | `mountGeometry.ts` | Pure maths of the mount (size, lean, bounce), unit-tested |
| | `spinner.types.ts` | `SpinnerState` enum (`STOPPED`/`SLOW`/`MEDIUM`/`FULL`), `SpinnerDef`, `SpinnerStyle` |
| `granny/` | `Granny.ts` | Render selected granny sprite, handle movement, swap to firing pose, breath idle |
| | `granny.data.ts` | `GRANNY_DEFS: { id, name, spriteKey, unlockCost }[]` |
| | `granny.types.ts` | `GrannyDef` |
| `gun/` | `Gun.ts` | Render the selected gun's one picture turned to the aim (mirrored top to bottom when pointing left), expose nozzle position |
| | `gun.data.ts` | The eighteen-gun ladder `GUN_LADDER` (`order, id, name, rarity, cost, coinBoost, powerRating`), `GUN_ART_READY` (a gun with no painted picture is left out of the game), `GUN_DEFS`, and the upgrade-level constants |
| | `gunMechanics.data.ts` | Per gun: `tier, tank, drain, pump, interval, power, streams, sz, type, projectile` — how it shoots and what its shots look like |
| | `gunLevels.ts` | Pure upgrade maths: the gun at a given level, the cost of the next level |
| | `gun.types.ts` | `GunDef`, `AnchorJSON` (the nozzle's pixel in the one picture), `GunTier`, `GunRarity`, `ProjectileStyle` |
| `world/` | `world.data.ts` | `WORLD_DEFS: { id, name, bg, grid, types, time, starsToOpen, … }[]` |
| | `world.types.ts` | `WorldDef` |
| | `gigs.data.ts` | The gig ladder: `GIGS_PER_VENUE`, `gigFor(world, index)`, `newMusicianCount` — band size, seconds, wind-down scale, hold time, moving targets per gig, and `starTargets` (0.8 / 3.0 / 6.0 of par) |
| | `wallBuilder.ts` | Lays out the wall for the gig's band size |
| `powerup/` | `PowerUp.ts` | Floating pickup, collision, applies effect to GameScene |
| | `powerup.data.ts` | `POWERUP_DEFS: { id, label, name, duration, effect }[]` |
| `visitor/` | `Visitor.ts` and kinds | The 18 visitors that replaced the fixed cat, umbrella and duck (2026-11-27): `BlockerVisitor` (parks over two or three instruments, silences them, takes water), `ThiefVisitor` (sits on one and steals coins), `TreatVisitor` (flies across, pays when popped), `BalloonsVisitor`; each exposes `tryBlock()` for water particles. `visitorSchedule.ts` decides when and which (pure), `visitor.data.ts` who and each venue's cast, `visitorTuning.data.ts` every timing and payout |
| `waterParticle/` | `WaterParticle.ts` | Pooled — physics, collision check, splash on impact |
| | `WaterCannon.ts` | Fire cadence, stream geometry, tank, pump refill |
| | `WaterJet.ts` | Joins the shots in flight into one tapering ribbon with a darker rim and bright core, drawn in the gun's projectile style |
| | `projectiles/` | One renderer per `ProjectileStyle` (water, bubbles, slime, shark, ice, lightning, flame, rainbow, tornado, dragon, trident, laser, mega) plus impact effects |
| | `splashVFX.ts` | Impact burst and ripple ring (throttled) |
| | `impactPool.ts` | The one pool, capped at 120 pieces, for every impact extra: splash, each projectile's burst, sparks, confetti; a piece that finds it busy is dropped |
| | `fireDensity.ts` | How dense a gun's stream is and how far apart twin barrels sit, shared by the cannon and the reveal's demo range |

#### Audio (the headline differentiator)

| File | Responsibility |
|---|---|
| `AudioOrchestra.ts` | Real-time clock and the game-facing orchestra API (§9) |
| `orchestra/` | Engine: `SampleBank`, `Conductor`, `OrchestraGraph`, `pattern`, `theory`, `setPieces`, `palette`, `icons`, `families`, `score.types` |
| `scores/` | One written score per world, `shared.ts` builders, `rooms.ts` (each band's room), `index.ts` resolver |
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
| `UnlockManager.ts` | Coin bank (the vault), unlocked sets, gun levels, validates purchases and upgrades, deducts coins |
| `Progress.ts` | Pure tour rules over `SaveData`: stars per gig, total stars, venue opening, `recordGig` (best coin total kept), `nextStop` |
| `startRound.ts` | The one gate that starts a round behind the between-runs commercial break (shared by Home PLAY and the results screen) |
| `FrenzyMeter.ts` | Watches spinner states, emits events for thresholds (60/80/100) |
| `Groove.ts` | The groove multiplier (1–5), its ring, and the level lost when an instrument drops out of full speed |
| `Rewards.ts` | The cheapest next purchase (gun, upgrade or granny) and the next locked venue, for the results screen, Home and the Shop |
| `AdManager.ts` | High-level "show ad between runs" — handles audio muting, input disabling |

#### UI components (visual, no game logic)

| File | Responsibility |
|---|---|
| `Button.ts` | Primary/secondary/tertiary button factory — applies palette, radius, hover/press |
| `Carousel.ts` | Generic ◀ item ▶ selector |
| `ScoreBar.ts` | HUD plate: coin total, bar with a star at each of the three targets and the coin each takes under it, groove badge beside it, "N to go!" in the last seconds |
| `GrooveBadge.ts` | The x1–x5 badge with a ring filling toward the next level |
| `VenueStrip.ts` / `VenueTile.ts` | Home's row of five venue tiles; a locked tile says how many stars it needs |
| `NextRewardCard.ts` / `SavingForStrip.ts` | "What now?" on the results screen and the same on Home: the next gun or granny not owned, never an upgrade |
| `GunCard.ts` | The Shop's gun card: level pips, perk in words, one BUY / UPGRADE button with its price and before → after |
| `GunRack.ts` / `GunReveal.ts` | The Shop's paged gun rack (rarity frames, POWER, silhouettes for guns far ahead) and the full-screen reveal, a short product film (close-up pan, muzzle burst, hero shot, the gun firing its real projectile at target discs, then the numbers), after a purchase or as a SEE IT BLAST preview; its parts are in `ui/reveal/` |
| `JamTile.ts` / `DailyGiftButton.ts` | A venue's Jam on the Tour map (a JAM button or a padlocked plate); Home's daily gift button |
| `NewWorldCard.ts` / `NextVenueTile.ts` | Results: the NEW WORLD card with GO THERE, and the venue at the end of the path as a button |
| `noteShapes.ts` | The drawn shapes of the note fountain |
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
| `math.ts` | `distance`, `clamp`, `lerp`, `easeOut`, `resolveAim`, `resolveMagneticAim`, `scaleAboutPivot`, etc. |
| `shotLock.ts` | What a shot may hit, decided when it is fired: a shot aimed at a visitor flies over the instruments and is tested only against visitors |
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
            │     Groove · Rewards · AdManager         │
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

### 8.2 Guns (eighteen, one picture each)

> **Superseded 2026-11-27.** The original spec below (six guns, eight angled pictures each, an `anchor.json` per angle, and the table of star unlocks) was replaced. There are now **eighteen guns** (David painted twelve more, two sheets, one picture each). Each gun ships **one** side-on picture with the nozzle pointing right (`public/sprites/guns/<id>/0.webp`) and one `anchor.json` with the nozzle's `{x, y}` in picture pixels; `Gun.ts` turns it in code, so the eight pre-turned angle pictures and the per-angle anchors are gone. `npm run guns` cuts the sheets (`tools/gun-sheets.json`, `_art_inbox/guns/`) and prints the ids to add to `GUN_ART_READY` in `src/entities/gun/gun.data.ts`; a gun not listed there is left out of the game. The ladder (order, price in coins, coin boost x1 to x12, rarity, POWER rating) is in `gun.data.ts` and set out in `docs/REWARD_LOOP.md`; how each gun shoots and looks is in `gunMechanics.data.ts`, with a drawn projectile per style in `src/entities/waterParticle/projectiles/`. Rarities are common, rare, epic and legendary. The guns are super-soaker power fantasies that get "bigger and more powerful"; **they are not music-themed** (David rejected music-themed guns on 2026-11-27). Not yet played or heard by David; the shark, ice, trident and Inferno shots were not looked at on screen. Each gun also has a large **hero picture** (`public/sprites/guns/<id>/hero.webp`, three times the size of `0.webp` with the same framing, 51 KB for the Drip Pistol and about 1 MB for the eighteen) cut by the same slicer (`npm run guns`; `npm run guns -- --hero-only` rewrites only the hero pictures, from the sheets or, for the six original guns, from `_reference/guns/<id>_0_raw.jpg`). It is loaded only when a gun reveal opens (`src/ui/reveal/HeroArt.ts`, which falls back to the small picture if it is late) and freed when the reveal closes; `tools/sprite-optimise.sh` leaves `hero.webp` out of its start-up sprite cap, but `npm run budget` still counts it in `dist/`. **Repainted 2026-11-27:** the six original guns (pistol, squirter, hose, splashjr, soaker3000, inferno) were repainted by David as `sheet-3-guns` in the style of the twelve new ones, replacing the older pictures (two of which had a fake-transparency checkerboard baked into the tank). The sheet came out with a seventh, spare blaster, which `tools/gun-sheets.json` skips with the id `_`; the hose's coil centre is made see-through by the slicer's `holes` option. Unlock costs are in coins, not the "★" figures in the table below.

**Original spec (history):** each gun: 8 angled sprites at 192×128 px, transparent PNGs, angles `0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°`, plus an `anchor.json` per gun declaring nozzle XY per angle.

| Tier | Unlock | Name | Visual cue |
|---|---|---|---|
| 1 | Start | Drip Pistol | Tiny plastic neon toy |
| 1 | Start | The Squirter | Classic '90s super-soaker |
| 2 | 200★ | Garden Hose | Coiled hose, brass nozzle |
| 2 | 500★ | Splash Jr | Two-handed kid blaster |
| 3 | 1,200★ | Soaker 3000 | Twin-barrel, retro-futuristic |
| 4 | 5,000★ | Inferno | Red flame-painted (fire weapon) |

**Post-launch content drops (original plan):** Aqua Seeker, Hydro Blaster, Lightning Rod, Ice Queen, Neptune's Wrath, MEGA CANNON (100,000★ hero unlock). Hydro Blaster, Neptune's Trident and MEGA CANNON are now on the ladder.

**Why these six (original):** covers tiers 1–4, gives two start guns + four unlocks.

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
| **Instruments** | `orchestra/SampleBank.ts` | Loads the orchestra sprite (`public/audio/orchestra.mp3` + `orchestra.json`), then one sprite per band after it (`BAND_SPRITES`, today `['kitchen', 'kit']`, from `public/audio/bands/`; each loads in the background and fails independently, and a score may mix its band's instruments with the orchestra's), decodes each with an `OfflineAudioContext` (allowed before any user gesture), slices per-note buffers, retunes by playback rate using each sample's *measured* pitch. Fire-and-forget from `BootScene`, never blocks play. |
| **Sprite builder** | `tools/build-orchestra-samples.ts` (`npm run samples`) | Reads `tools/bands/<band>.manifest.json` (`npm run samples` builds every bank, `npm run samples -- kit` one), downloads from the approved CC0 repositories only (`APPROVED_SOURCES` — VSCO-2 CE, VCSL and the Karoryfer repos; any other repository is refused) into `.cache/` (gitignored), trims, normalises, resamples to mono 32 kHz, measures real pitch (YIN), prepends a sync marker so notes land on the grid in every browser, packs one MP3 + JSON index. Needs `ffmpeg` and `lame` on PATH. Orchestra sprite: 37 instruments, 119 notes, about 955 KB; Kitchen sprite: 16 instruments, about 363 KB; `kit` sprite: 13 instruments (kick, snare, rimshot, hats, crash, toms, conga, electric bass, electric piano, clavinet), about 200 KB, from VCSL and the Karoryfer repositories. The orchestra bank writes `public/audio/orchestra.*`, any other bank `public/audio/bands/<bank>.*`. |
| **Conductor** | `orchestra/Conductor.ts` | Pure scheduling: given a sixteenth-note index, an audio time and each musician's charge, schedules exactly what plays. Knows nothing about clocks or game objects, so tests and offline renders drive it step by step. Also plays spray notes and stingers. |
| **Signal path** | `orchestra/OrchestraGraph.ts` | One fader and pan per musician, a generated hall reverb, a tone control that opens across the round (the last third sounds brighter, not just louder), and a limiter. Each band plays in its own room (`Room`, set per round with `setRoom`): a share of the hall reverb and an opening tone cutoff, so the Kitchen is a small club and the Disco a big ballroom. Built on `BaseAudioContext` so the same graph renders offline. |
| **Notation** | `orchestra/pattern.ts` | The small language every part is written in (token table below). |
| **Theory helpers** | `orchestra/theory.ts` | Pure chord, scale and pitch maths — chord parsing, stacked and windowed voicings, slash-chord bass, scale degrees, `isInScale`, playback-rate retuning. Unit-tested (`tests/unit/theory.test.ts`). |
| **Score types** | `orchestra/score.types.ts` | `Score`, `Part`, `Line`, `InstrumentId`. |
| **Set pieces** | `orchestra/setPieces.ts`, `orchestra/palette.ts` | The lean-in before Frenzy, the Frenzy fanfare, the closing chord and the feedback accents are written once as roles (the crash, the roll, the held chord, the rising call, the chime); each score's `palette` names the instruments that fill those roles, so a rock band's Frenzy lands on a kit and a guitar and the brass band's on snare, tuba and trombone. A score with no palette (Garden) gets the orchestra's. |
| **Scores** | `scores/{garden,workshop,kitchen,funfair,disco}.ts`, `scores/index.ts`, `scores/shared.ts`, `scores/rooms.ts` | One score per world, resolved by world id (an unknown id borrows Garden's). `shared.ts` holds the builders (`struck`, `held`, `line`) and the shared `drivingFinale` / `tuttiFrenzy` arrangements; `rooms.ts` holds the four rooms other than the Garden's hall. |
| **Game-facing API** | `AudioOrchestra.ts` | Owns the real-time clock (a 25 ms scheduler with 110 ms lookahead) and the API GameScene calls: `start`, `stop`, `finish`, `updateMix`, `setRoundProgress`, `onSpinnerHit`, `onFrenzyNear`, `onFrenzyStart`, `onFrenzyEnd`, `accent`, `tick`, `pollNotes`, `beatPhase`, `seatName`. |
| **Water** | `WaterSound.ts` | See §9.5. |
| **Results chimes** | `ResultsMusic.ts` | A chime note per star (a cymbal on the third) played straight from the instrument bank after the closing chord, on the instrument the gig's band names in its palette (the glockenspiel in the orchestra). |
| **One-shots** | `SFX.ts` | Only the mechanical and menu sounds deliberately kept *outside* the music. |
| **Master** | `AudioBus.ts` | Shared `AudioContext`, master volume, mute, fade (ads). Unchanged role. |

**A score** (`Score`) is a short real piece: a key (`tonic` + `mode`), `bpm`, an eight-bar chord progression, a `swing` amount, a quiet always-on `bed`, the `seats` (one written `Part` per musician, each with a stable `id`, a display `name`, an optional `light` version, `with` companion lines, an `ornament`, and a short percussive `spray` instrument for squirts), a `lineup`, the `finale` and `frenzy` lines, and optionally a `room` and a `palette` (below). Keys and tempos today: Garden G major 96 BPM, Workshop A minor 136 (straight eighths, a backbeat), Kitchen C major 116 (swung, triplet feel), Funfair F major 120 (oom-pah), Disco D minor 118 (four on the floor). A part can carry `drive` (0–1), which runs its seat through a guitar amp (a soft-clip waveshaper and speaker-cabinet filters in `OrchestraGraph`); that is how the clean recorded jazz guitar becomes the Workshop's rock guitars at no download cost. **Rooms** (2026-11-26, `scores/rooms.ts`, `OrchestraGraph.ts`), each against the hall's reverb: Garden is the hall itself; Kitchen a small club (half the reverb); Workshop a dry, bright garage (a quarter of the reverb, tone open at 7 kHz from the start); Funfair an open bandstand (two thirds); Disco a big glossy ballroom (1.2 times, tone open at 6 kHz). A score with no `room` plays in the hall.

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

1. **Spinning a spinner up brings its musician in — tiers, not just volume.** A spinner's charge (speed as a fraction of `MAX_SPINNER_SPEED`) is its fader. Below the MEDIUM threshold the musician plays the thinned outline of the part (`light`, by default only the notes that fall on a beat); from MEDIUM they play the full part (and any `with` companions); from FULL they add the `ornament`. A stopped spinner is silent. Let it wind down and the musician fades back out.
2. **Squirting plays the instrument, in its own voice.** Water landing on a spinner sounds that seat's instrument on the next sixteenth, stepping through the current chord (root, third, fifth, octave, fifth, third) in the part's own register. A held (bowed or blown) instrument answers in its own sustained voice, held about two and a half sixteenths; a struck one answers with its `spray` instrument if the score names one (a drum kit on its snare) and from `sprayFloor` if given (a bass an octave up). The first splash on a sleeping musician plays a **wake-up call** instead: a struck instrument runs up the chord (root, fifth, octave), a held one sings two notes, short then long. While water keeps landing on a spinner it holds the **spotlight** for 0.6 s: its musician is boosted and plays the whole written part, and the rest of the band ducks. At most one spray note per spinner per eighth and three per step across the wall, so a wide gun never clumps; once a musician is playing their own part the spray notes step back so the part stays the hero. (`Conductor.spray` / `wakeCall`; spotlight and wake-up pacing in `AudioOrchestra.onSpinnerHit`.)
3. **The round has a shape.**
   - **Finale:** from two-thirds of the round, driving spiccato strings, a timpani pulse and tambourine join regardless of wall state.
   - **Splash Frenzy:** a timpani roll and cymbal swell lean in when the wall is nearly full (`onFrenzyNear`); on the drop a fanfare lands (in the Garden: crash, bell tree, timpani, held horn, rising trumpet; every other band plays the same roles on its own instruments, see its `palette`) and the tutti plays for the whole window while every seat plays as if at full charge.
   - **Closing chord:** at the final whistle `finish()` lands a closing chord on the next beat and lets it ring instead of cutting the music dead.

### 9.4 Orchestra-voiced feedback

Level-ups, combos, pickups, golden spinners, refills and the cheer are played by the gig's own band (its `palette`, the orchestra's in the Garden) via `AudioOrchestra.accent()`: on the next sixteenth and in the current chord, so feedback is part of the score rather than a beep laid over it. The accents are `wake`, `spin`, `full`, `combo` (climbs the chord with the groove level; the name predates the groove), `powerup`, `golden`, `goldenMissed`, `refill` and `cheer`. The final-countdown `tick` is deliberately unquantised so it agrees with the on-screen clock.

### 9.5 The water sound layer

`WaterSound.ts` gives the water itself a sound, all shaped noise and sine so it costs no download: a continuous **spray** hiss while the cannon fires (its colour drifts slightly so it never sounds like a held tone), a soft **splash** where each shot lands (throttled, panned to where it lands) and an occasional rising **droplet**. It sits well under the orchestra — texture to be felt, not a layer to compete with the music.

### 9.6 Fallback

If the sprite fails to load, `SampleBank` falls back to a plain synthesised pluck for every note: the game is never silent and never waits on audio.

### 9.7 Bands per venue

The engine separates the mechanic (each spinner is a musician with a written part) from the style (which recordings, which score). A new band is a new score plus a new set of recordings — no engine change. The per-venue plan (Garden chamber orchestra, Kitchen jazz combo, Workshop garage rock, Funfair fairground band, Disco funk/disco), the sample sources and the size budget live in **`docs/BANDS.md`**; do not duplicate them here. Status today (2026-11-26): all five bands are built, each in its own room and with its own set pieces (see §9.2). **Garden** (chamber orchestra) is the reference. **Kitchen** is a jazz combo (C major, 116 BPM, swung; walking bass, ride, piano and tenor sax as the opening quartet, then brushes, vibraphone, guitar, muted trumpet and the rest). **Workshop** is a garage rock band (A minor, **136 BPM** since 2026-11-26, straight eighths, 15 seats; a backbeat of kick, a hard snare on two and four and eighth-note hats, palm-muted power chords, bass locked to the kick and a pentatonic lead hook; **drums, bass, rhythm guitar and lead guitar** first, then organ, tambourine, claps, cowbell, toms, cymbals, anvil, and the soft piano, sax, horns and clean guitar last). **Funfair** is a fairground brass band (F major, 120 BPM, oom-pah, 16 seats, no strings: tuba, clarinets, fairground organ and snare first). **Disco** is a funk/disco band (D minor, 118 BPM, four on the floor, 21 seats: bass guitar, kick, hi-hats and rhythm guitar first, the mirror ball last). Scores are `src/audio/scores/<venue>.ts`. Workshop and Disco share the `kit` rhythm-section sprite. **The set pieces (lean-in, fanfare, closing chord), the feedback accents and the results chimes are now per band** (a `palette` on each score; Garden keeps the orchestral one). Funfair's frenzy line is still the shared `tuttiFrenzy` arrangement, though its fanfare and chimes use the brass band's palette. All three sample sources were approved 2026-11-25: VCSL and the Karoryfer repositories verified CC0 from their LICENSE files, VSCO-2 CE already in use; FreePats is not yet re-checked at source and not yet used.

### 9.8 Verification

Unit tests cover the notation, theory helpers and scores (scores stay in key in every tier, add music as musicians join the mix, seat every spinner in every world). Offline renders check peak, RMS and clipping. **Limit stated plainly: we can measure audio but not hear it.** David listened on 2026-11-25: "the music sounds good, sounds really delightful". His one note was that hitting a spinner did not obviously play that instrument, and that spinners looked unrelated to instruments; the wake-up call, spotlight, louder squirt notes and section badges (commit `149d0ea`) answer that and are awaiting his second listen. His second note was that the instruments were "different tones of the same sound" and not distinct enough; commit `9707eee` answers it (each held instrument answers a squirt in its own sustained voice, the wake-up call and a stronger spotlight) and `f04ef3c` added the three new bands (offline renders put every band within the Garden's loudness range with no clipping; full-band RMS Garden 0.189, Workshop 0.165, Disco 0.176, Funfair 0.158). **On 2026-11-26 David confirmed the instruments are now "distinct enough"; he has given no notes yet on the Workshop, Funfair and Disco bands themselves.** **2026-11-26 audio changes, none yet heard by David:** rooms per band, per-band set pieces and chimes, and the reworked Workshop (136 BPM, new line-up order). Offline renders (commit `b409eaf`): Workshop's opening four 0.142 RMS against the Garden's 0.144, full band 0.166, Frenzy 0.207, no clipping; the other venues unchanged. The balance bot played gig 1 of every venue through Frenzy with no errors. His request behind them: "Could the rock band sound more rocky?"

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

> **Redesigned 2026-11-25.** The economy changed after this section was written: **coins are the single currency** (the save's `vault`), earned in every gig and spent on guns and grannies; **stars are the rating** (never spent) and open venues; the results screen is the "end screen" for ad purposes. Prices today (rescaled 2026-11-26 to the new coin totals): the old six-gun ladder of 0 / 0 / 6,000 / 20,000 / 60,000 / 200,000 coins was replaced on 2026-11-27 (see below); each owned gun can also be upgraded to level 5, the first upgrade costing the larger of 1,500 and 30% of the gun's price and doubling per level (`gunLevels.ts`). Earning and prices are set out in `docs/REWARD_LOOP.md`, which is authoritative for them. **"Double coins" at results was removed on 2026-11-27** (David: "how have I earned that?"), so the results screen has no rewarded option; a replacement placement has to be designed before submission. The planned "more time once per failed gig" and "try a locked gun for one gig" are not built; today the only rewarded option is the Shop's "free gun" ad, which draws from guns of tier 3 or below (never epic or legendary). Prices today: eighteen guns from 0 to 2,000,000 coins (ladder in `gun.data.ts`, `docs/REWARD_LOOP.md`) and the Punk Granny 30,000. **`docs/ENGAGEMENT_DESIGN.md` §4 and §6 are authoritative where they conflict.** The Poki rules in §11.2–11.4 are unchanged. `ADS_ENABLED` is still `false` for testing and must be `true` before submission (`BACKLOG.md`).

### 11.1 Ad placement plan

| When | Type | Rationale |
|---|---|---|
| First load → GO of the first count-in | none | Let SDK preload; `gameplayStart()` fires on GO after a real click, never on scene load |
| Every 2nd round start (NEXT GIG / PLAY AGAIN / PLAY) | `commercialBreak()` | Natural break; one shared gate, `systems/startRound.ts` |
| ~~Results screen → "Double your coins"~~ | ~~`rewardedBreak({size:'medium'})`~~ | Removed 2026-11-27; a replacement is to be designed |
| ~~Mid-run → "Watch ad to refill water"~~ | ~~`rewardedBreak({size:'small'})`~~ | Never built |
| Shop → "Watch an ad for a free gun" | `rewardedBreak({size:'large'})` | Acquisition (in the Shop, not the results screen) |

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
- Rewarded ads grant **content** (skins, unlocks, multipliers). *Note:* "Double your coins" re-added the gig's coins as a multiplier and was removed on 2026-11-27; any replacement must be checked against Poki's reading of "never raw currency"
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
| **Gun rotation via mechanical rotation, not re-prompting** *(superseded 2026-11-27: one picture per gun, turned in code; the eight pre-turned pictures are gone)* | Tested asking Nano Banana to rotate a locked 0° gun image to 45° via text prompt — result was nearly identical to 0°, unreliable for precise angles. Switched to generating one locked 0° image per gun and mechanically rotating it through the other 7 angles with PIL (`Image.rotate`), with nozzle anchors computed automatically per angle (extremal alpha pixel along the aim direction) instead of hand-picked. Reliable and used for all 6 launch guns. | 2026-09-11 |
| **Per-world orchestra themes** | §9.3's single synthesised voice set (`orchestraVoices.ts`, one row above) played the same instruments in every world. Direct user request: "a different orchestra tune for each world... so there's lovely music to unlock in each world." Generalised §9.1.1's mixing model to a theme-agnostic slot system (`foundation` + `spinner0..spinner8` + `dropBass`) and wrote five distinct per-world instrument palettes matching each world's setting — birdsong in Garden, real four-on-the-floor disco in Disco, a metallic/steel-band feel in Workshop, and so on — under `src/audio/themes/`. `AudioOrchestra.start(worldId)` resolves the theme once per round instead of using one hardcoded voice set; `orchestraVoices.ts` deleted, fully superseded. | 2026-09-12 |
| **Splash-screen selector: thumbnail carousel over inset-arrow pill** | `CompactSelector.ts`'s Granny/Gun pills were first redesigned with inset arrows to fix a z-order bug — a component's own arrow calls happening before its opaque background was added meant arrows could paint under a neighbour's, hiding or misrouting clicks (caught live, twice, by direct user observation of missing arrows). Direct user feedback then asked for something more visual regardless: "let players scroll through a carousel of different thumbnails for guns and grannies... a more visual selector with the beautiful composite visual in centre." Replaced with `ThumbnailSelector.ts` — thumbnail + arrows on one row, name on its own row below, which also incidentally fixed a long-name text-clipping bug the inset-arrow layout had introduced. `CompactSelector.ts` deleted. | 2026-09-12 |
| **Live score tally during play** | Sprint 2 story 2.5 called for the score hidden during play, revealed only at game over. Direct user feedback reversed this: "I'm also not seeing a point and gold tally add up as I'm playing, I want to see that currency get earned and be excited about how much gold I'm earning." Added `ScoreCounter.ts` to HUDScene — an exponential catch-up counter with a gold-flash pop on each gain — running alongside, not replacing, the existing per-hit floating "+N ★" combat text and the GameOverScene count-up reveal. | 2026-09-12 |
| **Wake/sleep framing dropped ("keep the band playing")** | David: "I don't think waking the band is the right term… It's getting everything playing, create as much music as possible." The 2026-11-25 words (asleep, awake, the "z z z", the band meter counting musicians awake) were removed everywhere; the goal is now to keep the band playing, with the words playing, quiet and full band. The band meter was replaced by the score bar and groove badge (see the reward loop row). | 2026-11-26 |
| **Painted instruments on the spinners** | David found the drawn instrument badges "pretty unconvincing". Each spinner now wears a painted instrument on its hub (the disc turns behind it, the instrument stays upright and bounces on its notes). David painted 36 pictures from Nano Banana sheets (`INSTRUMENT_ART_BRIEF.md`), cut by `npm run instruments` into `public/sprites/instruments/` (about 0.6 MB); every seat in every venue has one, and the drawn badge remains only as a fallback. | 2026-11-26 |
| **Magnetic aim, reach boost and faster water** | David: "the actual gameplay of aiming isn't very fun… it's quite hard work to reach the spinners at the top." The water now goes to the nearest instrument with no distance limit (kept until another is 28 px nearer); a mouse gets a 1.3x reach boost about the wall's bottom-centre, touch stays 1:1; water flies 1.6x faster. Supersedes §6.4's snap radius. Instruments also hold full speed for less time and wind down faster, since the quicker aim makes that affordable. | 2026-11-26 |
| **The reward loop: coins, groove, score-based stars** | David, after playing: no visible reward, "at the end it says full band, three stars, but you get that every time", and "where is the jeopardy… how do you play it badly?" Every spinning instrument now throws coins to one large counter (1 / 2 / 4 per half second by speed); the groove multiplier (x1 to x5) builds while the band is kept going and drops when an instrument falls out of full speed; stars come from the coin total against three targets shown before the gig, not from the share of the band at full; the hit-streak combo and the 60% / 80% mini-frenzies were removed; the results screen became three beats (score, what to save for, the path) and Home gained a "saving for" strip. Prices, missions, the daily gift and the first-star bonus were rescaled to the new coin totals. Specified in `docs/REWARD_LOOP.md`. Bot-tested on Garden only; not yet played by David. | 2026-11-26 |
| **Note fountain: music you can see** | David: "more animations with procedurally generated music notes… match the visual feedback with the audible feedback." Each note the band plays now throws a drawn visual from its instrument, in its section's colour and shape (ribbons for strings, bursts for brass, rings for drums), more as the instrument spins faster, a fan on the squirted one and gold in Frenzy. `NoteGlyph.ts` was deleted. | 2026-11-26 |
| **Gun upgrade levels** | David: "We probably also need lots more guns." Painting more guns costs art time, so each of the six guns can instead be upgraded to level 5 with coins (each level adds 15% of its base coin boost and 8% fill power; the cost is the larger of 1,500 and 30% of the gun's price, doubling per level), giving about thirty purchases with no new art, the first within reach after one gig. More painted guns are still wanted and not built. | 2026-11-26 |
| **Rooms and per-band set pieces** | David asked "could the rock band sound more rocky?" and approved giving each band its own fanfare, closing chord and chimes. Each band now plays in its own room (Kitchen a small club, Workshop a dry garage, Funfair a bandstand, Disco a ballroom, Garden the hall); the Frenzy lean-in, fanfare, closing chord, accents and results chimes are written as roles that each score's `palette` fills with its own instruments; Workshop was reworked at 136 BPM with a backbeat and power chords. Measured by offline renders, not yet heard by David. | 2026-11-26 |
| **Visitors** | After his 2026-11-26 play-test the fixed cat, umbrella and duck were replaced by 18 surprise visitors painted by David (`src/entities/visitor/`, `ceda261`): blockers, sitters and treats, each venue with its own cast. Not played by David. | 2026-11-27 |
| **Real jeopardy and a gig you can fail** | David, after playing on 2026-11-27: "where's the jeopardy… can you lose?" Sitters became coin thieves (they steal from the gig total each half second, give it back if squirted off, leave with it after about 6 s); blockers park over two or three instruments, silence them and need sustained water; a groove drop shows at the badge; star targets rose to 0.8 / 3.0 / 6.0 of par and a gig under one star is not passed ("Almost!", TRY AGAIN) (`cd20e22`). Specified in `docs/REWARD_LOOP.md`. Not played by David. | 2026-11-27 |
| **The Big Finish** | David: "the end just suddenly finishes." At the whistle each instrument still playing takes a bow and pays a bonus (doubled for a full band), then the stars land on the wall and the results screen opens; "N to go!" chases the next star in the last ten seconds (`BigFinish.ts`, `bigFinishRules.ts`). Not played or heard by David. | 2026-11-27 |
| **"Double coins" removed from results** | David, on the results screen: "how have I earned that?" The rebuilt results screen has one layout, a NEW WORLD card, a failed gig that says "Almost!", and no rewarded option; a replacement rewarded-ad placement is still to be designed before Poki submission. | 2026-11-27 |
| **Guns are super-soaker power fantasies, not music-themed** | David rejected music-themed guns: "they're meant to be more like super soaker vibes, getting bigger and more powerful." Every gun fires its own projectile, in four rarities with a POWER rating. | 2026-11-27 |
| **Eighteen guns from one picture each** | David painted twelve more guns (two sheets, `npm run guns`) on top of the six; each ships one picture turned in code, replacing the eight pre-turned angle pictures and per-angle anchors; the ladder, prices and rarities are in `gun.data.ts` and `docs/REWARD_LOOP.md`; the Shop has a paged rack and buying a gun plays a full-screen reveal (`1e5da49`). Supersedes the six-gun rows above. The shark, ice, trident and Inferno projectiles were not looked at on screen. Not played by David. | 2026-11-27 |
| **Visitors from the first gig** | David: "you only get one chance to make it fun from the beginning." Visitors come from a venue's first gig, whose first visitor is always a treat, and a blocker never hides more than half of a small band (`dd6b821`). | 2026-11-27 |
| **Count-in and auto-fire** | Every gig opens with a band count-in "3, 2, 1, GO!" on the beat that starts by itself after any click; a first-ever launch and the review link show TAP TO START first; the clock, pay, visitors and `poki.gameplayStart()` begin on GO, and the water fires by itself from GO (Space toggles it) (`d2c87af`). Heard by nobody: the dev build was muted. | 2026-11-27 |
| **The gun reveal is a product film** | David asked for "a big impact moment… show it blasting", then for "an Apple-esque" reveal: "start with the gun even bigger… pan across the whole of the gun… when you reach the nozzle, show it blasting, and then it shrinks down." The reveal (`GunReveal.ts`, `src/ui/reveal/`, `ca0d0ed`, `29fb6cf`, `9d9fed9`) is now a short film: from black, a close-up pan along the gun with a sheen of light, a charge-up and a muzzle burst at the nozzle in each gun's own style, a pull-back to a hero shot with the name, then the gun shrinks and fires its real projectile at target discs, then POWER, the stat rows and USE IT / Later. Each gun has a large hero picture (`hero.webp`, three times the in-game size, about 1 MB for the eighteen), loaded only when a reveal opens and left out of the start-up size cap (the whole-build budget still counts it). SEE IT BLAST previews a gun not yet owned from the Shop's gun card, the results card and Home's strip; guns far up the ladder stay a mystery. Checked by Claude in the browser with the sound off; not seen by David. The six older guns were repainted the same day (`sheet-3-guns`), which removed a fake-transparency checkerboard two of them showed in the reveal. | 2026-11-27 |
| **Star targets follow the gun a player is expected to hold** | After 2026-11-27's jeopardy changes the targets (0.8 / 3.0 / 6.0 of par) followed the guns only through a per-venue gain (1 / 1.25 / 1.6 / 2 / 2.6) that nobody had measured. Par is now also multiplied by the coin boost of the gun a first pass is expected to hold at that gig (`FIRST_PASS_GUNS`), a per-gig scale and a small per-venue correction, with the Garden's first star eased; the balance bot learned to play visitors, was given CHILD / KEEN / EXPERT profiles and a batch runner, and all five venues were read (`b16d1d6`). A child-speed bot passes 92% or more of runs on every gig; a child-speed player is short of the expected guns from the Funfair on, and prices were not changed. The formula, constants and measurements are in `docs/REWARD_LOOP.md`. Bot-measured, not human-tested. | 2026-11-27 |
| **Jam mode, built as specified** | `docs/ENGAGEMENT_DESIGN.md` §6 specified a per-venue Jam unlocked by its Grand Concert: no timer, no score, the whole band. Built as `JamScene.ts` (`9d9fed9`): no coins, stars or visitors either, instruments that wind down at half the last gig's rate and hold twice as long, Splash Frenzy celebrating and paying nothing, a Home button and a button that cycles the owned guns; opens when the venue's last gig is passed; a JAM button on Home, a tile on the Tour map, and a `?jam=<venue>` test link to be removed before submission. Not played by David. | 2026-11-27 |
| **Shots fly over instruments to a locked visitor** | A blocker parked over the wall's outer columns could not be cleared: water was absorbed by the first instrument on the line to it (`29fb6cf`). A shot fired while the aim is on a visitor now flies over every instrument and is tested only against visitors (`src/utils/shotLock.ts`); a shot locked onto an instrument is tested only against that instrument, as before. Impact effects also share one pool capped at 120 pieces, and pause, resume and Big Finish listeners are removed on shutdown. | 2026-11-27 |

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
