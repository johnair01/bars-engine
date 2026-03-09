# Plan: Archetype Key Resolution

## Overview

Add a resolution layer so ARCHETYPE_KEYS (diagnostic/signal) can be translated to playbook slugs (transformation/avatar). Create mapping config, resolver function, and wire into callers that pass archetype to transformation or avatar systems.

## Phases

### Phase 1: Mapping and Resolver

- Add `src/lib/archetype-keys.ts` (or `src/lib/archetype-key-resolution.ts`).
- Define ARCHETYPE_KEY_TO_PLAYBOOK_SLUG. Validate against PLAYBOOK_TRIGRAM and seed; adjust mapping with product input.
- Implement resolveArchetypeKeyForTransformation(key).
- Add PLAYBOOK_ARCHETYPE_KEYS constant (canonical 8 for transformation).

### Phase 2: Integration

- Identify callers: diagnostic engine output → playbook assignment; Twine bindings → transformation/avatar.
- Apply resolver at integration boundaries when archetype flows to transformation/avatar.
- Ensure transformation engine entry points accept playbook slug (or resolve internally).

### Phase 3: Documentation

- Update archetype-key-reconciliation.md with resolution behavior.
- Document mapping in spec; note any gaps or many-to-one cases.

## Implementation Layout

```
src/lib/
  archetype-keys.ts   # ARCHETYPE_KEY_TO_PLAYBOOK_SLUG, resolveArchetypeKeyForTransformation, PLAYBOOK_ARCHETYPE_KEYS
```

## Out of Scope

- Migrating ARCHETYPE_KEYS to playbook slugs (breaking change to diagnostic).
- Changing BindingForm UI (can keep ARCHETYPE_KEYS; resolve at integration).
