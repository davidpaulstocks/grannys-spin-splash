# Bands — one style per venue

**Written:** 2026-11-25 · **Status:** Garden (chamber orchestra) and Kitchen
(jazz combo) built. All three sample sources approved by David on 2026-11-25
and each repository's own LICENSE file checked (CC0-1.0). David listened on
2026-11-25 and called the music "really delightful"; each new band still needs
his ears. Funfair, Workshop
and Disco still play orchestral stand-ins.

The engine separates the mechanic (each spinner is a musician with a written
part) from the style (which recordings, which score). A new band is a new
score plus a new set of recordings. No engine change.

## Plan

| Venue    | Band                            | Feel                                           | Recordings                                                                                                     |
| -------- | ------------------------------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Garden   | Chamber orchestra               | G major, 96 BPM, pastoral                      | **Built.** VSCO-2 CE                                                                                           |
| Kitchen  | Jazz combo                      | C major, 116 BPM, swung                        | **Built.** Upright bass, ride, piano, tenor sax, brushes, vibraphone, guitar, muted trumpet, trombone (363 KB) |
| Workshop | Garage rock band                | A minor or C major, ~130 BPM, straight eighths | Drum kit, electric bass, distorted and clean guitar, organ, tambourine                                         |
| Funfair  | Fairground organ and brass band | F major, 120 BPM, oom-pah                      | Organ, tuba, trombone, trumpet, snare, cymbals — mostly VSCO-2 CE already                                      |
| Disco    | Funk/disco band                 | D minor, ~120 BPM, four on the floor           | Drum kit, electric bass, muted guitar, electric piano, strings, brass                                          |

Until each is built, every venue plays an orchestral stand-in written in the
right key, tempo and feel, so nothing is silent.

## Sources (approved 2026-11-25)

Only CC0 / public-domain libraries: free to ship inside a commercial game, no
attribution needed. Each repository's LICENSE file was read on 2026-11-25
before any download, and the sample builder (`tools/build-orchestra-samples.ts`)
refuses any repository not on its approved list.

| Library                                                                                               | Licence                                     | Used for                                                                                                      |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| VSCO-2 Community Edition (`sgossner/VSCO-2-CE`)                                                       | CC0-1.0                                     | The orchestra; muted trumpet and trombone for the jazz combo                                                  |
| VCSL (`sgossner/VCSL`)                                                                                | CC0-1.0                                     | Piano, vibraphone, tenor sax, claps. Also has hi-hat, kick, snares, toms, cowbells, congas for rock and disco |
| Karoryfer (`sfzinstruments/karoryfer.*`: big-rusty-drums, meatbass, emilyguitar, weresax, growlybass) | CC0-1.0                                     | Upright bass, brushes, ride, kick, sidestick, jazz guitar. Electric bass and the full kit for rock and disco  |
| FreePats (freepats.zenvoid.org)                                                                       | CC0 per bank (not yet re-checked at source) | Not used yet. Wanted for Hammond organ, electric piano and distorted guitar                                   |

Excluded: anything share-alike, non-commercial or "custom" licensed (Salamander
drums, jRhodes, Philharmonia, and others).

Known gaps with no free source found: a true Rhodes, clavinet, slap bass,
finger snaps (the Kitchen uses claps). Each has a workable substitute.

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

Still orchestral in every venue: the Frenzy fanfare, the closing chord and the
feedback accents (harp, glockenspiel, timpani). Giving each band its own is a
follow-up.

## Size

Each band costs roughly 300–500 KB as a sprite. Headroom today is about
700 KB under Poki's 8 MB. Two measures make room for all five:

1. Convert the painted art from PNG/JPG to WebP (5 MB of sprites today;
   expected to roughly halve).
2. Load only the current venue's band, on entering the venue, instead of
   every band at boot.

## Order

1. **David listens to Garden and the Kitchen** and signs off or sends notes.
2. Funfair — mostly recordings already in the orchestra sprite.
3. Workshop garage rock and Disco funk — drum kit, electric bass and guitar
   from the approved libraries; organ and electric piano need FreePats
   re-checked at source first.
