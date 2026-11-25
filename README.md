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
npm run samples        # rebuild the orchestra instrument sprite (needs ffmpeg and lame)
npm run optimise       # convert PNGs dropped in public/sprites/ to WebP (tools/sprite-optimise.sh)
```

## Balance harness (dev only)

In a dev build (`npm run dev`), open the browser console and run `await window.__bot.ladder('garden')` to play all eight gigs of a venue with scripted players, far faster than real time, and print stars and coins. It is not included in production builds. See `src/dev/botSim.ts` for the other calls.

## Where the plans live

- [`docs/UPLIFT_PLAN.md`](./docs/UPLIFT_PLAN.md) — the orchestra, juice and assessment plan
- [`docs/ENGAGEMENT_DESIGN.md`](./docs/ENGAGEMENT_DESIGN.md) — gigs, stars, coins and navigation (authoritative over CLAUDE.md §4 and §11)
- [`docs/BANDS.md`](./docs/BANDS.md) — one musical style per venue and the sample sources awaiting approval
