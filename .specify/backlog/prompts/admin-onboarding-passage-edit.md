# Spec Kit Prompt: Admin Onboarding Passage Edit (Node-Level)

## Role

You are a Spec Kit agent implementing per-passage editing for the onboarding .twee draft.

## Objective

Enable admins to edit individual passages (nodes) via a modal instead of the full-file textarea. Each node in the Template Structure graph opens to a form for title, body, and choices. API-first: passages API + PATCH before UI.

## Prompt (API-First)

> Implement Admin Onboarding Passage Edit per [.specify/specs/admin-onboarding-passage-edit/spec.md](../specs/admin-onboarding-passage-edit/spec.md). **API-first**: (1) Create `src/lib/twee-serializer.ts` with `serializePassageToBlock` and `replacePassageInTwee`. (2) GET `/api/admin/onboarding/draft/passages` returns `{ passages }`. (3) PATCH `/api/admin/onboarding/draft/passages/:id` accepts `{ name?, body?, links? }`, applies updates, replaces passage block, validates, writes. (4) Create `PassageEditModal` with form (name, body, links). (5) Make graph nodes in OnboardingFlowTemplate clickable; click opens modal. Spec: [path].

## Requirements

- **Surfaces**: /admin/onboarding, OnboardingFlowTemplate, PassageEditModal
- **API**: GET /draft/passages, PATCH /draft/passages/:id
- **Serialization**: String replacement to preserve StoryTitle, StoryData, other passages
- **Rename**: Update all links targeting old passage name when name changes

## Checklist (API-First Order)

- [ ] twee-serializer.ts with serializePassageToBlock, replacePassageInTwee
- [ ] GET /api/admin/onboarding/draft/passages
- [ ] PATCH /api/admin/onboarding/draft/passages/[id]
- [ ] PassageEditModal component
- [ ] Clickable nodes in OnboardingFlowTemplate
- [ ] npm run build and npm run check — fail-fix

## Deliverables

- [ ] .specify/specs/admin-onboarding-passage-edit/spec.md (done)
- [ ] .specify/specs/admin-onboarding-passage-edit/plan.md (done)
- [ ] .specify/specs/admin-onboarding-passage-edit/tasks.md (done)
- [ ] src/lib/twee-serializer.ts
- [ ] src/app/api/admin/onboarding/draft/passages/route.ts
- [ ] src/app/api/admin/onboarding/draft/passages/[id]/route.ts
- [ ] src/app/admin/onboarding/PassageEditModal.tsx
- [ ] Updates to OnboardingFlowTemplate.tsx
