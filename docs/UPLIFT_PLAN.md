# Granny's Spin Splash — Uplift Plan

**Written:** 2026-11-25 · **Owner:** autonomous build, check-ins at phase ends
**Goal:** turn solid foundations into something extraordinary, then submit to Poki.

This plan replaces nothing in `CLAUDE.md`; it sequences the work that closes the
gap between what the spec promises and what the game delivers today. Progress
is tracked in `BACKLOG.md` under "Uplift".

---

## 1. Honest assessment (played 2026-11-25)

| Area              | What is there                                                  | Why it reads as primitive                                                                                                                                                                                                                                       |
| ----------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Orchestra**     | 9 looping oscillator "voices" per world, gain = spinner charge | Every instrument is a raw sine/triangle/saw with one envelope. Each loops **one bar over one unchanging chord** — no progression, no melody, no phrasing. Hitting a spinner only moves a volume fader, so **nothing musical happens at the moment you squirt**. |
| **Squirt sound**  | A 35 ms triangle blip, rate-limited                            | There is no sound of water at all — no spray, no splash. The "ASMR" half of the pitch is missing.                                                                                                                                                               |
| **Water**         | Small separate dots                                            | Does not read as a jet of water. It is the thing the player does for 30 seconds and it has the least visual weight on screen.                                                                                                                                   |
| **Spinners**      | Small procedural shapes, muted when stopped                    | No ink outline, so they look pasted onto painted backgrounds that all have bold outlines. Stopped spinners nearly vanish against the fence. Nothing shows that a spinner _is_ an instrument.                                                                    |
| **Hit feedback**  | 6 dots, floating text on level-up                              | No squash, flash, splash ring, or beat-synced reaction.                                                                                                                                                                                                         |
| **Session depth** | One 30 s round, then back to the menu                          | Poki's first gate needs **average playtime over 3 minutes and 25% of plays over 3 minutes** — at least six rounds per sitting. "PLAY AGAIN" currently detours through the splash screen, and there is no round-to-round goal pulling the player on.             |

The foundations are sound: clean build, 35 passing tests, all ten Poki must-fix
rules met, real painted art for grannies, guns and worlds, working unlock
economy and SDK wiring.

---

## 2. Design pillars

1. **Every spinner is a musician.** Each grid position is a named orchestral
   instrument playing a written part of a real piece. Waking a spinner brings
   that musician in; a full wall is a full orchestra.
2. **Squirting plays the instrument.** While water lands on a spinner, that
   instrument plays notes immediately — quantised to the beat and drawn from
   the current chord, so it is impossible to sound wrong.
3. **You can see the music.** Spinners pulse on their own notes, throw off
   note particles, and the wall visibly comes alive as the arrangement fills.
4. **Water feels like water.** A continuous jet, real splash, real spray sound.
5. **One more go.** Thirty seconds must end with a reason to press play again.

---

## 3. Phase A — The Spinner Orchestra (headline feature)

### A1. Real instruments

- Source: **VSCO-2 Community Edition** (CC0, github.com/sgossner/VSCO-2-CE).
  Approved by David 2026-11-25.
- `tools/build-orchestra-samples.*` downloads a fixed manifest of notes, trims,
  normalises, resamples to mono, and packs them into **one audio sprite**
  (`public/audio/orchestra.mp3` + `orchestra.json` offsets). Raw downloads stay
  out of git (`.cache/`); the manifest and the script are committed so the
  build is reproducible.
- Budget: **≤ 1.0 MB** shipped (headroom today is 1.62 MB under Poki's 8 MB).
- Palette (about 20 instruments, 2–4 notes each, pitch-shifted ≤ ±3 semitones):
  contrabass pizz · cello pizz · cello sustain · viola sustain · violin
  sustain · violin spiccato · violin pizz · harp · flute · clarinet · oboe ·
  bassoon · french horn · trumpet · trombone/tuba · glockenspiel · marimba ·
  xylophone · timpani · bass drum · snare · cymbal · triangle · shaker.

### A2. Engine (`src/audio/`)

- `SampleBank` — loads and decodes the sprite, slices per-note buffers.
- `Instrument` — nearest-sample lookup, playback-rate pitch shift, per-note
  envelope, velocity, stereo pan. A synthesised fallback keeps the game
  musical if the sprite fails to load.
- `Conductor` — single Web Audio clock, 16th-note grid, lookahead scheduler.
  Replaces the per-bar voice scheduler in `AudioOrchestra`.
- `Score` (one per world) — key, tempo, an 8-bar chord progression, and a
  written part per musician. Parts are expressed against chord tones and scale
  degrees so they stay consonant by construction.
- **Tiers, not just volume:** STOPPED silent → SLOW plays a thinned part
  softly → MEDIUM plays the full part → FULL adds ornament and octave
  doubling. Gain still breathes with charge inside each tier.
- **Spray notes:** water landing on a spinner plays that instrument on the
  next 16th, stepping through the current chord. Voice-capped and arpeggiated
  so a wide gun never clumps.
- **Seating:** each musician is panned by its spinner's x position.
- **Frenzy:** timpani roll and rising run into a one-beat breath, then crash,
  brass fanfare and tutti on the downbeat; glockenspiel runs on every hit for
  the window. Round end lands a final chord on the next beat.
- **Final ten seconds:** driving percussion joins regardless of wall state.
- Shared reverb, limiter and ad-mute behaviour are kept.

### A3. Water and hit sound (the ASMR layer)

- Continuous spray while firing (shaped noise, per-gun colour), soft splash on
  impact, droplet plinks. Sits under the music; never louder than it.
- Replaces the triangle blip. Combo, upgrade, refill and pickup one-shots are
  re-voiced with real instruments in the world's key.

### A4. Five scores

Garden (pastoral: flute, harp, strings) · Workshop (clockwork march:
pizzicato, bassoon, xylophone) · Kitchen (playful: clarinet, marimba,
triangle) · Funfair (circus: tuba, piccolo-register flute, snare, cymbal) ·
Disco (disco strings, four-on-the-floor, brass stabs).

### A5. Verification

- Offline render of every score at 0, 25, 50, 75 and 100% of musicians: peak,
  RMS, clipping, silence gaps, per-part balance.
- Unit tests for chord/scale maths, grid quantisation, tier selection.
- Live playtest per world. **Limit stated plainly: I can measure audio but not
  hear it. David's ears are the final sign-off.** A dev-only sound-check page
  (solo/mute each musician) ships with the phase so feedback can be specific.

---

## 4. Phase B — Juice

- **Water jet:** continuous tapered ribbon with highlight and trailing
  droplets in place of dots; nozzle flare; recoil on the gun and granny.
- **Impact:** splash ring, gravity droplets, spinner squash and white flash,
  wet sheen.
- **Spinners:** bold ink outline and cel highlight to match the painted art;
  readable when stopped; tiered glow; motion-blur disc at FULL; pulse on each
  note played; floating note particles; the instrument's name floats up the
  first time a musician joins.
- **Wall-wide:** background pulse on the beat, HUD copy "n of 12 playing".
- **Frenzy:** hit-stop and zoom punch on the drop, light rays, confetti,
  granny celebration.
- All effects pooled and capped; verified against the 60 fps budget.

Hand-painted spinner sprites would lift this further but need David's art
pipeline; a `SPINNER_ART_BRIEF.md` is written as part of this phase.

---

## 5. Phase C — Assess, research, backlog

- Full playthrough of all five worlds on desktop and phone viewports.
- Score the game against Poki's published criteria (first seconds, conversion
  to play, playtime, load, rewarded-ad rules, thumbnail).
- Write the prioritised enhancement backlog into `BACKLOG.md`.

Candidates already identified:

| Idea                                                               | Why                                                                                              | Size |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ---- |
| One-tap replay from the results screen                             | Removes the largest friction between rounds                                                      | S    |
| Round goals ("wake 8 musicians", "reach Frenzy") with star rewards | Gives every round a target                                                                       | M    |
| Concert ladder: start as a quartet, add musicians level by level   | Fixes onboarding and gives real progression; **changes core structure — needs David's approval** | L    |
| Free-play "rehearsal" mode, no timer                               | Pure ASMR, long sessions                                                                         | M    |
| Orchestra album: musicians collected per world                     | Visible long-term goal                                                                           | M    |
| Results screen replays your orchestra                              | Ties score to the music                                                                          | S    |
| Rewarded-ad options that meet Poki's rules                         | Monetisation                                                                                     | S    |
| Restore ads, real-device pass, sourcemap out of the build          | Submission blockers                                                                              | S    |

---

## 6. Phase D — Relentless uplift loop

Repeat until the backlog's top tier is empty: pick the highest-value item →
build → lint, test, build, budget → live playtest → commit and push → log.
Stop and check in for: structural product decisions, anything needing art or
real devices, or spending money.

---

## 7. Working rules

- **Models:** Fable for design, composition, architecture and review; cheaper
  models for mechanical work (sample pipeline, refactors, lint, small fixes).
- **Publishing:** commit and push at each verified checkpoint (approved
  2026-11-25); every push rebuilds the GitHub Pages test link.
- **Budget:** `npm run budget` must pass on every checkpoint.
- **Spec drift:** `CLAUDE.md` §9 is updated to describe the shipped engine.
- **Before submission (not part of this plan's autonomy):** studio name,
  `ADS_ENABLED = true`, real-device testing.
