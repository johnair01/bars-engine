# Asset statements for Wendell to label

This folder now holds a list of statements from the project's asset docs, each paired with the code that decides the matter. A person labels each statement. No row is labelled. No number of rows was chosen on Wendell's behalf: the list is whatever the docs contain after the extraction rules below. The count of 195 is a result of those rules.

Files:

- `asset_statements.json` holds the rows, ordered by doc and then line.
- `validate_statements.py` checks the file's form and quoting (`python3 council/jev/validate_statements.py`).
- `test_statements.py` is the validator's self-check (`python3 council/jev/test_statements.py`).

## What a row holds

`id`, `doc`, `line`, `statement` (copied from the doc, whitespace normalised), `kind`, `scope`, `code_refs` (the code lines that decide the matter, each read while building the list), `checkable`, `known_drift`, `label` (always `unlabelled`), and an optional short `note`. A note may record a number that appears in both places. It never says whether the two agree.

## What a person labels

Wendell fills one column per row, `label`, with `agrees`, `disagrees` or `cannot tell`, and adds the date he labelled it. The validator currently requires `unlabelled`; once labelling starts, the allowed set in `validate_statements.py` needs the three labels added and a `labelled_on` date field. That edit belongs to whoever starts the labelling run.

## How rows were chosen

Each source doc was read in full. A row is a sentence, bullet, table row or code line that asserts something a reader could compare to code or config: a size limit, a file type, a path or directory, a naming convention, a count, a required field or schema field, an enum value, a pipeline step and its order, which route or function does what, a default. Each row is quoted verbatim.

Scope follows Wendell's rulings of 2026-10-03. The list covers admin art and the docs about it. Card art statements are kept and tagged `card-art-deprecated`. Sprite statements are tagged `sprite-pre-august` when `git log -1 --format=%as` for the doc is before 2026-08-01, and `sprite-current` otherwise. The validator re-checks that date. Rows about the shared Asset table and upload limits carry `asset-admin`. Rows about the carousel forge carry `carousel`.

## Counts

By doc:

| Rows | Doc |
|-----:|-----|
| 33 | docs/SPRITE_ASSETS.md |
| 30 | docs/CARD_ART_RUNBOOK.md |
| 26 | .specify/specs/sprite-generation-pipeline/spec.md |
| 25 | .specify/specs/asset-register-design-system/spec.md |
| 15 | .specify/specs/raise-awareness-carousel-forge/spec.md |
| 11 | .specify/specs/asset-management-bar-upload-walkable-sprites/spec.md |
| 9 | docs/WALKABLE_SPRITES.md |
| 9 | .specify/specs/avatar-sprite-quality-process/STYLE_GUIDE.md |
| 9 | .specify/specs/walkable-sprites-implementation/spec.md |
| 6 | .specify/specs/avatar-sprite-assets/spec.md |
| 6 | .specify/specs/avatar-sprite-quality-process/CANONICAL_BASE_SPRITE.md |
| 6 | .specify/specs/avatar-sprite-quality-process/spec.md |
| 4 | docs/card-art-prompt-template.md |
| 3 | docs/ENV_AND_VERCEL.md |
| 2 | .specify/specs/walkable-sprite-pipeline-demo/spec.md |
| 1 | .specify/specs/book-upload-vercel-client-exception/spec.md |

By scope: `sprite-pre-august` 121, `card-art-deprecated` 37, `asset-admin` 20, `carousel` 15, `sprite-current` 2.

By kind: `process` 44, `numeric` 42, `path` 41, `naming` 29, `other` 20, `schema` 19.

Checkable (at least one code ref, all of them read): 190 of 195. Five rows have no code ref and `checkable` false: the move-icon rule and the zone-texture rule in the asset-register spec, the two Lua script rows (`palette-swap.lua`, `assemble-walkable.lua`) in the sprite-generation spec, and the provenance-stamp spec path. A reader can still check those by listing a directory, but a directory has no line number to cite.

Almost every doc here was last changed before August 2026, so only the two rows from `docs/ENV_AND_VERCEL.md` that concern sprites are `sprite-current`. The labelled set is therefore mostly about material marked for discard with research kept. That is a fact about the docs. It is Wendell's call whether to label the pre-August rows at all.

## What was skipped and why

- Prompt tables in `docs/SPRITE_ASSETS.md` (30 rows of image-generation prompts). The prompt text has no counterpart in code, and the card-art prompt-completeness trial is retired.
- LPC sourcing steps, licence and attribution wording. Licensing is not live. The single attribution checklist line stays because it is one of the brief's five known items.
- Narrative, goals, rationale, design-decision tables, user stories, phases, non-goals, readiness checklists and cost or time estimates, unless the sentence is phrased as a current fact.
- Everything about player uploads and player data: the BAR attachment flow and its function contracts, `intention` text, `PlayerMapPresence` and position updates, Signal media, Valkyrie party media, and cert-feedback persistence (`cert-feedback-blob-persistence` and the cert-feedback line of `docs/ENV_AND_VERCEL.md`). Signal and Valkyrie code lines appear only as `code_refs` on the shared upload-limit statement.
- Book PDFs, except one limit line from `book-upload-vercel-client-exception`, which the task named. Lore is out of scope.
- The lobby room table and seed details in the asset-register spec, which describe rooms.
- `docs/ENV_AND_VERCEL.md` has only three asset-related lines; its other Blob lines concern book files and feedback.
- Specs considered and left out as not stating checkable asset facts beyond what is already covered: the other avatar and walkable specs not named in the task, `walkable-sprites-pixi`, `avatar-overwrite-transparency-fix` and `jrpg-composable-sprite-avatar`. Only `avatar-sprite-assets`, `walkable-sprites-implementation`, `walkable-sprite-pipeline-demo`, `avatar-sprite-quality-process` (spec, STYLE_GUIDE, CANONICAL_BASE_SPRITE) and `docs/card-art-prompt-template.md` were added to the named list, because their subject is asset format, naming or pipeline.

## The brief's five known items (matched to rows by reading the brief)

- (a) The upload route's declared and used image limit sits inside one code file. No doc sentence states it, so it has no row of its own. Its numbers appear in the code refs of the row tagged (b).
- (b) The spec's 5 MB and 10 MB upload limit: one row, `known_drift: "b"`, in `asset-management-bar-upload-walkable-sprites/spec.md` line 240.
- (c) The `playbook_*` layer names: tagged on rows that use `playbook_outfit` or `playbook_accent` as layer or directory names in `avatar-sprite-assets/spec.md`, `avatar-sprite-quality-process/spec.md` and its `STYLE_GUIDE.md`. `docs/SPRITE_ASSETS.md` itself uses the `archetype_*` names, so its rows carry no tag. The brief names the sprite doc and validator together; the tags follow where the `playbook_*` names appear in a doc.
- (d) The LPC attribution checklist line: one row in `docs/SPRITE_ASSETS.md` (line 168). The related line in the sprite-generation spec (Challenger failure mode 4) is a separate row with no tag, since the brief points to the checklist line.
- (e) The `sourceModel` field: one row in `sprite-generation-pipeline/spec.md` line 129, matched by the brief's line reference.

Tags only record where a brief item points. They say nothing about how a row will be labelled.

## Limits

Row order follows the docs and has not been rearranged. Code refs were found by grep and by reading; for a few rows they list several lines because the matter is decided in more than one place. A person may find a row whose refs miss the deciding line; that is a finding to record in `note`.
