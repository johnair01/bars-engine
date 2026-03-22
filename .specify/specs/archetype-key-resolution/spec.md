# Spec: Archetype Key Resolution

## Purpose

Resolve the dual archetype key systems so the transformation engine, avatar config, and quest generation use playbook-based keys consistently. ARCHETYPE_KEYS (truth_seer, shadow_walker, etc.) in [nations.ts](../../../src/lib/game/nations.ts) serve diagnostic/signal validation. Playbook slugs (bold-heart, devoted-guardian, etc.) serve transformation, avatar, and quest systems. This spec adds a resolution layer so both can coexist and transformation always receives playbook slugs.

## Problem

- **ARCHETYPE_KEYS**: truth_seer, shadow_walker, bridge_builder, flame_keeper, dream_weaver, story_teller, root_tender, void_dancer — used by diagnostic-engine, BindingForm, VALID_SIGNAL_KEYS
- **Playbook slugs**: bold-heart, devoted-guardian, decisive-storm, danger-walker, still-point, subtle-influence, truth-seer, joyful-connector — used by avatarConfig, transformation engine, Archetype Move Styles

When diagnostic recommends an archetype or BindingForm emits a signal, the value is ARCHETYPE_KEYS format. Downstream systems (avatar, transformation) expect playbook slugs. A mapping/resolver is needed.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Canonical for transformation | Playbook slug (bold-heart, etc.) |
| ARCHETYPE_KEYS | Retain for diagnostic/signal; add mapping to playbook slug |
| Resolution | Add `resolveArchetypeKeyForTransformation(key)` — accepts either format, returns playbook slug or null |
| Mapping | Define ARCHETYPE_KEY_TO_PLAYBOOK_SLUG in a single config module |

## Mapping (implemented)

Canonical map: **`ARCHETYPE_KEY_TO_PLAYBOOK_SLUG`** in [`src/lib/narrative-transformation/moves/archetype-profiles.ts`](../../../src/lib/narrative-transformation/moves/archetype-profiles.ts).  
(`void_dancer` → `still-point` — differs from some early drafts; treat code + reconciliation doc as source of truth.)

Product/lore may adjust entries via PR; validate against the eight playbook slugs in `ARCHETYPE_MOVE_PROFILES`.

## Resolution API

Implemented in [`src/lib/narrative-transformation/moves/archetype-profiles.ts`](../../../src/lib/narrative-transformation/moves/archetype-profiles.ts), re-exported from [`src/lib/archetype-keys.ts`](../../../src/lib/archetype-keys.ts).

```ts
/** Playbook slug or null if unresolvable. */
function resolveArchetypeKeyForTransformation(key: string | null | undefined): string | null

/** Same resolution; returns undefined instead of null (legacy callers). */
function resolvePlaybookArchetypeKey(key: string | null | undefined): string | undefined
```

## Functional Requirements

- **FR1**: `ARCHETYPE_KEY_TO_PLAYBOOK_SLUG` in `archetype-profiles.ts` (+ barrel `archetype-keys.ts`).
- **FR2**: `resolveArchetypeKeyForTransformation` implemented.
- **FR3**: Mapping validated against PLAYBOOK_TRIGRAM and Playbook seed; document any gaps.
- **FR4**: Callers that pass archetype to transformation/avatar use the resolver when input may be ARCHETYPE_KEYS format.
- **FR5**: Update [archetype-key-reconciliation.md](../../../docs/architecture/archetype-key-reconciliation.md) with resolution behavior.

## Integration Points

- **Diagnostic engine**: When recommendedArchetype feeds into avatar/playbook assignment, resolve to playbook slug before lookup.
- **Twine/BindingForm**: When signal triggers transformation or avatar update, resolve archetype key.
- **Transformation Move Library**: Accept resolved playbook slug; document that input should be pre-resolved or resolver applied at entry.

## Non-Functional Requirements

- No breaking change to ARCHETYPE_KEYS or diagnostic engine behavior.
- Resolver is pure function; no DB calls.
- Mapping is configurable (single source of truth).

## Dependencies

- [archetype-move-styles](../archetype-move-styles/spec.md) (EG)
- [iching-alignment](src/lib/iching-alignment.ts) — PLAYBOOK_TRIGRAM
- [nations](src/lib/game/nations.ts) — ARCHETYPE_KEYS

## References

- [docs/architecture/archetype-key-reconciliation.md](../../../docs/architecture/archetype-key-reconciliation.md)
