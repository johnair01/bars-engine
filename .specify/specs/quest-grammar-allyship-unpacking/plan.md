# Plan: Quest Grammar Allyship Unpacking

## Summary

Add an allyship-specific unpacking mode to the Quest Grammar form. New inputs: experience type (4 options), life state (3 options) + distance, multi-select reservations + context, and aligned action as one of 4 moves. Output: quest type per move.

## Investigation

1. **Experience options**: Gather Resource, Skillful Organizing, Raise Awareness, Direct Action — allyship campaign domains or action types.
2. **Life state**: Flowing, Stalled, Neutral — maps to emotional arc (satisfied ↔ dissatisfied). "How far do you feel from your creation?" = short text.
3. **Reservations**: Multi-select (existing SHADOW_VOICE_OPTIONS or similar) + short text for context. Requires form control change from single select to checkbox group.
4. **Aligned action**: Wake Up, Clean Up, Grow Up, Show Up — 4 basic moves from campaign-kotter-domains. Each produces a quest of that type.
5. **Quest type mapping**: Need to define how move → quest type. Check BAR/quest schema for moveType or equivalent.

## Architecture options

**Option A: Allyship mode toggle** — Add a toggle "Use allyship mode" on UnpackingForm. When on, show allyship-specific questions; when off, keep current 6-question flow. Two input shapes; compileQuest or a variant accepts both.

**Option B: Replace form** — Replace current form with allyship model. Simpler but loses flexibility for non-allyship campaigns.

**Option C: Campaign-aware** — When campaignId is bruised-banana (or allyship), auto-use allyship form. Otherwise use generic.

**Recommendation**: Option A for flexibility; can default to allyship when campaign is bruised-banana.

## Input shape (allyship mode)

```ts
interface AllyshipUnpackingAnswers {
  experience: 'Gather Resource' | 'Skillful Organizing' | 'Raise Awareness' | 'Direct Action'
  lifeState: 'Flowing' | 'Stalled' | 'Neutral'
  distanceFromCreation: string  // short text
  reservations: string[]        // multi-select
  reservationContext: string    // short text
}
// alignedAction: 'Wake Up' | 'Clean Up' | 'Grow Up' | 'Show Up'
```

Mapping to existing `UnpackingAnswers` for compileQuest compatibility:
- q1 = experience
- q2 = derived from lifeState (Flowing → satisfied; Stalled → dissatisfied; Neutral → neutral)
- q3 = distanceFromCreation
- q4 = lifeState
- q5 = derived or empty
- q6 = reservations.join(', ') + ' ' + reservationContext

Or: add `compileQuestAllyship` that accepts the new shape and produces QuestPacket with move-based quest type.

## File impacts

| Action | Path |
|--------|------|
| Modify | [src/app/admin/quest-grammar/UnpackingForm.tsx](../../src/app/admin/quest-grammar/UnpackingForm.tsx) — allyship mode, new questions, multi-select |
| Modify or Create | [src/lib/quest-grammar/](../../src/lib/quest-grammar/) — AllyshipUnpackingAnswers type, compileQuestAllyship or compileQuest variant |
| Modify | [src/lib/quest-grammar/types.ts](../../src/lib/quest-grammar/types.ts) — optional AllyshipUnpackingAnswers, moveType on QuestPacket |
| Investigate | BAR/quest schema — moveType, quest type per move |

## Dependencies

- quest-grammar-cert-feedback (dropdowns, mobile-first already done)
- campaign-kotter-domains (4 moves)
- BY (Quest Grammar Compiler)
