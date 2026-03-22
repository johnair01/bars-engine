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

**Twine `CONFIRM_ARCHETYPE`:** When the player confirms a diagnostic recommendation, the key may be `ARCHETYPE_KEYS` form (`truth_seer`, …). [`twine.ts`](../../src/actions/twine.ts) resolves via `resolveArchetypeKeyForTransformation` and matches the `Archetype` row by `slugifyName(name)` if id/name lookup fails.

## Resolution

When the transformation engine receives an **archetype** key:

- If it matches a playbook slug (`bold-heart`, `truth-seer`, etc.), use directly.
- If it is a playbook row from the DB, resolve `Playbook.name` → `slugifyName` → slug.
- If it is from **`ARCHETYPE_KEYS`** (`truth_seer`, `shadow_walker`, …), map via **`ARCHETYPE_KEY_TO_PLAYBOOK_SLUG`** (see below).

**API (use these names, not “playlist”):**

| Export | Module | Returns |
|--------|--------|---------|
| `resolveArchetypeKeyForTransformation(key)` | `@/lib/archetype-keys` or `archetype-profiles` | Playbook slug or `null` |
| `resolvePlaybookArchetypeKey(key)` | same | Playbook slug or `undefined` |

Mapping table: **`ARCHETYPE_KEY_TO_PLAYBOOK_SLUG`** in [`archetype-profiles.ts`](../../src/lib/narrative-transformation/moves/archetype-profiles.ts). Barrel: [`archetype-keys.ts`](../../src/lib/archetype-keys.ts).

## References

- [archetype-key-resolution spec](../../.specify/specs/archetype-key-resolution/spec.md)
- [archetype-move-styles spec](../../.specify/specs/archetype-move-styles/spec.md)
- [transformation-move-library spec](../../.specify/specs/transformation-move-library/spec.md)
- [nations.ts](../../src/lib/game/nations.ts) — ARCHETYPE_KEYS
- [iching-alignment.ts](../../src/lib/iching-alignment.ts) — PLAYBOOK_TRIGRAM
