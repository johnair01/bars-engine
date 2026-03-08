# Spec Kit Prompt: 321 Shadow Process

## Role

Implement the 321 Shadow Process per the spec kit. Deftness Development: API-first, deterministic over AI.

## Objective

Implement per [.specify/specs/321-shadow-process/spec.md](../specs/321-shadow-process/spec.md). Digital 3→2→1 flow that reuses unpacking questions; prompts BAR creation with optional metadata import; mints vibeulons to BAR creators when their public BARs are used in completed quests.

## Requirements

- **Unpacking**: Import from `@/lib/quest-grammar` (Phase 1 done)
- **BAR creator mint**: On quest completion, mint 1 vibeulon per public appended BAR creator
- **Metadata321**: Deterministic `deriveMetadata321`; extend `createCustomBar` accepts `metadata321`
- **321 UI**: 3→2→1 form; post-321 prompt with "Import metadata" option

## Deliverables

- [ ] BAR creator mint in quest-engine.ts
- [ ] deriveMetadata321.ts
- [ ] createCustomBar extension
- [ ] 321 form page (route TBD)

## Reference

- Spec: [.specify/specs/321-shadow-process/spec.md](../specs/321-shadow-process/spec.md)
- Plan: [.specify/specs/321-shadow-process/plan.md](../specs/321-shadow-process/plan.md)
- Tasks: [.specify/specs/321-shadow-process/tasks.md](../specs/321-shadow-process/tasks.md)
