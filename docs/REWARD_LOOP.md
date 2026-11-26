# The reward loop — coins, the groove and the jackpot

**Written:** 2026-11-26 · **Status:** being built. Supersedes the star rule in
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

## The loop in four sentences

1. **Every instrument that is spinning throws coins**, and throws more the
   faster it spins.
2. **Keeping the band going builds the groove**, a multiplier from ×1 to ×5
   on every coin.
3. **If an instrument drops out of full speed, the groove drops a level.**
   That is the jeopardy: chase new instruments and neglect the old ones and
   the multiplier never builds.
4. **Stars are earned by the coin total**, so three stars takes a good run,
   and the number at the end is the score.

## Rules

| Thing                       | Rule                                                                                                                                                                                      |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pay tick                    | Every 500 ms from the first squirt to the final whistle                                                                                                                                   |
| Pay per instrument per tick | Slow 1 · medium 2 · full speed 4                                                                                                                                                          |
| Groove                      | Level 1–5. A ring fills toward the next level at `(instruments at full ÷ band) ÷ 3 s`, so the full band earns a level every three seconds and half the band every six                     |
| Drop-out                    | An instrument falling out of full speed costs one groove level in a band of up to four, and proportionally less in a bigger one (a quarter of a level in a sixteen-piece). Never below ×1 |
| Jackpot (Splash Frenzy)     | The whole band at full at once: groove gains a level at once and every coin is doubled for the Frenzy window                                                                              |
| Power-up                    | Double Stars doubles coins for its window, as before                                                                                                                                      |
| Coins per tick              | `sum of instrument pay × groove × 2 if jackpot × 2 if Double Stars`                                                                                                                       |
| Stars                       | Locked in as the gig's coin total passes each of three targets (`starTargets` in `gigs.data.ts`). No star = gig not passed                                                                |
| Best                        | The best coin total per gig is kept; beating it is called out                                                                                                                             |

Removed: coins for a spinner climbing a tier, coins per star, per-second tips,
the hit-streak combo and its multiplier, and stars for the share of the band
at full speed.

## What the player sees

- **During the gig:** coins fly from each paying instrument to one large
  counter at the top; a bar under it shows the three star targets; a badge
  shows the groove (×3) with its ring. An instrument about to drop out
  flashes a warning ring; when one drops the badge cracks down a level.
- **At the end:** the coin total counts up large, stars land, "NEW BEST" if it
  is one. Then one panel answers "what now?": the next thing in the shop with
  a bar (1,120 / 2,000), or a BUY button if it can be afforded, and how many
  stars the next venue needs. NEXT GIG stays the largest button.
- **On Home:** the same "saving for" bar.

## Why play the next gig

- **Each gig adds a musician**, so the band is bigger, the music fuller and
  the coins faster. The results screen says who joins next.
- **A path is always on screen at the end:** this venue's eight gigs as dots
  with their stars, where the player is on it, and the next venue at the end
  of the row with the stars it still needs.
- **Guns are the upgrade.** A better gun fills instruments faster and
  multiplies every coin (`coinBoost` on `GunDef`: ×1 · ×1 · ×1.5 · ×2 · ×3 ·
  ×5). The shop and the results screen say so in those words: "Coins ×1.5".
  Star targets rise from venue to venue to match, so a better gun is how
  earlier gigs get their third star.
- **Next (not built):** upgrade levels per gun, so there is always a
  purchase within reach without painting more guns; more guns after that.

## Balance targets

Tuned with the bots in `src/dev/botSim.ts`: a child-speed bot should pass
every gig with one or two stars; a sharp bot should three-star most gigs but
not without the groove at ×4 or ×5 for much of the round. Prices are set
from the measured totals so the first gun arrives after about four gigs.
