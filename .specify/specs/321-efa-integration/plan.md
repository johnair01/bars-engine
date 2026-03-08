# Plan: 321 EFA Integration

## Implementation Phases

1. **Phase 1 — EFA tool**: Add or replace tool with key `shadow-321` in seed/lib; ensure it appears in EFA kit
2. **Phase 2 — Kit integration**: In EmotionalFirstAidKit, when `selectedTool.key === 'shadow-321'`, render Shadow321Form instead of FirstAidTwinePlayer
3. **Phase 3 — Shadow321Form EFA mode**: Adapt Shadow321Form to accept `onComplete` callback for EFA flow; optionally `embedded?: boolean` to hide nav/skip, show resolution CTA
4. **Phase 4 — Gold star mint**: In completeEmotionalFirstAidSession, when tool is 321, always mint 1 (source: `shadow_321_completion`)
5. **Phase 5 — Post-321 in EFA**: After 321 completion, show Create BAR prompt; wire to create-bar with metadata (same as standalone)

## Key Files

| File | Change |
|------|--------|
| `src/lib/emotional-first-aid.ts` | Add/replace tool `shadow-321`; update VIBES_EMERGENCY_OPTIONS suggestedToolKeys |
| `src/components/emotional-first-aid/EmotionalFirstAidKit.tsx` | Branch: 321 tool → Shadow321Form; else FirstAidTwinePlayer |
| `src/components/shadow/Shadow321Form.tsx` | Add `onComplete`, `embedded` props for EFA mode |
| `src/actions/emotional-first-aid.ts` | completeEmotionalFirstAidSession: gold star mint when tool.key === 'shadow-321' |

## API Contract

### Shadow321Form (extend)

```ts
type Shadow321FormProps = {
  onComplete?: (metadata: Metadata321) => void  // EFA mode: call when 321 done
  embedded?: boolean                            // EFA mode: hide standalone nav, show resolution CTA
  contextQuestId?: string | null                // Optional: for linkedQuestId in metadata
}
```

When `onComplete` provided: on "Complete 321", call `onComplete(deriveMetadata321(...))` and do not navigate. Parent advances to resolution.

## Seed Strategy

- Option A: Add new tool `shadow-321`; keep placeholder for backward compat
- Option B: Replace `three-two-one-placeholder` with `shadow-321` in DEFAULT_FIRST_AID_TOOLS; seed script upserts by key

Recommend Option B: single 321 tool. Update `suggestedToolKeys` in VIBES_EMERGENCY_OPTIONS from `three-two-one-placeholder` to `shadow-321`.
