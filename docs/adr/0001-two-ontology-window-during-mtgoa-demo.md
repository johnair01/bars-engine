# ADR 0001: Two-Ontology Window During MTGOA Demo

**Status:** Accepted  
**Date:** 2026-04-13  
**Decided by:** Wendell (Sage) with Diplomat + Challenger consensus; Architect concession accepted

---

## Context

The campaign-recursive-nesting spec (1.33) and the chapter-spoke-template spec (1.41) both call
for hub-spoke bindings to be stored as real Campaign rows in the database — with `parentCampaignId`
FK linking child campaigns to parents.

As of the MTGOA chapter 1 demo (2026-04-13), the BB→MTGOA binding lives in a **static TypeScript
registry** (`src/lib/campaign-hub/spoke-bindings.ts`), which shipped as a prototype in PR #50.

The new chapter spoke template (`registerChapterSpoke`) **correctly writes Campaign rows** for new
chapter spokes. This means from 2026-04-13 onward, new chapter-level spokes use the canonical DB
approach, while the legacy BB→MTGOA binding remains in the static registry.

This is a **known, intentional, temporary dual-ontology state.**

---

## Decision

During the MTGOA chapter 1 demo window (approx. 2026-04-13 to 2026-05-12), we knowingly maintain
two parallel ontologies for hub-spoke binding:

| Layer | Ontology | Governs |
|---|---|---|
| `spoke-bindings.ts` (static) | TypeScript registry | BB spoke 7 → mastering-allyship |
| `campaigns` table (canonical) | Prisma / DB | All new chapter spokes (mtgoa-chapter-1 etc.) |

---

## Why temporary

Migrating `spoke-bindings.ts` during the demo window risks destabilizing the spatial world
prototype the full team signed off on. The migration itself is a one-line invocation of a helper
that already exists in the chapter-spoke action code — it just hasn't been run for the legacy binding.

---

## What prevents this from becoming invisible

Three guardrails are in place:

1. **Freeze comment** in `spoke-bindings.ts` — do not add new bindings here; all new bindings
   use `registerChapterSpoke`.

2. **This ADR** — names the dual-ontology state explicitly so it cannot quietly metastasize.

3. **GitHub issue #43** — "Migrate: Attach hub/spoke models to canonical Campaign" — carries
   a comment with the post-demo migration subtask and a target date.

---

## Collapse trigger

The day after MTGOA chapter 1 demo acceptance signs off (~2026-05-12):

1. Call `registerChapterSpoke` with the MTGOA org/book campaign definitions (or a simpler
   `migrateSpokeBindingToCampaignRow` helper if one is written then).
2. Delete `spoke-bindings.ts` (or replace with a thin compatibility shim if needed for a
   transition window).
3. Close GitHub issue #43.

---

## Consequences

- Chapter spokes registered via `registerChapterSpoke` work correctly today.
- The legacy BB→MTGOA path continues to work exactly as before.
- Developers reading the codebase see a clear signal (freeze comment + this ADR + #43) that
  the static registry is temporary.
- No player-visible behavior change in either state.

---

## References

- `src/lib/campaign-hub/spoke-bindings.ts` — the frozen registry
- `src/actions/chapter-spoke.ts` — `registerChapterSpoke` (canonical path)
- `prisma/migrations/20260413000000_add_chapter_spoke_template/` — chapter models
- GitHub issue #43 — post-demo migration subtask
- I Ching cast 2026-04-13: Hexagram 41 (Sun / Decrease) → 26 (Da Chu / Taming Power of the Great)
  — the Architect's contention about the unstable middle was heard; the naming is the answer.
