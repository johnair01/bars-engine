# Backlog Prompt: Library Praxis — Three Pillars

## Role

Implement [.specify/specs/library-praxis-three-pillars/spec.md](../specs/library-praxis-three-pillars/spec.md) per [tasks.md](../specs/library-praxis-three-pillars/tasks.md). Read [ANALYSIS.md](../specs/library-praxis-three-pillars/ANALYSIS.md) for intent.

## Objective

1. **Tag** admin books *Antifragile*, *The Wealth of Networks*, *Complete Focusing Instructions* with `praxisPillar` + `designIntentSummary` in `metadataJson` ([metadata-shape.md](../specs/library-praxis-three-pillars/metadata-shape.md)).
2. **Admin UI** to view/edit praxis fields (merge JSON safely).
3. **Docs:** `ANTIFRAGILE_DEV_PRAXIS.md`, `COMMONS_NETWORKS_PRAXIS.md`, `FELT_SENSE_321_PRAXIS.md` in `docs/`.
4. **Optional:** one player-facing felt-sense scaffolding touchpoint (copy or wiki link).

## Constraints

- Non-clinical language for Focusing; original copy; optional external links to official Focusing resources.
- Do not wipe unrelated `metadataJson` keys from book analysis.

## Checklist

See [tasks.md](../specs/library-praxis-three-pillars/tasks.md).

## Verify

`npm run build` && `npm run check` after code changes.
