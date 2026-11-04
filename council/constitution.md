# The council's constitution

This is version 0.1, of 2026-10-28, proposed in pass `spec-contract-1_2026-10-28`; it stands as board positions until Wendell
flips them, and its articles change only by his ruling on the board, as `council/faces.yaml` does.

Wendell, 2026-10-28, on github/spec-kit: *"Need to fold this discipline into the 6 face game master councils most
importantly I want to use this discipline to create another formal way to integrate the 6 game masters the design
ontology and the game studio skills into a contract that makes the moves More consistent"*.

spec-kit keeps a constitution beside its spec, plan and tasks, and every plan opens with a constitution check. This
file is the council's. It does not restate the rules it gathers: each article names the rule's home, the face that
guards it, the check that enforces it, and the stages of `council/pipeline.yaml` where it bites. The stage contract
(which face signs each stage, which design-ontology fields it fills, which studio skills it loads) lives in
`council/pipeline.yaml`, and `python3 council/tools/contract_check.py <spec folder>` is the analyze step that reads
both. The design ontology keeps its own constitution (`ontology/v0.1/source/design-philosophy-draft-v0.1.md`);
Article 4 binds the council to it rather than copying it.

Every plan carries a `## Constitution check` table with one row per article: `pass`, `n/a: <why>` or
`exception: <why, and the board row that allows it>`. An exception without a row is a reach dressed as an answer.

## Article 1: Questions go to the board

**Rule:** A question for Wendell runs the reach test (`reach_test` in `council/faces.yaml`) and goes to the Council
Board, never into chat or into a spec as an open question. What the record can answer becomes a position.
**Home:** `CLAUDE.md`, "Questions go to the board, never to chat". **Guard:** sage. **Check:** no unresolved
`[NEEDS CLARIFICATION]` in spec.md; each one names its board row. **Stages:** clarify, analyze.

## Article 2: The player comes first

**Rule:** A game or world brief answers the experience intake before any code: the place it extends, the player's
body, the medium, the first 60 seconds from the player's eyes, references, keep list, and what came from the record.
**Home:** `docs/experience-intake.md`. **Guard:** diplomat. **Check:** `council/tools/intake_check.py`.
**Stages:** intake.

## Article 3: Primitives and footing before a decision

**Rule:** Every fix and feature names the primitive it serves (art style, atlas mechanics, ontology objects), its
footing rows and its tier. A choice that changes a primitive stops and goes through the reach test.
**Home:** `docs/ontology-in-flows.md`, "Footing before any decision". **Guard:** architect.
**Check:** `council/tools/primitives.py`; `primitives:`, `footing:` and `tier:` lines in plan.md. **Stages:** spec, plan.

## Article 4: The ontology's hard invariants hold

**Rule:** Design work fills the design ontology's output contract and never breaks its hard invariants (no rank for a
person, access is not command, consent is not inferred, the player authors inner meaning, an AI-raised risk carries a
test). A field that does not apply says why.
**Home:** `.claude/skills/design-ontology/SKILL.md`, `ontology/v0.1/source/design-ontology-v0.1.yaml` `hard_invariants`.
**Guard:** sage. **Check:** the `## Ontology` section of spec.md, read by `contract_check.py`; a game pass also passes
`ontology/tools/game_frame_check.py`. **Stages:** intake, spec, clarify, falsify, plan, analyze.

## Article 5: The cheapest proof first

**Rule:** Before the build, one cheap test that could show the design wrong, and the result that would stop the work.
A probe number before a still, a still before a sheet, a sheet before a build.
**Home:** `council/pipeline.yaml` stage `falsify`; `docs/tool-scout.md`, "Building it small". **Guard:** challenger.
**Check:** spec.md "How we will know it failed", with its result before the build. **Stages:** falsify, analyze.

## Article 6: A tool before a build, a reuse before a redraw

**Rule:** Climb the tool ladder before building anything new, and check what already draws a subject before drawing
it. **Home:** `docs/tool-scout.md`, `docs/assets-here.md`. **Guard:** architect.
**Check:** `council/tools/scout.py` and a `scout:` line; `council/tools/assets_here.py --check` on an art round.
**Stages:** plan, build.

## Article 7: Something to see

**Rule:** Every result ends with something he can look at: a still on the board for a look, or a one-click hosted
preview opened at the state to test. It is never a clone line, and a look never opens from a GitHub link.
**Home:** `CLAUDE.md`, "Check what already draws it before drawing" (`proof:` line); project memory, testable preview
(2026-10-20). **Guard:** diplomat. **Check:** a `proof:` or `preview:` line in tasks.md. **Stages:** verify.

## Article 8: Reserved items stay his

**Rule:** Money, a live paywall, canonical prose, consent and release, anything that names a person, and
`council/faces.yaml` are never decided in a spec. Each is a board question.
**Home:** `council/faces.yaml` `reserved`. **Guard:** regent. **Check:** spec.md "Reserved items".
**Stages:** spec, ship.

## Article 9: One session, one piece of work

**Rule:** A session does one piece of work, hands off before 150,000 tokens, records what is open in its callsheet,
and asks the coordinator to start the next thread. **Home:** `CLAUDE.md`, "Short sessions". **Guard:** regent.
**Check:** `council/tools/context_size.py`. **Stages:** build, close.

## Article 10: Transcend and include, sense and respond

**Rule:** A later version keeps the earlier one's record; superseded work is retired with its reason, never deleted.
A need found mid-work becomes its own strand. **Home:** `council/faces.yaml` `principles`; `council/pipeline.yaml`
`strands`. **Guard:** sage. **Check:** the close stage's ledger record names what was kept and what was set down.
**Stages:** close.
