# Plan: Onboarding Quest Generation Unblock

## Summary

Phased implementation: (1) Quick wins — I Ching step, feedback field, grammatical example — to unblock testing. (2) Skeleton-first phase. (3) Lens as first choice. (4) CYOA process refactor.

## Phases

### Phase 1: Quick Wins (Unblock Testing)

- Add I Ching draw step to GenerationFlow (STEPS array; new step type `iching`)
- I Ching step UI: Cast button (calls cast I Ching API), Select dropdown (1–64), or Random for testing
- Store hexagramId in state; pass ichingContext to compileQuestWithPrivileging
- Add feedback text input on generate step; pass adminFeedback to compileQuestWithPrivileging on regenerate
- Add adminFeedback to buildQuestPromptContext; include in AI prompt
- Add grammatical example to compileQuestWithAI system prompt (from orientation_linear_minimal or generated-quest-example)

### Phase 2: Skeleton-First (Medium-Term)

- Create compileQuestSkeleton: inputs → structure-only packet (placeholder text)
- Add skeleton review step to GenerationFlow: show structure, feedback, regenerate
- Create generateFlavorFromSkeleton: skeleton + feedback → AI fills prose
- Wire: skeleton → accept → flavor → publish

### Phase 3: Lens as First Choice

- Add getFacesForHexagram or alignment logic to derive available faces from hexagram
- Modify compileQuestCore or add wrapper: when ichingContext present, inject lens-choice node as first choice
- Lens options = available faces; selection gates subsequent narrative path

### Phase 4: CYOA Process (Long-Term)

- Refactor GenerationFlow into Adventure with passages
- Each step = passage; Back = previous passage
- Data persists in session/state as admin moves
- Progress indicator; feels like playing a quest

## File Impacts

| File | Action |
|------|--------|
| `src/lib/quest-grammar/unpacking-constants.ts` | Add iching step to STEPS |
| `src/app/admin/quest-grammar/GenerationFlow.tsx` | Add I Ching step UI, feedback input, pass ichingContext and adminFeedback |
| `src/actions/quest-grammar.ts` | Pass adminFeedback to buildQuestPromptContext; add grammatical example to system prompt |
| `src/lib/quest-grammar/buildQuestPromptContext.ts` | Accept adminFeedback; include in prompt context |
| `src/lib/quest-grammar/compileQuestSkeleton.ts` | Create (Phase 2) |
| `src/lib/quest-grammar/generateFlavorFromSkeleton.ts` | Create (Phase 2) |
| `src/lib/iching-alignment.ts` or new | getFacesForHexagram (Phase 3) |

## Dependencies

- quest-grammar-compiler (BY)
- quest-grammar-ux-flow (CD)
- iching-grammatic-quests (CR)
- quest-generation-prompt-contract (docs)
