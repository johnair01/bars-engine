# Plan: Strand Consult Composting

**Source**: [spec.md](./spec.md), [strand-consult-composting prompt](../backlog/prompts/strand-consult-composting.md)

## Phase 1: Policy Definition

### Merge Policy

- **Re-consult overwrites** — When running `npm run strand:consult:*` for a spec that already has a consult file, **overwrite** the existing file. No append. The latest consult is the source of truth.
- **Consult v2 absorbs v1** — If you need to preserve prior synthesis, copy the old file to `STRAND_CONSULT_ARCHIVE_YYYYMMDD.md` before re-running, or run `compost:strand-consults` first to archive it.

### Compost Policy

- **Trigger**: A consult is ready to compost when its **spec's backlog item is Done** (or Superseded). Recommendations are assumed integrated.
- **Retention**: Archived consults are preserved in `.specify/archive/strand-consults/<spec-name>/`. No automatic deletion.
- **Stub**: After moving, leave a stub file in the spec dir: `STRAND_CONSULT.md` → content: "Archived to .specify/archive/strand-consults/<spec-name>/ (YYYY-MM-DD). Run `npm run strand:consult:<name>` to refresh."

### Wieldy Rules

- **Single file per consult** — Keep Architect, Regent, Challenger, Diplomat, Shaman, Sage in one synthesis file. No split-by-face for v0.
- **Size guidance**: If a consult exceeds ~250 lines, consider extracting "Unified Spec Outline" into plan.md and trimming raw face responses in the consult file.
- **Naming**: Prefer `STRAND_CONSULT.md` for 6-face consults; `GM_CONSULT*.md` for variants (e.g. `GM_CONSULT_REEVALUATION.md`). Script matches `*CONSULT*.md`.

## Phase 2: Archive Location

- **Path**: `.specify/archive/strand-consults/<spec-name>/<original-filename>.md`
- **Index**: Optional `README.md` in archive dir listing archived specs and dates. Script can append to it.

## Phase 3: Script Design

- **Script**: `scripts/compost-strand-consults.ts`
- **Command**: `npm run compost:strand-consults`
- **Logic**:
  1. Parse BACKLOG.md and ARCHIVE.md for rows with `[x] Done` or `Superseded`
  2. Extract spec paths from feature name links: `(.specify/specs/bar-social-links/spec.md)` → `bar-social-links`
  3. For each Done spec dir, find files matching `*CONSULT*.md` (STRAND_CONSULT, GM_CONSULT, etc.)
  4. Skip if file is already a stub (contains "Archived to")
  5. Copy file to `.specify/archive/strand-consults/<spec-name>/<filename>.md`
  6. Replace original with stub
  7. Log: "Composted N consult(s) from M spec(s)"

## Phase 4: Design Doc Update

- Add "Strand Consult Composting" to `docs/AGENT_WORKFLOWS.md` or create `.specify/specs/strand-consult-composting/POLICY.md` (this plan serves as policy).
