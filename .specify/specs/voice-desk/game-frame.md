# Game frame: the Teaching Desk

Ontology: profile `game_design`

Carried from pass `voice-forge-1_2026-11-17` (store record), with the Sage's changes applied and his three answers of
2026-11-17 (vf-desk-look-1 B, vf-face-names-1 B, copy-edit-door-1 A). Mechanics: eye-mark, card-turn, compost-hatch,
tuning-bench (six-faces-council `canon/mechanics/`), checked against `canon/play-canon.md`.

## Game frame

**Player fantasy.** Wendell is the teacher of Calrunia's words, kneeling at a writing desk in his own hall. An
apprentice sits across from him who has never heard of the faces, ribbons or BARs. Every line he keeps teaches the
apprentice, and through it every writer who comes after, to name only what a player can see, in one hand's voice.

**Intake and character.** There is no form. The first sitting is the intake: his first five slips, what he rings, what
he keeps and the faders he sets become the apprentice's first lessons. His character is the cultivation figure he
already wears, kneeling with the brush (`brush-hand-cult-5`); his seal presses every kept line.

**Homeroom.** His homeroom is the desk in his hall. On it sit the slip tray, the ink stone (the lexicon, one carved tablet per word),
the bound book (kept lines with the struck line each replaced), the small brass bench with four faders (the voice
chart), and the hatch beside his knee. The apprentice kneels across the desk.

**World.** The desk is a threshold. Each slip names the screen it came from, so working a slip looks into that place:
the Tap the Vein ribbon screen first, then the crop packet and the sect intros. Between sittings the world is changed by
what he kept: the build refuses a word a screen never showed, and a screen whose lines were rewritten ships them.

**Core loop.** Draw a slip. The apprentice reads it aloud and stops at each word it cannot see. He holds a finger on a
word to ring it in chalk (eye-mark) or waves the apprentice on. Three redrafts and one blank card lie face down; he turns
each (card-turn), keeps one, writes his own, or sweeps them through the hatch with his rings as the reason
(compost-hatch). A ringed word goes to the ink stone for a plain meaning or to be kept off player screens. The bench
(tuning-bench) is there when he reaches for it. After five slips the desk rests.

**Encounters.** Four encounters bud from his four reservations, each ending as kept, not yet, or rest. The Tally
("we're not capable"): after three hatches in a row, the book opens to his first kept line beside his newest, with no
count. The Seal ("I'm not worthy"): every line he keeps is pressed with his seal and set above every agent line. The
Short Sitting ("I'm not good enough to do what it takes"): the sitting ends itself at five slips, and a sitting that
keeps nothing is complete. The Reading Circle ("I won't belong"): one of his playtesters reads a kept line cold, after
saying yes to its being kept, and the desk shows where the reader stopped or acted.

## Fields

- **design_intent:** Wendell teaches an apprentice to write Calrunia's lines so every writing agent works from what he kept, and canned or invented words stop reaching players.
- **intrinsic_pleasure:** triumph when a kept line ships; poignance when a cold reader understands it; bliss and peace from a sitting that ends by itself.
- **ontology_objects:** apprentice (NPC), slip, stop, chalk ring, redraft, kept line, stone, book, bench, pencil, read.
- **mechanical_claims:** eye-mark rings an unseen word; card-turn reads redrafts; compost-hatch drops a slip with its reason; tuning-bench sets the chart; the gate checks output.
- **aqal_attention:** I his felt sense of a line; We a cold reader's understanding; It the build gate; Its the compiled voice files.
- **agency_and_consent:** he keeps, hatches, writes or rests and owes nothing; readers consent at the read and see only what ships.
- **evidence_and_unknowns:** three rule passes did not stop the ribbon screen; typicality bias (arXiv 2510.01171). Unknown: whether a kept-line bank lowers it.
- **provenance_effects:** drafter, his mark, date, slip and screen on every bank line and stone; agent lines never enter the bank.
- **risks_and_tests:** the desk turns into proofreading (ask him after the first sitting); the gate over-fires (run it on Tap the Vein first).
- **implementation_translation:** store events in collection `voice`; deterministic export to `content/voice/`; `copy-scan --lexicon`; `voice-packet`; the desk at `/admin/voice-desk`.
- **decision_or_open_authority:** canonical prose is his; vf-desk-look-1 B, vf-face-names-1 B, copy-edit-door-1 A govern; five vf positions stand unless flipped.

## Anchor

The player kneels at the desk in his hall and teaches the apprentice across it, keeping the lines that name what a player can see,
until every writer of Calrunia starts from the words and lines he kept.
