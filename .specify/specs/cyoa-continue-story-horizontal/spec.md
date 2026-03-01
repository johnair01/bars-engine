# Spec: CYOA Continue Story Horizontal

## Purpose

Ensure "Continue" advances both content and story horizontally. Fix the emergent issue: slide-mode Prev/Next cycles through text chunks within a single node but does not advance the narrative. Players expect one "Continue" button that moves through long content and then advances the story.

## Root cause

- AO (cert-cyoa-slides) added Prev/Next controls that chunk long text client-side.
- These controls advance within the node only; the choice buttons (e.g., "Continue to choose my path") advance the story but are separate.
- Result: Two competing "next" actions; confusion about what "Continue" does.

## User story

**As a player**, I want one "Continue" button that moves me through long content and then advances the story, so I am not confused by separate slide controls vs. story choices.

**Acceptance**: When content is split into slides, a single "Continue" advances through slides first; on the last slide, "Continue" advances the story. No separate Prev/Next slide controls that do not advance the story.

## Functional requirements

- **FR1**: When a node has multiple content chunks (slides), a single "Continue" button MUST: (a) on non-final chunks, advance to the next chunk; (b) on the final chunk, advance to the next story node.
- **FR2**: Prefer graph structure: long content SHOULD be split into multiple nodes (e.g., BB_Intro_1, BB_Intro_2) so "Continue" is a story choice. Fallback: if structure cannot change, unify slide "Next" with story "Continue" in the UI.
- **FR3**: Remove or repurpose Prev/Next slide controls when a unified Continue is used. Optional: keep "Back" for revisiting previous chunks within the same logical step.
- **FR4**: Apply to both CampaignReader (campaign nodes) and PassageRenderer (certification quest passages).

## Non-functional requirements

- Phase A (UX fallback): Unify Continue in UI; quick win without API changes.
- Phase B (Structure): Split long nodes into graph nodes in API; remove client-side chunking for campaign.

## Reference

- Plan: [.specify/specs/cyoa-continue-story-horizontal/plan.md](plan.md)
- CampaignReader: [src/app/adventures/[slug]/[nodeId]/route.ts](../../src/app/api/adventures/[slug]/[nodeId]/route.ts)
- PassageRenderer: [src/app/adventures/[id]/play/PassageRenderer.tsx](../../src/app/adventures/[id]/play/PassageRenderer.tsx)
- AO spec: [cert-cyoa-slides](../cert-cyoa-slides/spec.md)
