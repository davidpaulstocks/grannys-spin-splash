# Granny's Spin Splash — Backlog

**Currently working on:** Overnight into 2026-09-12: real sprite art landed and Sprint 3 closed out (`Granny.ts`/`Gun.ts` rendering, `BootScene.ts` implemented, Sprint 7 QA partway — see git history for that wave's detail). Then a second wave, driven by direct, specific user feedback that the game "felt a long way behind the quality and fun of the prototype": went back and actually read `game prototype/granny-spin-splash.html` rather than working from secondhand summaries, and closed the gaps it surfaced —

- **Splash screen redesign:** the title flourish now fills the entire 1280×720 canvas as the page's frame (was a small tight border); the three separate granny/world/gun carousels became one big `LoadoutStage` composite (world background + granny + gun badge layered together) with slim arrow-only `CompactSelector`s for granny/gun either side — "one composite image, three independent controls," not three disconnected thumbnails.
- **Gameplay juice restored from the prototype:** final-10-seconds countdown urgency (pulsing red vignette, scale-pulsing timer, per-second tick + camera shake, big popping numbers — `UrgencyOverlay.ts`, new), floating "+N ★ ×combo" hit-feedback text (`FloatingText.ts`, new) on every level-up plus obstacle SHOO!/QUACK! reactions, combo-streak camera shake, and a visually denser water stream (`FIRE_DENSITY_SCALE` — fires 4× more/smaller particles at the same total DPS/drain, so tuned balance is untouched but the stream reads as continuous instead of discrete pulses).
- **The power-up system, which didn't exist:** `PowerUp.ts` was a literal empty stub despite `powerup.data.ts` already documenting all 5 effects verbatim from the prototype, and GameScene had zero references to it. Implemented fully — `PowerUpSpawner.ts` (spawn/lifetime/collision, kept out of the already-over-300-line GameScene) plus all 5 effects wired in (Super Soaker, Turbo Pump, Spin Lock, Golden Splash, Double Stars).
- **Gun visual differentiation:** `GunDef.type`/`sz` were dead fields nothing read — every gun fired an identical blue dot. Added `particleColour` (escalating through the existing palette) and wired both fields into `WaterParticle`/`spawnSplash`, so Inferno now visibly shoots fire-orange and Splash Jr pink.
- **Spinner juice + per-world theming:** a spark burst (`spawnSparks()`) on every level-up, and `SPINNER_PALETTE_BY_WORLD` — spinner types are shared/reused across worlds, so a per-world recolour (wood/brass Workshop, pastel Kitchen, carnival Funfair, neon Disco) is what actually makes them feel specific to the world they're in.

Then a third wave, again from direct user feedback — that spinners "just look like generic shapes" and had to sit "in natural positions like they fit in naturally eg on the fence or the disco ball," matching each scene's style so they "feel native not add on":

- **Gun feel, beyond colour:** multi-stream guns now offset their streams to real barrel positions (`BARREL_SPACING_PX`) rather than wobbling off one shared point, an opening **blast surge** fires on the rising edge of every press (3× streams + a small camera kick), and the tank running dry ends in a weak **splutter** of three short dying spurts instead of silence. Per-gun particle radius/colour escalate through the tier ladder.
- **Bespoke per-world spinner objects:** Garden daisy, Workshop saw blade, Kitchen whisk + citrus slice, Funfair candy swirl, Disco vinyl record — `SpinnerDef.style` is now genuinely separate from `SpinnerDef.type`, so only the drawing changes and every mechanical value (decay/power/blades/deflects) stays exactly as tuned. `WORLD_TYPE_PALETTE` recolours one type inside one world where the world-wide palette doesn't carry the right colours.
- **Native integration, which was the actual complaint:** every shape fills-and-outlines in Ink and drops a contact shadow to match the backgrounds' own thick-outline illustration style; the cream wall scrim is gone entirely (it *was* the pasted-on look) and `DIM_BY_STATE`'s floor rose 0.38 → 0.6 so idle spinners stay coloured against full-vibrancy art; and each world mounts its wall on its own art via `WorldDef.wallArea` — Garden's fence panel, Workshop's pegboard, Kitchen's shelf + backsplash, Funfair's tent canvas, Disco's back wall — instead of one generic rectangle that left spinners floating over sky, shelves and floor depending on the scene.
- **Funfair needed more than that:** its tent stripes run at the same spatial frequency as a spinner's blades and swallowed them whole, so Funfair spinners mount on shooting-gallery **target boards** — the one backing that reads as a fairground object rather than a UI panel.
- **`fitScaleForGrid()`** keeps the largest spinner inside its own grid cell, fixing visible overlap in all three 4-row worlds (Kitchen/Funfair/Disco). It only ever scales down, so worlds with room to spare keep their tuned radii untouched.
- **Per-world easter eggs:** a rare (10% of level-ups) world-specific shout + confetti burst — BLOOM! / CLANG! / SIZZLE! / TA-DA! / GROOVY!. Keyed off level-ups, not hits, so it stays a surprise instead of becoming wallpaper.

All of the above is live-verified (see individual commit messages for exact test steps) and the full pipeline is green. Sprint 4's 12-stem orchestra remains blocked on the audio source decision (§9.3); cross-browser/real-device testing (7.2) still needs actual devices; studio name (7.0) needs the user. Everything else is unblocked and this session kept moving through it autonomously per explicit standing instruction.

> This file is the live tracker. CLAUDE.md §13 is the immutable plan.
> Update this file as work progresses; only edit CLAUDE.md when re-planning.

---

## Status overview

| Sprint | Goal | Status |
|---|---|---|
| Sprint 0 | Foundation — empty scenes, working SDK, build pipeline | ✅ Done |
| Sprint 1 | Walking Skeleton — playable end-to-end with placeholders | ✅ Done |
| Sprint 2 | Visual Design System — premium look with procedural graphics | ✅ Done |
| Sprint 3 | Sprite Pipeline — real granny/gun/world art wired in | ✅ Done |
| Sprint 4 | ASMR Orchestra — layered audio | ✅ Built (4.1–4.5) with synthesised placeholder voices; 4.6's human playtest outstanding |
| Sprint 5 | Splash Screen + Unlocks + all 5 Worlds (re-planned 2026-09-11) | ✅ Done |
| Sprint 6 | Monetization Polish | ✅ Done (mobile controls gap closed 2026-09-11 — see below) |
| Sprint 7 | Launch Polish + Poki submission | 🟡 In progress — all 10 §12 must-fix now pass; blocked only on studio name, real devices, submission |
| Sprint 8 | First-run onboarding (§6.5) + launch assets | ✅ Done (added 2026-09-12, not in the original plan) |

---

## Blockers / parked

- ✅ **Audio approach decision** — resolved 2026-09-12 by taking §9.3's own option 4 (placeholder for v1), synthesised in Web Audio rather than sourced, so the headline feature stopped being a stub without spending the user's time or money. Upgrading to real stems later is a one-file swap and remains genuinely open — see Sprint 4, story 4.1.
- ⏳ **Studio name** — needed before Poki Developers profile creation (Sprint 7).
- ✅ **Granny + gun art** — resolved 2026-09-11. Delivered as a 3-pose set per granny (front/back/back_firing — see the Sprint 3 re-plan note for why, not the original 5-pose turnaround) + 6 guns × 8 angles + anchor.json, all wired into `Granny.ts`/`Gun.ts` and verified live.
- ✅ **World background art** — resolved 2026-09-11. All 5 illustrated world backgrounds delivered and wired via `worldBackgrounds.ts`'s `WORLD_BG_ASSETS` registry; procedural drawers remain only as the no-art fallback path.

## Known issues (non-blocking)

- ⚠️ **`GameScene.ts` is 623 lines, against CLAUDE.md §7.3 rule 1's 300-line cap.** Down from 934 on 2026-09-12 by extracting `wallBuilder.ts` (WorldDef → live spinners/obstacles), `GoldenSpinnerSpawner.ts` (the bonus spawn's whole lifecycle) and `WaterCannon.ts` (fire cadence, stream geometry, tank, pump) — joining the earlier `PowerUpSpawner.ts` and `UrgencyOverlay.ts`. What's left is genuinely orchestration plus two more separable clusters: water/spinner collision resolution with combo + scoring, and power-up effect application with its four timers. Extracting both would land it near 450 — the last stretch to 300 would mean splitting the round lifecycle itself, which is the one thing a scene legitimately owns.

(The cog dead-zone vs. auto-aim bug tracked here since Sprint 1 — "not reachable, Garden has no cog" — became reachable when Workshop/Kitchen shipped 2026-09-11, and was fixed the same day: see `resolveFireAimPoint()` in `src/entities/waterParticle/WaterParticle.ts`, verified live — a dead-centre-locked cog now reaches FULL in ~2s of continuous fire instead of never.)

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

> **Re-plan (2026-09-11):** delivered art landed as 3 poses per granny (`front`/`back`/`back_firing`), not the originally-speced 5-pose turnaround set (`front`/`front_firing`/`three_quarter`/`side`/`back`) — see CLAUDE.md §14's camera re-plan: the player stands behind Granny, so gameplay only ever needs a back view, and `front` alone covers the splash-carousel portrait. The turnaround set (3/4, side) was speced before that camera decision existed and is no longer needed. Guns shipped as originally speced (8 angles + anchor.json × 6 guns), but via a different pipeline than §8.3.1 describes: the user generated one locked 0° image per gun (no separate reference-lock step), and the other 7 angles were produced by mechanically rotating that single image with PIL rather than re-prompting Nano Banana per angle — more reliable than AI rotation-on-request, which was tested and found unreliable (a 45°-rotation prompt came back nearly identical to 0°).

- [x] **3.1** Lock Classic Granny standing + firing as style template — delivered as `front`/`back`/`back_firing`, palette/outline/scale consistent across the roster (see re-plan note above)
- [x] **3.2** Generate remaining 2 Granny standing + firing variants from template — Squirt Sister + Punk Granny delivered, same 3-pose set, consistency review passed live in-browser
- [x] **3.3** Lock Drip Pistol 0° as gun style template — delivered, outline weight matched to grannies
- [x] **3.4** Generate 8 angles for Drip Pistol + author `anchor.json` — 8 PNGs via mechanical PIL rotation of the locked 0° image (see re-plan note); anchor.json nozzle coordinates computed automatically (extremal-alpha-pixel-along-aim-direction, not hand-picked)
- [x] **3.5** Build small HTML anchor-picker tool — superseded: automatic anchor computation (see 3.4) made manual picking unnecessary, no tool built
- [x] **3.6** Generate remaining 5 guns × 8 angles + anchor data — all 6 guns × 8 angles (48 PNGs) + 6 `anchor.json` delivered and processed
- [x] **3.7** Implement `Granny.ts` sprite-based rendering — done 2026-09-11. Swaps `back`/`back_firing` textures on fire state, idle breath tween preserved from the placeholder version, `getGunGripOrigin()` exposes the hand anchor for Gun.ts. Live-browser-verified: idle pose, firing-pose swap, and idle-breath all confirmed working for Classic Granny/Drip Pistol.
- [x] **3.8** Implement `Gun.ts` with 8-angle rotation logic — done 2026-09-11. Snaps to nearest of the 8 pre-rotated angle sprites from live aim direction; `getNozzleWorldPosition()` (reading anchor.json) replaces the old generic gun-origin point as GameScene's water-particle spawn source. Live-verified rotating correctly across multiple aim directions and firing real water particles from the nozzle.
  - **Bug caught + fixed during verification:** the hand-grip offset (`getGunGripOrigin()`) was originally computed against Granny's vertical *centre* rather than her feet, so the gun rendered up near her hair instead of in her hands. Re-derived from her feet position; the correct "up from feet" fraction (~58%) was pixel-measured against the real `back_firing.png` art rather than guessed, since her actual proportions (large stylised hair, short legs) don't match a generic humanoid assumption.
- [x] **3.9** Optimise all PNGs — done via a custom pipeline (checkerboard-background removal + palette quantisation with explicit alpha preservation, `quantize_preserving_alpha()`) rather than pngquant specifically. *(2026-09-12: `tools/sprite-optimise.sh` was still a stub printing "not yet implemented" while this story read as done — now a real script, wired to `npm run optimise`. Re-measured: a lossless re-encode of every sprite saves **0 bytes**, confirming the art is already at the floor for RGBA PNG; going further needs a lossy step that would damage the soft outlined edges. So the script's real job is the size guard — it fails if `public/sprites/` grows past 5.47 MB, so a future art drop can't silently eat the §3 rule 2 headroom between budget runs. Currently 4.80 MB, 688 KB of headroom.)* Total sprites: 5.3 MB (grannies 1.8 MB, guns 1.8 MB, worlds 920 KB, UI 776 KB) — above the original "<1 MB" placeholder-art target, but expected once real illustrated art replaced flat-colour placeholders; full build is still 6.29 MB against the 8 MB Poki cap (1.71 MB headroom), so this isn't a budget risk.
- [x] **3.10** Stress-test at 640×360 — live-verified 2026-09-11: both SplashScene (title lockup, all 3 carousels) and GameScene (background, spinners, Granny + Gun, HUD) render crisp and fully legible at Poki's smallest canonical size, nothing cropped or illegible.

**Exit criteria:** ✅ Met. Game looks like a finished product — real sprite art carries the visual identity across splash and gameplay. 65 launch sprites delivered (9 granny poses + 48 gun angles + 6 anchor.json + 2 title images; the original "54" count assumed 5 poses/granny, superseded by the 3-pose re-plan above).

---

## Sprint 4 — ASMR Orchestra (1.5 weeks)

The headline feature. Layered music that builds with player progress.

- [x] **4.1** Audio source decision — **resolved 2026-09-12 by taking CLAUDE.md §9.3's own option 4 (placeholder for v1), synthesised rather than sourced.** The four shortlisted paths all needed either the user's time or money before a single note could exist, and the game's headline feature was sitting as a one-line `export {}` stub as a result. `orchestraVoices.ts` synthesises all 11 layers in Web Audio to §9.3's exact brief (96 BPM, 2.5 s bar, A minor) — zero asset-budget bytes, and it keeps the real decision genuinely open rather than pre-empting it: swapping in commissioned or royalty-free OGG stems later replaces that one file, because `updateMix()` never looks at how a layer makes its sound.
- [x] **4.2** Implement `AudioOrchestra.ts` mixing class — done. One `GainNode` per layer through a shared limiter + trim, `setTargetAtTime` at §9.2's 250 ms for click-free gain changes. Sync is structural rather than managed: every bar of every layer is scheduled off the same `_nextBarTime`, so layers are sample-aligned by construction and a silent layer is skipped entirely instead of burning oscillators inaudibly.
- [x] **4.3** Wire orchestra to *each spinner's own* charge level, continuously — done, per CLAUDE.md §9.1.1 (2026-09-11 refinement, requested by the user: "each spinner is an instrument"). Not `FrenzyMeter` population thresholds — a spinner's `currentSpeed / MAX_SPINNER_SPEED` directly drives its assigned layer's gain every frame, off the same spinner list the Frenzy meter reads. Assignment is `spinnerIndex % 9`, fixed for the run, so the same wall position always plays the same instrument; where spinners share a layer the loudest wins, so doubling up reinforces that instrument instead of the last spinner in the array silencing the others. FrenzyMeter's `full` event drives the two Frenzy-exclusive layers (drop bass sustain + cinematic hit one-shot).
  - **Verified live** (Garden and Disco, via manual frame-stepping): 11 layer gains built; bars scheduling continuously; 4 charged spinners raise exactly their 4 layers and no others; 20 charged raise all 9 plus the drop bass; clearing all charge returns every layer to silence — the ASMR payoff falling out of the model rather than from separate fade logic. Master peak measured through a full Disco Frenzy: 0.284, no clipping.
- [x] **4.4** Implement `AudioBus` master mute + fade on ad — done. Single shared `AudioContext` + master `GainNode` (`src/audio/AudioBus.ts`), `fadeOut(100)`/`fadeIn(300)` linear ramps, `AD_MUTE_HOOKS` wired into all 3 `adManager.play*()` call sites (SplashScene commercial break, GameOverScene double-score reward, GameScene mid-run refill reward) plus `_pauseGame()`'s fade-out. `init()` called from `GameScene._onFirstInput()` — a real user gesture, per browser autoplay policy.
- [x] **4.5** Port one-shot SFX from prototype synth code into `SFX.ts` — done. `src/audio/SFX.ts`: `scheduleTone`/`playTone`/`playSequence` primitives ported from the prototype's synth recipes, plus `playHit` (pitch scales with spinner speed), `playCombo`, `playUpgrade`, `playPump`, `playRefill`, `playDeflect`, `playFrenzy`. Wired into `GameScene.ts` at every trigger point (water-spinner collisions, combo increments, spinner state-tier upgrades, pump empty/refill, deflect, frenzy start). No licensed assets needed — pure Web Audio synthesis — so this shipped independently of the 4.1 audio-source decision.
  - **Verification note:** live-tested in Chrome by driving the real splash→play→first-click flow (not just unit tests) and confirmed end-to-end: `AudioContext` construction (proxy-patched `window.AudioContext` to intercept), `audioBus.ready` becoming `true` inside the actual imported module SFX.ts uses, and a real `AudioContext.prototype.createOscillator` call firing from `SFX.playHit()`. An earlier debugging session showed `audioBus.ready: false` when checked via a fresh ad-hoc `import('/src/audio/AudioBus.ts')` from the browser console — traced to Vite HMR module-versioning (a bare dynamic import resolving to an orphaned module instance distinct from the one already wired into the live game after a mid-session file edit), not a code bug. Confirmed via prototype-patching (`AudioContext.prototype.createOscillator`), which is instance-agnostic and unambiguous.
- [ ] **4.6** Playtest: does it feel like ASMR? — 5-person test, ≥4/5 say "satisfying". Needs human ears; the mix is verified functionally (right layers, right levels, no clipping) but whether it *feels* like ASMR is exactly the thing that can't be asserted from a state dump. **This is the one thing the user should judge first.**

**Exit criteria:** Met on the build side — the orchestra exists, mixes per-spinner continuously, and is level-safe through Frenzy. 4.6's human playtest is outstanding, and the synthesised voices are a deliberate placeholder (4.1): if they don't land, the swap path is one file.

---

## Sprint 5 — Splash Screen + Unlocks (1 week)

Build the new SplashScene with Granny + Gun carousel.

- [x] **5.1** Implement `UnlockManager` system — vault, unlock validation, free grants, random-locked-gun picker, granny/gun selection gated on unlock state — 10 unit tests
- [x] **5.2** Build `Carousel.ts` reusable component — one class, used for the Granny, World, and Gun selectors on `SplashScene`
- [x] **5.3** Build `SplashScene` matching CLAUDE.md §10 mockup — title, vault display, three carousels, PLAY
- [x] **5.4** Wire unlock thresholds to vault total — locked items show a lock overlay + cost; tapping one *attempts to unlock* (spend + select on success, toast the shortfall on failure) — see the re-plan note below, this changed after 5.4 first shipped
- [x] **5.6** World-select carousel, all 5 launch worlds (re-planned 2026-09-11 — see CLAUDE.md §14) — Garden free from run one, Workshop/Kitchen/Funfair/Disco purchasable at 500★/1,000★/1,500★/2,000★
- [x] **5.7** Create static + animated thumbnails — done 2026-09-12. `thumbnails/thumbnail-static.png` (512×384) and `thumbnails/thumbnail-animated.webm` (5 s, 512×384, no audio), both produced by `tools/generate-thumbnail.ts` from a live run, so they're reproducible rather than hand-made one-offs.
  - The blocker turned out to be imaginary. No encoder is needed: `canvas.captureStream()` + `MediaRecorder` records WebM in the browser itself, and a canvas stream carries no audio track, which is exactly Poki's "no audio" rule. The game is blitted into an offscreen 512×384 canvas inside Phaser's `postrender` (the WebGL buffer isn't readable any later — the renderer has no `preserveDrawingBuffer`), so the output is the right size with no post-processing.
  - The clip is scripted: Granny firing while the wall charges, tipping into SPLASH FRENZY at 3.1 s for the payoff. The still is grabbed at 2.6 s, deliberately *before* Frenzy — the screen flash washes the art out and the banner covers the wall, so the frame before is the better thumbnail.
  - Both live in a top-level `thumbnails/` folder, **not** `public/`: they're Poki dashboard uploads the game never requests, and shipping them inside `dist/` spent 742 KB of the 8 MB initial-download cap for nothing. See CLAUDE.md §7.1's re-plan note.
  - `npm run thumbnail` is still not wired: running this headlessly means taking on Playwright (plus its browser download) as a devDependency. That's a dependency call for the project owner, not one to make silently for a task that runs a handful of times before submission — so it stays a documented browser-console routine.

**Exit criteria:** ✅ Met in full (5.7 closed out 2026-09-12). Full game loop verified live end-to-end: splash → game (with the selected loadout actually passed through) → game over → splash, vault correctly shows the run's earned stars. Pipeline green throughout: lint, 35 tests, typecheck, build.

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

## Sprint 8 — First-run onboarding + launch assets (2026-09-12)

Not in CLAUDE.md §13's original sprint plan — these are §6.5 and §12 items that were speced but never built, found by reading the spec back against the code.

- [x] **8.1** Implement CLAUDE.md §6.5's tutorial-that-isn't — done. `§6.5` had been written but never built: there was no first-run hint, no ghost finger, and no save flag to hang either on. Now `SaveData.hasPlayed` (defaults false; existing saves pick it up through `SaveManager`'s default-merge, so no migration) drives two things and nothing else — one line on the splash naming the verb, and a looping ghost-finger tap on the spinner nearest the middle of the wall, dismissed the instant the player fires.
  - The splash hint and the rewarded-ad row **swap** rather than stack: there's no free vertical band between the loadout card (ends at y 575) and the bottom edge, and squeezing both in put the hint over PLAY's own top edge and pushed the ad row flush to the canvas edge. Swapping also means a brand-new player's first impression is a line telling them what to do rather than an ad offer for a gun they have no context for.
  - The hand went through two rejected drawings before it read: at ~40 px over illustrated fence art a small tilted hand looked like two floating white pills. It's now upright, larger, with the palm clearly wider than the finger — and a Mint Green ring contracts onto the target as it comes down, which is the part that actually reads at this size.
  - **Bug found and fixed by live-testing rather than by the type checker:** dismissing destroyed the rings while their radius tweens were still running, so the tween wrote to a dead Arc and threw inside `TweenManager.step` — taking every other tween in the scene down with it, including the hand's own fade-out, leaving the hint frozen on screen after the player had already fired. Rings are now tracked and their tweens killed before destruction. Verified: 0 leftover objects, no console errors, flag persists.
- [x] **8.2** Mobile move buttons met the minimum touch target — 72 logical px is ~37 CSS px on a 667-wide phone, under both Apple's 44 pt and Android's 48 dp. Now 96 (~50 px), higher contrast, clear of the water bar. Verified at 667×375 with touch reported.
- [x] **8.3** Performance re-check after the orchestra landed — worst case (Disco: 20 spinners, Soaker 3000 dual-stream, continuous fire, all 10 audio layers up, real Frenzy) measured with the orchestra on vs off: median frame delta 16.6 ms vs 16.7 ms, p95 18.9 ms vs 19.4 ms. The audio costs nothing measurable; scheduling runs off `setInterval` on the audio clock, not the render loop.

---

## Sprint 7 — Launch Polish (1 week)

Final QA pass and submission.

- [ ] **7.0** Decide studio name + create Poki Developers profile
- [x] **7.1** Test all canonical sizes — live-verified 2026-09-11 at 640×360, 836×470, and 1031×580 (not through Poki Inspector itself, which needs an uploaded build — verified via the dev build at each exact viewport instead). Both SplashScene (title lockup + all 3 carousels) and GameScene (multiple granny/gun/world combos, including Punk Granny + Inferno + Disco) render crisp with no cropping or overlap at every size.
- [ ] **7.2** Cross-browser smoke test (Chrome, Firefox, Safari, iOS, Android) — needs real devices/browsers beyond this environment's Chrome-based preview; not yet run
- [x] **7.3** Incognito mode test — live-verified 2026-09-11: patched `Storage.prototype.getItem`/`setItem` to throw `QuotaExceededError` (matching Safari private-mode/storage-denied behaviour) and called the live `SaveManager` module directly — `load()` returns clean defaults, `save()` silently no-ops, neither throws. Confirmed `SaveManager.ts` is the sole `localStorage` call site in `src/` (`grep -rn localStorage src/` outside that file returns nothing), so this coverage extends to the whole app, not just SaveManager's own unit tests.
- [ ] **7.4** Performance pass — 60fps on mid-range mobile; profile and optimise particle pool sizes. *Partial:* ran a 5-simulated-second continuous-fire stress test (Soaker 3000, dual-stream, sweeping aim, Funfair's moving targets active) via manual frame-stepping — averaged ~9.4ms of real compute per simulated frame on this dev machine, comfortably inside a 16.6ms/60fps budget, pool stayed capped well under `WATER_PARTICLE_MAX_POOL` (14/50 used), no console errors. This is a desktop-headless proxy, not a real mid-range-mobile profile — actual device testing still needed before this can be checked off.
- [ ] **7.5** Run full pre-submission checklist (CLAUDE.md §12) — walked all 18 items against the actual code 2026-09-11. **all 10 must-fix pass** as of 2026-09-12 (thumbnails, #9, were the last one outstanding):
  1. ✅ Bundle Phaser locally — npm dependency, `vite.config.ts` has `external: []`, confirmed zero external requests besides the Poki SDK script itself
  2. ✅ PokiSDK script + init + all events — script tag in `index.html`; `poki.ts` wraps all 6 (`init`/`gameLoadingFinished`/`gameplayStart`/`gameplayStop`/`commercialBreak`/`rewardedBreak`/`movePill`)
  3. ✅ `preventDefault` for arrows + space — was LEFT/RIGHT/SPACE only; extended to all 4 arrows (2026-09-11) since an unbound UP/DOWN press could still scroll the page
  4. ✅ `gameplayStart()` on first input — `GameScene._onFirstInput()`, never on scene load
  5. ✅ `commercialBreak()` between runs — `SplashScene._onPlay()`, gated on `adManager.shouldShowCommercialBreak()`
  6. ✅ Audio mutes during ads — `AD_MUTE_HOOKS` wired into every `adManager.play*()` call site (Sprint 4)
  7. ✅ Incognito mode — see 7.3
  8. ✅ `PokiSDK.movePill(0, 24)` — called in `main.ts`'s `boot()`
  9. ✅ Static + animated thumbnails — built 2026-09-12 via `tools/generate-thumbnail.ts`; see story 5.7
  10. ✅ No studio splash screens — boots straight from a loading bar (no logo/branding) into SplashScene
  - Should-fix: ✅ #11 (3 canonical sizes, 7.1); **#12 partial** — ESC pauses correctly, but Space is bound to auto-fire toggle per §6.2's own spec, not pause — the checklist's generic "ESC and Space pause handlers" phrasing doesn't quite match this game's deliberate accessibility design, flagging rather than silently marking pass/fail; #13 N/A (no cutscenes exist); ✅ #14 (icon-driven UI, no reading required during play, per §6.5); #15 N/A (no text input feature exists to filter)
- [ ] **7.6** Submit to Poki for Developers — Game uploaded to Inspector, review requested

**Exit criteria:** Game submitted to Poki. Ready for player-fit testing.

---

## Post-launch backlog

### First content drop (v1.1) — content cut from launch scope

- [x] ~~**C1** Workshop world~~ — pulled into v1 launch scope 2026-09-11 (CLAUDE.md §14 world-scope re-plan); shipped, unlocks at 500★
- [x] ~~**C2** Disco world~~ — pulled into v1 launch scope 2026-09-11; shipped, unlocks at 2,000★
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
- [x] ~~**P3** Funfair + Kitchen worlds~~ — pulled into v1 launch scope 2026-09-11 alongside C1/C2; both shipped (1,500★ / 1,000★)
- [ ] **P4** Localisation (FR, ES, DE, PT, NL, BR) — after web-fit test passes
- [ ] **P5** Seasonal Granny variants (Halloween, Christmas)
- [ ] **P6** Speedrun leaderboards (Poki Accounts)
- [ ] **P7** Additional grannies (Queen, Disco, Santa, Astro, Pirate, Cyber)
- [ ] **P8** A/B thumbnail tests (built-in Poki tool)
