# Plan: Library Praxis — Three Pillars

## Summary

**Phase A (data + admin):** Define `metadataJson` shape for praxis pillars; surface in admin Books UI (or document manual JSON edit if UI slips).

**Phase B (docs):** Ship three small artifacts — felt-sense wiki (or doc), commons/Benkler page, antifragile dev praxis doc.

**Phase C (UX hook):** One optional in-flow felt-sense scaffolding touchpoint behind a flag or low-risk copy change.

## Phase A — Metadata and admin

1. Document JSON shape in `metadata-shape.md` (see tasks).
2. Extend `BookList` / book detail (or a small `BookPraxisPanel`) to read/write:
   - `praxisPillar`: `antifragile` | `commons_networks` | `felt_sense` | `unset`
   - `designIntentSummary`: string
   - Optional: `strandNote`, `relatedWikiSlugs`
3. Seed or manual update the three books already in admin.

**Files:** `src/actions/books.ts` (if new server action), `src/app/admin/books/BookList.tsx` or sibling component, Prisma unchanged if JSON-only.

## Phase B — Documentation

1. `docs/FELT_SENSE_321_PRAXIS.md` or wiki page under `wiki/` — link from onboarding or 321-adjacent surface when ready.
2. `docs/COMMONS_NETWORKS_PRAXIS.md` — Benkler → BAR/campaign/thread framing.
3. `docs/ANTIFRAGILE_DEV_PRAXIS.md` — link fail-fix, cert feedback, roadblock metabolism.

## Phase C — Player UX (minimal)

1. Pick **one** touchpoint with product owner: e.g. `Shadow321` copy, charge capture placeholder, or quest grammar facilitator note.
2. Implement copy + optional feature flag `NEXT_PUBLIC_FELT_SENSE_SCAFFOLDING` or server config.

## Compatibility

- Does not change `Book.status` pipeline for extraction/analysis.
- Quest generation can **later** read `praxisPillar` to bias move/domain suggestions — out of scope unless tasks extended.

## Rollback

- Pillar metadata is additive; remove UI panel if needed without data loss.
