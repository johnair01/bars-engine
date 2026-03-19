# Strand Consult Composting

**Status**: Done — policy documented, script implemented.

## Problem

Strand consults produce `STRAND_CONSULT.md` (and variants like `GM_CONSULT.md`, `STRAND_CONSULT_POROSITY.md`) in spec directories. Over time these files accumulate. There is no process for:

- **Merging** — consolidating multiple consults into a single artifact
- **Composting** — moving superseded or integrated consults to archive
- **Keeping files wieldy** — avoiding unwieldy single-file bloat

## Questions to Explore

1. **Merge**: When a spec is re-consulted, do we append, overwrite, or merge? Is there a pattern for "consult v2 absorbs v1"?
2. **Compost**: When a consult's recommendations are fully integrated into spec/plan/tasks, can we archive the raw consult? What's the retention policy?
3. **Structure**: Should consults be split (e.g., by face) or kept as single synthesis? What keeps them wieldy?
4. **Backlog alignment**: `compost:backlog` moves Done items to ARCHIVE.md. Is there an analogous `compost:strand-consults`?

## Acceptance Criteria

- [x] Documented merge/compost policy for strand consults ([plan.md](./plan.md))
- [x] Script to compost integrated consults: `npm run compost:strand-consults`
- [x] Archive location: `.specify/archive/strand-consults/<spec-name>/`
- [x] Merge policy: re-consult overwrites; no append
- [x] Wieldy: single file per consult; size guidance ~250 lines
