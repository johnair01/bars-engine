# Spec: Quest Grammar Skeleton Feedback

## Purpose

Make the skeleton feedback box in the admin quest grammar flow actually affect the skeleton. When an admin adds feedback (e.g. "Add branch at tension", "Lens choice should come first") and clicks Regenerate, the system should use that feedback to produce a new skeleton—or explicitly explain why a change could not be made.

**Problem**: Feedback entered in the "Quest Structure (Skeleton)" box does not create a new skeleton. The Regenerate button calls `compileQuestSkeletonAction` without passing feedback; the skeleton compiler is rules-based and has no feedback input. Admins expect feedback to drive structural changes.

**Practice**: Deftness Development — API-first, deterministic over AI where possible; AI for natural-language feedback interpretation.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Feedback flow | Regenerate Skeleton passes feedback to a new action that can modify structure |
| Interpretation | AI interprets natural-language feedback; outputs structured changes (add/remove/reorder nodes, constraints) |
| Fallback | When AI cannot apply feedback, return explanation (e.g. "Could not add branch at tension: tension node has no depth slots in current grammar") |
| Change visibility | Show diff or "Changes applied" summary so admin sees what changed |

## Conceptual Model

| WHO | Admin (campaign owner, quest designer) |
| WHAT | Skeleton = structure (nodes, beats, depth) without prose |
| WHERE | Admin / Quest Grammar → CYOA flow → Skeleton Review step |
| Energy | Feedback as input; new skeleton or explanation as output |

**Flow**: Current Skeleton + Feedback → [Interpret] → New Skeleton or Explanation → [Display] → Admin accepts or iterates.

## API Contracts (API-First)

### regenerateSkeletonWithFeedback

**Input**:
```ts
{
  currentSkeleton: SerializableQuestPacket
  feedback: string
  unpackingContext: { unpackingAnswers, alignedAction, segment, questModel, ... }
}
```

**Output**:
```ts
| { success: true; packet: SerializableQuestPacket; changesApplied: string }
| { success: true; packet: SerializableQuestPacket; changesApplied: string; partial: true; explanation: string }
| { success: false; error: string; explanation?: string }
```

- `changesApplied`: Human-readable summary of what changed (e.g. "Reordered nodes: lens_choice first. Added depth branch at tension.")
- `explanation`: When partial or failed, why (e.g. "Could not add branch at tension: tension node does not support depth in personal quest model.")
- `partial`: true when some feedback was applied but not all.

### Implementation options

1. **AI-first**: Single AI call that takes (skeleton, feedback) and returns (modified skeleton JSON + changesApplied). Validate output against schema.
2. **Hybrid**: AI returns structured diff (e.g. `{ addNodeAt?: string, reorder?: string[], ... }`); rules-based apply step.
3. **Rules-first**: Parse feedback into intent (regex, keywords); apply via existing compiler extensions. Fallback to AI for complex feedback.

Recommendation: **AI-first** for v0—feedback is natural language; AI can interpret and produce valid skeleton. Add `generateObjectWithCache` with schema validation. Include `explanation` in schema for non-apply cases.

## User Stories

### P1: Feedback drives regeneration

**As an admin**, I want feedback in the skeleton box to produce a new skeleton when I click Regenerate, so my structural requests are reflected.

**Acceptance**: Enter feedback → Regenerate → new skeleton differs when feedback is applicable; or explanation shown when not.

### P2: See what changed

**As an admin**, I want to see what was changed after regeneration, so I can verify the feedback was applied correctly.

**Acceptance**: After regeneration, a "Changes applied" or diff summary is visible (e.g. "Reordered: lens_choice first. Added depth at tension.").

### P3: Understand when change isn't possible

**As an admin**, I want to know why my feedback wasn't applied when it can't be, so I can adjust my request.

**Acceptance**: When feedback cannot be applied, an explanation is shown (e.g. "Could not add branch at tension: tension node has no depth slots in current model.").

## Functional Requirements

### Phase 1: Wire feedback to regeneration

- **FR1**: Pass `feedback` from SkeletonReview into `compileQuestSkeletonAction` or a new regeneration action.
- **FR2**: When feedback is non-empty, call a feedback-aware skeleton regeneration path instead of the rules-only path.

### Phase 2: Feedback-aware skeleton regeneration

- **FR3**: Create `regenerateSkeletonWithFeedback` server action. Input: current skeleton, feedback, unpacking context.
- **FR4**: AI interprets feedback and produces a modified skeleton. Use `generateObjectWithCache`; schema: `{ packet: SerializableQuestPacket, changesApplied: string, explanation?: string }`.
- **FR5**: Validate output against quest grammar schema. On invalid output, return error with explanation.
- **FR6**: When AI cannot apply feedback, return `{ success: false, explanation }` so UI can display it.

### Phase 3: UI changes

- **FR7**: SkeletonReview: after Regenerate, if success, show `changesApplied` in a collapsible or inline summary.
- **FR8**: If regeneration fails or returns explanation, show the explanation in the UI (e.g. below the feedback box).
- **FR9**: Regenerate button passes feedback to the new action; loading state during regeneration.

### Phase 4: Edge cases

- **FR10**: Empty feedback: treat as "regenerate without changes" — optionally same as current behavior (rules-only compile).
- **FR11**: Feedback that contradicts grammar (e.g. "Remove lens choice" when lens is required): return explanation, don't produce invalid skeleton.

## Non-Functional Requirements

- AI: Use `QUEST_GRAMMAR_AI_MODEL` or env override; cache key includes feedback to avoid re-running identical requests.
- Security: Admin-only; reuse existing `compileQuestSkeletonAction` auth.
- Performance: Regeneration may take 5–15s; show loading state.

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| AI calls | `generateObjectWithCache`; env model override; feature flag `QUEST_GRAMMAR_AI_ENABLED` |
| Request body | Skeleton + feedback may be large; ensure `serverActions.bodySizeLimit` sufficient |
| Env | Document in `docs/ENV_AND_VERCEL.md` if new env vars |

## Out of Scope

- Changing the flavor-generation flow (adminFeedback already used there).
- Support for arbitrary feedback that changes unpacking answers (only skeleton structure changes in v0).

## Dependencies

- [quest-grammar-compiler](.specify/specs/quest-grammar-compiler/spec.md)
- [quest-grammar-allyship-unpacking](.specify/specs/quest-grammar-allyship-unpacking/spec.md)
- `src/actions/quest-grammar.ts` — compileQuestSkeletonAction, compileQuestWithPrivileging
- `src/components/admin/SkeletonReview.tsx`
- `src/app/admin/quest-grammar/GenerationFlow.tsx`

## References

- [src/actions/quest-grammar.ts](../../../src/actions/quest-grammar.ts) — compileQuestSkeletonAction (does not accept feedback)
- [src/components/admin/SkeletonReview.tsx](../../../src/components/admin/SkeletonReview.tsx) — feedback box, Regenerate button
- [src/app/admin/quest-grammar/GenerationFlow.tsx](../../../src/app/admin/quest-grammar/GenerationFlow.tsx) — onRegenerate calls compileQuestSkeletonAction without feedback
- [src/lib/quest-grammar/types.ts](../../../src/lib/quest-grammar/types.ts) — SerializableQuestPacket schema
