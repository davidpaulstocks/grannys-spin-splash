# Granny's Grand Tour — Engagement Redesign

**Written:** 2026-11-25 · **Status:** approved direction (David: "the whole game
needs to be rethought from an engagement perspective… a big transformation I
need you to oversee and drive"). Built in slices; each slice is playable.

---

## 1. Why the current structure cannot pass Poki

| Fact                                                                                                      | Consequence                                                       |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Poki's first gate: average playtime > 3 min **and** 25% of plays > 3 min; successful games average 5+ min | A 30-second round needs 6–10 rounds per sitting                   |
| The game is one wall per world, the same every time                                                       | Round 2 is round 1 again. Nothing new to see, hear or aim for     |
| A simple bot fills Garden's whole wall in 8 s and then holds Splash Frenzy for the remaining 20 s         | The round is solved, not played. No curve                         |
| That bot banked 2,673 stars in one round; the dearest item costs 5,000                                    | The economy is over in two rounds                                 |
| First screen is a three-carousel loadout menu                                                             | Poki measures conversion to first play; menus before play cost it |
| Results screen is text on a blank background                                                              | No celebration, no next step, no reason to continue               |

The orchestra is the hook. What is missing is a **journey**: something new each
round, a clear goal each round, and a visible next thing.

---

## 2. The frame

**Granny is putting a band together, venue by venue.**

- Five **venues** (the existing worlds), each with its own band and style.
- Each venue is a ladder of eight **gigs**. Gig 1 is a trio — three big
  spinners. Every gig adds musicians until gig 8 is the whole wall: the
  **Grand Concert**.
- Each new musician is a reward: introduced by name with a short solo before
  the gig they join.

This turns the game's best feature into its progression system. More levels
means more music, literally.

---

## 3. The gig (one round)

> **The purpose, as the game now says it (2026-11-25):** _wake up the whole
> band, and keep them all awake at once._ The musicians are dozing; a splash
> wakes one and it plays; left alone it nods off again. One is easy — keeping
> eight awake together is the game. A sleeping spinner shows "z z z", one
> about to drop off nods, the top of the screen is a band meter with one
> light per musician and the stars standing above the lights that earn them,
> and a YOUR GOAL card states it before the first squirt of every gig. This
> was added after David played and said he was not sure what he was trying to
> accomplish. "Awake" means a spinner at full speed.

- **Goal, in one sentence a seven-year-old can act on:** get the whole band
  playing at once.
- **Stars are the meter that is already on screen.** The bar's existing marks
  become star marks:
  - ★ — 60% of the band at full speed at once
  - ★★ — 80%
  - ★★★ — 100%: **FULL BAND**, which triggers Splash Frenzy
    Stars lock in the moment they are reached and pop on the bar. One star
    passes the gig and opens the next.
- **After three stars the rest of the round is the encore:** the Frenzy
  scoring rain. Finishing fast is rewarded with a longer encore, so there is
  always a reason to get better at a gig already passed.
- **Difficulty is authored per gig**, not left to wall size alone: round
  length, how fast spinners wind down, how long a topped-up spinner holds,
  obstacles, moving targets. Tuned with a bot that plays like a child
  (slow retargeting, imperfect aim), not a perfect one.

### Gig ladder (band size per gig)

| Venue    | Wall | Gigs 1–8                           |
| -------- | ---- | ---------------------------------- |
| Garden   | 12   | 3 · 4 · 5 · 6 · 8 · 9 · 10 · 12    |
| Workshop | 15   | 4 · 5 · 6 · 8 · 9 · 10 · 12 · 15   |
| Kitchen  | 16   | 4 · 6 · 8 · 9 · 10 · 12 · 14 · 16  |
| Funfair  | 16   | 4 · 6 · 8 · 9 · 10 · 12 · 14 · 16  |
| Disco    | 21   | 5 · 6 · 8 · 10 · 12 · 15 · 18 · 21 |

Small bands get **big spinners**: the wall is laid out for the number of
musicians, so gig 1 is three generous targets and the first squirt cannot miss.

Each score declares its **line-up order** — who joins first. The first three
must already sound like music (a bass, a harmony instrument, a tune).

---

## 4. Currency and rewards

Poki allows no purchases and no second currency, so there is exactly one.

- **Coins** — earned in every gig, spent in the shop. (Today's "stars in the
  vault" are renamed: stars now mean the rating, coins mean money.)
- **Stars** — the rating. Never spent. Total stars open venues.

| Earned                                                  | Amount                          |
| ------------------------------------------------------- | ------------------------------- |
| Coins scored during the gig (level-ups, combos, encore) | about 30–120, rising with venue |
| First time earning each star on a gig                   | +15 per star                    |
| Daily gift (slice 3)                                    | 25, rising with streak          |
| Mission complete (slice 3)                              | 30–60                           |

| Spent on                                     | Price                           |
| -------------------------------------------- | ------------------------------- |
| Guns                                         | 0 · 0 · 150 · 400 · 900 · 2,000 |
| Grannies                                     | 0 · 0 · 600                     |
| Later: band cosmetics, alternative musicians | —                               |

| Venue    | Opens at |
| -------- | -------- |
| Garden   | free     |
| Workshop | 12 ★     |
| Kitchen  | 30 ★     |
| Funfair  | 54 ★     |
| Disco    | 80 ★     |

Opening a venue on stars, not coins, means replaying for three stars always
moves the tour forward, and coins are never hoarded for a wall.

Existing saves are migrated: vault becomes coins, unlocked items are kept.

---

## 5. Navigation

Four screens on the main path, each with one obvious button.

1. **Home** — the current venue's art, Granny, and one big button:
   **PLAY · Gig n**. Coins and total stars along the top. Three small round
   icons: Tour, Shop, Band. A first-ever launch skips Home and drops straight
   into Garden gig 1.
2. **Gig intro** — two seconds, skippable: venue, gig number, and
   "NEW MUSICIAN: Clarinet" with the clarinet playing a bar.
3. **Gig** — the round.
4. **Results** — stars land one at a time with an orchestral hit each, coins
   count up, then **NEXT GIG** (largest), Retry (small), Home (icon).
   "Double coins" sits beside Next as the rewarded option, never larger.

Off the main path:

- **Tour** — the venues with their eight gigs and star ratings; tap to replay.
- **Shop** — grannies and guns (today's carousels, moved off the first screen).
- **Band** (slice 3) — every musician met so far; tap to hear them.

UI restraint still applies: no screen has more than one primary action.

---

## 6. Retention layer (slice 3)

- **Daily gift** with a streak.
- **Three missions** at a time ("reach FULL BAND twice", "earn 5 stars",
  "play a gig in the Workshop"), paying coins.
- **Jam mode** per venue, unlocked by its Grand Concert: no timer, no score,
  the whole band — the pure ASMR toy.
- **Rewarded ads, inside Poki's rules:** double coins at results; ten more
  seconds once per failed gig; try a locked gun for one gig. Each always has
  an equal-or-larger free alternative beside it.

---

## 7. Build slices

| Slice                    | Contents                                                                                                                                       | Status (2026-11-25)                                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **1. The gig**           | Level data, sized wall layout, line-up seating, star rating on the bar, per-gig difficulty, coin rebalance, results screen with stars and Next | **Built.** All five venues run their eight gigs. Garden tuned gig by gig; the other four checked at first and last gig only |
| **2. The tour**          | Home, gig intro, Tour map, Shop, save fields, first launch straight to gig 1                                                                   | **Built.** The gig intro names new musicians on their spinners; it does not yet play them a solo                            |
| **3. Reasons to return** | Missions, daily gift, Band album, Jam mode, rewarded options                                                                                   | **Part built:** one rolling mission and the daily gift. Not built: Jam mode, the album, "ten more seconds"                  |
| **4. The bands**         | Per-venue styles (jazz, rock, fairground, disco)                                                                                               | **Not started** — waiting on Garden's sound being signed off and sources approved, see `BANDS.md`                           |

Each slice ends with lint, tests, build, budget, a live playthrough, a commit
and a push.

### What the balance harness says

Starter gun, a bot that plays like a child and one that plays sharply
(`window.__bot.ladder('garden')` in a dev build):

| Garden gig | Band | Child-speed bot | Sharp bot   |
| ---------- | ---- | --------------- | ----------- |
| 1          | 3    | ★★★ at 4 s      | ★★★ at 4 s  |
| 3          | 5    | ★★★ at 10 s     | ★★★ at 10 s |
| 4          | 6    | ★★★ at 12 s     | ★★★ at 10 s |
| 5          | 8    | ★★              | ★★★ at 16 s |
| 6          | 9    | ★★★ at 21 s     | ★★★ at 16 s |
| 8          | 12   | ★★              | ★★★ at 26 s |

Later venues' Grand Concerts, with the gun a player would plausibly own by
then: two stars for both bots (Disco: three for the sharp one). Three stars
there is what the better guns are for. The bots do not steer around
obstacles, so real players should do a little better than these numbers.

**These are bots, not children.** The curve needs a real playtest before
submission.

---

## 8. Open decisions for David

These have working defaults and do not block the build:

1. **Names.** "Gig", "venue", "Grand Concert", "coins". Easy to change.
2. **The sound** — heard and liked by David on 2026-11-25. A second listen is due after the wake-up call, spotlight and section badges, before the remaining bands are built.
3. **Extra sample libraries** for rock and disco — see `BANDS.md`.
4. **Spinner art.** Procedural spinners now sit on backing discs and read
   well, but painted sprites would match the rest of the art.
