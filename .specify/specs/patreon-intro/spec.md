# Spec: Patreon intro video

<!-- Council pipeline spec (council/pipeline.yaml in wendell-britt/six-faces-council). Asset sheet:
     council/callsheets/patreon-intro.md there; Game frame council/passes/patreon-week-1_2026-11-02/intro-game-frame.md. -->

game: yes
intake: council/callsheets/patreon-intro.md

## The ask

> "Ok I'd also like to start working on a motion graphics video intro to my Patreon as well as specifically scoped
> demos for the type of people I want backing me at the various tiers. ... I want to use the full game design pipeline
> for each" (Wendell, 2026-11-02 22:44Z, project chat; plan https://claude.ai/artifact/EAt83qjR5pMMMY2qWbSNk6)

> "Looks good. Patreon page is already live though we haven't figured out tiers aside from average $20 per person."
> (Wendell, 2026-11-02 23:10Z)

> "3a  2a 1a" (Wendell, 2026-11-02 23:33Z, in the thread: no voice in round 1; sample blocks; built features only)

**Who it is for:** a visitor who lands on Wendell's Patreon page and has never seen the game.
**What they feel now, and what should change:** they see a page about a creator they may not know. After 60 to 90
seconds they should feel let in backstage, see that the games are real places someone walks, and want one of four doors.

## Purpose

A 60 to 90 second video, recorded entirely from the built world on bars-engine, that shows the walker step into the
land, melt a block's weather at three stands, keep what is left, and end on four doors, one per Patreon tier. Nothing in
it is a mock frame: every shot is recorded from the build.

## User stories

### A visitor watches the walk

**As a Patreon visitor**, I want to watch someone walk through the game, so I can tell it is real before I pledge.
**Acceptance:** the video plays one unbroken walk from the arch to the clearing with no cuts, and reads as weather,
clearing and light with the titles muted.

### A visitor picks a door

**As a Patreon visitor**, I want to see which door is mine, so I know what my pledge joins.
**Acceptance:** the end card names the four doors side by side, none ranked above another.

### Wendell scores the look

**As Wendell**, I want to see the video at two settings of the Game-led to You-led dial, so I can choose how much of
me is on screen.
**Acceptance:** the shared pick page plays both cuts and takes his Emotional Alchemy score per moment.

## Requirements

- **FR-001** Every frame of the video is recorded from bars-engine's built land (`public/between/land.html`), the
  block's room as built in #521, on a virtual clock at 30 frames a second, with the page's buttons and cards hidden.
- **FR-002** The walk is one take: arrive through the arch, walk to each of the three stands in order, take each, keep
  the keepsake. The camera stays behind the walker's shoulder (the land's own camera).
- **FR-003** Titles sit over the walk, never instead of it, and come from the dial's title track (Game-led or
  You-led). No title says AI.
- **FR-004** The end card names the four doors: Family, Friendcraft, Flirtcraft Founders, Custom Game Master.
- **FR-005** Round 1 has no voice (his 3A, 2026-11-02 23:33Z). Sound is the world's own sound and music, laid in at
  the build; round 1's reel is silent and says so.
- **FR-006** The nook's hearth and doorway open the walk once a logged-in preview can be recorded; until then the walk
  opens at the arch, and the round says the nook shot is owed.
- **FR-007** The recorder, the title tracks and the cut are committed scripts, so a re-record after any change to the
  land is one command.

## Design decisions

| Decision | Choice | Whose |
|---|---|---|
| Voice | none in round 1 | Wendell, 3A, 2026-11-02 23:33Z |
| Source of every shot | recorded from the build, never drawn | intake keep list (his yes to ctw-walk-look-1, #521 "This is the room") |
| Recording | headless Chromium on a virtual clock, 30 fps; real-time capture gave 2.4 fps | council (falsify test, below) |
| Tool for the cut | ffmpeg with drawtext; Remotion not brought in | council (Game frame implementation_translation) |
| Door names on the end card | Family, Friendcraft, Flirtcraft Founders, Custom Game Master | council; tier names follow pt-tier-ladder |
| Dial | two cuts, Game-led and You-led, from the same footage | council; his score picks |

## Contracts

- Recorder: `node make/record.js <land url> <out>` writes `f00000.jpg ...` and `beats.json` (`{beat: [first, last]}`).
- Title track: `engine.js titleTrack(dial, beats)` gives `[{text, from, to}]` in frames.
- Cut: `bash make/cut.sh <frames> <dial> <out.mp4>`.
- No route or data shape changes in bars-engine for round 1. A `?door=intro` preview param is proposed for the build
  only if the hidden-chrome style rule stops working.

## Ontology

- `design_intent`: show a Patreon visitor, in under 90 seconds, that the studio makes walkable games, and hand them one of four doors.
- `intrinsic_pleasure`: wonder that turns into an invitation; the pleasure of being shown backstage and watching weather clear.
- `ontology_objects`: ReleaseResidue (the three stands' release and the keepsake, seen), Meter (light warming as the room clears), Place (land, block's room), Offer (the four tiers on the end card).
- `mechanical_claims`: nothing is tracked or gated for the viewer; every frame is the engine's real state after one scripted step (block state ice, water, gas, clear), tagged real.
- `aqal_attention`: It (the built world) leads; We (four doors, four communities) closes; I is Wendell's hand, set by the dial.
- `agency_and_consent`: no urgency, streaks or guilt; the video does not lead with AI; the four doors sit side by side; the sample block is tagged as a sample.
- `evidence_and_unknowns`: known: the land and room render headless and record smoothly on a virtual clock (falsify test). Unknown: whether the nook can be recorded without a login; how sound is laid in.
- `provenance_effects`: each beat names the build and the stand it came from in beats.json; the round folder keeps the recorder so the video and the doors stay one source.
- `risks_and_tests`: risk, the video reads as an advert; test, a muted cut reads as weather to clearing to light. Risk, it becomes a separate animation project; test, no frame is drawn outside the build.
- `implementation_translation`: a Playwright recorder with an injected virtual clock drives `window.__land` (me.target, block().act); ffmpeg cuts frames to mp4 and lays titles; no bars-engine code change for round 1.
- `decision_or_open_authority`: Wendell, on the round's look on the shared Patreon pick page (in the thread, off the board per his 23:24Z word); tier names follow pt-tier-ladder.

## Reserved items

- Tier prices and names on the Patreon page stay his (pt-tier-ladder); the end card names doors, not prices.
- His voice and face: none in round 1 (3A). A You-led cut uses his first person in titles only, shown to him before it ships.

## How we will know it failed

- **The cheap test, run before building:** record 4 seconds of the land walk headless on a virtual clock and check the frames are smooth at 30 fps with the walker behind-shoulder. Run 2026-11-02: 120 frames in 92 s wall time, smooth (council/callsheets/stills/2026-11-02-patreon-intro-reel-1/falsify.md).
- **The result that stops the work:** the recorded walk cannot reach the three stands in one take, or the muted cut does not read as weather to clearing; then the round goes back to the intake, not to drawn frames.

## Definition of done

- [ ] `contract_check.py` on this folder exits 0.
- [ ] Both cuts play on the shared Patreon pick page.
- [ ] Wendell scores the round.

## Signed

- intake: shaman, diplomat (2026-11-02)
- spec: architect, regent (2026-11-02)
- clarify: sage (2026-11-02)
- falsify: challenger (2026-11-02)
- plan: architect, regent (2026-11-02)
- analyze: sage, challenger (2026-11-02)
