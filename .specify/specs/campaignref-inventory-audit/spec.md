# Spec: campaignRef inventory and classification audit

## Purpose

Produce a **maintainable inventory** of every `campaignRef` (and closely related slug-or-ref dual lookups) usage in application code, schema, and scripts; **classify** each surface so migration toward canonical `campaignId` (per [campaign-ontology-alignment](../campaign-ontology-alignment/spec.md)) can be ordered safely.

**Practice**: Deftness Development — deterministic audit, docs-first; no schema change in this spec.

## Problem

`campaignRef` is overloaded: string slug, query param, DB column, and legacy alias for `Campaign.slug`. Without a classified map, Phase 2–4 ontology work risks migrating the wrong call sites first.

## Design decisions

| Topic | Decision |
|-------|----------|
| Scope | TypeScript/TSX application code, `prisma/schema.prisma`, `scripts/`, `openapi/`; exclude `.specify/**` from *required* per-file classification (specs may mention `campaignRef` narratively). |
| Classification tags | **canonical_identity** — persists or resolves the initiative record; **routing** — URL/query/session handoff; **content_grouping** — adventures, slots, CYOA metadata; **progression** — deck, spokes, milestones, Kotter; **legacy_compat** — `OR: [{ campaignRef }, { slug }]` or equivalent dual key; **docs_only** — comments, seeds, certification copy. |
| Deliverable | Human-maintained summary + **regeneratable** file list via `npm run campaignref:inventory` → updates `docs/CAMPAIGNREF_INVENTORY.md` auto section. |
| Migration map | Table: subsystem → primary key today (`instanceId` / `campaignId` / `campaignRef` / mixed). |

## Functional requirements

- **FR1**: `docs/CAMPAIGNREF_INVENTORY.md` exists with classification taxonomy, migration map template, and auto-generated file index.
- **FR2**: `scripts/campaignref-inventory.ts` regenerates the index deterministically.
- **FR3**: GitHub issue [#40](https://github.com/johnair01/bars-engine/issues/40) references this spec kit as authority.

## Dependencies

- [campaign-ontology-alignment](../campaign-ontology-alignment/spec.md) — Phase 1 glossary and phased migration.

## References

- Issue: campaignRef inventory + classification
- Prisma: `schema.prisma` models carrying `campaignRef`

## Verification

- Run `npm run campaignref:inventory`; diff is limited to intentional edits or new `campaignRef` call sites.
- Spot-check: `campaign-deck.ts`, `instance` model, `world/[instanceSlug]` routes appear in inventory.
