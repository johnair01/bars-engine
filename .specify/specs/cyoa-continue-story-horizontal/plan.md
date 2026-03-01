# Plan: CYOA Continue Story Horizontal

## Architecture

### Phase A: UX Fallback (Unify Continue)

Replace Prev | 1/N | Next with a single "Continue" button that:
- On non-final slides: advances to next slide (setSlideIndex)
- On final slide: advances story (handleChoice(primaryChoice) or handleChoice(choice.targetId))

**CampaignReader** ([src/app/campaign/components/CampaignReader.tsx](../../src/app/campaign/components/CampaignReader.tsx)):
- When useSlideMode: hide Prev/Next; show single "Continue" that advances slide or calls handleChoice with primary choice (first choice).
- When multiple choices exist (e.g., "Continue" + "Learn more"), show "Continue" for slide flow; other choices remain below. On last slide, "Continue" = primary choice; others stay.
- Optional: small "Back" link for previous slide (slideIndex > 0).

**PassageRenderer** ([src/app/adventures/[id]/play/PassageRenderer.tsx](../../src/app/adventures/[id]/play/PassageRenderer.tsx)):
- When useSlideMode: hide Prev/Next; single "Continue" advances slide or handleChoice(primaryLink.target). Primary link = first link that does not target FEEDBACK.
- Other links (Report Issue) remain. slideIndex state must exist (add if missing).

### Phase B: Graph Structure (Split Nodes)

**Campaign API** ([src/app/api/adventures/[slug]/[nodeId]/route.ts](../../src/app/api/adventures/[slug]/[nodeId]/route.ts)):
- For BB_Intro: when wakeUpContent + storyBridgeCopy exceed SLIDE_THRESHOLD, split into BB_Intro_1, BB_Intro_2, ... using chunkIntoSlides server-side.
- Each slide node: text = one chunk; choices = [{ text: 'Continue', targetId: 'BB_Intro_2' }] or BB_ShowUp for last.
- Add getBruisedBananaNode handling for BB_Intro_1, BB_Intro_2, ... (or dynamic BB_Intro_N pattern).
- Campaign page start: when slides exist, use BB_Intro_1; else BB_Intro.

**CampaignReader**:
- When graph is restructured for a node: no client-side chunking; each node is one chunk. Remove chunkIntoSlides for nodes that come pre-split (e.g., BB_Intro_1).
- Detection: node id matches BB_Intro_N pattern → no chunking.

**Campaign page** ([src/app/campaign/page.tsx](../../src/app/campaign/page.tsx)):
- Start at BB_Intro_1 when ref=bruised-banana and intro has multiple slides; else BB_Intro.

## File Impacts

| File | Phase A | Phase B |
|------|---------|---------|
| CampaignReader.tsx | Unify Continue; remove Prev/Next | Remove chunking for BB_Intro_N |
| PassageRenderer.tsx | Unify Continue; remove Prev/Next | - |
| route.ts (adventures API) | - | Split BB_Intro into slide nodes |
| campaign/page.tsx | - | Start at BB_Intro_1 when applicable |
| slide-chunker.ts | - | Export for server use |

## Verification

- Cert quest step: "Confirm one Continue button advances through long content (BB_Intro or equivalent) and then the story."
- Manual: /campaign?ref=bruised-banana with long story bridge; click Continue through slides; confirm last Continue goes to BB_ShowUp.
