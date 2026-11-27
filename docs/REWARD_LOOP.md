# The reward loop — coins, the groove and the jackpot

**Written:** 2026-11-26 · **Updated:** 2026-11-27 (end of day) · **Status:** built (`dc38f8c`, gun levels `4b4cd4e`; jeopardy, the Big Finish and the results rebuild `cd20e22`; visitors from gig 1 `dd6b821`; eighteen guns `1e5da49`; star targets that follow the expected gun and the bot that plays visitors `b16d1d6`; six Mythic guns, granny talents and star-milestone grannies `be88590`; the Pirate Ship `fe598f1`). **Confirmed by the owner:** he and his seven-year-old son played builds from earlier on 2026-11-27; the son reached gun 17 in about two hours and, in the owner's words, "has enjoyed every minute because he's able to get new guns quite frequently, so I wouldn't want to slow that down", so the gun pace stays. **Not confirmed:** nothing from `fe598f1` onward (the Pirate Ship and its star targets, the six Mythic guns, granny talents, Nana Joy) has been played or heard by him, and the rest of the 2026-11-27 batch is recorded only as checked in the browser by Claude with the sound off. **Balance:** bot-measured, not human-tested. The five original venues were measured on 2026-11-27 before free aim, the aim clamp and granny talents existed (the starting granny's "Steady hands" makes every gig slightly easier); the Pirate Ship was measured once. **The bot under-estimates a real child's income** (see "What the bot measured" below). Supersedes the star rule in
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
  when these stars opened a venue, otherwise the next gun **not yet
  owned** (never an upgrade, and since 2026-11-27 never a granny: grannies join at star milestones and cost no coins) with a bar (1,120 / 2,000), or a BUY button if it
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

### The twenty-four guns (`src/entities/gun/gun.data.ts`)

Twenty-four guns, in five rarities (common, rare, epic, legendary, mythic), each with a POWER rating (a display number that grows with the ladder; fill power and coin boost are what the game uses). The owner painted the first eighteen across 2026-11-27 (the six starters were repainted the same afternoon as `sheet-3-guns`) and the six Mythic guns on `sheet-4-guns` (cut by `npm run guns`; one picture each, turned in code to face the aim). They are super-soaker power fantasies that get "bigger and more powerful", **not** music-themed (he rejected music-themed guns), and each fires its own projectile (`src/entities/waterParticle/projectiles/`; how each shoots is in `gunMechanics.data.ts` and `gunMechanics.mythic.data.ts`). The Shop's gun rack pages the ladder six at a time and shows guns far beyond reach as silhouettes. The rewarded "free gun" in the Shop draws only from guns of tier 3 or below (up to the rare ones), never epic, legendary or mythic. The table below was generated from the code on 2026-11-27, including the cost of each gun's first upgrade (`upgradeCost`).

**The ladder rule beyond MEGA CANNON.** Guns 1 to 18 are hand-set (`gunLadderBase.data.ts`). Each gun after MEGA CANNON costs `LADDER_PRICE_STEP` (1.25) times the one before, pays `LADDER_BOOST_STEP` (1.25) times the coins, and shows `LADDER_RATING_STEP` (1.3) times the POWER; the chain runs on unrounded values, then prices and ratings are rounded to two significant figures and the boost to one decimal. Price and coin boost therefore rise together, so a new gun keeps arriving at about the same pace however long the ladder gets. **Why:** the owner's son played two hours, reached gun 17 and "has enjoyed every minute because he's able to get new guns quite frequently, so I wouldn't want to slow that down" (2026-11-27). Claude had recommended slowing the top of the ladder; he overruled it, so the ladder was extended at the same pace instead. Damage rises only gently (see `gunMechanics.mythic.data.ts`): the steep rise is in coins.

| #   | Gun               | Rarity    | Price (coins) | Coins |  POWER | Shot      | First upgrade (level 2) |
| --- | ----------------- | --------- | ------------: | ----: | -----: | --------- | ----------------------: |
| 1   | Drip Pistol       | common    |             0 |    x1 |    100 | water     |                   1,500 |
| 2   | The Squirter      | common    |             0 |    x1 |    120 | water     |                   1,500 |
| 3   | Garden Hose       | common    |         6,000 |  x1.5 |    200 | water     |                   1,800 |
| 4   | Bubble Blitz      | common    |        12,000 | x1.75 |    280 | bubbles   |                   3,600 |
| 5   | Splash Jr         | rare      |        20,000 |    x2 |    400 | water     |                   6,000 |
| 6   | Hydro Blaster     | rare      |        35,000 |  x2.4 |    550 | water     |                  10,500 |
| 7   | Slime Slinger     | rare      |        55,000 |  x2.8 |    700 | slime     |                  16,500 |
| 8   | Soaker 3000       | rare      |        80,000 |  x3.2 |    900 | water     |                  24,000 |
| 9   | Shark Soaker      | epic      |       120,000 |  x3.7 |  1,200 | shark     |                  36,000 |
| 10  | Blizzard Blaster  | epic      |       170,000 |  x4.2 |  1,500 | ice       |                  51,000 |
| 11  | Thunder Soaker    | epic      |       240,000 |  x4.8 |  1,900 | lightning |                  72,000 |
| 12  | Inferno           | epic      |       330,000 |  x5.5 |  2,400 | flame     |                  99,000 |
| 13  | Rainbow Rocket    | epic      |       450,000 |  x6.2 |  3,000 | rainbow   |                 135,000 |
| 14  | Turbo Tornado     | legendary |       600,000 |    x7 |  3,800 | tornado   |                 180,000 |
| 15  | Dragon Drencher   | legendary |       800,000 |    x8 |  4,800 | dragon    |                 240,000 |
| 16  | Neptune's Trident | legendary |     1,050,000 |    x9 |  6,000 | trident   |                 315,000 |
| 17  | Galaxy Blaster    | legendary |     1,400,000 |   x10 |  7,500 | laser     |                 420,000 |
| 18  | MEGA CANNON       | legendary |     2,000,000 |   x12 |  9,999 | mega      |                 600,000 |
| 19  | Volcano Blaster   | mythic    |     2,500,000 |   x15 | 13,000 | lava      |                 750,000 |
| 20  | Unicorn Sparkler  | mythic    |     3,100,000 | x18.8 | 17,000 | glitter   |                 930,000 |
| 21  | Kraken Cannon     | mythic    |     3,900,000 | x23.4 | 22,000 | kraken    |               1,170,000 |
| 22  | Star Pony         | mythic    |     4,900,000 | x29.3 | 29,000 | starpony  |               1,470,000 |
| 23  | Robo-Rex          | mythic    |     6,100,000 | x36.6 | 37,000 | vortex    |               1,830,000 |
| 24  | Phoenix Fury      | mythic    |     7,600,000 | x45.8 | 48,000 | phoenix   |               2,280,000 |

The shark, ice, trident and Inferno shots had not been looked at on screen when the eighteen were built, and none of the six Mythic projectiles has been seen in play by the owner; the owner has not played the ladder himself; his son reached gun 17 on builds from earlier on 2026-11-27.

### Grannies: talents and star milestones (`src/entities/granny/`, `src/systems/GrannyJoining.ts`)

A granny is never bought. She **joins the band when the player's total stars reach her milestone** (stars are a rating and are never spent), and each has one **talent**, a named multiplier on one mechanic that is read once by the module that owns the mechanic (`talents.ts`). Balance in this document was measured **without any talent**; the starting granny's Steady hands makes every gig slightly easier. A granny with no painting is left out of the game (`GRANNY_ART_READY`): Nani Priya's pictures arrived after `150dccd` (in the working tree, uncommitted when this was written) and Grandma Mei is not yet painted.

| Granny                    | Joins at (total stars) | Talent        | Constant                    | Effect                                                                            |
| ------------------------- | ---------------------: | ------------- | --------------------------- | --------------------------------------------------------------------------------- |
| Classic Granny            |                      0 | Steady hands  | `STEADY_HANDS_HOLD` 1.2     | Instruments hold full speed 20% longer                                            |
| Nana Storm (id `squirt`)  |                      0 | Big tank      | `BIG_TANK_SIZE` 1.3         | Water tank 30% bigger (almost no effect today: every tank already outlasts a gig) |
| Punk Granny               |                     20 | Loud          | `LOUD_FRENZY_LENGTH` 1.3    | Splash Frenzy lasts 30% longer                                                    |
| Nana Joy                  |                     40 | Crowd-pleaser | `CROWD_PLEASER_TREAT_PAY` 2 | Treats pay double                                                                 |
| Nani Priya                |                     70 | Sharp eye     | `SHARP_EYE_SHOO_HITS` 0.65  | Thieves and blockers need 35% fewer hits (never below one)                        |
| Grandma Mei (not painted) |                    100 | Big finish    | `BIG_FINISH_BONUS` 1.5      | The Big Finish bow bonus is 50% bigger                                            |

Jam mode does not apply talents. An old save that bought the Punk Granny with coins keeps her.

## Star targets

Since 2026-11-27 (`b16d1d6`) a gig's three targets are

```
par    = band x FULL_SPEED_PAY x seconds x PAY_TICKS_PER_SECOND
         x boost(FIRST_PASS_GUNS[venue][gig])
         x STAR_TARGET_VENUE_GAIN[venue] x STAR_TARGET_GIG_SCALE[gig]
star n = round(par x STAR_TARGET_FRACTIONS[n] x ease, to 10)      (at least 10)
```

with `FULL_SPEED_PAY` 4, `PAY_TICKS_PER_SECOND` 2 (so a full-speed instrument pays 8 coins a second before the groove and the gun), `STAR_TARGET_FRACTIONS` **0.8 / 3.0 / 6.0**, and `ease` equal to `FIRST_STAR_EASE` for the first star only and 1 for the others. All constants are in `src/entities/world/gigs.data.ts`; the numbers below are copied from it.

| Constant                   | Garden | Workshop | Kitchen | Funfair | Disco | Pirate Ship |
| -------------------------- | -----: | -------: | ------: | ------: | ----: | ----------: |
| `STAR_TARGET_VENUE_GAIN`   |   0.95 |     1.05 |    1.05 |    1.05 |  0.95 |        1.13 |
| `FIRST_STAR_EASE` (star 1) |    0.7 |        1 |       1 |       1 |     1 |        0.85 |

| Gig                     |   1 |    2 |   3 |   4 |   5 |   6 |    7 |   8 |
| ----------------------- | --: | ---: | --: | --: | --: | --: | ---: | --: |
| `STAR_TARGET_GIG_SCALE` | 1.2 | 1.05 | 1.2 | 1.2 | 1.1 | 1.1 | 1.05 | 1.0 |

The Garden and Disco gains sit a little under 1 (the starter pistol; the mirror-ball finale's extra spinner), the Workshop, Kitchen and Funfair a little over, and the Pirate Ship (2026-11-27, the sixth venue) further over at 1.13 with its first star eased to 0.85: its small bands saturate, so a keen player three-stars its first two gigs most of the time (only on a cliff edge: at 1.2 they stop doing so at all), while its last three gigs stay at two stars. The scale is high on gigs 1, 3 and 4 because a trio is saturated by any gun, and lower later because bigger bands are harder to keep at full speed; gig 2 dips because it is as long as gig 1 with a musician more. The Garden's first star is eased to 0.7 because the starter pistol leaves a slow child with a bad run a fifth of a normal one. (Before 2026-11-27 the targets were par x a venue gain of 1 / 1.25 / 1.6 / 2 / 2.6, with no gun term; the gain's meaning changed with this rule.)

### The gun a first pass is expected to hold (`FIRST_PASS_GUNS`)

The guns the owner expects a player to have bought by each gig (level 1, no upgrades). The coin boost of that gun is the `boost` term above.

| Venue       | Gig 1                   | Gig 2            | Gig 3            | Gig 4                | Gig 5                 | Gig 6                | Gig 7                | Gig 8           |
| ----------- | ----------------------- | ---------------- | ---------------- | -------------------- | --------------------- | -------------------- | -------------------- | --------------- |
| Garden      | pistol (x1)             | pistol           | pistol           | hose (x1.5)          | hose                  | bubble_blitz (x1.75) | bubble_blitz         | splashjr (x2)   |
| Workshop    | splashjr (x2)           | splashjr         | splashjr         | hydro_blaster (x2.4) | hydro_blaster         | hydro_blaster        | slime_slinger (x2.8) | slime_slinger   |
| Kitchen     | soaker3000 (x3.2)       | soaker3000       | soaker3000       | soaker3000           | shark_soaker (x3.7)   | shark_soaker         | shark_soaker         | shark_soaker    |
| Funfair     | blizzard_blaster (x4.2) | blizzard_blaster | blizzard_blaster | blizzard_blaster     | thunder_soaker (x4.8) | thunder_soaker       | thunder_soaker       | thunder_soaker  |
| Disco       | inferno (x5.5)          | inferno          | inferno          | inferno              | rainbow_rocket (x6.2) | rainbow_rocket       | rainbow_rocket       | rainbow_rocket  |
| Pirate Ship | turbo_tornado (x7)      | turbo_tornado    | turbo_tornado    | turbo_tornado        | dragon_drencher (x8)  | dragon_drencher      | dragon_drencher      | dragon_drencher |

### The Pirate Ship's star targets

Computed from `starTargets` in `gigs.data.ts` on 2026-11-27 (band, seconds, then the targets for one, two and three stars). For comparison, the Disco's last gig asks 23,750 / 89,060 / 178,110 for 21 instruments, and the ship's asks 26,560 / 117,160 / 234,320 for 18 because the expected gun is a x8 Dragon Drencher rather than a x5.5 Inferno or x6.2 Rainbow Rocket.

| Gig | Band | Seconds | 1 star | 2 stars | 3 stars | Expected gun    |
| --- | ---: | ------: | -----: | ------: | ------: | --------------- |
| 1   |    5 |      20 |  5,160 |  22,780 |  45,560 | turbo_tornado   |
| 2   |    6 |      20 |  5,420 |  23,920 |  47,840 | turbo_tornado   |
| 3   |    8 |      25 | 10,330 |  45,560 |  91,120 | turbo_tornado   |
| 4   |   10 |      25 | 12,910 |  56,950 | 113,900 | turbo_tornado   |
| 5   |   12 |      30 | 19,470 |  85,920 | 171,830 | dragon_drencher |
| 6   |   14 |      30 | 22,720 | 100,240 | 200,470 | dragon_drencher |
| 7   |   16 |      30 | 24,790 | 109,350 | 218,700 | dragon_drencher |
| 8   |   18 |      30 | 26,560 | 117,160 | 234,320 | dragon_drencher |

The deck rolls from gig 4 (`deckRoll.ts`); the targets do not allow for it.

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

**The Pirate Ship** was measured once with this bot when it was built (`fe598f1`): its first two gigs sit on the edge of three stars for a keen player and its last three at two. It was not run through the full batch the other five venues got, and it is not in the tables above.

**The bot under-estimates a real child's income.** In the bot's economy a child-speed player cannot afford the expected guns from the Funfair on (the economy paragraph above), yet on 2026-11-27 the owner's seven-year-old reached gun 17 in about two hours and, in the owner's words, "has enjoyed every minute because he's able to get new guns quite frequently". So the shortfall above is a property of the bot (near-perfect aim and no treats caught, no missions, daily gift or retries), not a measured fact about children; no price was changed, and the pace was deliberately kept.

**Limits of the measurement.** These are bots, not children: perfect-ish aim, no power-ups, and the bot almost never catches treats (it does not lead a moving target), so treat income is understated. Several cells are only 16 runs. The five original venues were read before free aim, the aim clamp and granny talents existed (the starting granny's Steady hands makes every gig slightly easier). Nothing here has been played by the owner; his son's play on earlier builds is the only human evidence, and it was not instrumented.

## Balance targets

Originally tuned (Garden only, before 2026-11-27) with the bots in `src/dev/`: a child-speed bot should pass
every gig with one or two stars; a sharp bot should three-star most gigs but
not without the groove at ×4 or ×5 for much of the round. Retuned on 2026-11-27 for the five original venues (the Pirate Ship, added later that day, was measured once), aiming at (a child passes nine runs in ten at the start of each venue and three in four elsewhere; a keen player averages about two and a quarter stars; an expert three-stars the last gig in at most seven runs in ten). Prices are set
from the measured totals so the first gun arrives after about four gigs.
