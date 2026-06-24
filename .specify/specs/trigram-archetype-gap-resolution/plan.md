# Plan

## Phase 1: Canonical Spec

- Create this spec kit from the 2026-06-20 trigram archetype gap source spec.
- Treat this directory as the implementation authority for this pass.

## Phase 2: Handbook Archetypes

- Update `docs/handbook/archetypes/*.md`.
- Mirror the same additions into `src/content/handbook/archetypes/*.md` because the app reads from the content tree.
- Add inner/outer expression and developmental spectrum sections after the existing story material.

## Phase 3: Inner Garden NPC Lore

- Update canonical Inner Garden lore manifestos under `The Library/04 Quests/Campaigns/inner-garden/lore/Calrunia Game World/NPC_Design_Advocates/`.
- Add hexagram upper/lower position definitions.
- Add Earlier Heaven natural opposition sections.

## Phase 4: Nation x Sect Bridge

- Add `docs/architecture/CALRUNIA_NATION_SECT_INTERSECTIONS.md`.
- Include the eight priority intersections from the source spec.
- Link the document to existing nation move profile architecture.

## Phase 5: Engine Hooks

- Extend `packages/bars-core/src/archetype-overlay/types.ts` with optional trigram state fields.
- Populate `packages/bars-core/src/archetype-overlay/profiles.ts` with inner/outer and developmental hooks.
- Document the Calrunia upper/lower positional rule where hexagram structure is already modeled.

## Verification

- Confirm all targeted files contain the new headings.
- Run TypeScript/type-oriented checks if available and scoped enough for this pass.
