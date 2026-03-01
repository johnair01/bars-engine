# Tasks: CYOA Continue Story Horizontal

## Phase A: UX Fallback (Unify Continue)

- [x] **A1** CampaignReader: Replace Prev | 1/N | Next with single "Continue" button. When more slides: advance slideIndex. When last slide: call handleChoice(availableChoices[0]). Keep other choices (e.g., "Learn more") visible; they advance story directly.
- [x] **A2** CampaignReader: Optional "← Back" link when slideIndex > 0 to go to previous slide.
- [x] **A3** PassageRenderer: Add slideIndex state if missing. Replace Prev/Next with single "Continue". Primary link = first link where target !== 'FEEDBACK'. Continue: advance slide or handleChoice(primaryLink.target).
- [x] **A4** PassageRenderer: Keep "Report Issue" and other secondary links visible when in slide mode.

## Phase B: Graph Structure (Split Nodes)

- [x] **B1** Export chunkIntoSlides from slide-chunker for server use (or ensure it can be imported in API route).
- [x] **B2** Adventures API: For BB_Intro, when text length > SLIDE_THRESHOLD, return BB_Intro_1 with first chunk and choice to BB_Intro_2 (or BB_ShowUp if one chunk).
- [x] **B3** Adventures API: Add handlers for BB_Intro_2, BB_Intro_3, ... (or generic BB_Intro_N) returning subsequent chunks.
- [x] **B4** Campaign page: No change needed. API for BB_Intro when long returns first slide (id BB_Intro_1); client fetches BB_Intro and receives BB_Intro_1.
- [x] **B5** CampaignReader: When node id matches BB_Intro_N or BB_ShowUp_N, do not run chunkIntoSlides (content is already one chunk).
- [x] **B6** API for BB_Intro returns first slide when content long; campaign page keeps startNodeId BB_Intro; fetch returns BB_Intro_1.

## Verification

- [x] **V1** Add cert quest step to cert-two-minute-ride-v1 or cert-cyoa-slides: "Confirm one Continue button advances through long content and then the story."
- [x] **V2** Manual: Play /campaign?ref=bruised-banana with long story bridge; verify Continue flows through slides then to BB_ShowUp.
