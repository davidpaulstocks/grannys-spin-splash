# Bands — one style per venue

**Written:** 2026-11-25 · **Status:** Garden built; the rest awaiting David's
sign-off on Garden's sound and approval of extra sample sources.

The engine separates the mechanic (each spinner is a musician with a written
part) from the style (which recordings, which score). A new band is a new
score plus a new set of recordings. No engine change.

## Plan

| Venue    | Band                            | Feel                                           | Recordings                                                                         |
| -------- | ------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------- |
| Garden   | Chamber orchestra               | G major, 96 BPM, pastoral                      | **Built.** VSCO-2 CE                                                               |
| Kitchen  | Jazz combo                      | C major, ~120 BPM, swung                       | Upright bass, piano, muted trumpet, clarinet, vibraphone, tenor sax, brushes, ride |
| Workshop | Garage rock band                | A minor or C major, ~130 BPM, straight eighths | Drum kit, electric bass, distorted and clean guitar, organ, tambourine             |
| Funfair  | Fairground organ and brass band | F major, 120 BPM, oom-pah                      | Organ, tuba, trombone, trumpet, snare, cymbals — mostly VSCO-2 CE already          |
| Disco    | Funk/disco band                 | D minor, ~120 BPM, four on the floor           | Drum kit, electric bass, muted guitar, electric piano, strings, brass              |

Until each is built, every venue plays an orchestral stand-in written in the
right key, tempo and feel, so nothing is silent.

## Sources to approve

Only CC0 / public-domain libraries are proposed: free to ship inside a
commercial game, no attribution needed. Licences below were read from each
project's own page by a research pass; **each will be re-checked against the
repository's LICENSE file before a single file is downloaded.**

| Library                                                                                                 | Licence      | Gives us                                                                                                       | Notes                                                                                           |
| ------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| **VCSL** — Versilian Community Sample Library (github.com/sgossner/VCSL)                                | CC0          | Hi-hat open/closed, kick, snares, rim click, toms, claps, cowbells, congas, tambourines, vibraphone, tenor sax | Same author as the library already approved. Files fetchable one at a time                      |
| **Karoryfer** (github.com/sfzinstruments) — Big Rusty Drums, Growlybass, Meatbass, Emilyguitar, Weresax | CC0          | Full drum kit including **brushes**, electric bass, jazz upright bass, electric guitar, alto sax               | Big Rusty Drums is 2.3 GB as a whole; only a few dozen files would be fetched                   |
| **FreePats** (freepats.zenvoid.org)                                                                     | CC0 per bank | Hammond-style organ, electric piano, clean and distorted electric guitar                                       | Distributed as archives, so a whole bank must be downloaded to take a few notes (3–300 MB each) |

Excluded: anything share-alike, non-commercial or "custom" licensed (Salamander
drums, jRhodes, Philharmonia, and others).

Known gaps with no free source found: a true Rhodes, clavinet, slap bass,
finger snaps. Each has a workable substitute from the above.

## Size

Each band costs roughly 300–500 KB as a sprite. Headroom today is about
700 KB under Poki's 8 MB. Two measures make room for all five:

1. Convert the painted art from PNG/JPG to WebP (5 MB of sprites today;
   expected to roughly halve).
2. Load only the current venue's band, on entering the venue, instead of
   every band at boot.

## Order

1. David signs off Garden by ear (or sends notes).
2. Kitchen jazz combo — closest to what is already approved.
3. Funfair — mostly existing recordings.
4. Workshop rock and Disco funk, once the sources above are approved.
