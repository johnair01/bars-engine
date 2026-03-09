# Tasks: Archetype Key Resolution

## Phase 1: Mapping and Resolver

- [ ] **T1.1** Create `src/lib/archetype-keys.ts` with ARCHETYPE_KEY_TO_PLAYBOOK_SLUG.
- [ ] **T1.2** Validate mapping against PLAYBOOK_TRIGRAM and Playbook seed; adjust with product input.
- [ ] **T1.3** Implement resolveArchetypeKeyForTransformation(key): string | null.
- [ ] **T1.4** Add PLAYBOOK_ARCHETYPE_KEYS constant (canonical 8 playbook slugs).

## Phase 2: Integration

- [ ] **T2.1** Identify callers that pass archetype to transformation/avatar (diagnostic, Twine, etc.).
- [ ] **T2.2** Apply resolver at integration boundaries.
- [ ] **T2.3** Add unit tests for resolver.

## Phase 3: Documentation

- [ ] **T3.1** Update docs/architecture/archetype-key-reconciliation.md with resolution behavior.
- [ ] **T3.2** Document mapping and any gaps in spec.
