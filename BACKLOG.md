# Granny's Spin Splash — Backlog

**Currently working on:** Sprint 0 / Story 0.3 — Set up build size budget

> This file is the live tracker. CLAUDE.md §13 is the immutable plan.
> Update this file as work progresses; only edit CLAUDE.md when re-planning.

---

## Status overview

| Sprint | Goal | Status |
|---|---|---|
| Sprint 0 | Foundation — empty scenes, working SDK, build pipeline | 🟡 In progress |
| Sprint 1 | Walking Skeleton — playable end-to-end with placeholders | ⚪ Not started |
| Sprint 2 | Visual Design System — premium look with procedural graphics | ⚪ Not started |
| Sprint 3 | Sprite Pipeline — 54 Nano Banana sprites delivered | ⚪ Not started |
| Sprint 4 | ASMR Orchestra — 12-layer audio | ⚪ Not started |
| Sprint 5 | Splash Screen + Unlocks | ⚪ Not started |
| Sprint 6 | Monetization Polish | ⚪ Not started |
| Sprint 7 | Launch Polish + Poki submission | ⚪ Not started |

---

## Blockers / parked

- ⏳ **Audio approach decision** — needed before Sprint 4 start (~week 4). See CLAUDE.md §9.3 for shortlist: royalty-free / Suno+Udio / commission / placeholder for v1.
- ⏳ **Studio name** — needed before Poki Developers profile creation (Sprint 7).

---

## Sprint 0 — Foundation (1 week)

Get the project skeleton up. Empty scenes, working SDK, build pipeline.

- [x] **0.1** Scaffold Vite + TypeScript + Phaser 3 project — `npm run dev` boots empty Phaser canvas at 1280×720
- [x] **0.2** Bundle Phaser locally (no CDN) via `vite.config.ts` — Network tab shows zero external requests on load
- [ ] **0.3** Set up build size budget (`tools/budget-check.ts`) — `npm run build && npm run budget` exits 0
- [ ] **0.4** Create empty file skeleton matching CLAUDE.md §7.1 (including `src/types/` and `src/assets/keys.ts`) — All files exist with one-line JSDoc describing purpose
- [ ] **0.5** Implement `src/poki.ts` SDK wrapper + integrate in `main.ts` — All 5 SDK events fire correctly in Poki Inspector
- [ ] **0.6** Extract balance data from prototype into `src/data/*.ts` — All `data/` files populated from prototype constants per CLAUDE.md §2
- [ ] **0.7** Set up ESLint + Prettier + strict TypeScript — `npm run lint` passes on empty skeleton
- [ ] **0.8** Set up Vitest with one example test — `npm run test` runs `SaveManager.test.ts` and passes

**Exit criteria:** Empty Phaser game boots in browser, SDK initialises, all data files populated, lint/test/build pipeline working. No gameplay yet.

---

## Sprint 1 — Walking Skeleton (1 week)

Build the core loop with placeholder graphics. Make it playable end-to-end before any polish.

- [ ] **1.1** Implement `SaveManager` with localStorage try/catch — Unit test passes; survives incognito mode
- [ ] **1.2** Implement `Spinner.ts` with state machine (procedural draw) — 4 states render distinctly; decay + hit increase work
- [ ] **1.3** Implement `Granny.ts` as a placeholder coloured rectangle — Moves left/right via `InputManager`
- [ ] **1.4** Implement `WaterParticle.ts` with arc physics + collision — Pooled (max 50), hits register on spinners
- [ ] **1.5** Build `GameScene` to wire spinners + Granny + water together — Click/tap to fire works, spinners go SLOW→FULL
- [ ] **1.6** Implement `FrenzyMeter` system + trigger — All spinners FULL triggers frenzy event
- [ ] **1.7** Add `preventDefault` for arrows + space in `InputManager` — No page scroll in Poki Inspector
- [ ] **1.8** Wire `PokiSDK.gameplayStart()` to first input + `gameplayStop()` to game over — Verified in Inspector logs

**Exit criteria:** Game is playable. Ugly, but functional. Spinners spin, water flies, Frenzy triggers. SDK events fire correctly.

---

## Sprint 2 — Visual Design System (1 week)

Apply the design system. Game looks premium and kid-friendly with procedural graphics.

- [ ] **2.1** Bundle Fredoka WOFF2 locally; apply typography scale — All text uses Fredoka, sizes match CLAUDE.md §5.2
- [ ] **2.2** Implement `src/utils/colour.ts` palette + apply across UI — No hardcoded hex outside `colour.ts`
- [ ] **2.3** Build `Button.ts` component with primary/secondary/tertiary variants — Used everywhere; consistent hover/press behaviour
- [ ] **2.4** Build SVG icon sprite system + replace all emoji UI — Zero emoji in user-facing UI
- [ ] **2.5** Strip in-play HUD to timer + water + frenzy meter — Score hidden during play, revealed at game over
- [ ] **2.6** Build `FrenzyMeterUI` integrated into the wall background — Meter feels part of the world, not floating UI
- [ ] **2.7** Apply 8px spacing grid + 16px radius across all UI — Visual review confirms consistency
- [ ] **2.8** Tune spinner counts/decay so Frenzy arrives in ~50% of normal runs — Playtest confirms pacing

**Exit criteria:** Game looks premium. Visually cohesive. Plays the same as Sprint 1 but feels professional.

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
- [ ] **4.3** Wire orchestra to spinner state via `FrenzyMeter` events — Layers fade in/out as spinners progress
- [ ] **4.4** Implement `AudioBus` master mute + fade on ad — Audio mutes within 100ms of `commercialBreak()`
- [ ] **4.5** Port one-shot SFX from prototype synth code into `SFX.ts` — Hit/splash/unlock/frenzy SFX sound right
- [ ] **4.6** Playtest: does it feel like ASMR? — 5-person test, ≥4/5 say "satisfying"

**Exit criteria:** Game sounds incredible. The audio is the differentiator.

---

## Sprint 5 — Splash Screen + Unlocks (1 week)

Build the new SplashScene with Granny + Gun carousel.

- [ ] **5.1** Implement `UnlockManager` system — Vault total, unlocked sets, validation logic — unit tested
- [ ] **5.2** Build `Carousel.ts` reusable component — Used for both Granny and Gun selectors
- [ ] **5.3** Build `SplashScene` matching CLAUDE.md §10 mockup — Two carousels, PLAY button, vault display
- [ ] **5.4** Wire unlock thresholds to vault total — Locked items show cost + unlock at threshold
- [ ] **5.5** Add `rewardedBreak()` for random gun unlock — Random tier ≤ current grants only on success
- [ ] **5.6** Garden world only for v1 (no world-select scene) — First run starts in Garden
- [ ] **5.7** Create static + animated thumbnails — Meets Poki spec

**Exit criteria:** Full game loop: splash → game → game over → splash. Unlocks feel rewarding.

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

### Platform / retention features

- [ ] **P1** Daily challenges (drives DAU)
- [ ] **P2** Cloud save via Poki Accounts SDK (cross-device)
- [ ] **P3** Funfair + Kitchen worlds (expand world pool beyond C1/C2)
- [ ] **P4** Localisation (FR, ES, DE, PT, NL, BR) — after web-fit test passes
- [ ] **P5** Seasonal Granny variants (Halloween, Christmas)
- [ ] **P6** Speedrun leaderboards (Poki Accounts)
- [ ] **P7** Additional grannies (Queen, Disco, Santa, Astro, Pirate, Cyber)
- [ ] **P8** A/B thumbnail tests (built-in Poki tool)
