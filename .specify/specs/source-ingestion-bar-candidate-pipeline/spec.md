# Spec: Source Ingestion + BAR Candidate Pipeline

## Purpose

Design and implement a **Source Ingestion + BAR Candidate Pipeline** that allows PDFs and other long-form source documents to be analyzed as inspiration inputs for the BARS ecosystem. This is not generic document summarization—it supports a game loop where people consume books, essays, PDFs, extract inspiration, metabolize into BARs, and generate actionable quests.

**Problem**: The existing Book-to-Quest flow (Book → extract → analyze → CustomBar) flattens all passages into equal-status quests. It lacks provenance, metabolizability scoring, player extension prompts, curation, and deftness evaluation.

**Practice**: Deftness Development — spec kit first, API-first, provenance-first. Extends [Book-to-Quest Library](.specify/specs/book-to-quest-library/spec.md) with candidate curation, lineage, and genre-aware analysis. Implements [Deftness Development](.agents/skills/deftness-development/SKILL.md) and API-first discipline.

## Non-Negotiable Design Rules

| Rule | Decision |
|------|----------|
| Provenance first-class | Every candidate, prompt, quest seed preserves source lineage |
| Not every excerpt = BAR | Distinguish BAR candidate vs extension prompt vs lore vs reject |
| Player extension matters | Many excerpts become prompts for player-authored BARs, not canonical BARs |
| Deftness in pipeline | Named seams and event surfaces for deftness evaluation |
| Human curation in loop | Curation states and review flows; no blind auto-mint |
| Genre-aware analysis | Different prompts per document type (nonfiction, philosophy, fiction, etc.) |
| Ontology in code | Naming and structure communicate inspiration metabolism engine |

## Product Ontology

| Term | Meaning |
|------|---------|
| **Source Document** | Uploaded PDF or source artifact |
| **Source Excerpt** | Extracted passage/chunk from source |
| **BAR Candidate** | Scored possible BAR derived from excerpt |
| **Extension Prompt** | Player-facing prompt inviting BAR authorship |
| **Quest Seed** | Questable interpretation of a candidate or prompt |
| **Canonical BAR** | Approved/minted CustomBar from pipeline |
| **Lineage Edge** | Provenance relationship between entities |
| **Metabolizability** | Suitability for system-level transformation |
| **Deftness** | Quality of extraction, interpretation, curation, transformation |

## Relation to Existing Book System

- **Book** model (existing): PDF upload, extract, analyze → CustomBar. Stays for backward compatibility.
- **SourceDocument** (new): Broader model for new pipeline; can be created from Book or standalone upload.
- **SourceExcerpt** (new): Persisted chunks with page/section; replaces in-memory TextChunk for new pipeline.
- **BarCandidate** (new): Intermediate scored candidate before minting to CustomBar.
- **ExtensionPrompt** (new): Player-facing prompts.
- **QuestSeed** (new): Generated quest seeds.
- **SourceLineageEdge** (new): Provenance graph.

Migration path: Book can optionally be promoted to SourceDocument when entering the new pipeline. Existing Book flow continues unchanged.

## Required Domain Model

### SourceDocument

| Field | Type | Required |
|-------|------|----------|
| id | String | ✓ |
| title | String | ✓ |
| author | String? | |
| sourceType | String | PDF, EPUB, TEXT |
| fileUrl | String? | storage ref |
| uploadedByUserId | String | ✓ |
| documentKind | String | NONFICTION, PHILOSOPHY, FICTION, MEMOIR, PRACTICAL, CONTEMPLATIVE |
| status | String | UPLOADED, PARSED, ANALYZED, FAILED |
| pageCount | Int? | |
| bookId | String? | optional link to existing Book |
| createdAt, updatedAt | DateTime | ✓ |

### SourceExcerpt

| Field | Type | Required |
|-------|------|----------|
| id | String | ✓ |
| sourceDocumentId | String | ✓ |
| text | String | ✓ |
| excerptIndex | Int | ✓ |
| pageStart, pageEnd | Int? | |
| chapterTitle, sectionTitle | String? | |
| charStart, charEnd | Int? | |
| analysisStatus | String | PENDING, ANALYZED |
| createdAt, updatedAt | DateTime | ✓ |

### BarCandidate

| Field | Type | Required |
|-------|------|----------|
| id | String | ✓ |
| sourceExcerptId | String | ✓ |
| candidateType | String | INSIGHT, FRICTION, PRACTICE, WORLDVIEW, ARCHETYPE, RELATIONAL, MYTHIC |
| titleDraft | String | ✓ |
| bodyDraft | String | ✓ |
| metabolizabilityTier | String | SYSTEM_NATIVE, PROMPT_SEED, LORE_ARCHIVE, INSIGHT_RESIDUE |
| chargeScore, actionabilityScore, extendabilityScore, replayabilityScore, shareabilityScore, provenanceValueScore | Float? | 0-1 |
| recommendedDisposition | String | MINT_BAR, SAVE_AS_EXTENSION_PROMPT, SAVE_AS_LORE, REJECT |
| reviewStatus | String | PENDING, APPROVED, REJECTED, MINTED, ARCHIVED |
| createdAt, updatedAt | DateTime | ✓ |

### ExtensionPrompt

| Field | Type | Required |
|-------|------|----------|
| id | String | ✓ |
| sourceExcerptId | String? | |
| barCandidateId | String? | |
| promptTitle | String | ✓ |
| promptBody | String | ✓ |
| promptType | String | PLAYER_BAR_EXTENSION, REFLECTION, PRACTICE, QUEST_PROMPT, etc. |
| createdByUserId | String? | |
| status | String | ✓ |
| createdAt, updatedAt | DateTime | ✓ |

### QuestSeed

| Field | Type | Required |
|-------|------|----------|
| id | String | ✓ |
| sourceExcerptId | String? | |
| barCandidateId | String? | |
| extensionPromptId | String? | |
| title | String | ✓ |
| body | String | ✓ |
| questType | String? | |
| archetypeTags | String[] | JSON |
| nationTags | String[] | JSON |
| domainTags | String[] | JSON |
| status | String | ✓ |
| createdAt, updatedAt | DateTime | ✓ |

### SourceLineageEdge

| Field | Type | Required |
|-------|------|----------|
| id | String | ✓ |
| fromEntityType | String | |
| fromEntityId | String | |
| toEntityType | String | |
| toEntityId | String | |
| relationType | String | EXTRACTED_FROM, GENERATED_CANDIDATE_FROM, MINTED_BAR_FROM, etc. |
| createdAt | DateTime | ✓ |

## Pipeline Stages

### Stage 1 — Source document ingestion

- Store file reference; create SourceDocument
- Parse text; extract page-level data
- Create SourceExcerpt records
- Mark parse status

### Stage 2 — Excerpt analysis

- Classify candidate type
- Score metabolizability dimensions
- Determine recommended disposition
- Generate draft title/body for BAR candidate
- Optionally generate extension prompt
- Optionally generate quest seed(s)

### Stage 3 — Mapping layer

- Map to archetypes, nations, domains (tags or confidence-ranked)

### Stage 4 — Review / curation

- Curator-facing review states
- Approve, mint, save as prompt, save as lore, reject

### Stage 5 — Minting / transformation

- Approved → CustomBar, ExtensionPrompt, QuestSeed, lore
- All preserve lineage

## Metabolizability Framework

Score dimensions (0–1): chargeScore, actionabilityScore, extendabilityScore, replayabilityScore, shareabilityScore, provenanceValueScore.

Tiers: SYSTEM_NATIVE | PROMPT_SEED | LORE_ARCHIVE | INSIGHT_RESIDUE.

## Genre-Aware Profiles

Profile shapes analysis: NONFICTION, PHILOSOPHY, FICTION, MEMOIR, PRACTICAL, CONTEMPLATIVE. Each with heuristics for BAR types and priorities.

## API-First Development

Per [Deftness Development](.agents/skills/deftness-development/SKILL.md): **Contract before UI**. Define data shape and route/action signature before building UI that consumes it.

| Use | When | Response |
|-----|------|----------|
| **Route Handler** (`/api/*`) | External consumers, webhooks, non-React callers | `NextResponse.json()` |
| **Server Action** | Form submissions, React `useTransition`, internal flows | `{ success, error?, data? }` |

**Requirements for this feature:**

- Document method, path, request body shape, and response shape in plan or spec for each endpoint.
- Implement routes/actions first; UI consumes the contract.
- Add to `docs/` if exposing a public API.
- For uploads: use Vercel Blob (not filesystem); document `clientPayload` shape.
- For AI calls: use `generateObjectWithCache` where applicable; document env/model.

## Deftness Integration

Deftness is not decorative. Create real integration seams and explicit domain language. Per [Deftness Development](.agents/skills/deftness-development/SKILL.md).

### Ontology alignment

Deftness relies on integral theory—holocratic stewardship, generative movement, effective composting. The source ingestion pipeline embodies this: it composts source material into playable artifacts, stewards provenance, and moves generatively (excerpt → candidate → BAR/quest). Naming and structure should reflect that this is an inspiration metabolism engine.

### Required deftness hooks

Extension points (interface/stub implementations):

- `evaluateExcerptSelection(excerpt, context)` — Was the excerpt selected skillfully? Preserve signal without flattening.
- `evaluateCandidateGeneration(candidate, excerpt)` — Did the draft preserve living signal? Avoid generic advice sludge.
- `evaluateExtensionPrompt(prompt, context)` — Does the prompt invite genuine metabolization vs passive agreement?
- `evaluateQuestSeed(seed, context)` — Is it embodied, actionable, lineage-respecting?
- `evaluateCurationAction(action, context)` — Which candidates get minted, archived, or preserved as seeds?
- `evaluateLineageIntegrity(chain)` — Does the transformation chain preserve provenance?

### Event surfaces

Emit or define event surfaces for deftness reactions:

- `source_document.uploaded`, `source_document.parsed`
- `source_excerpt.analyzed`
- `bar_candidate.generated`, `bar_candidate.approved`, `bar_candidate.minted`
- `extension_prompt.generated`, `quest_seed.generated`
- `source_artifact.curated`

Usable for: deftness scoring, achievements, agent orchestration, analytics, player feedback.

### Process artifacts

Per Deftness: build artifacts the user can interface with **inside the game world**. For source ingestion: lineage preview in UI, curation logs, verification quests that document how decisions flowed. Prefer in-game surfaces over external docs.

### Scaling robustness

Before implementing, check [Deftness reference](.agents/skills/deftness-development/reference.md):

| Touchpoint | Risk | Mitigation |
|------------|------|-------------|
| Filesystem | ENOENT on Vercel | Use Blob for PDFs; no local write |
| AI calls | Rate limits, token cost | Cache; genre-aware prompts; chunk filtering |
| Request body | 4.5 MB limit | Client upload for large PDFs; Blob token flow |
| DB | Schema drift | Run `npm run db:sync` after schema changes |

### Optional persisted deftness fields

Where appropriate: `deftnessScore`, `deftnessNotes`, `deftnessEvaluationStatus`. Add only if they fit cleanly; do not overcomplicate v1.

## API / Route Expectations

Add or adapt API routes / procedures for:

| Area | Route/Action | Method | Purpose |
|------|--------------|--------|---------|
| Source documents | `POST /api/source-documents` or action | POST | upload source document |
| | `GET /api/source-documents` or action | GET | list source documents |
| | `GET /api/source-documents/[id]` | GET | get source document detail |
| | `POST /api/source-documents/[id]/parse` | POST | trigger parse |
| | `POST /api/source-documents/[id]/analyze` | POST | trigger analysis (async if job pattern exists) |
| | `GET /api/source-documents/[id]/status` | GET | get analysis status |
| Source excerpts | `GET /api/source-documents/[id]/excerpts` | GET | list excerpts for document |
| | `GET /api/source-excerpts/[id]` | GET | get excerpt detail |
| | `POST /api/source-excerpts/[id]/reanalyze` | POST | re-run analysis on excerpt |
| BAR candidates | `GET /api/source-documents/[id]/candidates` | GET | list candidates by document |
| | `GET /api/bar-candidates/[id]` | GET | get candidate detail |
| | `POST /api/bar-candidates/[id]/approve` | POST | approve candidate |
| | `POST /api/bar-candidates/[id]/reject` | POST | reject candidate |
| | `POST /api/bar-candidates/[id]/mint` | POST | mint BAR from candidate |
| | `POST /api/bar-candidates/[id]/save-as-prompt` | POST | save as extension prompt |
| | `POST /api/bar-candidates/[id]/save-as-lore` | POST | save as lore/archive |
| Extension prompts | `GET /api/extension-prompts` | GET | list by document or library |
| | `GET /api/extension-prompts/[id]` | GET | get prompt detail |
| | `POST /api/extension-prompts/[id]/create-bar` | POST | optionally create player BAR from prompt |
| Quest seeds | `GET /api/bar-candidates/[id]/quest-seeds` | GET | list quest seeds by candidate |
| | `GET /api/quest-seeds/[id]` | GET | get quest seed detail |
| | `POST /api/quest-seeds/[id]/promote` | POST | optionally promote into existing quest system |
| Analysis profiles | `GET /api/source-analysis-profiles` | GET | list available profiles |
| | (profile selection) | - | choose during upload or review |

## UI Expectations (Minimal v1)

**API-first**: UI is built after routes/actions and their contracts are defined. UI consumes the API; no UI-first implementation.

Do not redesign the whole app. Add the minimum viable UI needed to make source ingestion coherent.

1. **Source upload entry point** — A screen or modal where a user can: upload PDF, title it, optionally assign author, choose analysis profile / genre, choose target library if relevant.

2. **Source document detail view** — Must show: title, author, parse / analysis status, document metadata, candidate counts, prompt counts, quest seed counts.

3. **Candidate review view** — A curator can review excerpt-derived candidates and see: excerpt text, source page/chapter info, candidate classification, metabolizability scores, recommended disposition, draft BAR, extension prompt, quest seed preview; actions: approve, reject, mint, save as prompt, archive.

4. **Excerpt detail or expandable preview** — A user should be able to inspect the source excerpt that generated a candidate.

5. **Lineage preview** — At minimum, show a lightweight chain: Source Document → Excerpt → Candidate → BAR / Prompt / Quest Seed.

6. **Analysis profile selector** — On upload or analysis trigger, allow selecting: nonfiction, philosophy, fiction, memoir, practical, contemplative. If profiles are not yet dynamic, still build the UI and service seam.

## BAR / Quest Generation Expectations

For each viable candidate, the system should be able to generate at least:

- a draft BAR title
- a draft BAR body
- a player extension prompt
- a quest seed

Additionally, create support for generating variants or mappings by:

- **archetype** — Support future generation of quest templates from various archetypes.
- **nation** — Support future generation of nation-flavored quest variants.
- **domain** — Support future mapping into life domains used in the game.

This may be implemented as arrays of tags or richer typed suggestions. Do not fully solve all worldbuilding nuance in v1. Create the seams and data model so this can evolve cleanly.

## Migration / Compatibility Requirements

If the current app already has BARs, libraries, quests, and lineage systems:

- integrate with them rather than duplicating ontology
- connect minted BARs to existing BAR creation flow (CustomBar)
- connect quest seeds to existing quest models where appropriate
- reuse lineage abstractions if they already exist
- avoid parallel systems unless unavoidable

If no source ingestion entities currently exist:

- add them in a way that preserves future compatibility with EPUB, web article ingestion, and user notes

## Test Requirements

At minimum, add tests for:

- source document creation from upload
- source excerpt creation from parsed document
- candidate generation from excerpt
- metabolizability classification persistence
- extension prompt generation
- quest seed generation
- lineage edge creation across transformations
- candidate approval and minting to BAR
- candidate saved as extension prompt instead of BAR
- rejected candidate remains traceable
- analysis profile selection changes behavior or selection path
- deftness hooks are called at the expected pipeline points
- lineage integrity preserved after minting
- source metadata preserved on derived artifacts

If async jobs are used, also test status transitions.

## Implementation Constraints

- **Do not build a full auto-mint machine** — Human review must remain possible and structurally supported.
- **Do not reduce books to generic snippets** — Preserve enough context for actual meaning.
- **Do not lose provenance** — Every meaningful transformation must be traceable.
- **Do not make deftness decorative** — Create real integration seams and explicit domain language around it.
- **Do not force all sources into one extraction strategy** — Different kinds of texts need different analysis profiles.

## Style Guidance for Comments and Naming

Comments should be clear and ontologically useful.

**Good:**

- explain why not every excerpt becomes a canonical BAR
- explain why extension prompts matter
- explain why provenance is first-class
- explain why deftness belongs in the ingestion pipeline

**Bad:**

- vague helper comments
- generic "processes document data"
- lore-drenched fanfic comments
- overexplaining obvious code

The code should feel like a well-kept ledger of an inspiration metabolism engine.

## Dependencies

- [Book-to-Quest Library](.specify/specs/book-to-quest-library/spec.md)
- [Deftness Development](.agents/skills/deftness-development/SKILL.md)
- [AI Deftness Token Strategy](.specify/specs/ai-deftness-token-strategy/spec.md)

## References

- [src/actions/books.ts](src/actions/books.ts)
- [src/actions/book-analyze.ts](src/actions/book-analyze.ts)
- [src/lib/book-chunker.ts](src/lib/book-chunker.ts)
- [prisma/schema.prisma](prisma/schema.prisma)
