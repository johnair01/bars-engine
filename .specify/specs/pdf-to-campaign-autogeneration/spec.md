# Spec: PDF-to-Campaign Autogeneration v0

## Purpose

Extend the Book-to-Quest flow so an uploaded PDF can auto-generate a Campaign: a QuestThread plus a linked Adventure (CYOA) that takes players through the material. One CYOA with early archetype choice, archetype-specific branches using game LORE, move-organized quests (Wake Up, Clean Up, Grow Up, Show Up), and campaign-context leverage analysis.

**Problem**: Books become QuestThreads only. There is no CYOA wrapper, no archetype-specific flavor, no campaign-context leverage, and no fallback when PDFs lack a table of contents.

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI, token-efficient.

## Design Decisions

| Topic | Decision |
|-------|----------|
| Campaign entity | QuestThread + linked Adventure (existing schema) |
| Archetype flow | One CYOA; archetype choice early; archetype-specific branches later |
| Campaign context | Admin selects target campaignRef (Instance campaign); leverage analysis uses it |
| TOC fallback | Heuristic header scan in full text; if empty, evenly split into N sections |
| Token efficiency | Summary + leverage: one AI call on TOC + section hints + sampled chunks; CYOA prose: template + LORE slot-fill; reuse generateObjectWithCache |
| Moves | Wake Up (new ideas), Clean Up (psych barriers), Grow Up (skill tree), Show Up (apply to campaign) — reuse moveType |

## Conceptual Model

| Concept | Meaning |
|---------|---------|
| **Campaign** | QuestThread + Adventure; campaignRef links to Instance (e.g. bruised-banana) |
| **Book summary** | 2–4 paragraph condensation of book content |
| **Leverage** | How the book serves the target campaign; optional other domains |
| **CYOA skeleton** | Deterministic node graph: Intro → ChooseArchetype → Archetype_[id] → WakeUp → CleanUp → GrowUp → ShowUp → Complete |
| **Archetype branch** | One of 8 (Heaven, Earth, Thunder, Wind, Water, Fire, Mountain, Lake); flavor from LORE |

## API Contracts (API-First)

### generateBookSummaryAndLeverage(bookId, campaignRef)

**Input**: `bookId: string`, `campaignRef: string`  
**Output**: `Promise<{ success: true; summary: string; leverageInCampaign: string; leverageInOtherDomains?: string[] } | { error: string }>`

- Server Action — Admin trigger. Builds condensed input from TOC + section hints + sampled chunks; single AI call; stores in Book.metadataJson.summaryLeverage[campaignRef].

### createBookCampaign(bookId, campaignRef)

**Input**: `bookId: string`, `campaignRef: string`  
**Output**: `Promise<{ success: true; adventureId: string; threadId: string } | { error: string }>`

- Server Action — Orchestrates: ensure TOC, summary, analysis, thread exist; build skeleton; generate narratives; create Adventure + Passages; link to QuestThread.

### extractBookToc(bookId) — extended

**Input**: `bookId: string`  
**Output**: `Promise<{ success: true; entryCount: number; method: string } | { error: string }>`

- Existing action; extend to run fallback when heuristic returns 0–1 entries. Add `method` to response.

## User Stories

### Admin

- As an admin, I can extract TOC from any PDF (including those without a formal TOC), so structure is available for campaign generation.
- As an admin, I can generate a book summary and campaign leverage for a target campaign, so I see how the book serves that context.
- As an admin, I can generate a full Campaign (QuestThread + Adventure) from a book, targeting a campaign, so players get a CYOA that guides them through the material with archetype-specific flavor.

## Functional Requirements

### Phase 1: TOC Fallback

- **FR1**: When heuristic TOC returns 0–1 entries, run fallback: scan full text for heading patterns (e.g. `^#+\s`, `^\d+\.\s+[A-Z]`, standalone title-like lines).
- **FR2**: If still empty: create synthetic entries by splitting text into 5–10 chunks with charStart/charEnd.
- **FR3**: Add `method: 'heuristic' | 'fallback_headers' | 'fallback_chunks'` to BookToc.
- **FR4**: extractBookToc returns method in response.

### Phase 2: Summary and Leverage

- **FR5**: `generateBookSummaryAndLeverage(bookId, campaignRef)` — condensed input: TOC entries, section hints, 2–3 sampled chunks per move.
- **FR6**: AI schema: `{ summary, leverageInCampaign, leverageInOtherDomains? }`.
- **FR7**: Store in Book.metadataJson.summaryLeverage[campaignRef].
- **FR8**: Use generateObjectWithCache; cache key includes bookId, campaignRef.

### Phase 3: Move-Organized Quests

- **FR9**: Analysis prompt emphasizes move semantics: Wake Up (new ideas), Clean Up (psych barriers), Grow Up (skill tree), Show Up (apply to campaign).
- **FR10**: Optional skillLabel for Grow Up quests (emergent skill name).

### Phase 4: CYOA Structure

- **FR11**: `buildBookCampaignSkeleton(book, toc, sectionHints, questsByMove)` — deterministic node graph.
- **FR12**: Nodes: BOOK_Intro, BOOK_ChooseArchetype, BOOK_Archetype_[id], BOOK_WakeUp, BOOK_CleanUp, BOOK_GrowUp, BOOK_ShowUp, BOOK_Complete.
- **FR13**: Choices: archetype → BOOK_Archetype_[id]; each branch → move sequence → BOOK_Complete.

### Phase 5: Narrative Generation

- **FR14**: Load compact LORE context (lore-index, story_context abridged, archetype descriptions).
- **FR15**: BOOK_Intro uses summary + leverage (no AI).
- **FR16**: BOOK_Archetype_[id]: one AI call per archetype; schema `{ introText }`.
- **FR17**: Move passages: one AI call per move; schema `{ passageText }`.
- **FR18**: Use generateObjectWithCache; cache key includes bookId, campaignRef, nodeId.

### Phase 6: Adventure + Passage Creation

- **FR19**: createBookCampaign creates Adventure: slug = `book-{book.slug}`, campaignRef, startNodeId = BOOK_Intro.
- **FR20**: Create Passage records for each node (text, choices, metadata).
- **FR21**: Link quests via Passage.linkedQuestId for move nodes.
- **FR22**: Update QuestThread.adventureId; store campaignAdventureId in Book.metadataJson.

### Phase 7: Admin UX

- **FR23**: Book detail: "Target campaign" dropdown (Instance campaigns); "Generate Summary" and "Generate Campaign" buttons.
- **FR24**: Optional: POST /api/books/[id]/campaign with body `{ campaignRef }`.

## Non-Functional Requirements

- Token budget: ~15–20k tokens per book for new AI calls; cached.
- Backward compatible: existing books without TOC fallback continue to work.
- No schema changes: use existing Adventure, Passage, QuestThread.adventureId.

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| AI calls | generateObjectWithCache; cache by bookId+campaignRef+nodeId |
| Request body | No large payloads; orchestration is server-side |
| Env | BOOK_ANALYSIS_AI_ENABLED, model overrides |

## Verification Quest

- **ID**: `cert-pdf-to-campaign-v1`
- **Steps**: Admin uploads PDF; extracts TOC (with fallback if needed); generates summary for bruised-banana; generates campaign; plays through BOOK_Intro → ChooseArchetype → one archetype branch → completion.
- Reference: [cyoa-certification-quests](.specify/specs/cyoa-certification-quests/)

## Dependencies

- [Book-to-Quest Library](.specify/specs/book-to-quest-library/spec.md)
- [Book Quest Targeted Extraction](.specify/specs/book-quest-targeted-extraction/spec.md)
- [AI Deftness Token Strategy](.specify/specs/ai-deftness-token-strategy/spec.md)

## References

- [src/lib/book-toc.ts](../../src/lib/book-toc.ts)
- [src/actions/book-analyze.ts](../../src/actions/book-analyze.ts)
- [src/actions/book-to-thread.ts](../../src/actions/book-to-thread.ts)
- [src/app/api/adventures/[slug]/[nodeId]/route.ts](../../src/app/api/adventures/[slug]/[nodeId]/route.ts)
- [content/lore-index.md](../../content/lore-index.md)
