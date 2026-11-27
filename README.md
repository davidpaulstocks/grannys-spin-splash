# Granny's Spin Splash

Single-player Poki web game built with Vite + TypeScript + Phaser 3. See [CLAUDE.md](./CLAUDE.md) for the full design spec and [BACKLOG.md](./BACKLOG.md) for live progress.

## Quick start

```bash
npm install            # install dependencies
npm run dev            # vite dev server, http://localhost:5173
npm run build          # type-check + production build to dist/
npm run preview        # serve the production build locally
npm run lint           # eslint + prettier --check over the whole repo
npm run lint:fix       # eslint --fix + prettier --write
npm run test           # vitest unit + integration tests
npm run budget         # assert dist/ < 8 MB (Poki cap)
npm run samples        # rebuild every instrument sprite (needs ffmpeg and lame)
npm run samples -- kitchen   # rebuild one band's sprite (tools/bands/<band>.manifest.json)
npm run optimise       # convert PNGs dropped in public/sprites/ to WebP (tools/sprite-optimise.sh)
npm run instruments    # cut instrument art sheets in _art_inbox/instruments/ into icons (tools/slice-instrument-sheet.py)
npm run visitors       # cut visitor art sheets in _art_inbox/visitors/ into pictures
npm run guns           # cut gun art sheets in _art_inbox/guns/ into one picture + anchor + large hero.webp (for the reveal) per gun
npm run guns -- --hero-only   # rewrite only the hero.webp pictures, leaving the small pictures and anchors alone
npm run grannies       # cut a granny's three painted poses in _art_inbox/grannies/ into public/sprites/grannies/<id>/ (tools/cut-granny.py)
```

## Balance harness (dev only)

In a dev build (`npm run dev`), open the browser console and run `await window.__bot.ladder('garden')` to play all eight gigs of a venue with scripted players (a child, a keen player and an expert, who also shoo thieves, clear blockers and chase treats), far faster than real time, and print stars and coins. Each gig is played with the gun a first pass is expected to hold (`FIRST_PASS_GUNS` in `gigs.data.ts`) and with one two rungs further up; `__bot.batch(...)` runs many cases, `__bot.sweep(...)` a whole venue, and the harness runs headless. It is not included in production builds. See `src/dev/botSim.ts` for the other calls and `docs/REWARD_LOOP.md` for what it measured. In a dev build `window.__revealGun('dragon_drencher')` opens the gun reveal for any gun without buying it (`src/dev/revealDebug.ts`).

## Review links (dev and review only)

`?venue=<id>&gig=<n>` opens that gig directly, e.g. `http://localhost:5173/?venue=kitchen&gig=1`, so a venue's band can be heard without earning the stars to reach it. `?jam=<venue>` opens that venue's Jam (no timer, score or coins) whether or not it has been unlocked. Both bypass the tour, so they are for review only and must be removed before Poki submission (see BACKLOG.md).

## What a gig is, today (2026-11-27)

Every gig opens with a band count-in (3, 2, 1, GO!); the water then fires by itself (there is no off switch; Space does nothing in play) and the player only aims, with free aim that snaps to an instrument only when the pointer is close to it. Visitors (treats, coin thieves, blockers) come from a venue's first gig; at the whistle a Big Finish pays each instrument still playing. There are twenty-four guns across six worlds (the sixth, the Pirate Ship, opens at 110 stars), and five grannies who join at star milestones rather than costing coins; buying a gun (or tapping SEE IT BLAST on a gun not yet owned) plays a short product-film reveal. Passing a venue's last gig unlocks its Jam, a toy mode with no timer or score. The owner and his son played earlier builds on 2026-11-27, but nothing from the Pirate Ship, the Mythic guns or the granny talents onward has been played or heard by him; see `BACKLOG.md`.

## Where the plans live

- [`docs/UPLIFT_PLAN.md`](./docs/UPLIFT_PLAN.md) — the orchestra, juice and assessment plan
- [`docs/ENGAGEMENT_DESIGN.md`](./docs/ENGAGEMENT_DESIGN.md) — gigs, coins and navigation (authoritative over CLAUDE.md §4 and §11, except where `REWARD_LOOP.md` supersedes it)
- [`docs/REWARD_LOOP.md`](./docs/REWARD_LOOP.md) — coins, the groove, stars from the coin total, gun boosts and upgrade levels (authoritative for scoring, stars, earning and prices)
- [`docs/BANDS.md`](./docs/BANDS.md) — one musical style per venue, its room and its set pieces, and the sample sources
