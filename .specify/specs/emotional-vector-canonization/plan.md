# Plan: Emotional Vector Canonization

## Summary

Canonize emotional vector structure and transformation logic. Add explicit Transcend vs Translate taxonomy; document vector format; update types and docs. No new API or schema.

---

## Implementation Order

### Phase 1: Types (quest-grammar)

1. **`src/lib/quest-grammar/types.ts`**
   - Add `MoveFamily = 'Transcend' | 'Translate'`
   - Add `EmotionalVector` interface:
     ```ts
     export interface EmotionalVector {
       channelFrom: EmotionalChannel
       altitudeFrom: AlchemyAltitude
       channelTo: EmotionalChannel
       altitudeTo: AlchemyAltitude
     }
     ```
   - Add `vectorToString(v: EmotionalVector): string` and `parseVectorString(s: string): EmotionalVector | null`
   - Re-export or import `AlchemyAltitude` from alchemy types (avoid circular deps)

2. **`src/lib/quest-grammar/move-engine.ts`**
   - Add `getMoveFamily(move: CanonicalMove): MoveFamily` — Transcend if `element` set; Translate if `fromElement`/`toElement`
   - Optionally add `moveFamily` to each `CanonicalMove` at definition time (derived, not stored)
   - Keep `category: 'Transcend' | 'Generative' | 'Control'` for energy/behavior; `moveFamily` for taxonomy

3. **`src/lib/quest-grammar/elements.ts`** (if needed)
   - Ensure `EmotionalChannel` and `ElementKey` mapping is documented for vector construction

### Phase 2: Docs

4. **`.specify/memory/conceptual-model.md`**
   - Emotional Alchemy section: Add "Transcend = altitude within channel; Translate = channel-to-channel; Generative/Control = translate subtypes."

5. **`.agent/context/emotional-alchemy-ontology.md`**
   - Add "Transcend vs Translate" section
   - Document vector format `channel:fromAltitude->channel:toAltitude`
   - Clarify: Transcend = same channel; Translate = different channels; Generative/Control = translate by alignment

6. **`src/app/wiki/emotional-alchemy/page.tsx`**
   - Add subsection "Transcend vs Translate"
   - Show move family (Transcend vs Translate) per move in the 15-move table

---

## File Impacts

| Action | File |
|--------|------|
| Edit | `src/lib/quest-grammar/types.ts` — EmotionalVector, MoveFamily, vector helpers |
| Edit | `src/lib/quest-grammar/move-engine.ts` — getMoveFamily |
| Edit | `.specify/memory/conceptual-model.md` |
| Edit | `.agent/context/emotional-alchemy-ontology.md` |
| Edit | `src/app/wiki/emotional-alchemy/page.tsx` |

---

## Verification

- [ ] `npm run build` passes
- [ ] `npm run check` passes
- [ ] No circular imports (alchemy ↔ quest-grammar)
- [ ] Wiki page renders with Transcend vs Translate section
