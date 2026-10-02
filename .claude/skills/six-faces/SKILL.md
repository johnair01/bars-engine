---
name: six-faces
description: Convene the six Game Master faces (Shaman, Architect, Challenger, Regent, Diplomat, Sage) as a council on a project question, or run a term pass that finds, tests and records emergent terms and their usage. Use when Wendell says "get the six on this", "six-face pass", "let the faces weigh in", asks for new terms, a glossary pass or naming, or when a decision needs deliberation from the Integral altitudes. Reads council/faces.yaml; never improvises a lens.
---

# Six faces, as a council

Read `council/faces.yaml` first. It holds each face's lens, what it delivers, what it sees that later
levels lose, its standing test, and its lessons. The lessons are Wendell's words from past rulings.
A face carries them into its argument. Do not restate a lens from memory; the file is the standard.

## The shape of a pass

1. **Header.** Date, who called it, the question in his words, and what pass this is on the subject.
2. **Scorecard.** Grade the tests the previous pass set. Set new ones, dated, at the end.
3. **Anchor.** The design intent in one or two sentences. Unchanged unless Wendell changed it.
4. **Six faces, in the order `faces.yaml` gives.** Each speaks as its face, not as a game NPC. Each
   delivers what its entry lists, in bold-led paragraphs with a subject and a finite verb. Each
   applies its standing test where one exists.
5. **Verdicts table.** One row per face, one column per question.
6. **Dissent check.** State whether the pass was unanimous. A unanimous pass is a flag, not a result;
   say so in the pass.
7. **Sage.** The Sage synthesises. It names each face's contribution or says which it dropped, lists
   the dissent, and never decides. The Sage does not rule; Wendell ruled this on 2026-10-02.
8. **Outputs, typed apart.** *Positions*: what the council resolved, each with the citation for why it
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
  2026-10-02). Add rows to `.specify/specs/six-faces-council-agents/board/board_data.json` in
  bars-engine, run `python3 board/build_board.py` from that folder, and publish `council-board.html`
  to the same URL the ledger records carry.
- When a board read is recorded in the ledger, add each decided item to `resolved` in
  `board_data.json` with its decision and the ledger file, rebuild, and republish. A saved but
  unrecorded item already shows as resolved and waiting to be recorded.
- A record goes in this repo's `council/ledger/` as JSON, in the shape of bars-engine's
  `.specify/specs/six-faces-council-agents/ledger/*.json`. `council/stats.py` in bars-engine reads
  every sibling repo's ledger; `council/lockstep.py` checks this file and `faces.yaml` match across repos.
- The chat reply is what changed and the link. The pass itself is not pasted into chat.

## After Wendell answers on the board

Read the store with `ArtifactData`: collections `positions`, `questions`, and the document
`steer/general`. Write a ledger record. An overrule or a steer on a face's row becomes a lesson in
that face's entry in `faces.yaml`, quoted, with the source. A ruling that changes a term, a
structure or a date goes in the repo's decision log where one exists.

## The term pass

Run it when Wendell asks for terms, when a pass coins a word, or when the harvest grows. The full
rule is `term_pass` and each face's `term_test` in `council/faces.yaml`; pass three in bars-engine
argues it.

1. **Harvest.** Run `python3 council/harvest_terms.py --min 2` from bars-engine. It lists names used
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

Run `tools/voice_lint.py` from friendcraft on the pass before it ships. Every hard finding is a
defect. A quotation of Wendell's is never altered to satisfy the linter.
