# Plan: BAR Seed Metabolization

## Summary

Implement a **BAR garden** loop: **soil** (context), **maturity**, **compost** (witnessed release), optional **whole-collection** rituals—grounded in [STRAND_CONSULT.md](./STRAND_CONSULT.md) and [spec.md](./spec.md).

## Phases

| Phase | Focus | Gate |
|-------|--------|------|
| 0 | Spec kit + user research | ≥3 research sessions; open questions from strand resolved or deferred in spec |
| 1 | Data model + server actions | Schema or JSON fields; `name_soil` / `compost` / `graduate` |
| 2 | UI | Garden opt-in; BAR detail; gentle copy deck |
| 3 | Optional | Random draw; terrain ritual; physical twin — feature-flagged |

## File impacts (forecast)

| Area | Files |
|------|--------|
| Data | `prisma/schema.prisma` and/or `CustomBar` JSON; migrations per fail-fix rules |
| API / actions | `src/actions/*`, `src/app/api/bars/*` (TBD) |
| UI | Player dashboard / BAR routes |
| Copy | i18n or constants file for Playful/Solemn tracks |

## Dependencies

- Quest loop specs (GL, GD, GF) for handoff to quest from “graduate”
- `quest-seed-composer` / `nationLibraryId` for optional soil hints

## Changelog

| Date | Change |
|------|--------|
| 2026-03-22 | Spec kit expanded from strand consult; pipeline doc linked |
| (prior) | Strand consult captured; stub spec |
