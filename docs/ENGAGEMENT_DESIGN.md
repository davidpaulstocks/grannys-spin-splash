# Granny's Grand Tour — Engagement Redesign

**Updated 2026-11-27:** jeopardy (coin thieves, blockers), the Big Finish, the rebuilt results screen with "Double coins" removed, the eighteen-gun ladder and the count-in with auto-fire changed parts of this document; where they conflict, `docs/REWARD_LOOP.md` and the "2026-11-27" notes below win. None of it has been played or heard by David.

**Written:** 2026-11-25 · **Status:** approved direction (David: "the whole game
needs to be rethought from an engagement perspective… a big transformation I
need you to oversee and drive"). Built in slices; each slice is playable.

> **Updated 2026-11-26.** After David played the build on 2026-11-26,
> `docs/REWARD_LOOP.md` replaced the scoring and earning rules in this
> document. **It supersedes §3's star rule (stars from the share of the band at
> full speed, and the encore) and §4's earning table and prices.** It also
> replaced the wake/sleep wording: the goal is now to _keep the band playing_.
> §5 and §7 below were brought up to date; §1, §2, the gig ladder and §6 still
> stand as written. Where this file and `REWARD_LOOP.md` disagree, `REWARD_LOOP.md`
> and the code win.

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

> **The purpose, as the game now says it (rewritten 2026-11-26):** _keep the
> band playing — get as many instruments going at once as you can, and keep
> them going._ David: "I don't think waking the band is the right term… It's
> getting everything playing, create as much music as possible." Every spinner
> is a musician with a painted instrument; a spinning one plays and throws
> coins, a stopped one is quiet. The words are playing, quiet and full band;
> the 2026-11-25 asleep/awake wording, the "z z z" and the band meter are gone.
> The top of the screen is a score bar (the coin total, with a star at each of
> three coin targets) and a groove badge, and a YOUR GOAL line (since
> 2026-11-27 a one-line plate beside Granny; the targets stand under each star
> on the score bar) states the goal while the count-in plays before every gig. An instrument about to
> drop out of full speed rocks and shows an orange ring.

- **Goal, in one sentence a seven-year-old can act on:** get the whole band
  playing at once.
- **Superseded 2026-11-26 (`docs/REWARD_LOOP.md`):** stars now lock in as the
  gig's coin total passes three targets shown on the goal card, not at 60% /
  80% / 100% of the band at full speed, and the encore payout is replaced by
  the pay clock (every spinning instrument pays every half second). Full band
  still triggers Splash Frenzy. The two bullets below are the 2026-11-25 rule,
  kept as history.
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
  visitors (a blocker, a coin thief or a treat, from the venue's first gig; they replaced the fixed cat, umbrella and duck), moving targets. Tuned with a bot that plays like a child
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

> **Superseded 2026-11-26 where it conflicts with `docs/REWARD_LOOP.md`.** The
> two currencies below still hold (coins are spent, stars are the rating and
> open venues). The earning and price tables have been brought up to date.

Poki allows no purchases and no second currency, so there is exactly one.

- **Coins** — earned in every gig, spent in the shop. (Today's "stars in the
  vault" are renamed: stars now mean the rating, coins mean money.)
- **Stars** — the rating. Never spent. Total stars open venues.

| Earned                                 | Amount                                                                                                |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Coins thrown by spinning instruments   | Every 500 ms each instrument pays 1, 2 or 4 by speed, times the groove (x1 to x5) and the gun's boost |
| First time earning each star on a gig  | +200 per star                                                                                         |
| Daily gift                             | 800, plus 400 per consecutive day, growing for up to a week                                           |
| Mission complete (one rolling mission) | 1,000 to 2,400                                                                                        |

| Spent on                                     | Price                                                              |
| -------------------------------------------- | ------------------------------------------------------------------ |
| Guns                                         | 0 · 0 · 6,000 · 20,000 · 60,000 · 200,000                          |
| Gun upgrade levels (2 to 5)                  | the larger of 1,500 and 30% of the gun's price, doubling per level |
| Grannies                                     | 0 · 0 · 30,000                                                     |
| Later: band cosmetics, alternative musicians | —                                                                  |

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
   **PLAY · Gig n**. Coins and total stars along the top. Along the bottom, a
   row of the five venues as tiles (tap to switch; a locked one says how many
   stars it needs). A "saving for" strip names the cheapest next gun, upgrade
   or granny with a bar of coins toward it (tap for the Shop). ALL GIGS (the
   tour map) and SHOP are labelled buttons. A first-ever launch skips Home and
   drops straight into Garden gig 1.
2. **Gig intro** — two seconds, skippable: venue, gig number, and
   "NEW MUSICIAN: Clarinet" with the clarinet playing a bar.
3. **Gig** — the round.
4. **Results** — three beats, top to bottom. The coin total counts up large as
   the stars land one at a time ("NEW BEST" when it is one, and how far the
   next star is); then "what now": the next thing in the Shop with a bar, or a
   BUY button when it can be afforded; then the venue's eight gigs as a path
   with the next venue at the end and the stars it needs. Below, **NEXT GIG**
   (largest, the only green button) with who joins at the next gig, Retry
   (small) and Home (icon). **2026-11-27:** the screen was rebuilt (one layout; a
   failed gig says "Almost!" with TRY AGAIN as the one green button; a NEW WORLD
   card with GO THERE when the stars open a venue; the next venue on the path is
   a button) and "Double coins" was removed, so there is no rewarded option on it.

Off the main path:

- **Tour** — the venues with their eight gigs and star ratings; tap to replay.
- **Shop** — grannies and guns (today's carousels, moved off the first screen); the gun card shows five level pips, what the gun does in words and one BUY / UPGRADE button.
- **Band** (slice 3) — every musician met so far; tap to hear them.

UI restraint still applies: no screen has more than one primary action.

---

## 6. Retention layer (slice 3)

- **Daily gift** with a streak.
- **Three missions** at a time ("reach FULL BAND twice", "earn 5 stars",
  "play a gig in the Workshop"), paying coins.
- **Jam mode** per venue, unlocked by its Grand Concert: no timer, no score,
  the whole band — the pure ASMR toy.
- **Rewarded ads, inside Poki's rules:** ~~double coins at results~~ (removed 2026-11-27: David asked "how have I earned that?"); ten more
  seconds once per failed gig (not built); try a locked gun for one gig (not built; the Shop's free-gun ad is the only rewarded option today). Each always has
  an equal-or-larger free alternative beside it.

---

## 7. Build slices

| Slice                    | Contents                                                                                                                                               | Status (2026-11-26)                                                                                                                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. The gig**           | Level data, sized wall layout, line-up seating, star rating, per-gig difficulty, coin rebalance, results screen with stars and Next                    | **Built.** All five venues run their eight gigs. Stars now come from the coin total (`REWARD_LOOP.md`); the results screen is the three-beat one. Garden tuned gig by gig; Workshop spot-checked (its gig 4 looked too hard); Kitchen, Funfair and Disco untuned under the new scoring |
| **2. The tour**          | Home, gig intro, Tour map, Shop, save fields, first launch straight to gig 1                                                                           | **Built.** Home has a venue strip and a "saving for" strip; the Shop has gun upgrade levels. The gig intro names new musicians on their spinners; it does not yet play them a solo                                                                                                     |
| **3. Reasons to return** | Missions, daily gift, Band album, Jam mode, rewarded options                                                                                           | **Part built:** one rolling mission and the daily gift. Not built: Jam mode, the album, "ten more seconds"                                                                                                                                                                             |
| **4. The bands**         | Per-venue styles (jazz, rock, fairground, disco)                                                                                                       | **All five bands built**, each in its own room with its own Frenzy fanfare, closing chord, accents and results chimes (2026-11-26); Workshop reworked at 136 BPM. None of the 2026-11-26 audio has been heard by David, see `BANDS.md`                                                 |
| **5. The reward loop**   | Coins from every spinning instrument, the groove, stars from the coin total, the results screen, gun coin boosts and upgrade levels (`REWARD_LOOP.md`) | **Built 2026-11-26** (`dc38f8c`, `4b4cd4e`); bot-tested on Garden only, not played by David since                                                                                                                                                                                      |
| **6. Visitors**          | Random surprise blockers, sitters and treats replacing the fixed obstacles                                                                             | **Built 2026-11-27** (`ceda261`, `cd20e22`, `dd6b821`): 18 painted visitors from a venue's first gig; sitters steal coins, blockers silence two or three instruments; not played by David. Balance bot does not understand visitors                                                    |

Each slice ends with lint, tests, build, budget, a live playthrough, a commit
and a push.

### What the balance harness says

Starter gun, a bot that plays like a child and one that plays sharply
(`window.__bot.ladder('garden')` in a dev build). _The table is the 2026-11-25 reading, under the old star rule and slower wind-down; it is kept as history._ After the 2026-11-26 reward loop the Garden bots on the starter gun read (commit `dc38f8c`): child-speed bot three, two, two and one stars on gigs 1, 3, 5 and 8; sharp bot three, three, three and two stars. Workshop was spot-checked only; the other venues have not been read under the new scoring.

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
2. **The sound** — Garden and the Kitchen heard and liked by David on 2026-11-25. Not yet heard: the Workshop, Funfair and Disco bands, and the change that makes each instrument answer a squirt in its own voice.
3. **Per-band set pieces** — done 2026-11-26: the Frenzy lean-in, fanfare, closing chord, accents and results chimes are played by each band's own instruments; see `BANDS.md`. Awaiting David's listen.
4. **Spinner art.** Done 2026-11-26: every spinner wears a painted instrument (36 pictures); the drawn badge is only a fallback.
