# Tasks: PDF-to-Campaign Autogeneration v0

## Phase 1: TOC Fallback

- [x] Extend BookToc type: add `method: 'heuristic' | 'fallback_headers' | 'fallback_chunks'`
- [x] Add fallback_headers: scan full text for heading patterns (^#+\s, ^\d+\.\s+[A-Z], standalone title lines)
- [x] Add fallback_chunks: split text into 5–10 synthetic sections when headers empty
- [x] Update extractTocFromText to run fallback when heuristic returns 0–1 entries
- [x] Update extractBookToc to return method in response

## Phase 2: Summary and Leverage

- [x] Create src/actions/book-summary.ts
- [x] Implement generateBookSummaryAndLeverage(bookId, campaignRef)
- [x] Build condensed input from TOC + section hints + sampled chunks
- [x] Zod schema: summary, leverageInCampaign, leverageInOtherDomains
- [x] Use generateObjectWithCache; store in metadataJson.summaryLeverage[campaignRef]

## Phase 3: Move-Organized Quests

- [x] Update book-analyze SYSTEM_PROMPT with move semantics
- [ ] Optional: add skillLabel to analysis schema for Grow Up quests

## Phase 4: CYOA Structure

- [x] Create src/lib/book-campaign-cyoa/structure.ts
- [x] Implement buildBookCampaignSkeleton(book, toc, sectionHints, questsByMove)
- [x] Define node IDs: BOOK_Intro, BOOK_ChooseArchetype, BOOK_Archetype_[id], move nodes, BOOK_Complete
- [x] Return skeleton with textPlaceholder and choices

## Phase 5: Narrative Generation

- [x] Create src/lib/book-campaign-cyoa/narrative.ts
- [x] Load LORE context (lore-index, story_context, archetypes)
- [x] Implement generateBookCampaignNarratives
- [x] BOOK_Intro: use summary + leverage (no AI)
- [x] BOOK_Archetype_[id]: AI per archetype with cache
- [x] Move passages: AI per move with cache

## Phase 6: Orchestration

- [x] Create src/actions/book-campaign.ts
- [x] Implement createBookCampaign(bookId, campaignRef)
- [x] Ensure TOC, summary, analysis, thread exist
- [x] Create Adventure + Passages
- [x] Link QuestThread.adventureId; Book.metadataJson.campaignAdventureId

## Phase 7: Admin UX

- [x] Add target campaign dropdown to book detail
- [x] Add Generate Summary button
- [x] Add Generate Campaign button
- [x] Wire to actions; show status/errors

## Verification

- [ ] Run npm run build
- [ ] Run npm run check
- [ ] Manual: upload PDF, extract TOC, generate summary, generate campaign, play through CYOA
