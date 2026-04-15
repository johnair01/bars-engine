# Plan: PDF-to-Campaign Autogeneration v0

## Summary

Extend Book-to-Quest so an uploaded PDF can auto-generate a Campaign (QuestThread + Adventure). Add TOC fallback for PDFs without TOC; summary + leverage API; deterministic CYOA skeleton; LORE-flavored narrative generation; orchestration to create Adventure + Passages and link to QuestThread.

## Phases

### Phase 1: TOC Fallback

- Extend `src/lib/book-toc.ts`:
  - If heuristic returns 0–1 entries, run fallback: scan full text for heading patterns
  - If still empty: split text into 5–10 synthetic sections
  - Add `method: 'heuristic' | 'fallback_headers' | 'fallback_chunks'` to BookToc
- Update `extractBookToc` in `src/actions/books.ts` to return method

### Phase 2: Summary and Leverage

- Create `src/actions/book-summary.ts`:
  - `generateBookSummaryAndLeverage(bookId, campaignRef)`
  - Build condensed input: TOC + section hints + sampled chunks per move
  - Single generateObjectWithCache call; schema: summary, leverageInCampaign, leverageInOtherDomains
  - Store in Book.metadataJson.summaryLeverage[campaignRef]

### Phase 3: Move-Organized Quests

- Extend `src/actions/book-analyze.ts` SYSTEM_PROMPT:
  - Emphasize move semantics: Wake Up (new ideas), Clean Up (psych barriers), Grow Up (skill tree), Show Up (apply to campaign)
- Optional: add skillLabel to analysis schema for Grow Up quests

### Phase 4: CYOA Structure

- Create `src/lib/book-campaign-cyoa/structure.ts`:
  - `buildBookCampaignSkeleton(book, toc, sectionHints, questsByMove)`
  - Returns node graph: BOOK_Intro, BOOK_ChooseArchetype, BOOK_Archetype_[id], BOOK_WakeUp, BOOK_CleanUp, BOOK_GrowUp, BOOK_ShowUp, BOOK_Complete
  - Deterministic; no AI

### Phase 5: Narrative Generation

- Create `src/lib/book-campaign-cyoa/narrative.ts`:
  - Load LORE: lore-index, story_context (abridged), archetype descriptions from DB
  - `generateBookCampaignNarratives(skeleton, book, campaignRef, summaryLeverage)`
  - BOOK_Intro: use summary + leverage
  - BOOK_Archetype_[id]: AI per archetype
  - Move passages: AI per move
  - Use generateObjectWithCache

### Phase 6: Orchestration

- Create `src/actions/book-campaign.ts`:
  - `createBookCampaign(bookId, campaignRef)`
  - Ensure TOC, summary, analysis, thread exist (or run them)
  - Build skeleton, generate narratives
  - Create Adventure (slug book-{slug}, campaignRef, startNodeId BOOK_Intro)
  - Create Passages; link quests via linkedQuestId
  - Update QuestThread.adventureId; Book.metadataJson.campaignAdventureId

### Phase 7: Admin UX

- Extend book detail page: target campaign dropdown, Generate Summary, Generate Campaign buttons
- Optional: POST /api/books/[id]/campaign

## File Impacts

| File | Action |
|------|--------|
| `src/lib/book-toc.ts` | Extend — fallback logic, method field |
| `src/actions/books.ts` | Extend — extractBookToc returns method |
| `src/actions/book-summary.ts` | Create — generateBookSummaryAndLeverage |
| `src/actions/book-analyze.ts` | Extend — prompt tweaks |
| `src/lib/book-campaign-cyoa/structure.ts` | Create — buildBookCampaignSkeleton |
| `src/lib/book-campaign-cyoa/narrative.ts` | Create — generateBookCampaignNarratives |
| `src/actions/book-campaign.ts` | Create — createBookCampaign orchestration |
| `src/app/admin/books/[id]/page.tsx` | Extend — campaign UI |
| `src/app/api/books/[id]/campaign/route.ts` | Create (optional) |

## Dependencies

- book-to-quest-library
- book-quest-targeted-extraction
- ai-deftness-token-strategy
