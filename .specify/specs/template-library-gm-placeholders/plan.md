# Plan: Template Library Game Master Placeholders

## Summary

Extend `generateFromTemplate` to produce face-specific placeholder text for each passage slot. Slot-to-face mapping is deterministic; no schema change. Fixes cert-template-library-v1 feedback: "There wasn't any placeholder text when I generated text."

---

## Architecture

### Slot → Face Mapping (deterministic)

```ts
function getFaceForSlot(nodeId: string): GameMasterFace {
  if (nodeId.startsWith('context_')) return 'shaman'
  if (nodeId.startsWith('anomaly_')) return 'challenger'
  if (nodeId === 'choice') return 'diplomat'
  if (nodeId === 'response') return 'regent'
  if (nodeId === 'artifact') return 'architect'
  return 'architect' // default
}
```

### Guidance Text per Face

| Face | Guidance template |
|------|-------------------|
| shaman | "Shaman: Ground the scene. What world does the player stand in? [Edit: replace with your content.]" |
| challenger | "Challenger: Introduce tension. What disrupts or tests the player? [Edit: replace with your content.]" |
| diplomat | "Diplomat: Present options. What paths can the player take? [Edit: replace with your content.]" |
| regent | "Regent: Resolve. What outcome or ruling emerges? [Edit: replace with your content.]" |
| architect | "Architect: Deliverable. What does the player take away? [Edit: replace with your content.]" |

---

## Implementation Order

### Phase 1: Template Library Service

1. **`src/lib/template-library/index.ts`**
   - Add `getPlaceholderForSlot(nodeId: string): string` — returns face-specific guidance.
   - In `generateFromTemplate`, replace `text: \`[Edit: ${slot.nodeId}]\`` with `text: getPlaceholderForSlot(slot.nodeId)`.

### Phase 2: Verification

2. **Manual verification**
   - Run `npm run seed:adventure-templates` (if needed).
   - Generate from template via /admin/templates.
   - Confirm each passage shows face-specific placeholder (e.g. Shaman for context_1).
   - Run cert-template-library-v1 STEP_2; confirm tester sees placeholders.

---

## File Impacts

| Action | File |
|--------|------|
| Edit | `src/lib/template-library/index.ts` — add getPlaceholderForSlot, use in generateFromTemplate |

---

## Verification

- [ ] Generate from template creates passages with face-specific placeholder text
- [ ] cert-template-library-v1 STEP_2: tester confirms placeholders visible when generating
