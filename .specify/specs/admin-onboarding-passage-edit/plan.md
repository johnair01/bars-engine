# Plan: Admin Onboarding Passage Edit (Node-Level)

## Summary

Add per-passage editing: click a node → modal with title, body, links → PATCH updates that passage in the .twee file. API-first: passages API + PATCH endpoint before UI.

## Phase 1: Serialization helpers

### 1.1 serializePassageToBlock

**File**: `src/lib/twee-parser.ts` or new `src/lib/twee-serializer.ts`

```ts
export function serializePassageToBlock(
  name: string,
  tags: string[],
  body: string,
  links: Array<{ label: string; target: string }>
): string
```

- Header: `:: Name` or `:: Name [tag1 tag2]` if tags present.
- Body: `body.trim()`.
- Links: `[[label|target]]` per link, joined by newline.
- Format: `body\n\n${links}`.
- Return full block with trailing newlines.

### 1.2 replacePassageInTwee

**File**: `src/lib/twee-serializer.ts` (or same module)

```ts
export function replacePassageInTwee(
  tweeSource: string,
  passageId: string,
  newBlock: string
): string
```

- Parse to find passage boundaries. Scan for `:: PassageName` lines.
- Locate block: from `:: passageId` to next `::` or end.
- Replace with `newBlock`.
- Preserve StoryTitle, StoryData, other passages exactly.

### 1.3 Update references on rename

When PATCH changes `name`, find all passages with `links[].target === oldId` and update to new name. Apply before replace.

## Phase 2: API routes

### 2.1 GET /api/admin/onboarding/draft/passages

**File**: `src/app/api/admin/onboarding/draft/passages/route.ts`

- Require admin (reuse pattern from draft route).
- Read twee file, parse with `parseTwee`.
- Filter out StoryTitle, StoryData (passages where name matches).
- Map to `{ id, name, tags, body, links }`. Body = strip link markup from text.
- Return `{ passages }`.

### 2.2 PATCH /api/admin/onboarding/draft/passages/[id]/route.ts

**File**: `src/app/api/admin/onboarding/draft/passages/[id]/route.ts`

- Require admin.
- Parse body: `{ name?, body?, links? }`.
- Read twee, parse.
- Find passage by id. If not found, 404.
- If name changed: update all passages' links where target === old id.
- Build new block: `serializePassageToBlock(name ?? oldName, tags, body ?? oldBody, links ?? oldLinks)`.
- Replace: `replacePassageInTwee(tweeSource, id, newBlock)`.
- If name changed: id in replace is old id; new block has new name. Handle: replace old block, then if renamed we need to update references in other passages. Order: (1) update references in parsed structure, (2) rebuild full twee from parsed (or do in-place string updates for each reference). Simpler: do reference updates as string replace of `|OldName]]` → `|NewName]]` and `->OldName]]` → `->NewName]]` in the twee, then replace the passage block.
- Validate: parseTwee, translateTweeToFlow.
- Write file.
- Return `{ success: true }`.

## Phase 3: PassageEditModal component

**File**: `src/app/admin/onboarding/PassageEditModal.tsx`

- Props: `{ passageId, passages, onClose, onSaved }`.
- State: `name`, `body`, `links` (from passage or loaded).
- Form: input (name), textarea (body), links list (label + target select).
- Save: PATCH `/api/admin/onboarding/draft/passages/${passageId}`.
- On success: `onSaved()`, `onClose()`.

## Phase 4: Wire graph nodes

**File**: `src/app/admin/onboarding/OnboardingFlowTemplate.tsx`

- Fetch passages via GET `/api/admin/onboarding/draft/passages` (or derive from flow — flow nodes have id = passage name).
- Add `onNodeClick(id)` → set `editingPassageId`, open modal.
- Render `PassageEditModal` when `editingPassageId` set.
- Pass `passages` to modal for target dropdown (or fetch in modal).

## File Summary

| Action | Path |
|--------|------|
| Create | `src/lib/twee-serializer.ts` |
| Create | `src/app/api/admin/onboarding/draft/passages/route.ts` |
| Create | `src/app/api/admin/onboarding/draft/passages/[id]/route.ts` |
| Create | `src/app/admin/onboarding/PassageEditModal.tsx` |
| Modify | `src/app/admin/onboarding/OnboardingFlowTemplate.tsx` |

## Edge Cases

- **StoryTitle, StoryData**: Not in passages list. Parser treats them specially; exclude from editable list.
- **Empty body**: Allow. Passage can be link-only.
- **Links to non-existent passages**: Allow (external targets). Validation may warn; flow translator handles.
- **Rename to existing name**: Reject (duplicate passage names invalid).
