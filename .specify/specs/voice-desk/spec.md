# Spec: The Teaching Desk, the game that builds Calrunia's writing voice

game: yes
intake: council/callsheets/game-voice.md (wendell-britt/six-faces-council; this strand's own callsheet is the store record `voice-forge`, with the build split in store record `voice-forge-build`)
game frame: .specify/specs/voice-desk/game-frame.md
roles: game-designer (.specify/specs/voice-desk/roles/game-designer.md), narrative-director (.specify/specs/voice-desk/roles/narrative-director.md)
spec: .specify/specs/voice-desk
assets: none - the desk reuses the kneeling brush-hand cultivation figure and its desk from `/mnt/project-files/3d-build/brush-hand-cult-5/`; this spec draws nothing new, and step 6 runs `assets_here.py` before any new drawing

## The ask

> "So the quality of the writing in the game is quite consistently bad and it's a big blocker for throughput. I'd like
> to do research on how to improve this. I'd like the Game Masters and Game design Studio to be leveraged for rthis as
> it touches all of our srufaces. And of course I'd like the process of coming up with a more effective writing voice
> to be gamified itself." (Wendell, 2026-11-17)
>
> "I want to create a game that can be used to develop the voice for the writing inside of Calrunia" (his Q1, same
> message)

His answers on the Council Board, 2026-11-17: `vf-desk-look-1` B, "Build the desk now" (18:32 UTC), so round zero is
not run first; `vf-face-names-1` B, "Named, with a plain meaning first" (18:33 UTC); `copy-edit-door-1` A, "Edit the
line on the look itself" (02:45 UTC), which is the pencil.

**Who it is for:** Wendell first, as the teacher at the desk; then every writer of game copy, agent or person, who
reads what he kept before writing; then each player, who meets only words a screen has already shown them.
**What they feel now, and what should change:** today he finds lines on every surface that "feel canned and are
revolting", rewrites them by hand, and fears people won't like the game because the writing is bad. After this, the
lines he keeps teach every later writer, the build refuses a word no screen has shown, and a sitting ends by itself
after five slips.

## Purpose

Give the game's voice a home in data that agents must read and a build that checks their output against it. Wendell
plays a short sitting at a desk: he rings words a newcomer could not see, keeps or writes the better line, and gives a
ringed word a plain meaning or keeps it off player screens. A pencil on each line of a copy look row does the same
teaching from the board. Both doors write store events; a deterministic export (no AI) compiles them into three
bars-engine files, and `copy-scan.py --lexicon` fails a build that uses a watched word on a screen that never showed
what it names.

**Problem.** Every check the repo runs tests the shape of a line (banned words, fragments, dangling "and"). None asks
whether a word names something the player was shown. The Tap the Vein ribbon screen
(`src/lib/tap-the-vein/paths.ts`) passed every check while naming ribbons it never draws, a line that "burns", and "the
sitting" no screen has shown. Research brief: `/mnt/project-files/voice-forge/brief.md`; pass
`council/passes/voice-forge-1_2026-11-17.md` (store record `voice-forge-1_2026-11-17`).

**Practice.** Deftness Development: spec kit first, data contracts before UI, deterministic over AI. The only AI in
this spec is the redraft job (FR-015), admin-only, reading only shipped game copy, never a player's writing.

## Design Decisions

| Decision | Choice | Whose |
|---|---|---|
| Who plays and who grows | Wendell is the teacher; the apprentice across the desk is the one that learns, and the lexicon and book are its growth | position `vf-teacher-not-clerk` (stands unless he flips it), from the Shaman, pass voice-forge-1 |
| Build the desk before round zero | Yes: round zero's two-set test is folded into the first sitting (step 7) instead of a text-only round before the build | Wendell, `vf-desk-look-1` B, 2026-11-17 18:32 |
| Face names on player screens | Allowed only after that screen, or one the player has already passed, says the face's plain meaning; the six faces enter the lexicon `proposed` with plain meanings seeded from `src/lib/allyship-deck/glossary.ts` | Wendell, `vf-face-names-1` B, 2026-11-17 18:33 |
| Where the voice lives | Three files in bars-engine `content/voice/` (lexicon, bank, chart), plus a fourth, `screens.yaml`, the map of screens to source files that the gate needs | position `vf-lexicon-home`; `screens.yaml` is this spec's (Architect), since the gate cannot know a screen from a file without it |
| What is law | Only a line he keeps or writes, and only a stone he picks (`marked_by: wendell`). Every agent line is a proposal and never enters the bank | Regent, pass voice-forge-1; `council/faces.yaml` reserves canonical prose to him |
| How `marked_by: wendell` is proven | The server sets it from the owner sign-in on `POST /api/board/saves` (`BOARD_OWNER_PLAYER_ID`); a body that claims it is ignored | this spec (Regent) |
| Record of play | Store events in a new board-save collection `voice` on the council board; the build reads compiled files only, never the store | Architect, pass voice-forge-1 |
| The gate | Fail a watched word on a screen that never showed it; fail a shipped line equal to a bank `old` he rewrote; warn on a new coinage | position `vf-gate-scope` |
| First slips | Shipped lines, starting with the Tap the Vein ribbon screen's nine lines | position `vf-first-slips` |
| Style A rules 2 and 6 on interface screens | Tested at the first sitting: the three redrafts for each ribbon slip come from two unlabelled sets, one under rules 2 and 6 and one without | position `vf-style-a-scope`; Challenger's round-zero test moved into step 7 by his B |
| The pencil | On copy look rows, each line carries a pencil; a tap makes the line editable in place; setting it down saves one store event. No form opens | Wendell, `copy-edit-door-1` A |
| No count of him | The desk never shows how many lines he kept, struck or hatched | Shaman and Challenger, pass voice-forge-1 (the kept-line count was dropped) |
| A sitting | Five slips, then the desk rests. A sitting that keeps nothing is complete | Shaman, pass voice-forge-1; his Q6 "I'm not good enough to do what it takes" |
| The eye-mark | Reuse the chalk ring already built for previews (`public/marks/chalk.js`, his A on `pm-mark-look-1`) and its feel from `canon/mechanics/eye-mark.yaml` | this spec (scout rung 1) |

## Conceptual Model

- **WHO:** Wendell (the teacher); the apprentice (an NPC with no knowledge of Calrunia, whose stops are computed, not
  written by AI); the redraft job (an agent whose lines are proposals); a cold reader (one of his three playtesters,
  with consent asked at the read); every later copy writer, who reads `voice-packet <screen>` first.
- **WHAT:** a slip (one shipped line, its screen and file); a stop (a word the apprentice cannot see); a chalk ring
  (eye-mark on a word); a redraft (an agent proposal); a kept line (his choice or his own words, sealed); a stone (a
  lexicon entry he marked); the book (`bank.jsonl`); the bench (`chart.yaml`); the pencil (the board's door to the
  same book).
- **WHERE:** the desk, an admin screen in bars-engine in his hall (`/admin/voice-desk`); the Council Board's copy look
  rows (the pencil); a cold read link (`/voice/read/<token>`).
- **Energy:** a sitting is about five minutes and ends by itself. Nothing he does is scored.
- **Primitives:** mechanics `eye-mark`, `card-turn`, `compost-hatch`, `tuning-bench` (`canon/mechanics/`,
  six-faces-council), checked against `canon/play-canon.md`; the chalk ring script; the board-save store; the
  glossary; `scripts/copy-scan.py` (on branch `claude/project-thread-qtp56p` until it ships).

## Data contracts

All four files are written by the export (FR-005) or by hand in a pull request. YAML keys sort as listed; lists sort by
`word` or `id`; the export's output is byte-identical for the same events.

### `content/voice/lexicon.yaml`

```yaml
version: 1
words:
  - word: ribbon              # lower case, the form the gate matches
    forms: [ribbons]          # other spellings the gate matches as the same word
    plain: "..."              # one sentence a five-year-old understands; empty while proposed with no seed
    usage: "..."              # one sentence that uses the word the way a screen should
    status: proposed          # proposed | stoned | banned
    shown_on: []              # screen ids (screens.yaml) that draw or say what the word names
    struck_for: []            # words he pointed at this entry at a stone pick; the gate treats them as banned stand-ins
    drafted_by: seed:glossary # seed:<source> | agent:<job> | wendell
    marked_by: null           # wendell | null; only wendell makes stoned or banned
    at: 2026-11-17            # date of the latest event that changed the entry
    slip: null                # the slip id that last changed it
    screen: null              # the screen that slip came from
```

`status: stoned` requires `marked_by: wendell` and a non-empty `plain`; `status: banned` requires `marked_by: wendell`.
The export refuses any other combination.

### `content/voice/bank.jsonl`

One JSON object per line, sorted by `at` then `id`:

```json
{"id":"vb-2026-11-17-001","old":"Pull the one that fits","new":"...","screen":"tap-the-vein/ribbons","file":"src/lib/tap-the-vein/paths.ts","source":"desk","ring":["pull"],"look_row":null,"marked_by":"wendell","at":"2026-11-17T19:02:11Z","slip":"slip-..."}
```

`source` is `desk` or `pencil`. `ring` lists the words he chalked on the old line (may be empty). `look_row` is set
for a pencil edit. `new` equal to `old` is never written. An agent redraft he did not keep never appears here.

### `content/voice/chart.yaml`

```yaml
version: 1
set_by: null          # wendell once he moves a fader; null while these are the council's defaults
at: null
faders:               # each 0-10; the council's notch is the default
  length:  {value: 3, low: "one short sentence", high: "a full paragraph"}
  figure:  {value: 2, low: "plain words only",   high: "images and metaphor"}
  warmth:  {value: 6, low: "cool and exact",     high: "warm and close"}
  address: {value: 7, low: "about the world",    high: "to the player as you"}
```

The four axes and their defaults are proposals (the tuning-bench forgiveness rule: nothing is kept until he sets it).
`voice-packet` prints them as the writer's brief; no check reads them yet.

### `content/voice/screens.yaml`

```yaml
version: 1
screens:
  - id: tap-the-vein/ribbons
    files: [src/lib/tap-the-vein/paths.ts]   # files whose player-facing strings belong to this screen
    after: [tap-the-vein/free-write]         # screens a player has always passed before this one
```

A file in `scripts/copy-scan.files` with no screen is screen `file:<path>` with `after: []`. Agents add screens by
pull request; this is code shape, not voice, so it is not his to mark.

### Store events (collection `voice`, board `council`)

docId `<kind>--<id>`; `data.kind` repeats the kind. The server stamps `at` and, on his saves, `marked_by: wendell`.

| kind | written by | data | what the export does with it |
|---|---|---|---|
| `slip` | redraft job (server) | `{id, line, screen, file, stops:[{word, why}], redrafts:[{id, text, set}]}` | nothing (the desk reads it) |
| `ring` | Wendell at the desk | `{slip, word, on: 'old' or <redraft id>}` | adds `word` to the bank line's `ring` when the slip is kept |
| `keep` | Wendell at the desk | `{slip, redraft: <id> or null, text}` | one bank line, `source: desk` |
| `hatch` | Wendell at the desk | `{slip, ring:[words]}` | nothing in the bank; kept as the reason in the store |
| `stone` | Wendell at the desk | `{word, pick: 'plain' or 'off' or 'same-as', plain?, usage?, target?}` | sets the entry (`stoned`, `banned`, or adds to `target`'s `struck_for`) |
| `bench` | Wendell at the desk | `{faders:{length, figure, warmth, address}}` | writes `chart.yaml` with `set_by: wendell` |
| `pencil` | Wendell on the board | `{old, new, screen, file, look_row}` | one bank line, `source: pencil` |
| `sitting` | the desk | `{id, slips:[ids], ended: 'five' or 'rest'}` | nothing |
| `read` | a cold reader, after consent | `{line, reader, stopped_at: <word index> or null, acted: bool}` | nothing (the Reading Circle shows it) |

A later event with the same docId replaces the earlier one (the store's latest-wins rule). An event whose `marked_by`
is not `wendell` never changes `status`, never writes the bank, and never writes `set_by`.

## API Contracts (API-First)

### `POST /api/board/saves` with `{board: 'council', collection: 'voice', docId, data}`

This route exists. `voice` joins `COLLECTIONS` in `src/lib/board/save.ts` and six-faces-council
`schema/board-save.schema.json` in one pair of pull requests (AGENTS.md: the save shape changes only as a pair). It is
not a `RECORD_KINDS` collection, so a save is born recorded and `board/pull.py` never reads it. Owner sign-in is
required, as today; the route sets `data.marked_by = 'wendell'` and ignores the body's value.

### `GET /api/board/voice?after=<seq>`

New, COUNCIL_MENU_TOKEN as bearer (same guard as `/api/board/records/[docId]`). Answers `{events:[{docId, seq, data,
receivedAt}], last}` for the council board's `voice` collection after `seq`, oldest first, at most 500 a page.

### `scripts/voice-export.ts`

`npx tsx scripts/voice-export.ts [--from <events.json>] [--check]`. Reads events (from the route, or a fixture file),
folds them in `seq` order onto the current `content/voice/` files, and writes them. `--check` writes nothing and exits
1 when the files would change. It uses no AI and calls no network except the one route.

### `scripts/copy-scan.py --lexicon [FILE...]`

Adds the gate (FR-008 to FR-011) to the existing scan. Output lines name the file, line, word, screen and rule.

### `scripts/voice-packet.py <screen>`

Prints, for one screen: its lexicon entries (word, plain, status), the words it may not use yet, the chart's faders as
sentences, and up to ten bank pairs from that screen (then from screens it comes `after`), newest first. Plain text a
writer pastes before drafting.

### Redraft job: `POST /api/admin/voice/slips` `{screen, count}`

This route is admin only. It draws `count` shipped lines from a screen, computes each line's stops, and writes up to three redrafts per
slip through the AI SDK, each first given `voice-packet <screen>` and each passing `copy-scan --strict` and
`--lexicon` before it is saved on the slip. Answers `{slips:[ids]}`.

## User Stories

### P1: A sitting teaches the apprentice

**As Wendell**, I want to sit at the desk, ring the words a newcomer could not see, and keep a better line, so the next
writer starts from my line and not from a guess.
**Acceptance:** after one five-slip sitting where he keeps two lines, `voice-export` adds two bank lines marked
`wendell`, the slip's screen shows them first in `voice-packet`, and the desk shows no number anywhere.

### P1: The build refuses a word the screen never showed

**As a player**, I want every word on a screen to name something I was shown, so I can act on it.
**Acceptance:** `copy-scan --lexicon` on Tap the Vein fails on "ribbon", "face" and "sitting" before the rewrite and
passes after the kept lines ship.

### P1: The pencil

**As Wendell on the board**, I want to fix a word on a copy look by writing over it, so teaching costs one tap.
**Acceptance:** tapping a line's pencil makes the line editable where it sits; setting it down saves one `pencil` event;
the next export adds one bank line with `source: pencil`; nothing else on the card moves and no form opens.

### P2: A plain meaning, or off the screens

**As Wendell**, I want to give a ringed word one plain meaning or keep it off player screens, so agents stop inventing
what it means.
**Acceptance:** a stone pick writes a `stone` event; the export sets the entry `stoned` with his plain meaning, or
`banned`, or adds the word to another entry's `struck_for`.

### P2: A cold reader shows where the line lost them

**As Wendell**, I want one of my playtesters to read a kept line cold and show me where they stopped, so I know it
works outside the desk.
**Acceptance:** the reader is asked first whether the read may be kept; on yes, a tap on a word writes `stopped_at`;
on no, nothing is stored; the reader never sees an agent draft.

## Functional Requirements

### Phase 1: data and export (step 2)

- **FR-001** `content/voice/lexicon.yaml`, `bank.jsonl`, `chart.yaml` and `screens.yaml` exist with the shapes above.
  The lexicon is seeded `status: proposed, drafted_by: seed:glossary` from `src/lib/allyship-deck/glossary.ts` for the
  six faces, the five moves, BAR and charge, and with empty `plain` for every word the ribbon screen uses that the
  glossary lacks: ribbon, face, sitting, pull. The bank starts empty. The chart holds the four defaults.
- **FR-002** The board-save collection `voice` is accepted on the council board in bars-engine and in the council's
  schema, in a pair of pull requests, with the fixtures in both repos.
- **FR-003** `POST /api/board/saves` sets `marked_by: 'wendell'` on a `voice` save made with the owner's sign-in cookie
  (`isBoardOwner()`) and strips any `marked_by` the body carried. A save made with COUNCIL_MENU_TOKEN is never marked.
- **FR-004** `GET /api/board/voice?after=` serves the collection's events in `seq` order behind COUNCIL_MENU_TOKEN.
- **FR-005** `scripts/voice-export.ts` folds events into the four files deterministically: the same events give the
  same bytes; an event not marked by him changes no status, bank line or `set_by`; `stoned` without `plain` is refused
  with the event's docId. A vitest covers each event kind with a fixture.

### Phase 2: the gate and the packet (step 3)

- **FR-006** `copy-scan.py --lexicon` runs inside `scripts/local/check.sh --build` after `--strict`.
- **FR-007** A word is watched when it is a lexicon `word`, one of its `forms`, or a `struck_for` word. Matching is
  whole-word and case-blind on player-facing strings only (the strings copy-scan already extracts).
- **FR-008** A watched word fails when its entry is `banned`, or when it is a `struck_for` word.
- **FR-009** A watched word fails on screen S when neither S nor any screen in S's `after` chain is in the entry's
  `shown_on`. This covers the six face names under `vf-face-names-1` B.
- **FR-010** A player-facing string fails when, after trimming and folding case and whitespace, it equals the `old` of
  a bank line whose `marked_by` is `wendell`.
- **FR-011** A coinage warns and never fails: a word in a player-facing string that is in neither the lexicon nor the
  pinned common-word list `content/voice/common-words.txt`, and is not in `scripts/copy-scan.allow`.
- **FR-012** The step 3 pull request runs the gate on Tap the Vein and lists every failure (expected: ribbon, face,
  sitting).
- **FR-013** `scripts/voice-packet.py <screen>` prints the packet described above; `.claude/skills/no-ai-slop/SKILL.md`
  and `.claude/skills/no-ai-slop/concrete-referent.md` tell every copy writer to run it before drafting.

### Phase 3: the pencil (step 4)

- **FR-014** A council row may carry `copy: [{line, screen, file}]` (at most twelve). The board draws each line as text
  with a pencil beside it. A tap on the pencil makes that line editable in place with the caret at its end; Enter, a tap
  outside, or a second tap on the pencil sets it down and saves one `pencil` event; Escape restores the old line and
  saves nothing; an unchanged line saves nothing. No dialog, panel or form opens. The row schema change is a pair of
  pull requests (bars-engine `src/lib/board/rows.ts`, six-faces-council `board/council-board.html` and
  `board/post_rows.py`).

### Phase 4: the redraft source (step 5)

- **FR-015** `POST /api/admin/voice/slips` (admin only) writes `slip` events. Each slip carries its stops: the gate's
  FR-008 and FR-009 hits and the copy-scan referent tripwire hits on that line, each with a one-line `why`. It carries
  up to three redrafts written with `voice-packet <screen>` in the prompt, each passing `copy-scan --strict` and
  `--lexicon`; a redraft that fails is dropped after two tries, and a slip may arrive with fewer than three.
- **FR-016** The job reads only shipped game copy and lexicon, bank and chart. It never reads a player's writing and
  never runs for a non-admin.
- **FR-017** For the ribbon screen's slips (step 7), the job writes redrafts from two unlabelled sets, one under Style A
  rules 2 and 6 and one without, and records the set on each redraft (`set: 'a' or 'b'`) where the desk never shows it.

### Phase 5: the desk (step 6)

- **FR-018** `/admin/voice-desk` (owner only) draws his cultivation figure kneeling at the desk (from
  `brush-hand-cult-5`, never the Dusk figure), the apprentice across it, the slip tray, the ink stone, the book and the
  bench, in the aesthetic contract.
- **FR-019** Drawing a slip lays it on the desk with its screen named in plain words. The apprentice reads it and
  pauses at each stop: the word lifts and the apprentice looks up. A finger held still 0.65 s on any word rings it in
  chalk (eye-mark feel); a tap anywhere else waves the apprentice on.
- **FR-020** Three redrafts arrive face down beside the slip with a fourth, blank card for his own line. Each turns on
  a tap (card-turn, 0.35 s). He keeps one (a press, sealed), writes his own on the blank card and keeps it, or sweeps
  all of them into the hatch (compost-hatch: 0.4 s fall, 10 s at the lip to pull back), and the hatch takes his chalk
  rings as the reason.
- **FR-021** After a slip is kept or hatched, each ringed word with no stone comes to the ink stone: three plain
  meanings to tap (the glossary seed and two from the redraft job), a blank to write his own, "keep it off player
  screens", or "means the same as..." pointing at another entry. He may leave the stone for later; nothing waits on it.
- **FR-022** The bench holds the four faders (tuning-bench: the council's notch always on the scale, a tap on it puts
  the fader back, nothing is kept until he sets it). It opens only when he reaches for it.
- **FR-023** A sitting ends by itself after five slips. A sitting can end earlier at his word, and that is complete. The
  close names the screens whose slips he worked, in words, with no count.
- **FR-024** The Tally: after three hatches in a row within a sitting, and only once a kept line exists, the book opens
  to his first kept line beside his newest. It shows no number. It closes on a tap.
- **FR-025** The Seal: every kept line, chosen or written, is pressed with his seal and goes into the book above every
  agent line. A player with no seal yet presses the empty bezel.
- **FR-026** The Reading Circle: from a kept line he can make a read link for one playtester. The link page first asks,
  "May Wendell keep what you tap here?" Yes stores `read` events; No lets them read and stores nothing. It shows only
  shipped or kept lines, never a redraft. The desk shows each kept read as the line with the word where the reader
  stopped circled, or a mark that they acted. Skip, done and leaving never count as failing.
- **FR-027** The desk shows no count of kept, struck, hatched or read lines anywhere.

### Phase 6: the first sitting (step 7)

- **FR-028** The ribbon screen's nine lines (three header lines and six moves) are the first slips: five in the first
  sitting and four in the second. After his sitting, the kept lines ship to Tap the Vein in one pull request, and the
  gate passes on that screen.

## Non-Functional Requirements

- The export and the gate run with no network except the one events route, and no AI.
- The desk works with touch and mouse; every press has a keyboard path; reduced motion turns each animation into one
  step.
- A store outage leaves the build green: the build reads only committed files.

## Persisted data & Prisma

This spec changes no schema. Events live in `BoardSave` (`board: 'council'`, `collection: 'voice'`). The four files are committed
content.

## Scaling Checklist

| Touchpoint | Mitigation |
|---|---|
| AI calls | Only FR-015, admin only, about 3 calls per slip and 5 slips per sitting; model from env |
| Filesystem | The export runs in a session and lands by pull request; nothing writes the repo from a serverless function |
| Request body | A `voice` save is one line of text; the saves route's existing size limit holds |

## Verification Quest

- **ID:** `cert-voice-desk-v1`
- **Steps:** on the local server, sign in as the owner and open `/admin/voice-desk`. Draw a slip from the ribbon screen.
  Hold a finger on "ribbon" until the chalk ring closes. Turn the three redrafts; keep one. At the ink stone, write a
  plain meaning. Hatch the next slip, then pull it back from the lip within ten seconds; hatch it again. Finish five
  slips and read the close: it names Tap the Vein and shows no number. Run `voice-export --from` the local events: one
  bank line marked `wendell`, "ribbon" `stoned`. Run `copy-scan --lexicon`: "ribbon" still fails on the ribbon screen
  (no screen shows one yet). Then open a copy look row on the local board, use the pencil on one line, export, and see
  the second bank line with `source: pencil`.

## Ontology

- `design_intent`: Wendell, at the desk in his hall, teaches an apprentice to write Calrunia's lines, so the voice, the lexicon and the example bank every writing agent uses come from what he kept, and agents stop shipping canned or invented words (Shaman).
- `intrinsic_pleasure`: triumph when a kept line goes out to a screen; poignance when a cold reader understands it; bliss and peace from a sitting that ends by itself at five slips (his Q2 feelings) (Shaman).
- `agency_and_consent`: he keeps, hatches, writes or rests, and nothing is required of him in a sitting; a stone can wait; playtesters consent at the read, see only what ships, and may leave at any point without it counting (Diplomat).
- `ontology_objects`: the apprentice (an NPC), a slip, a stop, a chalk ring, a redraft (proposal), a kept line, a stone (lexicon entry), the book (`bank.jsonl`), the bench (`chart.yaml`), the pencil, a read (Architect).
- `mechanical_claims`: eye-mark rings a word that names nothing shown; card-turn reads each redraft; compost-hatch drops a struck slip with its ring as the reason; tuning-bench sets the voice chart; the gate fails watched words on screens that never showed them and warns on coinages. The claim that a bank of kept lines lowers canned writing is unproven until the first sitting's keep rate is read (Architect).
- `aqal_attention`: I, his felt sense of a line at the desk; We, a cold reader's understanding in the Reading Circle; It, the gate in `check.sh --build`; Its, the four compiled files every writer's output is checked against (Architect).
- `provenance_effects`: every bank line and stone carries who drafted it, his mark, the date, the slip and its screen; the server, not the body, sets his mark; agent lines never enter the bank, so the bank cannot feed on its own slop (Regent).
- `evidence_and_unknowns`: evidence: three rule passes since 2026-11-04 did not stop the ribbon screen; typicality bias in preference data (arXiv 2510.01171); Failbetter's editor of last resort; Kennedy's "Go short." Unknown: whether the bank lowers typicality, and whether Style A rules 2 and 6 cause the invented objects; the first sitting's two unlabelled sets test the second (Sage).
- `decision_or_open_authority`: canonical prose is his reserved matter; his rulings `vf-desk-look-1` B, `vf-face-names-1` B and `copy-edit-door-1` A govern; positions `vf-teacher-not-clerk`, `vf-lexicon-home`, `vf-first-slips`, `vf-gate-scope` and `vf-style-a-scope` stand unless he flips them; the four fader axes are proposals until he moves one (Regent).
- `risks_and_tests`: the desk becomes proofreading (ask him after the first sitting what he felt; proofreading words mean the frame failed); the gate fails a third of shipped lines and writers route around it (run it on Tap the Vein first and keep the watched list to the seed); "face" is common English, so the gate may fire on "face the wall" (allow file, and the step 3 run lists each hit); a fresh metaphor in plain English ("the one that burns") passes the gate and stays with `--ask` and cold readers (Challenger).
- `implementation_translation`: `src/lib/board/save.ts` and the council schema (collection `voice`), `src/app/api/board/saves/route.ts` (the mark), new `src/app/api/board/voice/route.ts`, new `scripts/voice-export.ts` and `content/voice/`, `scripts/copy-scan.py --lexicon`, new `scripts/voice-packet.py`, `src/lib/board/rows.ts` and the council board's HTML (the pencil), new `src/app/api/admin/voice/slips/route.ts`, new `src/app/admin/voice-desk/` and `src/app/voice/read/[token]/` (Architect).

## How we will know it failed

- **The cheap test, run first (step 3):** seed the lexicon and run `copy-scan --lexicon` on the live Tap the Vein files. If "ribbon", "face" and "sitting" all pass, the per-screen rule is not enough and the council rethinks the gate before the desk is built. If more than a third of all shipped lines in `copy-scan.files` fail, the watched list starts smaller.
- **The result that stops the work:** after his first two sittings (step 7), fewer than five of the nine ribbon lines kept unedited, or a sitting that runs past ten minutes, or his own words for it naming proofreading rather than triumph, poignance, bliss or peace. Any one sends the desk back to a pass before more slips are loaded.
- **The Style A read:** if the redrafts written without rules 2 and 6 are kept at least two lines more often than those with them, those rules stop governing interface screens (position `vf-style-a-scope`).

## Definition of done

- [ ] `scripts/local/check.sh --build` green on each step's pull request, with `copy-scan --lexicon` inside it from step 3
- [ ] each step's pull request marked ready with `ship-next`; none self-merged
- [ ] the pencil's picture on a look row before step 4 is marked ready
- [ ] his look on the desk's stills (step 6), on the board, with the picture
- [ ] his first sitting on the ribbon screen, and its kept lines shipped to Tap the Vein (step 7)
- [ ] the Verification Quest walked on the local server

## Reserved items

Canonical prose is his: only his kept or written lines and his stones are law. No player's writing is read by AI. It touches no
money. The Average Dusk figure is not used.

## Dependencies

- `scripts/copy-scan.py` and `.claude/skills/no-ai-slop/concrete-referent.md` (branch `claude/project-thread-qtp56p`,
  not yet shipped; step 3 stacks on it if it has not).
- six-faces-council `schema/board-save.schema.json`, `board/council-board.html`, `board/post_rows.py` (pairs in steps 2
  and 4).
- `public/marks/chalk.js` (the chalk ring) and `/mnt/project-files/3d-build/brush-hand-cult-5/` (the figure at the
  desk).

## References

- Build handoff `/mnt/project-files/voice-forge/build-handoff.md`; brief `/mnt/project-files/voice-forge/brief.md`;
  still `/mnt/project-files/voice-forge/still/desk.png`
- Store records: pass `voice-forge-1_2026-11-17`, callsheet `voice-forge`, `voice-forge-build`, research
  `research-2026-11-17-voice-forge-brief`
- Board rows: vf-desk-look-1, vf-face-names-1, copy-edit-door-1, pm-mark-look-1; positions vf-teacher-not-clerk,
  vf-lexicon-home, vf-first-slips, vf-gate-scope, vf-style-a-scope
- Mechanics (six-faces-council): `canon/mechanics/eye-mark.yaml`, `card-turn.yaml`, `compost-hatch.yaml`,
  `tuning-bench.yaml`

## Signed

- intake: shaman, diplomat (2026-11-17)
- spec: architect, regent (2026-11-17)
- clarify: sage (2026-11-17)
- falsify: challenger (2026-11-17)
- assets: regent, architect (2026-11-17)
- plan: architect, regent (2026-11-17)
- analyze: sage, challenger (2026-11-17)
