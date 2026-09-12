# Unused art — kept, not shipped

Art that was produced and is good, but that the game no longer uses. It lives
outside `public/` so Vite doesn't copy it into `dist/` and it doesn't count
against CLAUDE.md §3 rule 2's 8 MB initial-download cap — same reasoning as
the top-level `thumbnails/` folder.

## move-buttons/ (2026-09-12)

Hand-painted ◀ / ▶ move buttons plus their Granny Pink pressed states, and
they looked right. Retired the same day the left/right walking mechanic was
removed: nothing in the game could ever *require* repositioning (the umbrella
opens and closes on a timer, the cat is shooed by aiming near it, the duck
paddles), and the two-thumb grip walking forced was the direct cause of two of
the three critical input bugs the spec audit found. Aim became the only input.

Restore by moving these back to `public/sprites/ui/buttons/` and reinstating
`src/ui/MobileMoveButtons.ts` from git history (last present at commit 674e8e0).
