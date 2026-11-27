# The reward loop — coins, the groove and the jackpot

**Written:** 2026-11-26 · **Updated:** 2026-11-27 · **Status:** built (`dc38f8c`, gun levels `4b4cd4e`; jeopardy, the Big Finish and the results rebuild `cd20e22`; visitors from gig 1 `dd6b821`; eighteen guns `1e5da49`; star targets that follow the expected gun and the bot that plays visitors `b16d1d6`). **Not confirmed by David:** he has not played or heard anything built on 2026-11-27 after his morning play-test (the thieves, blockers, Big Finish, new results screen, gun reveal and its product-film version, the eighteen guns and their projectiles, the count-in, auto-fire, Jam mode); it was checked in the browser by Claude only, with sound muted. **Balance:** the star targets were retuned on 2026-11-27 against the dev bot in all five venues (see "What the bot measured", below); that is a measurement, not a human play-test, and the economy is still short for a slow player from the Funfair on. Supersedes the star rule in
`ENGAGEMENT_DESIGN.md` §3 and the earning table in §4 where they conflict.

## Why

David played the 2026-11-26 build and said:

- "It's not really clear what benefit you're getting when you spin each of the
  instruments… it's missing that feel-good, big number that accumulates
  through the play."
- "At the end it says full band, three stars, but you get that every time. So
  why is that even a rewarding thing to celebrate?"
- "You want to finish with a huge amount of points and then immediately know:
  what do I do now? What can I afford? How far am I away?"
- "I'm unclear where the jeopardy is… how do you play it badly? What's the
  difference between a really good run and a less good run?"

After his play-test of 2026-11-27 he asked again: "where's the jeopardy… can you
lose?" and "the end just suddenly finishes". That produced the thieves, the
blockers, the higher star targets and the Big Finish below.

## The loop in four sentences

1. **Every instrument that is spinning throws coins**, and throws more the
   faster it spins.
2. **Keeping the band going builds the groove**, a multiplier from ×1 to ×5
   on every coin.
3. **If an instrument drops out of full speed, the groove drops a level.**
   That is the jeopardy: chase new instruments and neglect the old ones and
   the multiplier never builds.
4. **Stars are earned by the coin total**, so three stars takes a good run,
   and the number at the end is the score. **Under one star the gig is not
   passed** ("Almost!" and TRY AGAIN); the pass mark is the first star target,
   0.8 of par (below).
5. **Visitors put the coins and the groove at risk** (2026-11-27): a thief
   steals from the total, a blocker silences instruments and takes the groove
   with them unless it is washed away.
6. **The Big Finish** pays each instrument still playing at the whistle.

## Rules

| Thing                       | Rule                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Pay tick                    | Every 500 ms from the first squirt to the final whistle                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Pay per instrument per tick | Slow 1 · medium 2 · full speed 4                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Groove                      | Level 1–5. A ring fills toward the next level at `(instruments at full ÷ band) ÷ 3 s`, so the full band earns a level every three seconds and half the band every six                                                                                                                                                                                                                                                                                                                      |
| Drop-out                    | An instrument falling out of full speed costs one groove level in a band of up to four, and proportionally less in a bigger one (a quarter of a level in a sixteen-piece). Never below ×1                                                                                                                                                                                                                                                                                                  |
| Jackpot (Splash Frenzy)     | The whole band at full at once: groove gains a level at once and every coin is doubled for the Frenzy window                                                                                                                                                                                                                                                                                                                                                                               |
| Power-up                    | Double Stars doubles coins for its window, as before                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Coins per tick              | `sum of instrument pay × groove × 2 if jackpot × 2 if Double Stars`                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Stars                       | Locked in as the gig's coin total passes each of three targets (`starTargets` in `gigs.data.ts`). No star = gig not passed                                                                                                                                                                                                                                                                                                                                                                 |
| Star targets                | Coin totals for one, two and three stars (`starTargets` in `gigs.data.ts`; the formula is under "Star targets" below), shown on the goal card before the gig. One star is the pass mark. They follow the coin boost of the gun a first pass is expected to hold at that gig, so buying the next gun early makes a gig easier and arriving late makes it harder                                                                                                                             |
| Thief (a sitter)            | Lands on one instrument, silences it, and every 500 ms steals the larger of 5 and 0.6% of the gig's third star target from the total. Washed off with water (about 13 landed hits from the starter gun, fewer from better guns, never under 4) it gives the coins back; left alone it leaves after about 6 s with them (`THIEF`, `SITTER_HITS` in `visitorTuning.data.ts`)                                                                                                                 |
| Blocker                     | Parks over two or three neighbouring instruments (never more than half of a small band), silences and freezes them, and absorbs the water; 28 landed hits plus 2 per gig index to shift it, or it leaves after 7 s. A covered instrument that was at full speed counts as dropping out 1.5 s after it parks, each further one 0.35 s later, so it costs groove (`BLOCKER`)                                                                                                                 |
| Treat                       | Flies across; popping it pays 8% of the third star target (minimum 2); a shooed visitor pays 2%, a balloon 1% (`VISIT_PAY`)                                                                                                                                                                                                                                                                                                                                                                |
| Big Finish                  | At the whistle each instrument still playing takes a bow from left to right and pays `pay for its state x 6 x groove x the gun's coin boost` (`BOW_BONUS_TICKS`), doubled if the whole band is at full speed (`FULL_BAND_BONUS_FACTOR`). The bonus goes into the total before it is banked, so it can tip the gig over a star. The whole cascade fits 1.4 s (a bow every 120 ms, tightening to 60 ms for a big band); a tap or Space after the first second skips it (`bigFinishRules.ts`) |
| Best                        | The best coin total per gig is kept; beating it is called out                                                                                                                                                                                                                                                                                                                                                                                                                              |

Removed: coins for a spinner climbing a tier, coins per star, per-second tips,
the hit-streak combo and its multiplier, and stars for the share of the band
at full speed.

## What the player sees

- **During the gig:** coins fly from each paying instrument to one large
  counter at the top; a bar under it shows the three star targets; a badge
  shows the groove (×3) with its ring. An instrument about to drop out
  flashes a warning ring; when one drops the badge cracks down a level.
- **At the whistle (2026-11-27):** the Big Finish. Each instrument still
  playing takes a bow and pays its bonus (doubled, with a gold burst, for a full
  band), then the stars earned land large on the wall. In the last ten seconds
  the score bar says "N to go!" for the next star. A thief on the wall shows the
  stolen coins over its head, and a groove drop is shown at the badge.
- **At the end:** one results layout. The coin total counts up large, stars
  land, "NEW BEST" if it is one; a gig under one star says "Almost!" with how
  many coins the first star still needed, and TRY AGAIN is the one green
  button. Then one slot answers "what now?": a NEW WORLD card with GO THERE
  when these stars opened a venue, otherwise the next gun or granny **not yet
  owned** (never an upgrade) with a bar (1,120 / 2,000), or a BUY button if it
  can be afforded; buying a gun plays a full-screen reveal (Coins, Power and
  Water counting up, USE IT or Later). The path below shows the venue's eight
  gigs, and the next venue is a button (GO! or "N more stars"). **There is no
  "Double coins" and no rewarded option on this screen** (removed 2026-11-27).
- **On Home:** the same "saving for" bar.

## Why play the next gig

- **Each gig adds a musician**, so the band is bigger, the music fuller and
  the coins faster. The results screen says who joins next.
- **A path is always on screen at the end:** this venue's eight gigs as dots
  with their stars, where the player is on it, and the next venue at the end
  of the row with the stars it still needs.
- **Guns are the upgrade.** A better gun fills instruments faster and
  multiplies every coin (`coinBoost` on `GunDef`, the "Coins" column below).
  The shop and the results screen say so in those words: "Coins ×1.5". Star
  targets rise from venue to venue to match, so a better gun is how earlier
  gigs get their third star.
- **Upgrade levels.** Every owned gun goes up to level 5 **in the Shop only**
  (the results screen and Home never offer an upgrade; the gun card shows the
  price and "before → after" for the next level): each level adds 15% of the
  gun's base coin boost and 8% fill power (and 8% of the POWER number), and
  costs `max(1,500, 30% of the gun's price)`, rounded to 100 and doubling per
  level (`src/entities/gun/gunLevels.ts`).

### The eighteen guns (`src/entities/gun/gun.data.ts`)

Eighteen guns, in four rarities (common, rare, epic, legendary), each with a
POWER rating (a display number that grows with the ladder; fill power and coin
boost are what the game uses). The owner painted twelve more guns in 2026-11-27
(two sheets cut by `npm run guns`; one picture each, turned in code to face the
aim). They are super-soaker power fantasies that get "bigger and more powerful",
**not** music-themed (he rejected music-themed guns), and each fires its own
projectile (`src/entities/waterParticle/projectiles/`; how each shoots is in
`gunMechanics.data.ts`). The Shop's gun rack pages the ladder six at a time and
shows guns far beyond reach as silhouettes. The rewarded "free gun" in the Shop
draws only from guns of tier 3 or below (up to the rare ones), never epic or
legendary.

| #   | Gun               | Rarity    | Price (coins) | Coins | POWER | Shot      |
| --- | ----------------- | --------- | ------------: | ----: | ----: | --------- |
| 1   | Drip Pistol       | common    |             0 |    x1 |   100 | water     |
| 2   | The Squirter      | common    |             0 |    x1 |   120 | water     |
| 3   | Garden Hose       | common    |         6,000 |  x1.5 |   200 | water     |
| 4   | Bubble Blitz      | common    |        12,000 | x1.75 |   280 | bubbles   |
| 5   | Splash Jr         | rare      |        20,000 |    x2 |   400 | water     |
| 6   | Hydro Blaster     | rare      |        35,000 |  x2.4 |   550 | water     |
| 7   | Slime Slinger     | rare      |        55,000 |  x2.8 |   700 | slime     |
| 8   | Soaker 3000       | rare      |        80,000 |  x3.2 |   900 | water     |
| 9   | Shark Soaker      | epic      |       120,000 |  x3.7 | 1,200 | shark     |
| 10  | Blizzard Blaster  | epic      |       170,000 |  x4.2 | 1,500 | ice       |
| 11  | Thunder Soaker    | epic      |       240,000 |  x4.8 | 1,900 | lightning |
| 12  | Inferno           | epic      |       330,000 |  x5.5 | 2,400 | flame     |
| 13  | Rainbow Rocket    | epic      |       450,000 |  x6.2 | 3,000 | rainbow   |
| 14  | Turbo Tornado     | legendary |       600,000 |    x7 | 3,800 | tornado   |
| 15  | Dragon Drencher   | legendary |       800,000 |    x8 | 4,800 | dragon    |
| 16  | Neptune's Trident | legendary |     1,050,000 |    x9 | 6,000 | trident   |
| 17  | Galaxy Blaster    | legendary |     1,400,000 |   x10 | 7,500 | laser     |
| 18  | MEGA CANNON       | legendary |     2,000,000 |   x12 | 9,999 | mega      |

The shark, ice, trident and Inferno shots have not been looked at on screen at
all; none of the ladder has been played by David.

## Star targets

Since 2026-11-27 (`b16d1d6`) a gig's three targets are

```
par    = band x FULL_SPEED_PAY x seconds x PAY_TICKS_PER_SECOND
         x boost(FIRST_PASS_GUNS[venue][gig])
         x STAR_TARGET_VENUE_GAIN[venue] x STAR_TARGET_GIG_SCALE[gig]
star n = round(par x STAR_TARGET_FRACTIONS[n] x ease, to 10)      (at least 10)
```

with `FULL_SPEED_PAY` 4, `PAY_TICKS_PER_SECOND` 2 (so a full-speed instrument pays 8 coins a second before the groove and the gun), `STAR_TARGET_FRACTIONS` **0.8 / 3.0 / 6.0**, and `ease` equal to `FIRST_STAR_EASE` for the first star only and 1 for the others. All constants are in `src/entities/world/gigs.data.ts`; the numbers below are copied from it.

| Constant                   | Garden | Workshop | Kitchen | Funfair | Disco |
| -------------------------- | -----: | -------: | ------: | ------: | ----: |
| `STAR_TARGET_VENUE_GAIN`   |   0.95 |     1.05 |    1.05 |    1.05 |  0.95 |
| `FIRST_STAR_EASE` (star 1) |    0.7 |        1 |       1 |       1 |     1 |

| Gig                     |   1 |    2 |   3 |   4 |   5 |   6 |    7 |   8 |
| ----------------------- | --: | ---: | --: | --: | --: | --: | ---: | --: |
| `STAR_TARGET_GIG_SCALE` | 1.2 | 1.05 | 1.2 | 1.2 | 1.1 | 1.1 | 1.05 | 1.0 |

The Garden and Disco gains sit a little under 1 (the starter pistol; the mirror-ball finale's extra spinner), the other three a little over. The scale is high on gigs 1, 3 and 4 because a trio is saturated by any gun, and lower later because bigger bands are harder to keep at full speed; gig 2 dips because it is as long as gig 1 with a musician more. The Garden's first star is eased to 0.7 because the starter pistol leaves a slow child with a bad run a fifth of a normal one. (Before 2026-11-27 the targets were par x a venue gain of 1 / 1.25 / 1.6 / 2 / 2.6, with no gun term; the gain's meaning changed with this rule.)

### The gun a first pass is expected to hold (`FIRST_PASS_GUNS`)

The guns the owner expects a player to have bought by each gig (level 1, no upgrades). The coin boost of that gun is the `boost` term above.

| Venue    | Gig 1                   | Gig 2            | Gig 3            | Gig 4                | Gig 5                 | Gig 6                | Gig 7                | Gig 8          |
| -------- | ----------------------- | ---------------- | ---------------- | -------------------- | --------------------- | -------------------- | -------------------- | -------------- |
| Garden   | pistol (x1)             | pistol           | pistol           | hose (x1.5)          | hose                  | bubble_blitz (x1.75) | bubble_blitz         | splashjr (x2)  |
| Workshop | splashjr (x2)           | splashjr         | splashjr         | hydro_blaster (x2.4) | hydro_blaster         | hydro_blaster        | slime_slinger (x2.8) | slime_slinger  |
| Kitchen  | soaker3000 (x3.2)       | soaker3000       | soaker3000       | soaker3000           | shark_soaker (x3.7)   | shark_soaker         | shark_soaker         | shark_soaker   |
| Funfair  | blizzard_blaster (x4.2) | blizzard_blaster | blizzard_blaster | blizzard_blaster     | thunder_soaker (x4.8) | thunder_soaker       | thunder_soaker       | thunder_soaker |
| Disco    | inferno (x5.5)          | inferno          | inferno          | inferno              | rainbow_rocket (x6.2) | rainbow_rocket       | rainbow_rocket       | rainbow_rocket |

### What the bot measured (2026-11-27, `b16d1d6`)

The balance bot (`src/dev/`, run from the console of a dev build as `window.__bot`) now plays visitors: it shoos thieves, clears blockers and chases treats, with a per-profile chance of noticing each one. It counts the Big Finish bonus into the stars it reports. Its three players are CHILD (450 ms to react, 85% of moves land, notices 6 visitors in 10), KEEN (180 ms, 97%, sees every visitor) and EXPERT (120 ms, never misses; about the owner's own level). A batch runner plays 16 to 56 runs per gig case with seeded randomness and a headless mode steps the game by hand, so the reading does not depend on the browser's frame rate. Each gig is run for the child, keen and expert players holding the expected gun, and for a keen player holding the gun two rungs further up the ladder. Across all five venues:

- A child-speed bot passes (one star or more) in **92% or more of runs on every gig** and averages **1.7 stars in the Garden and about 2 to 2.1 elsewhere**.
- A keen bot averages **2.3 to 2.5** stars.
- A keen bot holding a gun two rungs up gets three stars in **64% of runs or more** on every gig.

| Mean stars per venue | Garden | Workshop | Kitchen | Funfair | Disco |
| -------------------- | -----: | -------: | ------: | ------: | ----: |
| CHILD                |   1.71 |     2.07 |    2.07 |    2.05 |  2.01 |
| KEEN                 |   2.40 |     2.27 |    2.28 |    2.28 |  2.45 |
| EXPERT               |   2.47 |     2.33 |    2.38 |    2.37 |  2.59 |

**Economy, a first pass** (the gig's coins plus 200 per first-time star; no missions, daily gift or retries): the keen bot affords every expected gun on time except the last, rainbow_rocket, which it is about 99,000 coins short of at Disco gig 5. The child bot is short from the Funfair on: thunder_soaker by about 56,000, inferno by about 124,000 and rainbow_rocket by about 402,000. **Prices were not changed.** A slow player who does not replay gigs will meet the Funfair and Disco without the expected gun, which makes their targets harder than the table says; that is an open decision, not a settled one (`BACKLOG.md`).

**Limits of the measurement.** These are bots, not children: perfect-ish aim, no power-ups, and the bot almost never catches treats (it does not lead a moving target), so treat income is understated. Several cells are only 16 runs. Nothing here has been played by the owner or by a child.

## Balance targets

Originally tuned (Garden only, before 2026-11-27) with the bots in `src/dev/`: a child-speed bot should pass
every gig with one or two stars; a sharp bot should three-star most gigs but
not without the groove at ×4 or ×5 for much of the round. Retuned on 2026-11-27 for all five venues, aiming at (a child passes nine runs in ten at the start of each venue and three in four elsewhere; a keen player averages about two and a quarter stars; an expert three-stars the last gig in at most seven runs in ten). Prices are set
from the measured totals so the first gun arrives after about four gigs.
