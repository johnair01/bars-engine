---
name: six-faces
description: Convene the six Game Master faces (Shaman, Architect, Challenger, Regent, Diplomat, Sage) as a council on a project question, or run a term pass that finds, tests and records emergent terms and their usage. Use when Wendell says "get the six on this", "six-face pass", "let the faces weigh in", asks for new terms, a glossary pass or naming, or when a decision needs deliberation from the Integral altitudes. Reads council/faces.yaml; never improvises a lens. Also use it before asking Wendell any question whose answer changes what gets built: the question goes through the reach test first, and what survives goes to the board.
---

# Six faces, as a council

Read `council/faces.yaml` first. It holds each face's lens, what it delivers, what it sees that later
levels lose, its standing test, and its lessons. The lessons are Wendell's words from past rulings.
A face carries them into its argument. Do not restate a lens from memory; the file is the standard.

## The shape of a pass

1. **Header.** Date, who called it, the question in his words, and what pass this is on the subject.
2. **Scorecard.** Grade the tests the previous pass set. Set new ones, dated, at the end.
3. **Anchor.** The design intent in one or two sentences. Unchanged unless Wendell changed it.
4. **Every agent casts the I Ching first.** Wendell, 2026-10-03: *"all agents should be casting the I Ching
   and using its wisdom to inform their decisions (not unlike flirtcraft)"*. Run `python3 council/iching/cast.py
   shaman architect challenger regent diplomat sage`, one cast each by the three-coin method (Wendell on the
   board: "We actually want to do a simulation of the coin method and then map to the reading"). Changing
   lines give the hexagram it becomes, and the cast maps to both readings. Each cast carries Wendell's reading from flirtcraft (its name, what it shows, its image and its
   situation) beside the traditional lines and trigrams. Each face opens its section with its hexagram and
   one or two sentences on how its reading bears on the question, and lets it shape how the face frames and weighs its argument. The cast
   informs; the evidence a face cites still has to hold. When a face sends a daemon, the face casts for it
   (`cast.py daemon-skeptic`) and passes the hexagram in, so daemons stay read-only. The pass header lists
   every cast, and the ledger record carries them under `casts` (`cast.py --json`).
5. **Six faces, in the order `faces.yaml` gives.** Each speaks as its face, not as a game NPC. Each
   delivers what its entry lists, in bold-led paragraphs with a subject and a finite verb. Each
   applies its standing test where one exists.
   **While it drafts, a face may send its daemons to work a specific problem in its domain.** Wendell,
   2026-10-02: *"The daemons exist to solve problems in the faces domain. They are designed to protect
   the player but also all work for the players enjoyment. They should be able to ask questions and help
   with specific problems."* The subagents are `daemon-protector`, `daemon-controller`, `daemon-skeptic`,
   `daemon-fixer`, `daemon-victim`, `daemon-damaged-self`, `daemon-emotional-body` and `daemon-player`.
   They run on the smallest model by default, and research runs on the middle model: dispatch a research
   problem with `model: sonnet` (Wendell's board answer of 2026-10-03, the split). The faces think, and the
   daemons do the focused legwork cheaply. Each reads its definition from `council/daemons/daemons.yaml`, a trimmed copy of
   Wendell's friendcraft canon, so it runs in any council repo. Pass each one the face, the one problem, and
   who the Player is (Wendell for council work, or the person a product serves). Send only the daemons the
   problem needs, usually one to three. Each works the five moves in its own domain: Wake Up (see what is
   there), Open Up (brainstorm every possible move, unjudged, as Wendell's Idea Storm does), Clean Up (clear
   what blocks the work and compost what does not serve), Grow Up (the test, measurement or reading that
   makes the next attempt better, with web research where it helps), and Show Up (distill to at most five
   moves). Each also says what it protects the Player from and makes more enjoyable, asks at most two
   questions, and names where it would overreach. The face uses what helps, says which daemon it came
   from, and stops a daemon where its overreach line says. A daemon's questions go through the reach test
   like any other. Before reading a report, the face saves it and runs `python3 council/daemons/check_report.py
   <report> [--research]`; a report that fails goes back to its daemon once. No daemon hands work to another.
   The face, not the daemon, judges a report, and spot-checks its links when the report is research. The pass
   record carries the subagents' token count.
6. **Verdicts table.** One row per face, one column per question.
7. **Dissent check.** State whether the pass was unanimous. A unanimous pass is a flag, not a result;
   say so in the pass.
8. **Sage.** The Sage synthesises. It names each face's contribution or says which it dropped, lists
   the dissent, and never decides. The Sage does not rule; Wendell ruled this on 2026-10-02.
9. **Outputs, typed apart.** *Positions*: what the council resolved, each with the citation for why it
   did not need Wendell. *Questions*: only what passed the reach test below, each with owner face,
   options, the consequence of each, why only he can answer, and why it was not asked before.

## The reach test, before any question leaves the pass

Send the question back to its owning face with the record: the decision log, the working rules,
prior passes, the ledger. The face answers with a citation or says what is missing. The question
reaches Wendell only when what is missing is his preference or a fact only he holds, and only if his
answer changes what gets built. An answer with no citation is not an answer; the question goes to
the board.

## Where it lands

- The pass is a file: `6FACE_PASS<n>_<date>.md` beside the subject it concerns (a spec folder, or
  `preproduction/` in friendcraft).
- Positions, questions and terms go to the board, so Wendell flips, answers and steers there. The
  board's top page holds only unresolved work; everything decided moves to its Resolved view (Wendell,
  2026-10-02). Add rows to `board/board_data.json` in the home repo, run `python3 board/build_board.py`,
  and publish `board/council-board.html` to the same URL the ledger records carry.
- When a board read is recorded in the ledger, add each decided item to `resolved` in
  `board_data.json` with its decision and the ledger file, rebuild, and republish. A saved but
  unrecorded item already shows as resolved and waiting to be recorded.
- A record goes in this repo's `council/ledger/` as JSON, in the shape of the home repo's
  `council/ledger/*.json`. `python3 council/stats.py --remote` in the home repo counts every
  registered repo's records.
- The chat reply is what changed and the link. The pass itself is not pasted into chat.

## After Wendell answers on the board

Read the store with `ArtifactData`: collections `positions`, `questions`, and the document
`steer/general`. Write a ledger record. An overrule or a steer on a face's row becomes a lesson in
that face's entry in `faces.yaml`, quoted, with the source. A ruling that changes a term, a
structure or a date goes in the repo's decision log where one exists.

**A deferred item waits until its date.** Each question and position row has a Defer button with a
return date: in a week, in a month, or when Wendell asks. A deferred row waits on the Resolved tab and
comes back to the Open tab when its date passes. Record it in `resolved` with `decision: deferred` and
`until`, and do not ask about it again before then. Every deferral stays in the ledger, because the
pattern of what he puts off is data about priority (Wendell, board read 20, 2026-10-03). The rules are
in `defer` in `council/pipeline.yaml`.

**A deferred item comes back on a spaced schedule, with new context** (Wendell, 2026-10-03). Each deferral of
the same item waits for the next rung of Wendell's ladder: 1 hour, 6 hours, 1 day, 3 days, 1 week, 2 weeks, then
a month. A scheduled session re-weighs every day on its own, and every board read also starts with
`python3 council/due.py --ahead 7`, so items due in the coming week arrive prepared. For each item it lists, read its brief of what changed, have each
face cast and write one line, and write the result onto the row as `review` in `board_data.json` on main,
with a recommendation of take it up, defer again, retire, or reshape the question. Record a new deferral with
`python3 council/due.py record`, which keeps every earlier one in `history`. The spec is
`.specify/specs/spaced-deferral/spec.md`.

**The daily session takes up one of Wendell's five moves each day** (Wake up, Open up, Clean up, Grow up,
Show up; his steer, 2026-10-03). `python3 council/daily.py` says the level, the move and the limits, and
`council/daily.yaml` holds them; the level changes only by his ruling on the board. A session that reads the
board records each daily run's token use with `daily.py usage`, and puts any proposal `daily.py` prints on the
board. The rules are `five_moves` in `council/pipeline.yaml`.

**Deferral.** Each question and position row has a Defer button with a return date: in a week, in a
month, or when Wendell asks. A deferred row waits on the Resolved tab and comes back to the Open tab
when its date passes. Record it in `resolved` with `decision: deferred` and `until`, and do not ask
about it again before then. Every deferral stays in the ledger, because the pattern of what he puts
off is data about priority (Wendell, board read 20, 2026-10-03). The rules are in `defer` in
`council/pipeline.yaml`.

## The feature pipeline

A new feature runs the pipeline in `council/pipeline.yaml`. Wendell asked for it on 2026-10-02:
*"steps I have to do myself should generate a step by step checklist I can run from. Things that need
building should go through a production pipeline managed by the 6 faces."* Fixes and manuscript prose
do not run it; `scope` in the file says which is which.

1. **Spec kit first.** Scaffold `.specify/specs/<feature>/` from `council/spec-kit/`. In a repo with its own
   template, use that one and add the three council sections: the ask, whose decision, and how we will know
   it failed. The repo's own rules win on conventions.
2. **Each stage has owning faces and a gate** (intake, spec, falsify, plan, build, verify, ship, close). A
   stage's output passes its gate before the next stage starts. The clarifying questions of a spec kit
   interview go through the reach test like any other question.
3. **Three outputs, kept apart.** Questions go to the board. Steps only Wendell can take go to the board's Your steps tab.
   Product goes to a pull request.
4. **Steps.** Every `[wendell]` task passes the step test (only he can take it) and carries the full step
   shape: do, where, enter, check, device, and whether it is safe to stop after. Publish the feature's steps
   as one list with `ArtifactData` to the board's store, named as `steps_page` in `pipeline.yaml`: a `lists/<feature>` document
   (title, repo, why, source, order, created) and `steps/<feature>-<nn>` documents (list, n, do, where, href,
   enter, generate, check, device, stopSafe, optional, done). A secret is never written to a step. A step
   that needs one sets `generate` to its length, and the page makes it on his device without storing it.
5. **Read his ticks.** The page records `done`, `doneAt` and `note` on each step. Read the list before any
   work that waits on a step. A note is a report from him; answer it in the next reply or in the pass.
6. **Ship.** A feature whose gates pass goes on the board as a position that merges on the next board read
   unless he flips it. A feature that touches a reserved item ships only on a board question he answers.

## Sense and respond, transcend and include

Wendell, 2026-10-03: *"Sense and respond is one of the principles we want to hold in addition to transcend and
include. This practically means doing work in parallel that's responding to an emergent need and to keep the
work from the lower level as we move to higher levels. This will make the work more inclusive and the handoffs
from colliding."* Both are in `council/faces.yaml` under `principles`, and the working rules are `strands` and
`transcend_and_include` in `council/pipeline.yaml`.

- **Sense first.** Before a pass picks work in a repo, run `python3 council/strands.py` there and read each open
  strand's latest commits. Main is not the whole picture: on 2026-10-03 the council chose root-game work that an
  open branch had already moved past, because it read only main.
- **Respond in parallel.** A need found mid-work becomes its own strand, with its own branch, small spec, ledger
  record and declared files. The finding is stated where it was found, and the fix lives in the new strand.
- **No collisions.** Two strands that touch the same file are sequenced. `strands.py --touch <files>` checks a
  planned strand before it starts. Board data, ledger records and lessons are written on main only.
- **Keep the lower level.** A later version keeps the earlier one's record; superseded work is retired with its
  reason, never deleted; a corrected figure sits beside its original.
- **Census before cleanup.** `python3 council/census.py` sorts a repo's unmerged branches into active, recent,
  stale and landed, and recommends for each. Retiring a branch means tagging it `archive/<branch>` before the
  branch goes, so the work stays reachable. Nothing is tagged or removed without Wendell's ruling.

## One home, every repo

The council has one home: the repo named in `council/source.txt`, `wendell-britt/six-faces-council` since 2026-10-02.
Every other repo pulls `council/faces.yaml` and this skill from home when a session starts, through
`council/hooks/council-sync.sh`. The hook's first line in the session says whether the copy is
current, updated, or local because GitHub was unreachable. Commit synced files with the next change.

- **Lessons and lens changes are written at home only.** In another repo, record a new lesson in
  that repo's ledger record under `lessons_pending`, with the face, Wendell's exact words, the
  lesson, the date and the source. `python3 council/collect_lessons.py` at home lists every pending
  lesson across the registered repos, and folding one in is a reviewed edit there.
- **Ledgers, term registries and glossaries stay in the repo they belong to.** The hook never
  touches them. `python3 council/stats.py --remote` at home counts every registered repo's records
  over GitHub.
- **A repo without the council gets it with** `python3 council/install.py <path>` run at home. That
  adds it to `council/repos.yaml`. Commit the new files in the target and merge them.

## The editorial pass

Wendell, 2026-10-03, on oracle rewrites that sessions had made: *"We need to revisit batch one and 2 now we have the
game masters we can integrate the work with the editorial skill so we can teach why these changes aren't really good
enough. A bit too mechanical and don't get at the essence of the problem"*. Friendcraft's pass seven
(`preproduction/6FACE_PASS7_2026-10-03.md`) found why. Each of his rulings named a reader problem in one sentence. A
session turned the ruling into a rate across the corpus, drove the rate down, and reported success, and the reader
problem stayed.

Run this pass on any edit to prose a reader reads, before it reaches him. The instruments are the house-voice skill's
(`.claude/skills/house-voice/SKILL.md` and `reference.md`) and the no-ai-slop skill's. Each face owns one of them.

| Face | Instrument | Daemon it may send |
|---|---|---|
| Shaman | Who is in it; the felt read of a person holding the page or card | Emotional Body |
| Architect | The counters, as candidates only: every hit becomes a question for a reading | Controller |
| Challenger | Strip the image; the source check against any text the prose may copy; what would show it false | Skeptic |
| Regent | Wendell's rulings, each with the sentence it was about; the spec's obligations | Protector |
| Diplomat | The ELI5 first; the stance pass's five questions; every change shown whole, before and after | Fixer |
| Sage | One sentence on what the page or card tells the reader to do, and whether each edit serves it | none |

- **A counter hit never closes an edit.** `SKILL.md` says it: *"A counter finds candidates; only a person approves
  them."* A lint pass that fixes hits by rule is the failure this section exists to stop. On 2026-10-03 one turned
  *"Danger."* into *"Danger is present."*
- **A ruling travels with its sentence.** Quote the sentence Wendell was reading when he ruled. Applied without it, a
  ruling becomes a rate.
- **Done means the readings were run.** For each changed sentence: the ELI5 exists, the six diagnostic checks in
  `reference.md` §2 are answered, the stance pass is answered, and Wendell sees the sentence whole. A clean lint is
  necessary and never enough.
- **The council writes no replacement prose of his unless he asks for it.** It diagnoses, and a deletion may be shown.
  New wording is his, or it is a draft he asked for.

## The term pass

Run it when Wendell asks for terms, when a pass coins a word, or when the harvest grows. The full
rule is `term_pass` and each face's `term_test` in `council/faces.yaml`; pass three, kept in
bars-engine's `.specify/specs/six-faces-council-agents/`, argues it.

1. **Harvest.** Run `python3 council/harvest_terms.py --min 2` from the home repo. It lists names used
   in two or more files that no glossary or registry holds, with whose word each is. Add any term
   Wendell coined in the conversation, with the quotation. A face may add a name for an unnamed
   pattern only if it is marked as the council's.
2. **Six tests.** Each face applies its `term_test`. A term that diagnoses a person, names nothing
   new, survives only by its phrasing, or cannot be checked by its reader does not go forward.
3. **Usage card.** The Sage writes: plain definition, the five-year-old sentence, one usage sentence,
   register (council, product or book), whose word, what it replaces, collisions with other repos.
4. **Board.** Each candidate is a row with adopt, not yet, retire, or a rename, and a steer box. The
   council recommends; Wendell decides.
5. **Write after he answers.** Update `council/terms.yaml` in the repo that owns the term. An adopted
   term enters that repo's glossary in the Proposed section, pasted into the reply before and after,
   with a decision-log entry. A retired term is struck through with its reason and date. Nothing is
   locked unless he says the word.

## Voice

Run `python3 council/tools/voice_lint.py <pass file>` before the pass ships. Every council repo has it. Every hard finding is a
defect. A quotation of Wendell's is never altered to satisfy the linter.
