# Granny's Spin Splash — Backlog

**Currently working on:** Sprint 5 complete — Sprint 3 blocked on user-supplied art (ART_BRIEF.md), Sprint 4 blocked on an audio source decision (CLAUDE.md §9.3). Proceeding to Sprint 6 (Monetization Polish) next — it builds on Sprint 5's UnlockManager/AdManager groundwork and needs no art/audio either.

> This file is the live tracker. CLAUDE.md §13 is the immutable plan.
> Update this file as work progresses; only edit CLAUDE.md when re-planning.

---

## Status overview

| Sprint | Goal | Status |
|---|---|---|
| Sprint 0 | Foundation — empty scenes, working SDK, build pipeline | ✅ Done |
| Sprint 1 | Walking Skeleton — playable end-to-end with placeholders | ✅ Done |
| Sprint 2 | Visual Design System — premium look with procedural graphics | ✅ Done |
| Sprint 3 | Sprite Pipeline — 54 Nano Banana sprites delivered | ⏳ Blocked on user art (ART_BRIEF.md) |
| Sprint 4 | ASMR Orchestra — 12-layer audio | ⏳ Blocked on audio source decision (§9.3) |
| Sprint 5 | Splash Screen + Unlocks | ✅ Done (5.7 thumbnails deferred — needs real art) |
| Sprint 6 | Monetization Polish | 🔵 Up next |
| Sprint 7 | Launch Polish + Poki submission | ⚪ Not started |

---

## Blockers / parked

- ⏳ **Audio approach decision** — needed before Sprint 4 start (~week 4). See CLAUDE.md §9.3 for shortlist: royalty-free / Suno+Udio / commission / placeholder for v1.
- ⏳ **Studio name** — needed before Poki Developers profile creation (Sprint 7).
- ⏳ **Granny + gun art** — user is creating this personally with Nano Banana. Full generation brief delivered: [ART_BRIEF.md](ART_BRIEF.md) (2026-09-11) — palette, exact filenames/paths, per-character prompt seeds, generation order. Grannies now ship 5 poses each (front/front_firing/three_quarter/side/back — a turnaround set for the splash carousel + an optional Frenzy spin, not just the original 2), guns unchanged (8 angles + anchor.json). Sprint 3 needs the delivered files before 3.1/3.2/3.3/3.6 can run; §8.3.1's Nano Banana pipeline is a fallback only, not the default path.

## Known issues (non-blocking)

- **Cog dead-zone vs. auto-aim snap** — a fully snapped shot lands dead-centre on its target, which is inside a cog's unhittable "hole" (see `COG_DEAD_ZONE_RATIO` in `src/objects/WaterParticle.ts`). Verified live during Sprint 1: a cog under continuous snapped fire never registers a single hit. Not reachable today — Garden's roster (`src/data/worlds.ts`) has no `'cog'` — but fix this before any world adds cogs.

---

## Sprint 0 — Foundation (1 week)

Get the project skeleton up. Empty scenes, working SDK, build pipeline.

- [x] **0.1** Scaffold Vite + TypeScript + Phaser 3 project — `npm run dev` boots empty Phaser canvas at 1280×720
- [x] **0.2** Bundle Phaser locally (no CDN) via `vite.config.ts` — Network tab shows zero external requests on load
- [x] **0.3** Set up build size budget (`tools/budget-check.ts`) — `npm run build && npm run budget` exits 0
- [x] **0.4** Create empty file skeleton matching CLAUDE.md §7.1 (including `src/types/` and `src/assets/keys.ts`) — All files exist with one-line JSDoc describing purpose
- [x] **0.5** Implement `src/poki.ts` SDK wrapper + integrate in `main.ts` — All 5 SDK events fire correctly in Poki Inspector *(wrapper covers all 6 events; init + gameLoadingFinished verified firing in dev console; gameplayStart/Stop + commercialBreak + rewardedBreak land in Sprint 1+ when their callers exist)*
- [x] **0.6** Extract balance data from prototype into `src/data/*.ts` — All `data/` files populated from prototype constants per CLAUDE.md §2 *(redone: `game prototype/granny-spin-splash.html` is now in the repo. `spinners.ts` (ST → real 8 kinds + deflects/isGolden), `worlds.ts` (Garden's 4×3 grid + type roster), `powerups.ts` (PU, 5 real effects), and `levels.ts` (GRANNY_LEVELS, 8 tiers) now hold verbatim prototype values. `guns.ts`/`grannies.ts` stay placeholder — no WEAPON_DEFS/GRANNY_CHARS exist in this prototype; tune in Sprint 2 story 2.8.)*
- [x] **0.7** Set up ESLint + Prettier + strict TypeScript — `npm run lint` passes on empty skeleton
- [x] **0.8** Set up Vitest with one example test — `npm run test` runs `SaveManager.test.ts` and passes

**Exit criteria:** Empty Phaser game boots in browser, SDK initialises, all data files populated, lint/test/build pipeline working. No gameplay yet.

---

## Sprint 1 — Walking Skeleton (1 week)

Build the core loop with placeholder graphics. Make it playable end-to-end before any polish.

- [x] **1.1** Implement `SaveManager` with localStorage try/catch — 6 unit tests (default/round-trip/version-mismatch/both incognito throw paths); live-verified writing `highScore` at round end
- [x] **1.2** Implement `Spinner.ts` with state machine (procedural draw) — all 8 kinds render distinctly per state via `spinnerRenderers.ts` (ported from the prototype's draw code); decay/hit/state-transition math live-verified frame-by-frame
- [x] **1.3** Implement `Granny.ts` as a placeholder coloured rectangle — moves left/right via `InputManager`, clamped to the play field
- [x] **1.4** Implement `WaterParticle.ts` with arc physics + collision — pooled (max 50) `Phaser.GameObjects.Group`; live-verified drain/flight/collision against a real target
- [x] **1.5** Build `GameScene` to wire spinners + Granny + water together — click/tap fires, spinners advance SLOW→FULL, confirmed live via manual frame-stepping (real browser tabs are `document.hidden` in this headless setup, so rAF never fires — verification drove `game.loop.step()` directly instead of relying on wall-clock waits)
- [x] **1.6** Implement `FrenzyMeter` system + trigger — **found + fixed a real bug during verification**: the original `_frenzyActive`/`endFrenzy()` latch design let SPLASH FRENZY re-trigger itself forever, because releasing the bonus window always coincided with every spinner still reading FULL. Rewrote all three thresholds (`miniLow`/`miniHigh`/`full`) as the same rising-edge check — confirmed via a 10-simulated-second trace that `full` now fires exactly once per genuine wall-fill
- [x] **1.7** Add `preventDefault` for arrows + space in `InputManager` — `keyboard.addCapture([LEFT, RIGHT, SPACE])`
- [x] **1.8** Wire `PokiSDK.gameplayStart()` to first input + `gameplayStop()` to game over — confirmed in real console output: `gameplayStart → gameplayStop (pause) → gameplayStart (resume) → gameplayStop (round end)`, exact expected order, against the genuine Poki dev SDK (not mocked)

**Exit criteria:** ✅ Met. Game is playable — ugly (monospace debug HUD, no sprites yet), but functional. Spinners spin, water flies, Frenzy triggers (and releases correctly). SDK events fire correctly and in order. Full pipeline green: `npm run lint && npm run test && npm run build && npm run budget` (1.43 MB / 8 MB budget).

**Also found, documented, deliberately not fixed (out of Sprint 1 scope):** the cog dead-zone can make a cog unhittable under full auto-aim snap — not reachable today since Garden's roster has no cogs. See "Known issues" above and the comment on `COG_DEAD_ZONE_RATIO` in `src/objects/WaterParticle.ts`.

**Also redone beyond the original story list:** `ComboTracker.ts` + its unit tests — CLAUDE.md §7.2 names it as a Systems file and §2 explicitly calls out "Combo decay — 2-second window" as behavioural reference to extract, but no Sprint 1-7 story ever scheduled building it. Implemented now (prototype-faithful, including its one quirk: re-hitting the same spinner holds the combo but doesn't refresh its window) since GameScene's scoring needed it anyway.

---

## Sprint 2 — Visual Design System (1 week)

Apply the design system. Game looks premium and kid-friendly with procedural graphics.

> **Reminder (2026-09-11):** the old prototype's UI got "buttons everywhere and too much" per direct user feedback — every addition here needs to earn its place against CLAUDE.md §6.1 ("No menus during play") and §5.8 ("Negative space matters"). Default to cutting, not adding.

- [x] **2.1** Bundle Fredoka WOFF2 locally; apply typography scale — one variable-font file (`public/fonts/fredoka.woff2`), `utils/typography.ts` implements the §5.2 scale; `main.ts` awaits `document.fonts.ready` before Phaser draws anything (canvas text doesn't re-render on a late font swap)
- [x] **2.2** Implement `src/utils/colour.ts` palette + apply across UI — done in Sprint 1 prep, extended this sprint with `shade()` for muted variants (ground plane, spinner glow); no hardcoded hex outside it
- [x] **2.3** Build `Button.ts` component with primary/secondary/tertiary variants — used in GameOverScene's Play Again; **found + fixed a real perf bug here** (see below)
- [~] **2.4** Build SVG icon sprite system + replace all emoji UI — zero emoji in user-facing UI is already true (nothing ever used one), but no UI built so far actually needs an icon yet (timer/water bar/rings are pure shapes) — the sprite-sheet system itself isn't built. Revisit once real icon needs show up (Sprint 5's carousel arrows are a likely first case)
- [x] **2.5** Strip in-play HUD to timer + water + frenzy meter — `HUDScene` (timer pill + water bar + on-wall rings) replaces Sprint 1's debug text; score is never rendered during play, only on `GameOverScene`'s reveal (built now since 2.5's acceptance needs an actual reveal moment to exist — GameOverScene wasn't scheduled anywhere either, like ComboTracker)
- [x] **2.6** Build `FrenzyMeterUI` integrated into the wall background — per-spinner progress rings (ported from the prototype's `drawRings`, re-skinned to the hero palette) instead of a floating bar
- [x] **2.7** Apply 8px spacing grid + 16px radius across all UI — HUD/button constants are all multiples of 8 (pills use `pillRadius()`, WaterBar's panel uses the 16px standard exactly); will get more exercise once Sprint 5 adds cards/panels
- [x] **2.8** Tune spinner counts/decay so Frenzy arrives in ~50% of normal runs — also fixed `GunDef.streams` never being consumed (every gun fired single-stream regardless of data). Retuned gun power empirically via live simulation (see `entities/gun/gun.data.ts` header for the full reasoning) — first-pass, needs a real human playtest to confirm the "~50%" figure specifically

**Exit criteria:** ✅ Met. Game looks premium and visually cohesive — Fredoka, the hero palette, a real Garden backdrop, a minimal HUD, impact/celebration juice. Same core loop as Sprint 1, now feels considerably more professional. Full pipeline green throughout: lint, 18 tests, typecheck, build.

**Critical bug found + fixed mid-sprint (story 2.3):** `Button.ts`/`TimerDial.ts` copied CLAUDE.md §5.4's CSS "999px pill" convention literally into `Graphics.fillRoundedRect` — Phaser doesn't clamp that radius to the box the way CSS `border-radius` does, so a 999 radius on a small box built a degenerate path that made every frame with `HUDScene` active take ~250-300ms (a 120-frame test went from <1s to 36.7s). Bisected live via manual frame-stepping to the exact `Graphics` object, fixed with `utils/math.ts`'s new `pillRadius()` (computes `min(width,height)/2`). Would have shipped as an unplayable-slow game the moment any pill-shaped UI rendered.

**Also done, not part of the original 8 stories:**
- Reorganized `src/` from a layer-based split (`objects/`, `data/`, per-entity `types/`) into feature/entity-based folders (`entities/spinner/`, `entities/granny/`, etc.) per explicit user request for "professional, component-based" architecture — see CLAUDE.md §7.1's re-plan note for the full rationale. Pure refactor, `git mv`-based, history preserved, zero behaviour change (verified: identical build output size).
- Visual polish beyond the letter of the 8 stories but within CLAUDE.md §5.6/§5.7's own spec: a real Garden background (ground plane + depth shapes — there was none at all before), splash-on-impact VFX (WaterParticle.ts's own architecture doc calls this its responsibility; it was doing nothing), Granny's idle breath animation and spinner wobble-near-max (both explicitly speced in §5.6, neither had been implemented), and a bundled Frenzy celebration (banner + camera shake + flash) in `ui/Banner.ts`.
- [ART_BRIEF.md](ART_BRIEF.md) — full Nano Banana generation brief for the user, and CLAUDE.md's C12 "Space Bubble" post-launch roadmap item — see "Blockers" and "Known issues" sections above.

---

## Sprint 3 — Sprite Pipeline (1.5 weeks)

Replace placeholder Granny + Gun with custom Nano Banana sprite art. **Do not parallelise the reference-image chain — see CLAUDE.md §8.3.1.**

- [ ] **3.1** Lock Classic Granny standing + firing as style template — 2 reference PNGs in `_reference/`, palette/outline/scale exactly right
- [ ] **3.2** Generate remaining 2 Granny standing + firing variants from template — 4 PNGs delivered, consistency review passes
- [ ] **3.3** Lock Drip Pistol 0° as gun style template — 1 reference PNG, outline weight matched to grannies
- [ ] **3.4** Generate 8 angles for Drip Pistol + author `anchor.json` — 8 PNGs + correct nozzle XY per angle
- [ ] **3.5** Build small HTML anchor-picker tool (click nozzle, copy coords) — Tool in `tools/anchor-picker.html`
- [ ] **3.6** Generate remaining 5 guns × 8 angles + anchor data — 40 PNGs + 5 `anchor.json` files
- [ ] **3.7** Implement `Granny.ts` sprite-based rendering — Correct sprite per selection; idle breath; firing pose swap
- [ ] **3.8** Implement `Gun.ts` with 8-angle rotation logic — Smoothly snaps to nearest cardinal angle following aim
- [ ] **3.9** Optimise all PNGs through pngquant — Total sprites < 1 MB
- [ ] **3.10** Stress-test at 640×360 — sprites crisp at all three Poki canonical sizes

**Exit criteria:** Game looks like a finished product. All 54 launch sprites delivered.

---

## Sprint 4 — ASMR Orchestra (1.5 weeks)

The headline feature. Layered music that builds with player progress.

- [ ] **4.1** Audio source decision + procure 12-layer ASMR loop pack (see CLAUDE.md §9.3) — 12 OGG files, same BPM, same length, same key
- [ ] **4.2** Implement `AudioOrchestra.ts` mixing class — Smooth gain tweening; no clicks/pops at layer change
- [ ] **4.3** Wire orchestra to *each spinner's own* charge level, continuously — CLAUDE.md §9.1.1 (2026-09-11 refinement, requested by the user: "each spinner is an instrument"). Not `FrenzyMeter` population thresholds — a spinner's `currentSpeed / MAX_SPINNER_SPEED` directly drives its assigned layer's gain every frame, smoothed 250ms. FrenzyMeter's `full` event still drives the two Frenzy-exclusive layers (drop bass sustain + cinematic hit one-shot) — Acceptance: each grid position audibly maps to the same instrument every run; the mix breathes in real time with actual play, not just crossed thresholds
- [ ] **4.4** Implement `AudioBus` master mute + fade on ad — Audio mutes within 100ms of `commercialBreak()`
- [ ] **4.5** Port one-shot SFX from prototype synth code into `SFX.ts` — Hit/splash/unlock/frenzy SFX sound right
- [ ] **4.6** Playtest: does it feel like ASMR? — 5-person test, ≥4/5 say "satisfying"

**Exit criteria:** Game sounds incredible. The audio is the differentiator.

---

## Sprint 5 — Splash Screen + Unlocks (1 week)

Build the new SplashScene with Granny + Gun carousel.

- [x] **5.1** Implement `UnlockManager` system — vault, unlock validation, free grants, random-locked-gun picker, granny/gun selection gated on unlock state — 10 unit tests
- [x] **5.2** Build `Carousel.ts` reusable component — one class, used for both Granny and Gun selectors on `SplashScene`
- [x] **5.3** Build `SplashScene` matching CLAUDE.md §10 mockup — title, vault display, two carousels, PLAY
- [x] **5.4** Wire unlock thresholds to vault total — locked items show a lock overlay + cost; tapping one shows a toast instead of selecting it (§10's exact behaviour spec)
- [x] **5.5** Add `rewardedBreak()` for random gun unlock — "Watch an ad for a free gun" button on `SplashScene`; verified it's never Mint Green and both buttons are visible together (§11.3)
- [x] **5.6** Garden world only for v1 (no world-select scene) — already true since Sprint 1 (`GameScene` has always hardcoded `WORLD_DEFS[0]`), nothing to build
- [ ] **5.7** Create static + animated thumbnails — **deferred**, not skipped: a placeholder-art thumbnail isn't worth generating (it'd need regenerating the moment real sprites land). Revisit once ART_BRIEF.md's assets are in.

**Exit criteria:** ✅ Met (except 5.7, deferred for a real reason above). Full game loop verified live end-to-end: splash → game (with the selected loadout actually passed through) → game over → splash, vault correctly shows the run's earned stars. Pipeline green throughout: lint, 28 tests, typecheck, build.

**Two real bugs found via live testing (not caught by unit tests alone):**
1. `SaveManager`'s default save only auto-unlocked the single `DEFAULT_GRANNY_ID`/`DEFAULT_GUN_ID` — Squirt Sister and The Squirter (both 0★ per CLAUDE.md §8.1) weren't pre-unlocked on a fresh save. Fixed: default save now unlocks every 0-cost item.
2. Bigger: `SaveManager` cached per-instance, and each scene created its own `new SaveManager()` — GameScene correctly banked a run's score, but SplashScene's separate stale cache still showed the vault at 0 after Play Again. Only surfaced by scripting the *actual* splash→game→gameover→splash loop end-to-end, not by testing scenes in isolation. Fixed with a shared `saveManager` singleton (`systems/SaveManager.ts`) every scene now imports.

**Also found + fixed, not part of the original 5 stories:** the run's score was earned but never actually persisted anywhere past `highScore` — nothing called `UnlockManager.addStars()`. Wired into `GameScene._endRound()`.

---

## Sprint 6 — Monetization Polish (1 week)

Get the ads right. Poki rejects games that get this wrong.

- [ ] **6.1** Wire `commercialBreak()` to "Play Again" button — Ad shows before run start; events fire correctly
- [ ] **6.2** Add "Watch ad → 2× score" `rewardedBreak()` on game over — Optional, never gates the standard "Play Again"
- [ ] **6.3** Add "Watch ad → refill water" mid-run when tank empty — Only player-initiated when water = 0
- [ ] **6.4** Verify all reward buttons follow Poki UX rules — Mint Green standard ≥ rewarded; 🎬 icon present
- [ ] **6.5** Implement `AdManager` to centralise ad logic + audio mute — All ad flows route through this
- [ ] **6.6** Build `PauseScene` with ESC / two-finger trigger — Fires correct SDK events on pause/resume

**Exit criteria:** All ad flows work correctly per Poki rules. Game is technically submission-ready.

---

## Sprint 7 — Launch Polish (1 week)

Final QA pass and submission.

- [ ] **7.0** Decide studio name + create Poki Developers profile
- [ ] **7.1** Test all canonical sizes in Poki Inspector — No breakage at 640×360 / 836×470 / 1031×580
- [ ] **7.2** Cross-browser smoke test (Chrome, Firefox, Safari, iOS, Android) — All pass; no console errors
- [ ] **7.3** Incognito mode test — no crashes; localStorage failures handled gracefully
- [ ] **7.4** Performance pass — 60fps on mid-range mobile; profile and optimise particle pool sizes
- [ ] **7.5** Run full pre-submission checklist (CLAUDE.md §12) — All 10 must-fix rules pass
- [ ] **7.6** Submit to Poki for Developers — Game uploaded to Inspector, review requested

**Exit criteria:** Game submitted to Poki. Ready for player-fit testing.

---

## Post-launch backlog

### First content drop (v1.1) — content cut from launch scope

- [ ] **C1** Workshop world (unlocks at 500★)
- [ ] **C2** Disco world (unlocks at 2,000★)
- [ ] **C3** Beach Granny (1,500★)
- [ ] **C4** Ninja Granny (4,000★)
- [ ] **C5** GOLDEN GRANNY (10,000★ hero unlock)
- [ ] **C6** Aqua Seeker gun (Tier 3, 2,500★)
- [ ] **C7** Hydro Blaster gun (Tier 4, 10,000★)
- [ ] **C8** Lightning Rod gun (Tier 5, 20,000★)
- [ ] **C9** Ice Queen gun (Tier 5, 35,000★)
- [ ] **C10** Neptune's Wrath gun (Tier 6, 60,000★)
- [ ] **C11** MEGA CANNON (Tier 7, 100,000★ hero unlock)
- [ ] **C12** 🧪 Space Bubble world — Granny in a bubble, spinning through space, blasting objects. 3D; needs a design/tech spike before it's a real sprint. See CLAUDE.md §13's C12 note for the 3 technical paths considered (pseudo-3D in Phaser is the recommended starting point). Requested by the user's kid, 2026-09-11.

### Platform / retention features

- [ ] **P1** Daily challenges (drives DAU)
- [ ] **P2** Cloud save via Poki Accounts SDK (cross-device)
- [ ] **P3** Funfair + Kitchen worlds (expand world pool beyond C1/C2)
- [ ] **P4** Localisation (FR, ES, DE, PT, NL, BR) — after web-fit test passes
- [ ] **P5** Seasonal Granny variants (Halloween, Christmas)
- [ ] **P6** Speedrun leaderboards (Poki Accounts)
- [ ] **P7** Additional grannies (Queen, Disco, Santa, Astro, Pirate, Cyber)
- [ ] **P8** A/B thumbnail tests (built-in Poki tool)
