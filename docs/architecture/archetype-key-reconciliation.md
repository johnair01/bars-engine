# Archetype Key Reconciliation

## Purpose

Clarify the difference between two archetype key systems in the codebase and which to use where.

## Two Systems

### 1. Playbook-Based Archetype Keys (Transformation Engine)

**Use for**: Narrative Transformation Engine, Archetype Move Styles, avatar config, quest generation.

**Format**: Playbook slug derived from Playbook.name via `slugifyName()`.

**Canonical 8 keys**: bold-heart, devoted-guardian, decisive-storm, danger-walker, still-point, subtle-influence, truth-seer, joyful-connector

**Source**: [PLAYBOOK_TRIGRAM](src/lib/iching-alignment.ts), [seed-narrative-content.ts](scripts/seed-narrative-content.ts), [avatar-utils.ts](src/lib/avatar-utils.ts)

**Mapping**: "The Bold Heart" → bold-heart, "The Devoted Guardian" → devoted-guardian, etc.

### 2. ARCHETYPE_KEYS (Diagnostic / Signal Validation)

**Use for**: Diagnostic engine, signal validation, Twine bindings, BindingForm.

**Format**: Snake_case identifiers.

**Values**: truth_seer, shadow_walker, bridge_builder, flame_keeper, dream_weaver, story_teller, root_tender, void_dancer

**Source**: [nations.ts](src/lib/game/nations.ts)

**Purpose**: Signal validation and diagnostic scoring. May map to different axes (e.g. developmental lens, diagnostic categories) than the 8 Playbooks.

## When to Use Which

| Context | Use |
|---------|-----|
| Transformation Move Library | Playbook slug (bold-heart, etc.) |
| Archetype Move Styles | Playbook slug |
| Avatar config (playbookKey) | Playbook slug |
| Quest generation, narrative transformation | Playbook slug |
| Diagnostic engine, signal validation | ARCHETYPE_KEYS |
| Twine BindingForm archetype options | ARCHETYPE_KEYS |

## Resolution

When the transformation engine receives `archetypeKey`:

- If it matches a playbook slug (bold-heart, devoted-guardian, etc.), use directly.
- If it is a playbookId, resolve Playbook.name → slugify → archetypeKey.
- If it is from ARCHETYPE_KEYS (truth_seer, etc.), a mapping layer may be needed to translate to playbook slug when both systems coexist. Document any such mapping when implemented.

## References

- [archetype-move-styles spec](../../.specify/specs/archetype-move-styles/spec.md)
- [transformation-move-library spec](../../.specify/specs/transformation-move-library/spec.md)
- [nations.ts](../../src/lib/game/nations.ts) — ARCHETYPE_KEYS
- [iching-alignment.ts](../../src/lib/iching-alignment.ts) — PLAYBOOK_TRIGRAM
