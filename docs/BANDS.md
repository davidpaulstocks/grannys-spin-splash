# Bands — one style per venue

**Written:** 2026-11-25 · **Status:** all five bands built (Garden chamber
orchestra, Kitchen jazz combo, Workshop garage rock, Funfair brass band,
Disco funk/disco band). All three sample sources approved by David on
2026-11-25 and each repository's own LICENSE file checked (CC0-1.0). David
listened to Garden and the Kitchen on 2026-11-25 and called the music "really
delightful". On 2026-11-26, after the change that makes each instrument answer
a squirt in its own voice (`9707eee`), he confirmed the instruments are now
"distinct enough". He has given no notes yet on the Workshop, Funfair and Disco
bands themselves.

The engine separates the mechanic (each spinner is a musician with a written
part) from the style (which recordings, which score). A new band is a new
score plus a new set of recordings. No engine change.

## Plan

| Venue    | Band                  | Feel                                | Recordings                                                                                                                                                                                                                                                                                                            |
| -------- | --------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Garden   | Chamber orchestra     | G major, 96 BPM, pastoral           | **Built.** VSCO-2 CE                                                                                                                                                                                                                                                                                                  |
| Kitchen  | Jazz combo            | C major, 116 BPM, swung             | **Built.** Upright bass, ride, piano, tenor sax, brushes, vibraphone, guitar, muted trumpet, trombone (363 KB)                                                                                                                                                                                                        |
| Workshop | Garage rock band      | A minor, 132 BPM, straight eighths  | **Built**, 15 seats: drums, bass, rhythm guitar, organ, lead guitar, tambourine, claps, piano, cowbell, toms, cymbals, sax, horns, clean guitar, anvil. The `kit` bank plus the jazz guitar run through the amp (`Part.drive`) for the rock guitars; `src/audio/scores/workshop.ts`                                   |
| Funfair  | Fairground brass band | F major, 120 BPM, oom-pah           | **Built**, 16 seats: tuba, clarinets, fairground organ, snare, bass drum and cymbal, trumpet, glockenspiel, piccolo, trombone, xylophone, saxophone, French horn, bassoon, euphonium, solo clarinet, guitar. No strings; `src/audio/scores/funfair.ts`                                                                |
| Disco    | Funk/disco band       | D minor, 118 BPM, four on the floor | **Built**, 21 seats (20 musicians plus the mirror ball): bass guitar, kick, hi-hats, rhythm guitar, disco strings, snare and claps, electric piano, congas, trumpet, clavinet, saxophone, trombone, cowbell, tambourine, violins, glockenspiel, harp, violas, flute, cellos, mirror ball; `src/audio/scores/disco.ts` |

Workshop and Disco share a rhythm-section bank, `kit` (below). Workshop and
Disco have their own frenzy and finale lines; Funfair's frenzy is still the
shared `tuttiFrenzy` arrangement.

## Sources (approved 2026-11-25)

Only CC0 / public-domain libraries: free to ship inside a commercial game, no
attribution needed. Each repository's LICENSE file was read on 2026-11-25
before any download, and the sample builder (`tools/build-orchestra-samples.ts`)
refuses any repository not on its approved list.

| Library                                                                                               | Licence                                     | Used for                                                                                                                                                              |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VSCO-2 Community Edition (`sgossner/VSCO-2-CE`)                                                       | CC0-1.0                                     | The orchestra; muted trumpet and trombone for the jazz combo                                                                                                          |
| VCSL (`sgossner/VCSL`)                                                                                | CC0-1.0                                     | Piano, vibraphone, tenor sax, claps; conga, electric piano and clavinet in the `kit` bank. Also has hi-hat, kick, snares, toms, cowbells for rock and disco           |
| Karoryfer (`sfzinstruments/karoryfer.*`: big-rusty-drums, meatbass, emilyguitar, weresax, growlybass) | CC0-1.0                                     | Upright bass, brushes, ride, kick, sidestick, jazz guitar; kick, snare, rimshot, hats, crash, toms (big-rusty-drums) and electric bass (growlybass) in the `kit` bank |
| FreePats (freepats.zenvoid.org)                                                                       | CC0 per bank (not yet re-checked at source) | Not used yet. Wanted for Hammond organ, electric piano and distorted guitar                                                                                           |

Excluded: anything share-alike, non-commercial or "custom" licensed (Salamander
drums, jRhodes, Philharmonia, and others).

The `kit` bank (`tools/bands/kit.manifest.json`, `npm run samples -- kit`,
about 200 KB) is 13 instruments: kick, snare_kit, rimshot, hat_closed,
hat_open, crash, tom_hi, tom_lo (all `karoryfer.big-rusty-drums`), ebass and
ebass_stac (`karoryfer.growlybass`), and conga, epiano and clav (VCSL).

Distorted guitar needed no new source: `Part.drive` (0–1, in
`score.types.ts`) puts a seat through a soft-clip waveshaper and speaker-cabinet
filters (`OrchestraGraph._amp`), which turns the clean recorded jazz guitar into
the Workshop's rhythm and lead guitars at no download cost. The clavinet and
electric piano gaps were filled from VCSL. Known gaps with no free source
found: a true Rhodes, slap bass, finger snaps (the Kitchen uses claps). Each
has a workable substitute.

## How a band is built

1. A manifest per band in `tools/bands/<band>.manifest.json` names each
   instrument, its source repository and its notes.
2. `npm run samples -- <band>` downloads, trims, measures real pitch, and
   packs `public/audio/bands/<band>.mp3` + `.json`.
3. The band's instrument ids are added to `InstrumentId` and the band's name
   to `BAND_SPRITES` in `src/audio/orchestra/SampleBank.ts`; it then loads in
   the background after the orchestra.
4. A score in `src/audio/scores/` seats the musicians. A score may mix its
   own band's instruments with the orchestra's.

Still orchestral in every venue: the Frenzy lean-in, fanfare and closing chord
(`setPieces.ts`) and the feedback accents (harp, glockenspiel, timpani). Giving
each band its own is a follow-up.

## Size

Build is 5.22 MB, 2.78 MB under Poki's 8 MB cap (`npm run budget`). The
sprites are the orchestra (about 955 KB), the Kitchen (363 KB) and `kit`
(200 KB); the art is already WebP. Every bank loads at boot, in the background.
Loading only the current venue's band on entering the venue would save up to about
560 KB of boot download, but nothing needs it today.

## Measured, not heard

Offline renders put every band in the same loudness range as the Garden from
the opening group to Frenzy, with no clipping (full-band RMS: Garden 0.189,
Workshop 0.165, Disco 0.176, Funfair 0.158). The balance bot played the first
and last gig of Workshop, Funfair and Disco with no errors. We can measure
audio but not hear it.

## What is left

1. **David listens** to Workshop, Funfair and Disco, and to the own-voice squirt
   answer, wake-up call and spotlight (`9707eee`), and signs off or sends notes.
2. Per-band fanfares, closing chords and feedback accents, so the set pieces
   stop being orchestral in the rock, brass and funk venues.
