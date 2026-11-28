# Brief for the next session (written 2026-11-28)

David's weekly usage was nearly spent when this was written, so the three jobs below were not started.
They are for a **fresh session on a cheaper model**. Do the jobs in the order they appear; the
last (ten more worlds) is by far the largest and can run over several sessions. Read `CLAUDE.md` first (source of truth; the
architecture rules are in §7.3; the status paragraph at the top says what David has and has not played).

## How to work

- Economically: do the work yourself; at most one subagent at a time, and only for a clearly separable
  piece; do not re-read large files; keep reports short.
- Pushing to `main` at each verified checkpoint is approved (every push redeploys the test link on
  GitHub Pages). Stage files by name. End commit messages with the attribution line the session gives.
- David paints art with Nano Banana from prompts. When a painting is needed, write the prompt **and send
  the reference image file with it**, one prompt at a time.
- Checking in the browser pane: the dev server is `npm run dev -- --port 5199`. The game loop must be
  stepped by hand: after each navigate wait 3 s, then run
  `const g = window.__gameForDebug; clearInterval(window.__drv); window.__drv = setInterval(() => g.loop.step(performance.now()), 16);`
  Test links: `?venue=<id>&gig=<n>` and `?jam=<id>`. `localStorage.__devMute = '1'` mutes the dev build;
  leave it muted unless David asks to hear something.
- Checks before every commit: `npx tsc --noEmit`, `npx vitest run`, `npx eslint src tests`,
  `npx prettier --check src tests`, `npm run build && npm run budget`.
- Say plainly what you could not check: you cannot hear sound, and the browser pane is not a real phone.

## Job 0 (small, do first): keep the Golden Spinner but make it look and aim right; a light touch on treats

David first asked (2026-11-28) to remove the Golden Spinner and slow the treats down, then corrected
himself the same day after watching his seven-year-old: the boy **does** catch the treats as they fly
across, and **does** grab the extra spinners as they appear. So the mechanics work for a real player and
stay. What remains true from David's first note: the Golden Spinner "looks a bit crap" (it is drawn in
the old procedural style beside painted visitors), and "your aim snaps to the nearest actual spinner"
when you go for it.

- **Golden Spinner: keep the idea, fix the look and the aim.** It stays a bonus target that appears for
  a few seconds and pays when hit. Make the aim take it the way it takes a visitor (it should be in the
  points FireControl checks before instruments, with the visitor lock in `src/utils/shotLock.ts` so the
  shots fly over instruments), with a clear ring on it. For the look, ask David for one painted picture
  (give him a prompt and a reference: a gleaming golden gramophone record or golden bell, in the style
  of the treats sheet) and mount it like the visitors' art; until it arrives, leave the current drawing.
  Do not change how often it appears or what it pays.
- **Treats: do not slow them or make them hover.** Only make the aim a little more willing to take one:
  a treat within about 110 px of the pointer takes the aim before an instrument does. Check that this
  does not pull the aim off an instrument the player is clearly on (the pointer inside that
  instrument's body keeps the instrument).
- The five power-up pickups (`src/entities/powerup/`): leave them; just tell David whether they have
  the same aim problem.

## Job 0b (small): cut the leftover white out of the visitors and treats

David, 2026-11-28: "some of the treats and visitors, specifically the golden watering can, have white
parts that haven't been cut out properly: the inside of the handle and one other place. Make sure
they're all properly cut out, including the details."

The same thing was done for the guns on 2026-11-27 (see the `holes` seeds in `tools/gun-sheets.json` and
`punch_holes` in `tools/slice-instrument-sheet.py`): the slicer removes white by flood-filling from the
picture's border, so white enclosed by an outline (inside a handle, a loop, a gap between parts)
survives. Do it for all 24 visitors (`tools/visitor-sheets.json`, sheets in `_art_inbox/visitors/`,
pictures in `public/sprites/visitors/`):

- Let the visitors set take a `holes` option like the guns' (seed points per id in the 256x256 picture).
- For every visitor, list the enclosed near-white regions, make a contact picture on a coloured
  background, **look at it**, and decide region by region: background showing through (cut: handle
  loops, gaps between a strap and a body, between balloon strings, inside a net's mesh if it is plain
  white) or paint (keep: eyes, teeth, highlights, cream cloth such as the bloomers, sail and tea towel,
  the compass dial, white feathers). When unsure, keep: a leftover gap is a blemish, a hole in paint is
  damage.
- Re-cut with `npm run visitors`, check on green and on Ink that every cut is clean and nothing painted
  is gone, and confirm with `git status` that only the intended pictures changed.
- Then give the 36 instrument pictures (`tools/instrument-sheets.json`) the same look-over and tell
  David what you find before cutting anything there: they sit on a cream disc, so enclosed white matters
  less, and the harp's strings and the whisk were left white on purpose.

## Job 0c (small to medium): make the Pirate Ship a real sea shanty

David, 2026-11-28: "Is there an opportunity to make the pirate ship a bit more of a sea shanty song? It
could even play the Drunken Sailor song, and could one of the instruments be a kind of sea shanty
singing?" David has now heard the current score (`src/audio/scores/ship.ts`): "it's fine, I just think we could do
better." So this is an improvement to something that works, not a rescue: keep what is good about it (the
stomp, the line-up order) and rework the tune and the refrain.

- **The tune.** "What Shall We Do with the Drunken Sailor" is a traditional shanty, long out of
  copyright, so its melody can be used. Rewrite the ship's score around it: the fiddle carries the
  verse tune, the tin whistle answers, and the whole band lands the "way, hey, and up she rises"
  refrain together (that is the Frenzy/finale material). It is in the Dorian mode (D E F G A B C), which
  the engine does not have as a mode, but those are the notes of C major: write the score with tonic C,
  mode major, over the chords Dm and C, and melodies in scale degrees stay in key. Keep the tests in
  `tests/unit/scores.test.ts` passing. On screen the song is never named and no words are shown or sung
  (the title mentions drink; a kids' game on Poki keeps it to the tune).
- **A singing seat.** One musician is the crew: "Hey!" and "Ho!" shouts on the stomps and a hummed or
  "oh"-sung line in the refrain. This needs recorded voices. First look in the approved CC0 sources
  (`APPROVED_SOURCES` in `tools/build-orchestra-samples.ts`: VSCO-2 CE, VCSL, the Karoryfer repositories)
  for a choir "ah/oh" or shouts and check each licence file before using anything. If nothing fits, ask
  David: he and his son can record four or five short clips on a phone ("Hey!", "Ho!", and a sung "oh"
  on three or four notes), which the sprite builder can pack as a new small bank (`tools/bands/`), with
  rights that are plainly his. Do not download voices from anywhere else. Until there are voices, a
  whistled line (a sine with vibrato, synthesised, no download) can stand in for the crew. The seat needs
  a picture: ask David for one painted icon (a singing sailor's hat or a megaphone) with a prompt and a
  reference.
- Measure loudness offline against the other bands as `CLAUDE.md` §9.8 describes, and tell David
  plainly that the new version has not been heard until he listens (`?jam=ship` plays the whole band with no clock).

## Job 1 (small): a granny joining should be an event, and changing granny should be one tap

David: "the shop is quite a few clicks away, and people never click in there to change the granny…
should we provide an alert or make it clear when a granny becomes available?" Grannies are not bought:
they join at star milestones (`src/systems/GrannyJoining.ts`, `src/entities/granny/granny.data.ts`), each
with a talent. Today a join is only a toast on the results screen, and switching needs the Shop.

- **Results:** when a granny joins, the "what next" slot shows a card for her (her front picture, name,
  talent in one line) with a **USE HER** button that equips her on the spot. It takes priority over the
  gun card and the new-world card for that one screen. Remove the toast.
- **Home:** tapping Granny opens a small picker of all six grannies: the ones the player has (tap to
  use, talent shown) and the ones to come ("Joins at 70 stars"). A "NEW" badge sits on Granny after a
  join until the picker has been opened. The line under her also names the next one:
  "Nana Joy joins at 40 stars (you have 31)".
- Jam mode does not apply talents yet (`src/scenes/JamScene.ts`): make it.
- "Big tank" (Nana Storm) does almost nothing, because every tank outlasts a gig. Replace it with
  something felt, e.g. a 25% faster refill pump, and say so on her card.

## Job 2 (small): guide players to the stars they have left, across all worlds

David: "kids can get stuck in a loop in one world… and forget that there are stars available in previous
worlds that they did when they were less skilled or had a less powerful gun. We need to guide them towards
gathering all the stars available so that they can move on to future worlds." Today `recommendedGig` in
`src/systems/Progress.ts` only looks inside one world; a finished world offers PLAY AGAIN.

- A tour-wide rule, pure and unit-tested: `recommendedStop(save)`. If the world the player is in still
  has an unplayed gig, that gig (progress first). Otherwise, if a locked world needs more stars, the gig
  with the fewest stars across **all open worlds**, earliest world first (old gigs are the easy stars
  with a better gun). Otherwise the next unplayed gig anywhere.
- **Results:** when the rule points to another world, the main button goes there and says so
  ("GARDEN · GIG 3"), with a line above it: "7 more stars open the Pirate Ship. 2 to win here."
  Never offer PLAY AGAIN on a three-star gig as the main button while stars are missing elsewhere.
- **Home:** PLAY follows the same rule (switching the selected world if needed). A world tile whose
  world has stars left shows them ("19 / 24") with a small marker; a finished world shows a tick. When
  a locked world is within reach, one line near the strip: "7 more stars open the Pirate Ship", and
  tapping it goes to the recommended gig.
- When every gig of a world reaches three stars, say so once on the results screen ("Garden complete!")
  and point at where the remaining stars are.

## Job 3 (large): fill the phone's screen, and play with the phone held upright

Today the game is a fixed 1280x720 canvas (`src/config.ts`, `Phaser.Scale.FIT`) and `index.html` has a
"portrait gate" telling an upright phone to rotate. Poki requires a mobile game to cover the whole screen
in portrait or landscape (both is best). David: "a lot of people won't want to" rotate. The game (a wall
above, Granny below, aiming upward with one thumb) suits portrait.

Check each step at 844x390 and 932x430 (landscape), 390x844 and 430x932 (portrait) and 1280x720 (desktop,
which must look exactly as it does today) with the browser pane's `resize_window`. Commit and push each
step and tell David what you saw before starting the next.

**Step 1, fill the screen in landscape.** Keep the logical height at 720 and let the logical width follow
the screen's shape between 1280 and about 1560, re-evaluated on resize. Backdrops
(`src/entities/world/worldBackgrounds.ts`, 1600x900) scale to cover. The band's wall stays centred.
Things pinned to an edge follow the edge (timer, coin pill, pause button); centred things stay centred.
Go through every use of `GAME_WIDTH` and decide whether it means "the canvas" or "the 1280 design
width"; add a small layout helper (live width, edges, centre) rather than scattering arithmetic.
`RENDER_SCALE` and `fitCameraToLogicalSize` must keep text sharp.

**Step 2, portrait for the core loop.** When the screen is taller than wide, use a 720-wide logical canvas
whose height follows the screen (1280 to about 1560), and remove the portrait gate.

- The gig (`src/scenes/GameScene.ts`, `src/scenes/game/`, `src/scenes/HUDScene.ts`, `src/ui/ScoreBar.ts`):
  the band in a narrower, taller grid from `src/entities/world/wallBuilder.ts` (3 or 4 columns), Granny
  bottom centre, the score plate across the top with the timer in or under it, the water bar along the
  bottom; the goal line, count-in, Big Finish and big-message stage centred on the wall. Visitors, the
  aim clamp (`src/utils/softAim.ts`) and the Pirate Ship's deck roll follow the new wall. Jam mode shares it.
- Results (`src/scenes/ResultsScene.ts`, `src/scenes/results/resultsLayout.ts`): the 760-wide column
  becomes 688 wide, the eight gig buttons in two rows of four.
- Home (`src/scenes/HomeScene.ts`): Granny and the gig card stacked, PLAY full width, the world strip
  showing three tiles at a time. Pause.
- Rotating between screens picks the other layout; rotating during a gig pauses it and lays the wall
  out again on resume.
- Each screen's portrait arithmetic goes in a pure layout module with unit tests like
  `tests/unit/resultsLayout.test.ts` (nothing overlaps, everything on screen, 16 px between stacked
  elements, touch targets at least 44 px).
- **Check `_art_inbox/worlds/` first:** David was given the prompt for the tall paintings on 2026-11-28 and
  may already have saved `garden_bg_tall`, `workshop_bg_tall`, `kitchen_bg_tall`, `funfair_bg_tall`,
  `disco_bg_tall` and `ship_bg_tall` there. Use what is there; ask only for what is missing.
- Backdrops: the six paintings are landscape, and cropping keeps only the middle third. For now scale to
  cover with the wall area centred, and ask David for a tall painting of each world (one prompt at a
  time, with the landscape painting as the reference image). Tall versions: `_art_inbox/worlds/<id>_bg_tall`,
  cropped to 900x1600, saved as `public/sprites/worlds/<id>_bg_tall.webp`, with a portrait wall area per
  world in `src/entities/world/world.data.ts`. Use the tall painting when present, the cover-crop otherwise.

**Step 3, portrait for the rest:** the Shop (`src/scenes/ShopScene.ts`, `src/scenes/shop/`), the Tour map
(`src/scenes/TourScene.ts`) and the gun reveal (`src/ui/GunReveal.ts`, `src/ui/reveal/`: gun above,
targets below).

After step 2, measure the Garden once in portrait with the balance bot (`src/dev/botSim.ts`:
`await __bot.ready()`, then its batch runner started without awaiting and polled, because browser tool
calls time out at about 45 s) and compare with the landscape figures in `docs/REWARD_LOOP.md`. Do not
retune without asking David.

**Done means:** on an upright and a sideways phone the game fills the screen with no bars, no rotate
prompt, nothing overlapping or cut off on any screen; desktop at 1280x720 is unchanged; all checks pass;
`CLAUDE.md` (§3 rule 1, §5.8, §6.3, the status paragraph) and `BACKLOG.md` say what is built and what
David has and has not seen.

## Job 4 (the last and largest): ten more worlds

David, 2026-11-28: his seven-year-old "has played for around 2 hours non stop, the pace is perfect and
addictive and fun. But he has just completed all the worlds, and has earned the Volcano Blaster. So he's
through most of the content, but the answer isn't slowing him down, it's more content. Like another 10
worlds." Do **not** slow the pace: keep price and coin boost rising together (`LADDER_PRICE_STEP`,
`LADDER_BOOST_STEP` in `src/entities/gun/gun.data.ts`) and keep star targets following the gun a player
should hold (`FIRST_PASS_GUNS` in `src/entities/world/gigs.data.ts`). The Pirate Ship (`ship`, built
2026-11-27, commit `fe598f1`) is the pattern for a world: copy how it was added.

**All the art prompts are in `docs/NEW_WORLDS_ART_PROMPTS.md`**: per world a wide backdrop, a tall
backdrop and a sheet of six visitors, plus four sheets of six guns. David had no time to paint them
before this session. Give him the prompts **one painting at a time, each with its reference image file
sent alongside**, starting with the first world, and build each world as its art arrives (a world is
playable on stand-in drawings and a procedural backdrop meanwhile, as the ship was).

**First, before any new world: load world art on demand.** The build was 1.18 MB under Poki's 8 MB
initial-download cap, and a world costs about 0.3 MB. Change loading so a world's backdrop (wide and
tall), its visitors' pictures and any band sprite of its own are fetched when that world is opened
(with a short loading moment), not in `BootScene`; only the Garden and what Home needs load at start.
Guns' small pictures beyond the ones the player owns or can see in the Shop page can load the same way.
`tools/budget-check.ts` and `tools/sprite-optimise.sh` already separate "initial" from "on demand": extend
their lists. Report the initial-download figure after this step and after each world.

**The ten worlds, in order** (id, name, the band and its feel):

| #   | id        | World           | Band                                                                                                                                                               |
| --- | --------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 7   | `jungle`  | Jungle          | Percussion ensemble: marimba, congas, shakers, toms, flute calls. Bright, bouncing.                                                                                |
| 8   | `castle`  | Castle          | Royal fanfares: trumpets, horns, harp, timpani, bells. Stately, in three.                                                                                          |
| 9   | `beach`   | Beach           | Laid-back island band: vibraphone, guitar, hand drums, bass. Sunny, off-beat.                                                                                      |
| 10  | `ice`     | Ice Palace      | A winter waltz: glockenspiel, sleigh bells, celesta or harp, soft strings.                                                                                         |
| 11  | `saloon`  | Wild West       | Honky-tonk piano, guitar, fiddle, a clip-clop wood block, tambourine. A hoedown.                                                                                   |
| 12  | `haunted` | Haunted House   | Friendly spooky: organ, pizzicato strings, xylophone "bones", bassoon. Tiptoe.                                                                                     |
| 13  | `toyshop` | Toy Shop        | A music box: glockenspiel, celesta or toy piano, pizzicato, clarinet, snare.                                                                                       |
| 14  | `sea`     | Under the Sea   | Dreamy: harp glissandi, vibraphone, soft horns, bass clarinet. Slow, swaying.                                                                                      |
| 15  | `dino`    | Dinosaur Valley | Big drums, low brass, tuba, bassoon stomps. Heavy and funny.                                                                                                       |
| 16  | `space`   | Space Station   | A synth band (the engine has no synth voices beyond its fallback pluck: add a small set of synthesised instruments, no download). The owner's son asked for space. |

- Write each band from instruments already recorded (the three sprites) wherever that gives the style;
  where a signature instrument is missing, look in the approved CC0 sources only
  (`tools/build-orchestra-samples.ts`), check the licence file, and say what you added and its size.
  Each band gets its own room (`src/audio/scores/rooms.ts`) and palette, as the ship has. Every seat
  needs one of the 36 painted instrument icons, or ask David for a new sheet of icons if a world needs
  instruments that have no picture (give him the prompt in the style of `INSTRUMENT_ART_BRIEF.md`).
- Give each world one trait in play, as the Funfair has moving targets and the ship a rolling deck
  (for example: the Ice Palace's instruments slow down faster; under the sea everything drifts gently;
  the Space Station's wall slowly turns). Only if it can be built cleanly.
- Star thresholds continue from the ship's 110 in steps of 20 (130, 150, … 310 for the last), so a world
  always opens well before every star is won. Job 2's star guidance matters more with sixteen worlds.
- Visitors: each world's sheet is two blockers, two thieves, two treats, in the order listed in the
  prompts file; add the ids, stand-in drawings and the cast as the ship did.
- Guns: twenty-four more (`sheet-5-guns` to `sheet-8-guns` in the prompts file) continue the ladder
  after Phoenix Fury by the 25% rule, as a tier above mythic if a new rarity name is wanted (ask David).
  Each needs its own projectile; build them from mix-and-match parts (shape, colour, trail, impact)
  on the existing renderers instead of hand-making twenty-four. Extend `FIRST_PASS_GUNS` so each new
  world expects the two or three guns a player would reach there at the pace measured for David's son
  (six worlds and nineteen guns in about four hours of play).
- Measure each world once with the balance bot (child and keen profiles, eight runs a gig) and tune only
  that world's own numbers. Remember the bot under-estimates a real child's income.
- Home's world strip already pages; the Tour map pages one world at a time: check both read well with
  sixteen.
- After each world: push, and tell David what you saw and that its music has not been heard.

## Also waiting

- **Download size.** The build was 1.18 MB under Poki's 8 MB cap. Four more worlds (Jungle, Castle,
  Beach, Space) will not fit as things are: load each world's backdrop, visitors and band sprite when the
  world is opened, not at start-up, before adding the next world.
- David has heard the Pirate Ship's music ("it's fine"). He has not said he has listened to the rest of
  the sound built on 2026-11-27 (count-in, thief, reveal, Jam).
- Nothing from the Pirate Ship onward has been played by David (see `CLAUDE.md` status).
