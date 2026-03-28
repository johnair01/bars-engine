# Spec: Library-conditioned Game Master generation

## Purpose

When **Game Master** agents (six faces) generate campaign passages, they should be able to **ground** output in **authoritative excerpts** from **Books** (`Book.extractedText`) and **Quest Library** threads—so stewards can ingest reference texts (prep guides, CC-licensed toolkits) and have runtime generation **cite or stay silent** instead of inventing unrelated rules.

**Problem:** [Book-to-quest-library](../book-to-quest-library/spec.md) turns long texts into **pullable** library quests, but **Python GM generation** (`backend/app/routes/agents.py` — `_generate_slot`, `generate_passage`) only receives **kernel, domain, Kotter, `campaign_ref`, slot**. No retrieval path means agents cannot **leverage** the same corpus during **passage** synthesis—breaking the “train GM agents on the library” loop.

**Practice:** Spec kit first, API-first (extend generation contracts before UI). Deterministic retrieval + bounded excerpts before model calls; **cite-or-silence** policy in system prompts. Deftness: ship **Phase A** (optional request fields + prompt policy + keyword/TOC chunk match) before **Phase B** (embeddings / persisted binding on `Instance`).

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Grounding source** | **Primary:** `Book.extractedText` chunks aligned with [`book-chunker`](../../../src/lib/book-chunker.ts) (consistency with `book-analyze.ts`). **Secondary:** optional pinned `QuestThread` / `CustomBar` excerpts when thread ids passed. |
| **Retrieval v1** | **Keyword + optional metadata tags** over chunk index (no new vector DB in Phase A). Phase B may add embeddings or reuse existing AI cache patterns. |
| **Cite-or-silence** | Model may use **only** text in `reference_excerpts[]` + **kernel** + **slot contract**; if no relevant chunk, generate **generic BARs-voice** prose—**no** invented stat blocks, spell names, or long quotes from copyrighted sources not in context. |
| **Schema (Phase A)** | **None required** — all inputs via API body / MCP tool args. **Phase B (optional):** `Instance.librarySourceBookIds` JSON or `libraryBinding` JSON for default sources per campaign. |
| **Scope** | **Passage / slot generation** first (`generate_passage`, campaign deck slots). **Out of scope v1:** Rewriting all Sage routing; full RAG for `sage_consult` MCP (follow-up). |
| **Translation pedagogy** | Steward-facing **L1–L4 mapping** (atoms → library; procedures → CYOA/hub; framing → onboarding; spine → Instance/Kotter) lives in **docs or wiki**; this spec defines **machine contract** only. Reference: Lazy-GM-style single-file prep docs as **example** use case—not a license to paste proprietary text. |

## Conceptual Model

| WHO | WHAT | WHERE | Energy / throughput |
|-----|------|-------|---------------------|
| **Steward / admin** | Bind `bookId`(s), tags (`strong_start`, `safety`, `generator_table`) to generation requests | Admin or API caller | Chooses **what** the GM may cite |
| **GM agents (six faces)** | Synthesize **passage text** conditioned on **retrieved chunks** | FastAPI `/api/agents/*`, MCP `architect_*` family when extended | **OpenAI** tokens; bounded excerpt length |
| **Player** | Experiences **coherent** campaign prose aligned to **published** library | Hub / spoke CYOA, generated slots | Reads output only (no direct retrieval UI in v1) |

```text
Book.extractedText  →  chunk index (same family as book-analyze)
                           ↓
              retrieval_query (domain + kotter + face + slot + tags)
                           ↓
              reference_excerpts[]  →  GM system prompt section
                           ↓
              passage output (cite-or-silence)
```

## API Contracts (API-First)

### extend: `GeneratePassageRequest` / `_generate_slot` inputs

**Input** (additive fields; all optional for backward compatibility):

```ts
type LibraryConditioningInput = {
  /** Book ids to search (Phase A: load extractedText from DB by id). */
  sourceBookIds?: string[]
  /** Optional library thread ids — derive text from linked CustomBars / thread summary when implemented. */
  sourceThreadIds?: string[]
  /** Filter chunks e.g. strong_start | safety | clue | generator | kotter_N */
  libraryTags?: string[]
  /** Max total characters of excerpts injected (hard cap, e.g. 6000). */
  maxExcerptChars?: number
}
```

**Output:** Unchanged passage text shape; **optional** `debug.libraryChunkIds?: string[]` behind admin flag or `NODE_ENV` for QA.

- **Route Handler:** `POST` existing `/api/agents/generate-passage` (and siblings used by deck generation) accept the additive JSON fields.
- **MCP:** When MCP tools wrap generation, accept parallel optional args or a single `library_conditioning_json` string.

### `retrieveLibraryExcerpts` (internal module)

**Input:** `{ sourceBookIds, libraryTags, queryText, maxExcerptChars }`  
**Output:** `{ excerpts: { id: string; bookId: string; text: string; score?: number }[] }`

- **Implementation:** Python module under `backend/app/` (e.g. `library_retrieval.py`) calling shared chunking logic or porting chunk boundaries from a documented algorithm matching `book-chunker` (or HTTP to internal helper if duplication is unacceptable—document tradeoff in plan).

## User Stories

### P1: Steward — grounded strong start

**As a** campaign steward, **I want** to pass a **Book** id when generating a hub-adjacent passage, **so that** strong-start tables from my ingested prep doc inform the prose without copying whole chapters.

**Acceptance:** With `sourceBookIds` set and book analyzed/extracted, generated passage **either** echoes a retrievable idea from an injected excerpt **or** stays generic; **spot check** no 5e CR tables unless present in excerpts.

### P2: Developer — regression safety

**As a** developer, **I want** **golden traces** (prompt + excerpts + output), **so that** prompt changes do not reintroduce hallucinated rules.

**Acceptance:** Fixture file(s) under `backend/tests/` or `tests/fixtures/` with at least **3** pairs; CI or `make test` step documented in tasks.

### P3: Admin — optional Instance default (Phase B)

**As an** admin, **I want** to set **default library books** on an `Instance`, **so that** I do not pass ids on every generation call.

**Acceptance:** Deferred to Phase B; requires **Persisted data & Prisma** section update + migration.

## Functional Requirements

### Phase A — Contract + retrieval + prompts

- **FR1:** Extend generate-passage (and `_generate_slot` pipeline) to accept `LibraryConditioningInput` optional fields.
- **FR2:** Implement `retrieveLibraryExcerpts` with keyword/tag scoring over chunks; enforce `maxExcerptChars`.
- **FR3:** Inject a fixed **system prompt section** `LIBRARY_USE_POLICY` (cite-or-silence, no extra RPG rules, attribution when quoting verbatim from CC sources).
- **FR4:** When `OPENAI_API_KEY` missing, deterministic stubs **ignore** library excerpts or log “skipped” (document behavior).
- **FR5:** Document **chunk alignment** with `src/lib/book-chunker.ts` (link or shared spec) to avoid analyze vs retrieve mismatch.

### Phase B — Persistence + eval harness (optional)

- **FR6:** Optional `Instance` JSON field for default `sourceBookIds` + tags.
- **FR7:** Embeddings or better ranking (if cost-approved).
- **FR8:** Wire **narrative-quality** feedback tags (`library_grounding`, `hallucination_rpg`) in `.feedback/narrative_quality.jsonl` guidance.

## Non-Functional Requirements

- **Latency:** Retrieval + generation p95 budget (e.g. +500ms for keyword index on typical book)—document in plan.
- **Security:** Only **admin / server** may pass `sourceBookIds`; validate ids exist and caller is authorized (reuse patterns from book admin).
- **Copyright:** Policy text forbids pasting long third-party prose into prompts without rights; stewards use **CC** or **owned** texts.

## Persisted data & Prisma (required when schema changes)

> **Phase A:** No schema change — table below N/A; skip migration.

> **Phase B only:** If `Instance` gains `librarySourceBinding` (or similar) JSON:

| Check | Done |
|-------|------|
| Prisma field on `Instance` named in **Design Decisions** | |
| **`tasks.md`** includes: `npx prisma migrate dev --name add_instance_library_binding`, commit SQL | |
| **Verification**: `npm run db:sync`; `npm run check` | |
| **Human** reviewed `migration.sql` | |

## Scaling Checklist (when AI, upload, filesystem)

| Touchpoint | Mitigation |
|------------|------------|
| AI calls | Reuse model env vars; cap excerpt tokens; cache retrieval key `(bookIds, tags, query hash)` short TTL optional |
| Large books | Chunk cap per request; sample evenly if needed (mirror `book-analyze` sampling patterns) |
| MCP / API body | Document max `maxExcerptChars` default in OpenAPI or route docstring |

## Verification Quest

- **ID:** `cert-library-conditioned-gm-v1` (seed when implementation ships)
- **Steps:**
  1. Admin: ensure **Book** with `extractedText` exists (e.g. small test fixture book).
  2. Call **generate-passage** (or scripted equivalent) **with** `sourceBookIds` containing that book and a **tag** matching a known section.
  3. Confirm response prose **references** a distinctive phrase from injected chunk **or** is explicitly generic (no fake mechanic).
  4. Repeat **without** `sourceBookIds` — output must **not** claim the same distinctive grounding (baseline).
  5. (Optional) Run **golden trace** test in CI.
- Reference: [cyoa-certification-quests](../cyoa-certification-quests/)

## Dependencies

- [book-to-quest-library](../book-to-quest-library/spec.md) — `Book`, extraction, chunking semantics
- [game-master-template-content-generation](../game-master-template-content-generation/spec.md) — slot / face generation alignment
- [campaign-hub-spoke-landing-architecture](../campaign-hub-spoke-landing-architecture/spec.md) — campaign kernel / hub context
- [game-master-agents-cursor-integration](../game-master-agents-cursor-integration/spec.md) — MCP surface
- [narrative-quality](../../../.agents/skills/narrative-quality/SKILL.md) — optional feedback loop

## References

- `src/actions/book-analyze.ts`, `src/lib/book-chunker.ts`
- `backend/app/routes/agents.py` — `_generate_slot`, `generate_passage`, `_FACE_SYSTEM_PROMPTS`
- `backend/app/mcp_server.py` — `architect_analyze_chunk` (chunk analysis, not passage conditioning—related pattern)
- Prisma workflow: [.agents/skills/prisma-migration-discipline/SKILL.md](../../../.agents/skills/prisma-migration-discipline/SKILL.md)

## Training artifacts (for GM / eval)

| Artifact | Purpose |
|----------|---------|
| **Translation pair eval set** | JSONL: `source_excerpt` → expected BARs-safe behavior (allowed vs forbidden patterns) |
| **`LIBRARY_USE_POLICY` prompt block** | Static injection for all six faces when conditioning active |
| **Golden traces** | Saved request/response + excerpt ids for regression |

These are **deliverables** in `tasks.md` Phase A where marked.
