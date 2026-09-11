# Granny's Spin Splash — Backlog

**Currently working on:** Mid-Sprint-7 QA surfaced a scope decision (user asked whether the prototype's other worlds were planned) — re-planned to pull all 4 remaining worlds into v1 (CLAUDE.md §14, 2026-09-11). Workshop/Kitchen/Funfair/Disco now ship alongside Garden: a new 3rd SplashScene carousel (world select, vault-gated same as grannies/guns), obstacles (cat/umbrella/duck — previously an empty stub) fully implemented, moving targets (Funfair) and the Golden Spinner bonus spawn (Disco-frequent, all worlds) wired end-to-end. Along the way, fixed two real pre-existing gaps this surfaced: (1) locked items (grannies/guns/worlds) had no actual "spend vault stars to unlock" UI path, only a dead-end toast — now a tap attempts a real unlock; (2) the cog dead-zone-vs-auto-aim bug (previously "not reachable," now live in Workshop/Kitchen) — fixed via a teeth-ring aim nudge. Also built out mobile controls (§6.3) that were a known gap: edge hold-to-move buttons + two-finger-tap pause. Sprint 4's 12-stem orchestra remains blocked on the audio source decision (§9.3); Sprint 3 remains blocked on user-supplied art (ART_BRIEF.md). All new work verified live in Chrome (all 5 worlds, obstacles, golden spinner lifecycle, unlock purchase success/failure paths) — full pipeline (tsc/lint/test/build/budget) green. Resuming Sprint 7's QA pass next.

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
| Sprint 4 | ASMR Orchestra — 12-layer audio | 🟡 SFX (4.4/4.5) done; 12-stem orchestra (4.1/4.2/4.3/4.6) blocked on audio source decision (§9.3) |
| Sprint 5 | Splash Screen + Unlocks + all 5 Worlds (re-planned 2026-09-11) | ✅ Done (5.7 thumbnails deferred — needs real art) |
| Sprint 6 | Monetization Polish | ✅ Done (mobile controls gap closed 2026-09-11 — see below) |
| Sprint 7 | Launch Polish + Poki submission | 🟡 In progress |

---

## Blockers / parked

- ⏳ **Audio approach decision** — needed before Sprint 4 start (~week 4). See CLAUDE.md §9.3 for shortlist: royalty-free / Suno+Udio / commission / placeholder for v1.
- ⏳ **Studio name** — needed before Poki Developers profile creation (Sprint 7).
- ⏳ **Granny + gun art** — user is creating this personally with Nano Banana. Full generation brief delivered: [ART_BRIEF.md](ART_BRIEF.md) (2026-09-11) — palette, exact filenames/paths, per-character prompt seeds, generation order. Grannies now ship 5 poses each (front/front_firing/three_quarter/side/back — a turnaround set for the splash carousel + an optional Frenzy spin, not just the original 2), guns unchanged (8 angles + anchor.json). Sprint 3 needs the delivered files before 3.1/3.2/3.3/3.6 can run; §8.3.1's Nano Banana pipeline is a fallback only, not the default path.
- ⏳ **World background art** — user flagged (2026-09-11) that the current procedural backgrounds ("so unbelievably basic") don't deliver the immersive, illustrated feel they want. Brief delivered: [WORLD_BACKGROUND_BRIEF.md](WORLD_BACKGROUND_BRIEF.md) — 5 paintings (1536×864, one per world), same style pipeline as ART_BRIEF.md, reference-image chain locking Garden first. `worldBackgrounds.ts`'s procedural drawers stay as the fallback until these land, then get retired in favour of loaded images.

## Known issues (non-blocking)

None currently open. (The cog dead-zone vs. auto-aim bug tracked here since Sprint 1 — "not reachable, Garden has no cog" — became reachable when Workshop/Kitchen shipped 2026-09-11, and was fixed the same day: see `resolveFireAimPoint()` in `src/entities/waterParticle/WaterParticle.ts`, verified live — a dead-centre-locked cog now reaches FULL in ~2s of continuous fire instead of never.)

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
- [x] **4.4** Implement `AudioBus` master mute + fade on ad — done. Single shared `AudioContext` + master `GainNode` (`src/audio/AudioBus.ts`), `fadeOut(100)`/`fadeIn(300)` linear ramps, `AD_MUTE_HOOKS` wired into all 3 `adManager.play*()` call sites (SplashScene commercial break, GameOverScene double-score reward, GameScene mid-run refill reward) plus `_pauseGame()`'s fade-out. `init()` called from `GameScene._onFirstInput()` — a real user gesture, per browser autoplay policy.
- [x] **4.5** Port one-shot SFX from prototype synth code into `SFX.ts` — done. `src/audio/SFX.ts`: `scheduleTone`/`playTone`/`playSequence` primitives ported from the prototype's synth recipes, plus `playHit` (pitch scales with spinner speed), `playCombo`, `playUpgrade`, `playPump`, `playRefill`, `playDeflect`, `playFrenzy`. Wired into `GameScene.ts` at every trigger point (water-spinner collisions, combo increments, spinner state-tier upgrades, pump empty/refill, deflect, frenzy start). No licensed assets needed — pure Web Audio synthesis — so this shipped independently of the 4.1 audio-source decision.
  - **Verification note:** live-tested in Chrome by driving the real splash→play→first-click flow (not just unit tests) and confirmed end-to-end: `AudioContext` construction (proxy-patched `window.AudioContext` to intercept), `audioBus.ready` becoming `true` inside the actual imported module SFX.ts uses, and a real `AudioContext.prototype.createOscillator` call firing from `SFX.playHit()`. An earlier debugging session showed `audioBus.ready: false` when checked via a fresh ad-hoc `import('/src/audio/AudioBus.ts')` from the browser console — traced to Vite HMR module-versioning (a bare dynamic import resolving to an orphaned module instance distinct from the one already wired into the live game after a mid-session file edit), not a code bug. Confirmed via prototype-patching (`AudioContext.prototype.createOscillator`), which is instance-agnostic and unambiguous.
- [ ] **4.1** Audio source decision + procure 12-layer ASMR loop pack — still blocked (CLAUDE.md §9.3)
- [ ] **4.2** Implement `AudioOrchestra.ts` mixing class — blocked on 4.1
- [ ] **4.3** Wire orchestra to each spinner's own charge level (§9.1.1) — blocked on 4.1
- [ ] **4.6** Playtest: does it feel like ASMR? — blocked on 4.1–4.3

**Exit criteria:** Partially met — one-shot SFX (4.4/4.5) done and verified live; the 12-stem orchestra (4.1/4.2/4.3/4.6) remains blocked on the audio-source decision (§9.3). Game sounds good today; the ASMR differentiator lands once that decision is made.

---

## Sprint 5 — Splash Screen + Unlocks (1 week)

Build the new SplashScene with Granny + Gun carousel.

- [x] **5.1** Implement `UnlockManager` system — vault, unlock validation, free grants, random-locked-gun picker, granny/gun selection gated on unlock state — 10 unit tests
- [x] **5.2** Build `Carousel.ts` reusable component — one class, used for the Granny, World, and Gun selectors on `SplashScene`
- [x] **5.3** Build `SplashScene` matching CLAUDE.md §10 mockup — title, vault display, three carousels, PLAY
- [x] **5.4** Wire unlock thresholds to vault total — locked items show a lock overlay + cost; tapping one *attempts to unlock* (spend + select on success, toast the shortfall on failure) — see the re-plan note below, this changed after 5.4 first shipped
- [x] **5.6** World-select carousel, all 5 launch worlds (re-planned 2026-09-11 — see CLAUDE.md §14) — Garden free from run one, Workshop/Kitchen/Funfair/Disco purchasable at 500★/1,000★/1,500★/2,000★
- [ ] **5.7** Create static + animated thumbnails — **deferred**, not skipped: a placeholder-art thumbnail isn't worth generating (it'd need regenerating the moment real sprites land). Revisit once ART_BRIEF.md's assets are in.

**Exit criteria:** ✅ Met (except 5.7, deferred for a real reason above). Full game loop verified live end-to-end: splash → game (with the selected loadout actually passed through) → game over → splash, vault correctly shows the run's earned stars. Pipeline green throughout: lint, 35 tests, typecheck, build.

**World re-plan (2026-09-11) — what shipped beyond the original 6 stories:**
- **5 worlds, not 1.** `entities/world/world.data.ts` now has Garden/Workshop/Kitchen/Funfair/Disco with real grid sizes, spinner-type rosters, and obstacle rosters extracted from the prototype's `WORLDS` table; unlock costs are new (worlds didn't gate in the prototype — invented to reuse the existing Vault economy rather than ship a second, inconsistent "everything free" system).
- **Obstacles actually implemented.** `entities/obstacle/Obstacle.ts` was an empty stub (`export {}`) until now — Cat (sits on a random spinner, caps its speed at 30, shoo-able), Umbrella (toggles open/closed, blocks water while open), Duck (paddles, deflects on contact) are all real, ported from the prototype's `_updateCat`/`_updateUmbrella`/`_updateDuck`, collision-checked in `GameScene._updateWaterCollisions()` ahead of the spinner check.
- **Moving targets (Funfair).** `Spinner.setDrift()` — 3 random spinners per round get a sinusoidal horizontal drift (prototype: range 55px, speed 0.4-0.8 rad/s). Live-verified: exactly 3 spinners report `hasDrift` with x offset from their grid column.
- **Golden Spinner, previously spec'd but never wired.** `SpinnerDef.isGolden`/`'golden'` style existed since Sprint 1 with a header comment saying "spawn-timer behaviour not yet wired" — now is: spawns at a random point clear of the grid, 6s lifetime, respawns every 25-40s (12-20s in Disco, `goldenFrequent`), awards bonus stars on reaching FULL, shrink-fades out unclaimed. Deliberately excluded from `FrenzyMeter`'s "% of wall at FULL" and the HUD's spinner-dot list — a temporary bonus spawn shouldn't distort either. Live-verified full spawn→claim cycle in Disco (spawned at ~16s into the 12-20s window, claimed cleanly, bonus scored).
- **Unlock-purchase flow, a real pre-existing gap fixed.** `UnlockManager.unlockGranny/unlockGun` existed and were unit-tested since Sprint 5 first shipped, but nothing in the UI ever called them — tapping a locked item only ever showed "Earn X★ more," a dead end. Found while testing the new world carousel (an unlockable item with no purchase path is a broken feature). Fixed for all three carousels: `Carousel`'s tap handler now always calls `onSelect(id)` regardless of lock state (moved the locked/unlocked branch out of the dumb UI component and into `SplashScene`, which owns `UnlockManager`); a locked tap now attempts unlock-and-select, spending vault stars on success. Live-verified both paths (600★ vault → Workshop unlock succeeds, vault drops to 100; 100★ vault → Kitchen unlock fails, vault untouched, selection unchanged).
- **Cog dead-zone bug, tracked since Sprint 1, fixed now that it's reachable.** Workshop/Kitchen both roster `'cog'`; auto-aim snapping dead-centre landed inside the cog's unhittable hole. Fixed via `resolveFireAimPoint()` in `WaterParticle.ts` — a cog-locked shot's aim point is nudged onto a random point on the teeth ring instead of dead-centre. Live-verified: a dead-centre-locked cog now reaches FULL in ~2s of continuous pistol fire.
- All 5 worlds live-tested end-to-end (400+ simulated frames each, zero thrown errors): spinner counts/rosters match spec, obstacles spawn correctly, moving targets drift, Golden Spinner's full lifecycle works in Disco.

**Two real bugs found via live testing (not caught by unit tests alone):**
1. `SaveManager`'s default save only auto-unlocked the single `DEFAULT_GRANNY_ID`/`DEFAULT_GUN_ID` — Squirt Sister and The Squirter (both 0★ per CLAUDE.md §8.1) weren't pre-unlocked on a fresh save. Fixed: default save now unlocks every 0-cost item.
2. Bigger: `SaveManager` cached per-instance, and each scene created its own `new SaveManager()` — GameScene correctly banked a run's score, but SplashScene's separate stale cache still showed the vault at 0 after Play Again. Only surfaced by scripting the *actual* splash→game→gameover→splash loop end-to-end, not by testing scenes in isolation. Fixed with a shared `saveManager` singleton (`systems/SaveManager.ts`) every scene now imports.

**Also found + fixed, not part of the original 5 stories:** the run's score was earned but never actually persisted anywhere past `highScore` — nothing called `UnlockManager.addStars()`. Wired into `GameScene._endRound()`.

---

## Sprint 6 — Monetization Polish (1 week)

Get the ads right. Poki rejects games that get this wrong.

- [x] **6.1** Wire `commercialBreak()` to "Play Again" button — `SplashScene`'s PLAY button, guarded to every 2nd run (CLAUDE.md §11.1) via `AdManager`, double-tap guarded
- [x] **6.2** Add "Watch ad → 2× score" `rewardedBreak()` on game over — never gates PLAY AGAIN, destroys itself after one use, doesn't build at all if the run scored 0
- [x] **6.3** Add "Watch ad → refill water" mid-run when tank empty — `ui/RefillPrompt.ts`, visible only while pumping
- [x] **6.4** Verify all reward buttons follow Poki UX rules — checked live: every rewarded button uses Button's `secondary` variant (never Mint Green), always shown alongside a `primary` action, one grant per watch. No 🎬 icon — CLAUDE.md §7.3 rule 8 bans emoji in production UI; the button's own label text ("Watch an ad...") carries the same "this costs an ad" signal without one
- [x] **6.5** Implement `AdManager` to centralise ad logic + audio mute — done; the mute/unmute hooks are real (caller-supplied) but every call site currently passes none, since there's no AudioBus to mute yet (Sprint 4 blocked) — 6 unit tests
- [x] **6.6** Build `PauseScene` with ESC + two-finger-tap trigger — Resume/Quit, fires `gameplayStop()`/`gameplayStart()` correctly, verified live that Phaser's real `scene.pause()` genuinely stops `update()` (not just a visual overlay). Mobile gap closed 2026-09-11: `InputManager` now tracks concurrent pointer ids (`input: {activePointers: 2}` in `main.ts`'s game config, default is 1) — a 2nd simultaneous touch emits `pause` and is suppressed from being read as aim/fire.
- [x] **6.7** *(added 2026-09-11)* Mobile edge move buttons — `ui/MobileMoveButtons.ts`, hold-to-move ◀/▶ pinned to the bottom screen edges, only created on `device.input.touch`. Merged into `InputManager.getMoveDir()` alongside keyboard so `Granny.move()` doesn't need to know the input source. Closes the other half of CLAUDE.md §6.3's mobile control spec (there was previously no way to move Granny on a touch device at all).

**Exit criteria:** ✅ Met, including the mobile control gap that was previously flagged as open — full desktop + mobile control parity now (§6.2/§6.3 both fully built). All ad flows work correctly per Poki rules, verified live in Chrome via direct state inspection, not just screenshots. Game is technically submission-ready pending Sprints 3/4's blockers and Sprint 7.

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
