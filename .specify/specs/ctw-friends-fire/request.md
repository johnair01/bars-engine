# Request: The Friends' Fire, scene 4 of charge to world

<!-- The feature request move's record. Procedure: council/moves/feature-request.md (six-faces-council).
     The 3 step was written from the record. The 2 step ran as the reach test, not as a board dialogue, because every
     candidate question came back answered from the record (pass friends-fire-1). The 1 step names the test; it has not
     run yet. -->

## The ask

> "Did this process use the game design ontology and game studio skills? This is the type of work I'd expect to have gone through the pipeline." (Wendell, 2026-11-02 16:00Z, on build 5 of charge to world, six-faces-council `council/callsheets/charge-to-world.md`, "build 5 miss")

## 3: Face it (third person)

### What are we trying to create or experience?

A player who has crossed their episode's forest and mended the Scale-House bridge walks out of the trees onto the rim of
their homeroom at dusk. Three friends sit on upturned crates round a low fire; Oriel tunes a guitar; one crate is left
empty for the player. The player sits, Oriel asks "Play what you have so far?", and the player plays the bar they never
finished, stops where they stop, and hands it to Oriel, who plays it home from their last note. The last card offers the
week's step, play one unfinished song for one person, and takes the player home to the nook. It is built in bars-engine
on `/between/land.html?place=friends-fire`, as scene 4 of the sample player's episode sheet.

### What is life like now?

Prototype #534 (draft, branch `claude/project-thread-almrpj`) builds the place in `public/between/land/friends-fire.js`
and the moves in `public/between/land/land.js` (`ffAct`, the `fire` and `crate` cards). The play is one button: the
fixed eight-note bar plays itself as if the player played it, then Oriel plays it on with the stump's notes
(sessionStorage `ctw-song`). In the clearing, by contrast, the stump takes notes from five seals the player presses one
at a time. The look `ctw-fire-look-1` is on the board and is superseded by this pipeline run.

### The grammar, the council's first answers

| Question | The council's answer | His correction |
|---|---|---|
| Who is being helped? | A player whose belief is "I'm not capable" and whose half-finished songs ride in a toolbag nobody hears; the sample player's sheet leads, and any player on the creative line follows | |
| What satisfaction are they looking for? | Inside: being picked up where you stopped, heard without being judged. Outside: playing one unfinished song for one person this week | |
| What altitudes does the help need? | Magenta (belonging at a fire, Shaman), green (friends who follow, Diplomat), orange (a song state the machine keeps honest, Architect) | |

## 2: Talk to it (second person)

**Casts:** Shaman 17 Following, becoming 42 Windfall (Oriel follows; more song comes back than went in). Architect 33
Retreat, becoming 32 Endurance (stop early and keep what you played; the exchange repeats a year-old one). Challenger 43
Unsaid, becoming 51 Shock (the Protector's fear of laughter is the unsaid sentence). Regent 26 Reserves, becoming 4 Fog
(the stored songs are spent today; build 5 guessed where it could ask). Diplomat 28 Overload, becoming 48 The Well (the
reach to the song was broken). Sage 60 Measure, becoming 48 The Well (a limit that makes it strong).

### Round 1

No round reached the board. Five questions ran the reach test and came back with citations (spec.md "Clarify").

### What the dialogue found

- **What will that get us?** Inside: the episode's loop closes on an act the player does, not one they watch. Outside:
  a scene that rehearses the week's outer step.
- **How does it feel to live here now?** The player's: the fire looks like home, and then the song plays itself.
  Wendell's: the work skipped the pipeline he built for this.
- **What would have to be true for someone to feel this way?** The notes must be theirs, Oriel's ending must audibly
  come from them, and the friends must never grade them. The Emotional Body's read is fear (metal) under the ask,
  turning to gold when the song is picked up.
- **What reservations do we have?** "I'm not capable" (the Weigher) and the Protector's "If nobody hears it, nobody can
  say it's bad". Evidence: the episode sheet, steps 6 and 7.

## 1: Be it (first person, tested)

### Aligned actions

| Face | Analysis | Action |
|---|---|---|
| Shaman | the felt sense is exposure; the stump's seals tell the hands they are safe | reuse the five seals at the fire; silence is a full turn |
| Architect | a song state whose ending is a pure function of the player's notes | `fire-song.js` engine, from the reel round's `make/engine.js` |
| Challenger | the risk is a cutscene with buttons | the reel's check that different inputs give different endings |
| Regent | build 5 skipped the order | reel, stills, then code; #534 stays a draft |
| Diplomat | the last card carries too much; the reach is broken | two-button cards; first 60 seconds from the far bank |
| Sage | one fire, one ask, one hand-over, one card | the plan's order |

### The test, and what it showed

The falsify test is spec.md "How we will know it failed": the reel round's engine check over three sittings and his
score of the hand-over keyframe. It has not run. Its result becomes "life now" for the build.
