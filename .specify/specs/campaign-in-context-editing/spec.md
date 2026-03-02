# Spec: Campaign In-Context Editing (Admin)

## Purpose

Allow admins to edit campaign onboarding copy, slide count, and branching paths **while going through the flow** — via a modal that opens from the campaign reader, instead of navigating to Admin > Adventures.

## Problem

- Admins must leave the campaign flow and go to `/admin/adventures/[id]/passages` to edit copy.
- There is no way to edit "number of pages" (slides) — slide chunking is automatic via `chunkIntoSlides` (~500 char threshold).
- Creating branching paths requires creating passages in admin, then manually editing JSON choices.
- Context is lost when switching to admin; admins want to edit in place.

## User story

**As an admin**, I want to edit the copy, slide count, and choices of the current campaign node from a modal while viewing it, so I can iterate on onboarding content without leaving the flow.

**Acceptance**: When logged in as admin and viewing a campaign node, I see an "Edit" control; clicking it opens a modal to edit text, slide settings, and choices (branching paths). Changes persist to the Passage table and appear on refresh.

## Current architecture

- **Campaign flow**: `/campaign` → CampaignReader fetches nodes from `/api/adventures/bruised-banana/[nodeId]`
- **Data**: Adventure (slug: bruised-banana) + Passage (nodeId, text, choices JSON)
- **Fallback**: Hardcoded nodes in API when no Passage exists (e.g. BB_ChooseNation, BB_NationInfo_*)
- **Slides**: `chunkIntoSlides(text)` splits long text by ~500 chars; BB_Intro and BB_ShowUp are chunked
- **Choices**: `[{ text, targetId }]` — targetId links to next node

## Functional requirements

- **FR1**: When admin is viewing a campaign node, an "Edit" button/link MUST be visible (e.g. top-right of the node card).
- **FR2**: Clicking Edit MUST open a modal with:
  - Passage text (markdown + macros) — editable textarea
  - Choices — editable list (add/remove/edit each choice: text + targetId)
  - Slide break control — optional: explicit break marker (e.g. `---`) or threshold hint
- **FR3**: Saving MUST upsert the Passage (create if missing, update if exists) for the current adventure and nodeId.
- **FR4**: For nodes that are currently hardcoded (no Passage), the modal MUST allow creating a new Passage to override the default.
- **FR5**: Admin MUST be able to add new choices that point to existing or new nodeIds (branching).
- **FR6**: "Number of pages" — support at least one of: (a) explicit `---` slide breaks in text, or (b) configurable slide threshold per node (stored in Passage metadata if needed).

## Non-functional requirements

- Modal must match app dark theme (zinc/purple).
- Require admin role; non-admins must not see the Edit control.
- Campaign page must receive `isAdmin` (or equivalent) from server to conditionally render the control.

## Out of scope (phase 1)

- Creating entirely new nodes from scratch in the modal (can link to existing nodeIds only; new nodes created via Admin > Adventures).
- Visual graph editor for branching.
- Per-node slide threshold in DB (use explicit `---` breaks for phase 1).

## Reference

- [src/app/campaign/components/CampaignReader.tsx](../../src/app/campaign/components/CampaignReader.tsx)
- [src/app/api/adventures/[slug]/[nodeId]/route.ts](../../src/app/api/adventures/[slug]/[nodeId]/route.ts)
- [src/app/admin/adventures/[id]/passages/[passageId]/edit/EditPassageForm.tsx](../../src/app/admin/adventures/[id]/passages/[passageId]/edit/EditPassageForm.tsx)
- [src/lib/slide-chunker.ts](../../src/lib/slide-chunker.ts)
