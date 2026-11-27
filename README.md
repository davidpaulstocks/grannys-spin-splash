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
npm run guns           # cut gun art sheets in _art_inbox/guns/ into one picture + anchor per gun
```

## Balance harness (dev only)

In a dev build (`npm run dev`), open the browser console and run `await window.__bot.ladder('garden')` to play all eight gigs of a venue with scripted players, far faster than real time, and print stars and coins (on the starter gun unless you pass another). It is not included in production builds. See `src/dev/botSim.ts` for the other calls.

## Review link (dev and review only)

`?venue=<id>&gig=<n>` opens that gig directly, e.g. `http://localhost:5173/?venue=kitchen&gig=1`, so a venue's band can be heard without earning the stars to reach it. It bypasses the tour, so it is for review only and must be removed before Poki submission (see BACKLOG.md).

## What a gig is, today (2026-11-27)

Every gig opens with a band count-in (3, 2, 1, GO!); the water then fires by itself (Space switches it off and on) and the player only aims. Visitors (treats, coin thieves, blockers) come from a venue's first gig; at the whistle a Big Finish pays each instrument still playing. There are eighteen guns. None of this has been played or heard by the owner yet; see `BACKLOG.md`.

## Where the plans live

- [`docs/UPLIFT_PLAN.md`](./docs/UPLIFT_PLAN.md) — the orchestra, juice and assessment plan
- [`docs/ENGAGEMENT_DESIGN.md`](./docs/ENGAGEMENT_DESIGN.md) — gigs, coins and navigation (authoritative over CLAUDE.md §4 and §11, except where `REWARD_LOOP.md` supersedes it)
- [`docs/REWARD_LOOP.md`](./docs/REWARD_LOOP.md) — coins, the groove, stars from the coin total, gun boosts and upgrade levels (authoritative for scoring, stars, earning and prices)
- [`docs/BANDS.md`](./docs/BANDS.md) — one musical style per venue, its room and its set pieces, and the sample sources
