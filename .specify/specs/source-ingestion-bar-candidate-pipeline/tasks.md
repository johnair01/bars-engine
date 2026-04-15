# Tasks: Source Ingestion + BAR Candidate Pipeline

## Phase 1: Schema

- [ ] Add SourceDocument model to prisma/schema.prisma
- [ ] Add SourceExcerpt model
- [ ] Add BarCandidate model
- [ ] Add ExtensionPrompt model
- [ ] Add QuestSeed model
- [ ] Add SourceLineageEdge model
- [ ] Add optional barCandidateId or lineage fields to CustomBar if needed
- [ ] Run npm run db:sync

## Phase 2: Core Services

- [ ] Create src/services/source-document-service.ts (createFromUpload, listDocuments, getDocumentDetail, parseDocument)
- [ ] Create src/services/source-excerpt-service.ts (createExcerpts, listByDocument, getExcerptDetail)
- [ ] Create src/services/source-lineage-service.ts (createEdge, getLineage)
- [ ] Create src/lib/source-genre-profiles.ts (SOURCE_ANALYSIS_PROFILES: NONFICTION, PHILOSOPHY, FICTION, MEMOIR, PRACTICAL, CONTEMPLATIVE)

## Phase 3: Analysis Pipeline

- [ ] Create src/services/source-analysis-service.ts (analyzeExcerpt, classify, score metabolizability)
- [ ] Create src/services/bar-candidate-service.ts (generateCandidate, listByDocument, getCandidateDetail)
- [ ] Create src/services/extension-prompt-service.ts (generateFromCandidate, listByDocument)
- [ ] Create src/services/quest-seed-service.ts (generateFromCandidate, listByCandidate)
- [ ] Create src/services/source-ingestion-service.ts (orchestrate: upload → parse → analyze)

## Phase 4: Deftness Hooks

- [ ] Create src/services/deftness-service.ts (interface + stub implementations)
- [ ] Add evaluateExcerptSelection stub
- [ ] Add evaluateCandidateGeneration stub
- [ ] Add evaluateExtensionPrompt stub
- [ ] Add evaluateQuestSeed stub
- [ ] Add evaluateCurationAction stub
- [ ] Add evaluateLineageIntegrity stub
- [ ] Create src/lib/source-ingestion-events.ts (event surface constants)
- [ ] Wire deftness calls into analysis and curation flows

## Phase 5: Curation

- [ ] Create src/services/curation-service.ts (approveCandidate, rejectCandidate, mintBarFromCandidate, saveAsExtensionPrompt, saveAsLore)
- [ ] Mint CustomBar from approved BarCandidate with lineage
- [ ] Create SourceLineageEdge for each transformation

## Phase 6: API / Routes (API-First: contracts before UI)

- [ ] Document request/response shapes for each endpoint in plan or spec
- [ ] Create src/actions/source-ingestion.ts (server actions for ingestion flow)
- [ ] Create GET /api/source-documents (list)
- [ ] Create POST /api/source-documents (upload)
- [ ] Create GET /api/source-documents/[id] (detail)
- [ ] Create POST /api/source-documents/[id]/parse
- [ ] Create POST /api/source-documents/[id]/analyze
- [ ] Create GET /api/source-documents/[id]/status
- [ ] Create GET /api/source-documents/[id]/excerpts
- [ ] Create GET /api/source-documents/[id]/candidates
- [ ] Create GET /api/source-excerpts/[id]
- [ ] Create POST /api/source-excerpts/[id]/reanalyze
- [ ] Create GET /api/bar-candidates/[id]
- [ ] Create POST /api/bar-candidates/[id]/approve
- [ ] Create POST /api/bar-candidates/[id]/reject
- [ ] Create POST /api/bar-candidates/[id]/mint
- [ ] Create POST /api/bar-candidates/[id]/save-as-prompt
- [ ] Create POST /api/bar-candidates/[id]/save-as-lore
- [ ] Create GET /api/bar-candidates/[id]/quest-seeds
- [ ] Create GET /api/extension-prompts (list by document or library)
- [ ] Create GET /api/extension-prompts/[id]
- [ ] Create POST /api/extension-prompts/[id]/create-bar (optional)
- [ ] Create GET /api/quest-seeds/[id]
- [ ] Create POST /api/quest-seeds/[id]/promote (optional)
- [ ] Create GET /api/source-analysis-profiles

## Phase 7: Admin UI (Minimal v1 — after API contracts)

- [ ] Create src/app/admin/source-ingestion/page.tsx (list + upload entry)
- [ ] Create SourceUploadForm (upload PDF, title, author, analysis profile, optional library)
- [ ] Create src/app/admin/source-ingestion/[id]/page.tsx (source document detail view)
- [ ] Document detail: title, author, status, metadata, candidate/prompt/seed counts
- [ ] Create CandidateReviewList (excerpt, scores, disposition, draft BAR, extension prompt, quest seed preview; approve/reject/mint/save as prompt/archive)
- [ ] Create ExcerptPreview (expandable or inline source excerpt)
- [ ] Create LineagePreview (chain: Document → Excerpt → Candidate → BAR/Prompt/Seed)
- [ ] Add analysis profile selector to upload or analysis trigger
- [ ] Add Source Ingestion link to AdminNav

## Phase 8: Integration

- [ ] Optional: create SourceDocument from existing Book (migration path)
- [ ] Wire completionEffects or lineage metadata when minting CustomBar

## Phase 9: Tests

- [ ] Create src/actions/__tests__/source-ingestion.test.ts
- [ ] Test: source document creation from upload
- [ ] Test: source excerpt creation from parsed document
- [ ] Test: candidate generation from excerpt
- [ ] Test: metabolizability classification persistence
- [ ] Test: extension prompt generation
- [ ] Test: quest seed generation
- [ ] Test: lineage edge creation across transformations
- [ ] Test: candidate approval and minting to BAR
- [ ] Test: candidate saved as extension prompt instead of BAR
- [ ] Test: rejected candidate remains traceable
- [ ] Test: analysis profile selection changes behavior or selection path
- [ ] Test: deftness hooks are called at expected pipeline points
- [ ] Test: lineage integrity preserved after minting
- [ ] Test: source metadata preserved on derived artifacts
- [ ] Test: status transitions (if async jobs used)

## Phase 10: Analysis Profiles

- [ ] Implement GET /api/source-analysis-profiles (return SOURCE_ANALYSIS_PROFILES)
- [ ] Add profile selector UI to SourceUploadForm
- [ ] Wire profile selection into analysis service (genre-aware prompts)

## Verification Quest

- [ ] Add cert-source-ingestion-v1 to seed script (or manual verification steps)
- [ ] Run npm run build and npm run check

## Backlog

- [ ] Add to BACKLOG.md (already done: SI 40.14)
- [ ] Create .specify/backlog/prompts/source-ingestion-bar-candidate-pipeline.md (already done)
