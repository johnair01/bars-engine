# Spec: The Friends' Fire, where you play the unfinished bar and a friend plays it home

<!-- The six-faces pipeline's spec template (six-faces-council council/spec-kit/spec.md), with bars-engine's
     Conceptual Model, Verification Quest, Dependencies and References sections added. Stages and owners:
     council/pipeline.yaml. Pass: six-faces-council council/passes/friends-fire-1_2026-11-02.md. -->

game: yes
intake: council/callsheets/charge-to-world.md

## The ask

> "Did this process use the game design ontology and game studio skills? This is the type of work I'd expect to have gone through the pipeline." (Wendell, 2026-11-02 16:00Z, on build 5 of charge to world, six-faces-council `council/callsheets/charge-to-world.md`)

**Who it is for:** a player on the creative line, at the end of their episode, whose loudest belief is "I'm not
capable"; first, the sample player of `council/charge-to-world/sample-player/`.
**What they feel now, and what should change:** at #534's fire the player watches their own song play itself, so the
fear of being heard is never met. After this, the player sounds the notes themselves, hands them over when they choose,
and hears a friend carry exactly those notes home.

## Purpose

Scene 4 of the charge-to-world episode, the road home: the player sits at the Friends' Fire, plays the unfinished bar on
the same five note seals the stump taught them, hands it to Oriel, and Oriel plays it home from their last note at their
pace. The last card offers the week's capability and takes the player home to the nook. It reworks prototype #534.

## Game type

A game of passion with a thread of skill (`game_types` in the design ontology). Coins: connection and sustainable joy
(renewable), about four minutes of time; the scene must not spend the need to be seen as good, so nothing grades the
playing. Tickets: satisfaction, reported by the player in their own words later over tea, shown as the fire lifting and
the rain staying gone; money, none from this scene and no money date.

## Conceptual Model

- **WHO:** the player (their avatar, seated); Oriel, the friend who kept the recording; two townsfolk, unnamed.
- **WHAT:** the song: the old bar (eight notes), the notes from the stump, the notes played at the fire, and Oriel's
  ending; the take-home capability and the key.
- **WHERE:** the homeroom's rim at dusk, `/between/land.html?place=friends-fire`, reached from the Scale-House far bank.

## User stories

### Play what you have so far

**As a player sat on the empty crate**, I want to sound my own notes on the seals I learned at the stump, so the bar I
play is mine.
**Acceptance:** the crate's card opens five note seals with the stump's notes lit; each press sounds a note within 0.5 s
and the fire's light leans toward the player.

### Hand it over

**As that player**, I want Oriel to pick up only when I hand it over, so I choose when I am done.
**Acceptance:** with no "Hand it to Oriel" press nothing plays, however long the player waits; after the press Oriel
starts one beat later from the player's last note, at the player's pace, and ends on the held home note.

### Just listen tonight

**As a player who cannot play tonight**, I want to sit and listen, so the fire is still mine.
**Acceptance:** "Just listen tonight" plays the bar and its own ending on Oriel's guitar; the last card is the same.

### Take it home

**As the player after the song**, I want the week's step offered with the key, so I leave with a move I can use.
**Acceptance:** the last card heads "This week", offers the capability, gives the key's words and the friends' key to the
garage, asks for no name, and has two buttons: "Take it home to your nook" and "Stay by the fire".

### Verification quest

**As a tester**, I want a quest that walks me through the fire on a phone, so I can confirm the play before his look.
**Acceptance:** `cert-ctw-friends-fire-v1` shows on the quest list; its passages ask for the walk in, the sit, five notes,
the hand-over, a second sitting with "Just listen tonight", and the last card; the last passage mints the reward.

## Requirements

- **FR-001** At the fire, after the player sits, the card offers "Open the toolbag and play" and "Just listen tonight";
  "Stand up" stays available.
- **FR-002** "Open the toolbag and play" opens the five note seals of the stump (the same pentatonic, the same labels),
  with the notes from sessionStorage `ctw-song` shown lit; each press sounds the note in the player's string voice and
  appends it to the song state.
- **FR-003** A "Hand it to Oriel" seal is the only way Oriel starts; there is no timer and no auto hand-over.
- **FR-004** Oriel's ending is a pure function of the song state (`fire-song.js`): it starts from the player's last
  played note (else the last stump note, else the bar's cadence), walks the pentatonic to the home note in four to six
  notes, at the player's tempo (the median gap between their notes, held to 60-110 beats a minute, 84 when there is one
  note or none). Different played notes give different endings.
- **FR-005** "Just listen tonight" is a valid turn: Oriel plays the bar and its own cadence; the last card follows the
  same way.
- **FR-006** While the player plays, the camera rests in the seated framing: low three-quarter over the player's left
  shoulder at about 1.1 m, the fire in the middle third, Oriel upper right, eased in over about 1.2 s with no cut.
- **FR-007** Audio: the tuning is heard from the far bank; Oriel's last tuned string lands on the song's home note; the
  fire's crackle ducks about 6 dB while either plays; the friends are silent from the ask until the song ends.
- **FR-008** Laughter never answers the playing: the friends laugh on arrival at something said, and after the song a
  1.5 s silence comes before any laugh; nothing in the scene varies with which notes were played except Oriel's ending.
- **FR-009** The last card is the "Take it home" card of the user story, with drafted text read from the episode sheet
  (`takeHome()`); Oriel says one drafted line landing the recording secret before it.
- **FR-010** A verification quest `cert-ctw-friends-fire-v1` (bars-engine spec-kit-translator rule), framed as readying
  the episode's road home for a first player, walks a tester through FR-001 to FR-009; its last passage mints the reward.
- **FR-011** Preview params on preview hosts: `?place=friends-fire&at=crate` opens seated; `&song=1,3,0,4` seeds the
  stump notes for a test.

## Design decisions

| Decision | Choice | Whose |
|---|---|---|
| Who plays the bar | The player, on the stump's five seals | council, position ff1-you-play-it; episode sheet step 7 ("a small act done with what the character already has") |
| When Oriel plays on | Only on the player's hand-over; no timer | council, position ff1-hand-it-over; atlas `narrative-timed-response` reshaped |
| Oriel's ending | From the player's last note, at their pace, to home | council, position ff1-oriel-follows; the audio-director and game-designer roles |
| Laughter | Before at something said, after a silence as delight; never graded | council, position ff1-laughter-after-silence; the sheet's Protector secret; atlas `relationships-companion-approval` reshaped |
| The last card | An offer, the key, no name asked, two buttons | council, position ff1-take-home-offer; faces.yaml `reserved` |
| Order of work | Reel round, then stills, then code | council, position ff1-reel-before-rework; Wendell's ask above |
| A canon mechanic | `play-it-on`, proposed by the reel round | council, position ff1-play-it-on; Play Canon |
| Card text | Drafted from the episode sheet; the game master's to strike | the sheet (every line marked drafted) |

## Contracts

`public/between/land/fire-song.js`, pure functions, no drawing and no audio, ported from the reel's `make/engine.js`:

```
newSong({ bar: number[8], stump: number[] }) -> Song
play(song, degree: 0..4, t: seconds) -> Song          // appends { degree, t } to song.played
handOver(song) -> Song                               // song.handedOver = true; refused after a pass
pass(song) -> Song                                   // song.passed = true; refused after a hand-over
tempo(song) -> number                                // bpm, median gap of played notes, held to 60..110, else 84
ending(song) -> number[]                             // Oriel's notes, 4..6 long, last is 0 (home); pure
Song = { bar, stump, played: [{ degree, t }], handedOver: boolean, passed: boolean }
```

The feature adds no route, no table and no Prisma change. `ctw-song` in sessionStorage stays the carry from the clearing.

## Ontology

<!-- The design ontology's output contract. The face named owns the line. -->

- `design_intent`: the player plays their own unfinished bar for friends at the fire on the rim of home and hands it to Oriel, who plays it home from their last note; the scene rehearses the week's outer step (Diplomat)
- `intrinsic_pleasure`: being picked up where you stopped and hearing your own notes come back as an ending; Fellowship first, Expression second (Shaman)
- `ontology_objects`: TurnsAndSharedPool (order: player then Oriel on hand-over; common_stock: the song; fairness_repair: Oriel never takes an unhanded turn, a pass is valid); DelayedReturn (delay: clearing to fire; return: the stump's notes lit); Location road-home, Character Oriel and two townsfolk, Capability, Encounter; atlas rhythm-cue-response, narrative-service-as-response, narrative-delayed-choice-consequences, narrative-deliberate-silence, relationships-date-itinerary (partial), relationships-companion-approval and narrative-timed-response (reshaped); proposed canon mechanic play-it-on; GameOfPassion with GameOfSkill (Sage)
- `mechanical_claims`: no note is wrong; Oriel plays only after the hand-over; the ending is a pure function of the notes and tempo and differs when they differ; a pass yields the bar's own ending; nothing is scored (Architect)
- `aqal_attention`: We first (friends who shift along and follow); I (the fear of being heard, the player's own meaning); It (hands on seals, the sit); Its (the song state, the card's capability); line creative; exit by standing up or passing (Shaman)
- `agency_and_consent`: you step off the plank and hear a guitar being tuned through the trees, walk out to a low fire on the rim of home where one crate is left empty for you, sit, and Oriel asks "Play what you have so far?"; play, pass, hand over or stand up are each yours, and no name is asked (Diplomat)
- `evidence_and_unknowns`: evidence: the episode sheet and its secrets, the built clearing and Scale-House, #534 and its four frames, his A on ctw-walk-look-2, his question on build 5; unknown: whether five seals at the fire feel like playing, the phone frame rate with three seated friends, a CC0 laughter recording (Sage)
- `provenance_effects`: keeps the sheet's drafted scene, Oriel's line and treasure, the approved forest at dusk, the far bank, the figure and crate sit, #534's layout and pieces, the stump's seals and ctw-song; retires the self-playing bar and the graded laughter caption with their reasons; supersedes look ctw-fire-look-1 when the new look posts (Regent)
- `risks_and_tests`: a cutscene with buttons, laughter as a grade, skipping the reel; test below (Challenger)
- `implementation_translation`: bars-engine `/between/land.html?place=friends-fire`; `fire-song.js` engine and its vitest; the stump's seals reused on the crate card; the seated camera; the audio mix; no code before the reel's yes and the stills (Architect)
- `decision_or_open_authority`: seven council positions (ff1-you-play-it, ff1-hand-it-over, ff1-oriel-follows, ff1-laughter-after-silence, ff1-take-home-offer, ff1-reel-before-rework, ff1-play-it-on); no question; the feel is his on the reel round's look (Regent)

## Reserved items

This feature holds no reserved item. No money, paywall or real person's name; the take-home card asks for no name and keeps none. Oriel's lines and
every card line are drafted episode text, the game master's to strike, not canonical prose.

## Clarify

The reach test ran on five questions, each sent back to its face with the record (council/faces.yaml `reach_test`). Who
plays the bar: the Shaman cites the sheet's step 7. Whether a timer hands the song over: the Challenger cites the atlas
reshaping of `narrative-timed-response`. Whether the laughter stays: the narrative-director and Regent cite the sheet's
aspect and the Protector secret. Whether the card asks who the person is: the Regent cites `reserved` and the
Quickstart's rule that disclosure is not progression currency. Whether a new mechanic needs his say now: the Sage cites
the pipeline's `prototype` rule, where mechanics are ruled on at the reel's look. All five stand as positions; there is
no open marker in this spec.

## How we will know it failed

- **The cheap test, run before building:** a satisfaction-reel round (plan.md, "Reel round 1 brief") whose
  `make/check.js` plays three scripted sittings through `make/engine.js`: the four stump notes then hand over; one note
  then hand over; pass. It must print pass for "the three endings differ" and "no note plays before a hand-over or a
  pass", and Wendell scores the reel's keyframes, the hand-over moment among them.
- **The result that stops the work:** the engine gives the same ending for different played notes; or his score marks
  the hand-over moment lead, or his note says the song still plays itself. Then the play mechanic is rethought in a
  second round, and #534 is not reworked until a round lands gold at the hand-over.

## Definition of done

- [ ] `npm run check`, the land vitest (`land-place.test.ts` and the new `fire-song.test.ts`) and `npm run build` pass.
- [ ] On the Vercel preview, `?place=friends-fire&at=crate` plays the five seals, the hand-over and Oriel's ending, and
      "Just listen tonight" plays the bar's own ending.
- [ ] The Impeccable critique of the crate and last cards is run and its findings fixed.
- [ ] His look on the board, opened at the preview, supersedes `ctw-fire-look-1`.

## Dependencies

#534 (draft) for the place, pieces and sit; #502 and #529 for the Scale-House far bank; the clearing's stump for the
seals and `ctw-song`.

## References

Six-faces-council: `council/passes/friends-fire-1_2026-11-02.md`; `council/callsheets/charge-to-world.md`;
`council/charge-to-world/sample-player/episode.md` and `locations.yaml`; `docs/satisfaction-reel.md`; the stills folder
`council/callsheets/stills/2026-11-02-ctw-friends-fire/` (branch `claude/project-thread-almrpj`).

## Signed

<!-- One line per stage reached, naming every owner in council/pipeline.yaml. -->

- intake: shaman, diplomat (2026-11-02, from council/callsheets/charge-to-world.md, Intake and the build 5 brief; intake_check ok)
- spec: architect, regent (2026-11-02)
- clarify: sage (2026-11-02; five questions, five positions, no board question)
- falsify: challenger (2026-11-02; the reel round's engine check and his keyframe score, not yet run)
- plan: architect, regent (2026-11-02)
- analyze: sage, challenger (2026-11-02; contract_check.py exits 0)
