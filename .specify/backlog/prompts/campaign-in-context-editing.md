# Spec Kit Prompt: Campaign In-Context Editing

## Role

Implement in-context campaign editing so admins can edit copy, slide breaks, and branching paths from a modal while going through the campaign onboarding flow.

## Objective

Implement per [.specify/specs/campaign-in-context-editing/spec.md](../specs/campaign-in-context-editing/spec.md). Add an "Edit" control to CampaignReader for admins; modal to edit passage text, choices (branching), and support explicit `---` slide breaks.

## Requirements

- **FR1–FR6**: Edit button visible to admin; modal with text, choices (add/remove/edit), slide break hint; upsert Passage; support hardcoded-node override; branching via choices; `---` for slides.
- **Slide chunker**: Split on `\n---\n` or `\n\n---\n\n` before char-based chunking.
- **Action**: `upsertCampaignPassage(adventureSlug, nodeId, { text, choices })` — require admin, upsert Passage.

## Deliverables

- [ ] slide-chunker.ts: support `---` explicit breaks
- [ ] campaign-passage.ts: upsertCampaignPassage action
- [ ] CampaignPassageEditModal.tsx: form with text, choices list, save
- [ ] campaign/page.tsx: pass isAdmin to CampaignReader
- [ ] CampaignReader.tsx: Edit button (admin only), modal integration
- [ ] Manual test: admin edits node, saves, sees changes

## Reference

- Spec: [.specify/specs/campaign-in-context-editing/spec.md](../specs/campaign-in-context-editing/spec.md)
- Plan: [.specify/specs/campaign-in-context-editing/plan.md](../specs/campaign-in-context-editing/plan.md)
