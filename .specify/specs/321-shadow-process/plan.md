# Plan: 321 Shadow Process

## Implementation Phases (Deftness Order)

1. **Phase 1 — Unpacking refactor** (done): Move `unpacking-constants.ts` to `src/lib/quest-grammar/`; update imports.
2. **Phase 2 — Spec kit**: Create spec, plan, tasks, backlog prompt.
3. **Phase 3 — BAR creator mint**: Add logic in `completeQuestForPlayer` to mint 1 vibeulon per public appended BAR creator.
4. **Phase 4 — deriveMetadata321**: Implement deterministic `deriveMetadata321(phase3, phase2, phase1)` — rules only.
5. **Phase 5 — createCustomBar extension**: Accept `metadata321`; pre-fill when provided.
6. **Phase 6 — 321 UI**: Build 3→2→1 form; post-321 prompt with "Import metadata" option; wire to create flow.

## Schema

- **Option A**: No schema change. Use existing `CustomBar.parentId` for BAR-quest attachment.
- Future: `QuestBarAttachment` join model if slots/ordering/withdrawal needed.

## Key Files

| File | Role |
|------|------|
| `src/lib/quest-grammar/unpacking-constants.ts` | Source of truth for 6 questions |
| `src/actions/quest-engine.ts` | Quest completion; add BAR creator mint |
| `src/actions/create-bar.ts` | BAR creation; extend with `metadata321` |
| `src/lib/quest-grammar/deriveMetadata321.ts` | Deterministic metadata derivation (new) |

## API-First Contract

See [spec.md](spec.md) for `Metadata321` type and `createCustomBar` extension.
