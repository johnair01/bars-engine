# Tasks: Admin Onboarding Passage Edit (Node-Level)

## Phase 1: Serialization

- [ ] Create `src/lib/twee-serializer.ts`
- [ ] Implement `serializePassageToBlock(name, tags, body, links)` → string
- [ ] Implement `replacePassageInTwee(tweeSource, passageId, newBlock)` → string
- [ ] Add unit tests for serializer (optional; or rely on integration)

## Phase 2: API

- [ ] Create `src/app/api/admin/onboarding/draft/passages/route.ts`
- [ ] GET: parse twee, filter StoryTitle/StoryData, return `{ passages }`
- [ ] Create `src/app/api/admin/onboarding/draft/passages/[id]/route.ts`
- [ ] PATCH: parse body, find passage, apply updates, handle rename (update refs), replace block, validate, write
- [ ] Reuse admin auth pattern from draft route

## Phase 3: PassageEditModal

- [ ] Create `src/app/admin/onboarding/PassageEditModal.tsx`
- [ ] Props: passageId, initialData (or fetch in modal), onClose, onSaved
- [ ] Form: name (input), body (textarea), links (list of { label, target })
- [ ] Save button → PATCH, on success call onSaved + onClose
- [ ] Target dropdown: list of passage names (from passages or flow nodes)

## Phase 4: Wire graph

- [ ] Modify OnboardingFlowTemplate: fetch passages (or use flow node ids)
- [ ] Make NodeRow clickable; onClick opens modal with node.id
- [ ] Add state: editingPassageId, show PassageEditModal when set
- [ ] On save: close modal, refetch flow (or trigger refresh)

## Phase 5: Verification

- [ ] Add cert-admin-onboarding-passage-edit-v1 to seed (or extend existing)
- [ ] npm run build and npm run check pass
