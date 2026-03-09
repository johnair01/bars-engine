# Prompt: Archetype Key Resolution

**Use this prompt when resolving ARCHETYPE_KEYS vs playbook slug dual systems.**

## Context

ARCHETYPE_KEYS (truth_seer, shadow_walker, etc.) in nations.ts serve diagnostic/signal validation. Playbook slugs (bold-heart, devoted-guardian, etc.) serve transformation engine, avatar config, and quest generation. This spec adds a resolution layer so transformation always receives playbook slugs. When diagnostic or BindingForm outputs ARCHETYPE_KEYS format, resolve to playbook slug before passing to transformation/avatar.

## Prompt text

> Implement Archetype Key Resolution per [.specify/specs/archetype-key-resolution/spec.md](../specs/archetype-key-resolution/spec.md). Create `src/lib/archetype-keys.ts` with ARCHETYPE_KEY_TO_PLAYBOOK_SLUG mapping (validate against PLAYBOOK_TRIGRAM and seed; adjust with product input), resolveArchetypeKeyForTransformation(key), and PLAYBOOK_ARCHETYPE_KEYS. Apply resolver at callers that pass archetype to transformation/avatar (diagnostic output, Twine bindings). Update docs/architecture/archetype-key-reconciliation.md. Run `npm run build` and `npm run check` — fail-fix.

## Checklist

- [ ] Phase 1: archetype-keys.ts with mapping, resolver, PLAYBOOK_ARCHETYPE_KEYS
- [ ] Phase 2: Apply resolver at integration boundaries
- [ ] Phase 3: Update archetype-key-reconciliation.md, unit tests

## Reference

- Spec: [.specify/specs/archetype-key-resolution/spec.md](../specs/archetype-key-resolution/spec.md)
- Plan: [.specify/specs/archetype-key-resolution/plan.md](../specs/archetype-key-resolution/plan.md)
- Tasks: [.specify/specs/archetype-key-resolution/tasks.md](../specs/archetype-key-resolution/tasks.md)
- Archetype key reconciliation: [docs/architecture/archetype-key-reconciliation.md](../../docs/architecture/archetype-key-reconciliation.md)
