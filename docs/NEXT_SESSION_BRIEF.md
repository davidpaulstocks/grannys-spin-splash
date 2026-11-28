# Brief for the next session (written 2026-11-28)

David's weekly usage was nearly spent when this was written, so the three jobs below were not started.
They are for a **fresh session on a cheaper model**. Read `CLAUDE.md` first (source of truth; the
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

## Job 0 (small, do first): remove the Golden Spinner; make treats catchable

David, 2026-11-28, after watching children play:

- **Remove the Golden Spinner** (the timed bonus spinner announced with "Golden Spinner appeared!"; more
  frequent in the Disco). "They're a bit of an anticlimax because it's kind of hard to hit them because
  your aim snaps to the nearest actual spinner, and they look a bit crap… we already have the visitors
  and the treats." Take it out everywhere: its spawner and entity, its accents (`golden`, `goldenMissed`
  in the audio API can stay if other things use them: the thief's first steal does), its texts, the
  Disco's "frequent Golden Spinner" trait in `src/entities/world/world.data.ts` and `gigs.data.ts`, any
  mission that mentions it (`src/systems/Missions.ts`), tests and docs. Check whether the five power-up
  pickups (`src/entities/powerup/`) have the same problem (hard to hit with the snap, look out of place
  next to the painted visitors) and tell David what you find before removing them.
- **Treats are too hard to catch.** "The treats fly across really fast, and if your gun doesn't directly
  target them they're just quite hard to get." Make a treat a gift, not a test: slow its crossing to
  about half speed (`src/entities/visitor/visitorTuning.data.ts`), have it drift in, **hover for about a
  second and a half** near the middle of the wall with a gentle bob, then drift on; make its catch area
  generous (about 1.5 times the picture); and make the aim take it eagerly: a treat within about 140 px
  of the pointer takes the aim before any instrument does (the visitor lock in `src/utils/shotLock.ts`
  already lets those shots fly over instruments), with a clear ring on it while it is the target. One
  hit is enough. Keep a miss costing nothing. Check on screen that a treat can be caught by moving the
  pointer roughly toward it, on mouse and on touch.

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

## Also waiting

- **Download size.** The build was 1.18 MB under Poki's 8 MB cap. Four more worlds (Jungle, Castle,
  Beach, Space) will not fit as things are: load each world's backdrop, visitors and band sprite when the
  world is opened, not at start-up, before adding the next world.
- **Nobody has heard** the Pirate Ship's sea shanty or any sound built on 2026-11-27.
- Nothing from the Pirate Ship onward has been played by David (see `CLAUDE.md` status).
