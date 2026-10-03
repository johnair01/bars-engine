# Six-face pass: integrating TypeSafe's Jev into our workflows

**Date:** 2026-10-03. **Called by:** Wendell. **Question, in his words:** "let's get the 6 game masters to weigh in on integrating Jev into our workflows".

**Copy used:** the repo's `council/faces.yaml` (the portable snapshot was missing; the home repo was not fetched). **Board read:** 2026-10-03, version 1791060569-7b50, plus the `questions` collection and `steer/general`. No row on the board mentions TypeSafe or Jev, so nothing here contradicts a ruling. **Daemons:** none sent. This repo has no `council/daemons/daemons.yaml`, so each face worked alone. **Casts:** three-coin method, six lines from the bottom up, drawn with Python's `secrets` module, because this repo has no `council/iching/cast.py`.

## Anchor

Jev is a model that returns typed judgments (Choice, Noul for yes/no, Score for degree) and does not write text. bars-engine today uses models only to generate, through `generateObject` in files such as `src/lib/campaign-leads/quest-alignment-ai.ts`, and that file already falls back to deterministic assembly when the model is off. The design intent is that Jev selects, scores and verifies, that code owns the workflow, and that the non-AI path stays a first-class path.

## What the docs say, and what they leave out

The TypeSafe skill points to cookbooks for routing, hierarchical classification, composite scoring and citation checks. The documentation index lists no page on pricing, usage limits, data handling or hosting. Nobody has measured Jev on our material.

## The faces

**Shaman, Hexagram 8 (Holding Together), line 6 changing to 20 (Contemplation).** The top line of Holding Together reads "no head for holding together." The wisdom bears here as a warning that a helper adopted without someone at its head scatters the group. The felt sense is that this community has an allergy to AI, and a player's charge, BARs and reflections are the most intimate material the game holds. The Shaman recommends that no player-written text goes to a third-party model without Wendell's explicit say-so. It also recommends that what a player brings stays chosen, as the board's `mh-input-chosen` position already says.

**Architect, Hexagram 34 (Great Power), lines 3, 5 and 6 changing to 55 (Abundance).** Great Power says power is worth using only where it fits, and Abundance says midday does not last. The wisdom bears as a reason to place Jev where it matches the mechanism. A Choice fits a fixed set of options, which means routing a request to a handler, picking the right Five-Move form, or sorting census branches into keep, review and retire. A Noul fits a yes/no check, such as "does this quote support this claim". A Score fits only a described dimension. The Architect recommends a mechanism rule: Jev never generates, and every call has a deterministic fallback, as `aiDraftAlignedQuest` already has.

**Challenger, Hexagram 6 (Conflict), no changing lines.** Conflict advises settling the terms before the fight. The Challenger's flat claim is that a fast, cheap judge makes the failure Wendell ruled against faster and cheaper. On 2026-10-03 a session turned his ruling into a rate across 142 sentences and reported success, and the reader's problem stayed. A Noul on every sentence would produce that rate at scale. The Challenger would strip the pitch to this: Jev is a classifier, and a classifier is useful where a wrong answer is cheap to catch. Its falsification test is a bake-off before any wiring. Wendell's own rulings (the oracle batch rulings and the sentences they were about) become the labelled set, and Jev has to agree with him on held-out cases. The Challenger dissents from building anything before that result exists.

**Regent, Hexagram 15 (Modesty), no changing lines.** Modesty says to claim little. The Regent separates obligations from preferences. Consent and release, money, anything that names a person, canonical prose and the definition file are reserved and never delegated, so a Jev score can never decide them. Two more obligations follow from the board. A counter hit never closes an edit, so a Jev probability never closes one either. Finally, the council's spec is written before the first command runs (`council-spec-first`). An account with TypeSafe is money and a credential, so setting it up is Wendell's step, and no key ever goes into chat or the repo.

**Diplomat, Hexagram 46 (Pushing Upward), line 1 changing to 11 (Peace).** Pushing Upward is gradual growth, and the changing line turns it into Peace. The Diplomat asks who is excluded and what the Portland community will accept. The bridge is staging in the open. Jev goes first into the tooling the council and the build use, where no player data flows, and the public documents say plainly where a model is used and where it is not. The Diplomat dissents on speed from the other side of the Challenger: waiting for a perfect bake-off could leave the idea unexamined, so the first test should be small.

**Sage, Hexagram 4 (Youthful Folly), lines 1 and 4 changing to 38 (Opposition).** Youthful Folly says the learner asks and the teacher does not chase. Opposition says two estranged parties can still cooperate in small matters. The Sage's synthesis follows. The Architect supplies where Jev fits. The Challenger supplies the test that decides whether it earns a place. The Regent supplies the limits that no result can lift. The Shaman supplies the privacy line. The Diplomat supplies the staging. Nobody dropped a contribution. The smallest coherent whole is a measured trial inside the council's own tooling, with fallbacks, with candidates only, and with Wendell ruling on any move toward player data.

## Verdicts

| Face | Verdict |
|---|---|
| Shaman | Yes to tooling; no player text to a third party without Wendell's say-so. |
| Architect | Yes, as select/score/verify only, with a deterministic fallback on every call. |
| Challenger | Not before a bake-off against Wendell's own rulings. Dissents. |
| Regent | Yes inside the reserved list; probabilities are candidates, never closers. |
| Diplomat | Yes, staged and disclosed; keep the first test small. Dissents on pace. |
| Sage | A measured trial in council tooling first. Recommends; Wendell decides. |

**Dissent check:** the pass was not unanimous. The Challenger holds out for the bake-off first, and the Diplomat wants it kept small enough to start this week.

## Positions (resolved without Wendell)

1. **Jev selects, scores and verifies; it never generates.** Reason: generation is already covered by the existing `generateObject` paths, and the community allergy is to generated text. Cited: `quest-alignment-ai.ts`, project CLAUDE.md "Community Context".
2. **Every Jev call has a deterministic fallback, and the non-AI path stays first-class.** Reason: the repo's existing fail-safe pattern and CLAUDE.md's dual-track principle.
3. **A Jev probability is a candidate and never closes an edit or a decision.** Reason: the editorial pass's rule that "a counter finds candidates; only a person approves them," and the reserved list.
4. **Reserved items never go through Jev.** Reason: `faces.yaml` `reserved`.
5. **No player-written text leaves the system for a third-party model on this pass.** Reason: `mh-input-chosen`, and a missing data-handling page in TypeSafe's docs. This position holds until Wendell rules otherwise (see question 1).
6. **The first trial's spec is written before any command runs, and it names its window and its labelled set.** Reason: `council-spec-first` and `root-name-the-window`.

## Candidate first uses, ranked

1. **Quote-to-claim check for daemon reports.** A Noul asks whether a quoted passage supports the claim it is attached to. This answers the failure on the board's `dm-quote-the-source` row, where linked papers matched the wrong claims twice in four checks. It matches TypeSafe's citation-check cookbook, and it touches no player data.
2. **Reach-test pre-screen.** A Noul asks whether a draft question is answerable from the record. It would be a candidate flag only.
3. **Census sorting.** A Choice sorts branches into keep, review and retire. The census already did this with six daemons reading each branch, which gives a labelled set to test against.
4. **Later, only on Wendell's ruling:** routing and scoring inside bars-engine on non-personal content (quest metadata, spec and backlog triage).

## Questions for Wendell

**Q1. How far may Jev reach?** Why only he can answer: it concerns consent and what a player shares, which the reserved list keeps with him, and the TypeSafe docs publish no data-handling terms to check against. Why it was not asked before: Jev is new tonight. His answer changes what gets built.

- A. Council and build tooling only, with no player data. Consequence: the first trial can start now, and bars-engine's game paths stay untouched.
- B. Also non-personal bars-engine content, such as quest metadata and specs. Consequence: it unlocks routing and triage inside the app, and it needs a disclosure line in the public docs.
- C. Player text too, after the terms are read. Consequence: the largest reach, and it conflicts with the community's allergy until the terms and a consent flow exist.

**Recommended by the Sage:** A, then revisit B after the bake-off.

## Steps only Wendell can take (only if he picks A or B)

Not due until Q1 is answered, and the bake-off should show Jev earns a key first. When due: create a TypeSafe account, make an API key, and enter it as a server-side environment variable in Vercel (or the council's host) yourself. A secret never goes into chat or into the repo. It is safe to stop after any step.

## Record block

- **Date:** 2026-10-03. **Question:** integrating Jev into workflows. **Copy:** repo `faces.yaml`; board read this date.
- **Casts:** Shaman 8→20; Architect 34→55; Challenger 6; Regent 15; Diplomat 46→11; Sage 4→38.
- **Verdicts:** Shaman: tooling yes, player text no. Architect: select/score/verify with fallbacks. Challenger: bake-off first (dissent). Regent: candidates only, reserved list holds. Diplomat: staged and disclosed (dissent on pace). Sage: measured trial in council tooling.
- **Board rows to add** (to `board_data.json` in the home repo; this session did not republish the board):
  - Positions `jev-select-only`, `jev-fallback`, `jev-candidates-only`, `jev-reserved`, `jev-no-player-text`, `jev-spec-first`, each with the `pos` and `why` given above.
  - Question `jev-reach`, with the three options and consequences above, `why_you` as given, and `not_before: "Jev trial spec written"`.
- **Ruling (Wendell, 2026-10-03), on Q1:** "Council and build tooling for now but I’d be curious about asset and story pipeline work too". This is option A, with a standing interest in the asset and story pipelines. Position `jev-no-player-text` stands. Question `jev-reach` is resolved as A and does not go on the board.
- **Follow-up, not yet a question:** scope the asset pipeline and the story pipeline as a later pass, after the first trial reports. The Regent's note for that pass: story prose is canonical and reserved, so in the story pipeline Jev could only flag candidates for a reader to judge and could never edit, rank or approve. Asset work that carries no player data (tagging, routing, sorting) is the likelier first fit. The pass should read the bars-engine asset code and the editorial pass before it argues.
