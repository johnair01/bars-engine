# Plan: Campaign Ontology Alignment

## Strategy

**New spec kit** (this folder)—does not replace [.specify/specs/campaign-lifecycle/](../campaign-lifecycle/) or [.specify/specs/campaign-recursive-nesting/](../campaign-recursive-nesting/). Those cover lifecycle clocks and spoke-depth mechanics; **this kit** is the **identity and layering** contract (Instance vs Campaign vs Slot vs topology) and the migration path from `campaignRef`-heavy code.

**GitHub [issue #39](https://github.com/johnair01/bars-engine/issues/39)** tracks Phase 1 glossary + architecture note (published under `docs/architecture/campaign-ontology-*.md`).

## Implementation order

1. **Phase 1 (docs + audit)** — No schema. Glossary in `docs/` or spec appendix; script or spreadsheet from `campaignRef` grep classification.
2. **Phase 2** — Prisma: `Campaign.parentCampaignId` + relations; migrate; server queries for tree.
3. **Phase 3** — Stewardship model (JSON vs `CampaignMembership`—decide in tasks).
4. **Phase 4** — Hub/spoke models: add or resolve `campaignId` per audit.
5. **Phase 5** — Documentation pass on `CampaignSlot` usage in app and seeds.
6. **Phase 6** — Provenance fields / queries for hierarchy.

## File impacts (expected)

| Area | Files / systems |
|------|------------------|
| Schema | `prisma/schema.prisma`, new migration(s) |
| Runtime | Actions and lib that read `campaignRef` (audit output drives list) |
| UI | Campaign admin, hub, world routes that assume flat campaigns |
| Docs | `docs/` glossary, architecture note cross-linking this spec |

## Verification

- Phase 1: audit artifact checked in or linked from `tasks.md`.
- Phase 2+: `npm run check`, `npm run build`, migration committed per [docs/PRISMA_MIGRATE_STRATEGY.md](../../../docs/PRISMA_MIGRATE_STRATEGY.md).
