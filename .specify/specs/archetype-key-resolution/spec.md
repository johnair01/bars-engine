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

## Mapping (To Be Defined)

The exact mapping from ARCHETYPE_KEYS to playbook slugs requires product/lore input. Proposed structure:

```ts
// ARCHETYPE_KEYS (diagnostic) → playbook slug (transformation/avatar)
const ARCHETYPE_KEY_TO_PLAYBOOK_SLUG: Record<string, string> = {
  truth_seer: 'truth-seer',
  shadow_walker: 'danger-walker',    // verify with lore
  bridge_builder: 'joyful-connector', // verify with lore
  flame_keeper: 'bold-heart',        // verify with lore
  dream_weaver: 'subtle-influence',  // verify with lore
  story_teller: 'truth-seer',        // or subtle-influence; verify
  root_tender: 'devoted-guardian',   // verify with lore
  void_dancer: 'decisive-storm',     // verify with lore
}
```

Implementation must validate mapping against PLAYBOOK_TRIGRAM and seed data. Some ARCHETYPE_KEYS may map to the same playbook; some playbooks may have no ARCHETYPE_KEYS equivalent. Adjust during implementation.

## Resolution API

```ts
/**
 * Resolve an archetype key to playbook slug for transformation/avatar/quest use.
 * Accepts: ARCHETYPE_KEYS format (truth_seer) or playbook slug (truth-seer).
 * Returns: playbook slug, or null if unresolvable.
 */
function resolveArchetypeKeyForTransformation(key: string): string | null
```

## Functional Requirements

- **FR1**: Create `src/lib/archetype-keys.ts` (or extend nations.ts) with ARCHETYPE_KEY_TO_PLAYBOOK_SLUG mapping.
- **FR2**: Implement resolveArchetypeKeyForTransformation(key).
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
