# Tap the Vein + 321 → bars-engine Port

**Date:** 2026-06-20
**Status:** DRAFT — needs user sign-off on Phase ordering
**Owner:** agent
**Target audience:** a Claude Code session that picks this up to implement
**Related specs:**
- `docs/plans/321-to-bar-pipeline-spec.md` (existing — covers the 321→BAR draft translator; we build on top, not over)
- `docs/plans/tap-the-vein-barseed-distillation-spec.md` (existing — covers the LLM extract step; we adopt and adapt)
- `bars-engine/src/lib/quest-grammar/map321ToBarDraft.ts` (existing — already 90% done; we extend, not rewrite)

---

## 0. Why this spec exists

The Tap the Vein (TTV) daily free-write practice and the 321 Shadow process are currently the most mature pieces of product on zo.computer (zo.space routes). They are also **inaccessible to bars-engine users**. You want both ports, plus a deck-based 321 surface, living in bars-engine as first-class features. zo.space stays up and remains your personal practice surface.

This spec is the **handoff package** for a Claude Code session to build that port in bars-engine. The decisions below are based on the eight user decisions captured in the 2026-06-20 conversation (see § Decisions Captured).

---

## 1. Decisions Captured (2026-06-20)

| # | Decision | Rationale |
|---|---|---|
| 1 | **Full port, no bridge.** All new TTV + 321 data lives in bars-engine Prisma tables. zo.space routes stay live for your personal practice. | Two parallel surfaces, same feature, different audiences. No data migration from vault. |
| 2 | **Drop the editing-manuscript 321 skin.** Manuscript flow is personal; users don't need it. | Keeps the public 321 surface small. |
| 3 | **zo.space routes NOT removed.** They coexist with the bars-engine surface. | You continue personal practice on zo.computer. |
| 4 | **321 deck surface (52 cards) ships in bars-engine.** Cards are 6 GM-face-backed prompts the player draws before each unpacking step. | Optional invocation — players can run 321 without the deck, but the deck is the recommended path. |
| 5 | **6 GM-face distillation retained as a 321-side helper.** Available as a separate inline action inside 321 (not a default); the LLM-assisted phrase extractor is a separate, optional mechanism. | Matches the original zo.space UX; keeps 321 editable/manual by default. |
| 6 | **TTV → BAR is a new primary flow.** Player dumps free-write, gets 3–5 BAR candidates, picks which to save, optional free-write provenance attached. | Reframes TTV's job: "Take the lead of the journaling, kick out gems." |
| 7 | **Provenance schema = Shape 1.** `TtvEntry` is a separate row + table. `Bar` rows have an optional `ttvEntryId` FK. Free-write is parent, BAR is child. | TtvEntry persists regardless of whether the player saves any BARs. |
| 8 | **LLM pass = Mix.** Output is 1–2 Extracts (honor actual words) + 2–3 Forks (where this could go). | Quality comes from honoring the writing first, opening it second. |
| 9 | **Word count policy.** 750-word minimum for the daily-practice TTV. Lower floor (or zero) for ad-hoc TTV/BAR creation from text. | "Good BARs come from long-form." Players can drop off the daily practice and still create BARs through other inputs. |
| 10 | **Daily LLM budget = $5/day.** 1,000 daily users × 1 call/user/day = $0.005/call ceiling. | Sets a hard ceiling on the LLM cost model. |
| 11 | **Deterministic strategy = A + C.** A: deterministic fallback when LLM budget exhausted. C: deterministic extracts are captured as a labeled training-set for a future custom model. | Both are research threads, not a single fallback. |

---

## 2. What is in scope vs. out of scope

### In scope (this spec)
- New TTV page + APIs in bars-engine (`/bars/tap-the-vein`, `/api/tap-the-vein/*`)
- New 321 surface in bars-engine (`/bars/321`, `/api/321/*`) **without** the manuscript flow
- 321 deck surface in bars-engine (`/bars/321-deck`, `/api/321-deck/*`)
- TtvEntry Prisma model + provenance FK on Bar
- LLM distillation endpoint with budget guard
- Cost attribution hook (writes to bars-engine's LLM ledger, not Council's)
- One-time seed: import the existing 52-card deck from `The Library/The Library/03 BARs/321-deck/core-deck.json` into the new Prisma deck table

### Out of scope (deferred)
- LLM provider selection (research memo required, see § 7)
- Custom-model fine-tuning from deterministic extracts (research thread, see § 7)
- Migration of your existing vault 321 files (intentional — your zo.computer data stays where you wrote it)
- Migration of your existing TTV entries on zo.space (same — your practice stays put)
- Cost guard refactor to share infrastructure with Council tooling (these are independent)
- Morning pages lineage surface (separate design thread)

---

## 3. High-level architecture

### 3.1 Pages
```
/bars/tap-the-vein        — TTV daily free-write surface (replaces /api/tap-the-vein/* logic for bars users)
/bars/321                 — 321 unpacking surface (stateless, no manuscript flow)
/bars/321-deck            — Deck draw + recent cards (no full management UI; that lives in admin)
/bars/tap-the-vein/review — Candidate review + multi-select save
```

### 3.2 APIs
```
POST   /api/tap-the-vein/entry          — save free-write (creates TtvEntry)
GET    /api/tap-the-vein/entry/:id      — fetch entry
POST   /api/tap-the-vein/distill        — run LLM (or fallback) on entry, returns candidates
POST   /api/tap-the-vein/review         — save selected candidates as BARs (Shape 1 FK)
GET    /api/tap-the-vein/recent         — list player's recent TtvEntries

POST   /api/321/session                 — start 321 (with optional deck-card FKs)
PATCH  /api/321/session/:id             — write belief/3rd/2nd/1st as user completes steps
POST   /api/321/session/:id/finalize    — finalize 321, returns BarDraft
POST   /api/321/session/:id/gm-distill  — optional GM-face distill (5)
GET    /api/321/assist                  — optional LLM phrase extractor (per move, not inline)

GET    /api/321-deck/cards              — list deck (paginated)
POST   /api/321-deck/draw               — draw N random cards (player context: current step)
```

### 3.3 Prisma additions
```prisma
model TtvEntry {
  id              String   @id @default(cuid())
  playerId        String
  freewrite       String   // raw free-write (optional provenance source)
  wordCount       Int
  status          String   // "draft" | "distilled" | "saved" | "discarded"
  distillResult   Json?    // { extracts: [...], forks: [...], model: "...", usedFallback: bool }
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  bars            Bar[]    // 1..n, provenance FK (Shape 1)
  player          Player   @relation(fields: [playerId], references: [id])
  @@index([playerId, createdAt])
  @@map("ttv_entries")
}

model Bar {
  // ... existing fields ...
  ttvEntryId     String?
  ttvEntry       TtvEntry? @relation(fields: [ttvEntryId], references: [id])
}

model DeckCard {
  id              String   @id @default(cuid())
  deckId          String
  step            String   // "belief" | "third-person" | "second-person" | "first-person" | "any"
  prompt          String
  gmFace          String?  // which face the prompt maps to (architect, regent, challenger, diplomat, shaman, sage)
  position        Int      // sort order
  archived        Boolean  @default(false)
  deck            Deck     @relation(fields: [deckId], references: [id])
  @@index([deckId, step, position])
  @@map("deck_cards")
}

model Deck {
  id          String   @id @default(cuid())
  slug        String   @unique  // "321-core"
  title       String
  description String?
  createdAt   DateTime @default(now())
  cards       DeckCard[]
  @@map("decks")
}
```

`Bar` already exists. The migration adds the optional `ttvEntryId` FK.

### 3.4 LLM call surface
```
/api/tap-the-vein/distill
  Input:  { entryId: string, freewrite: string, wordCount: int }
  Output: { extracts: Extract[], forks: Fork[], model: string, usedFallback: bool }

  Extract: { id, body, sourceQuote: string }   // 1..2, the actual words
  Fork:    { id, body, framing: string }        // 2..3, where this could go

  Provider:
    1. Read budget from runtime/llm_budget.json (config, not source)
    2. If budget remaining: call LLM with prompt pack + output_format schema
    3. If budget exhausted OR LLM errors: run deterministic fallback (§ 5)
    4. Return candidates with `usedFallback` flag and `model` field
```

### 3.5 Cost attribution
bars-engine owns its own LLM ledger, independent of Council tooling:
- File: `bars-engine/runtime/llm_ledger.jsonl`
- Schema: `{ timestamp, model, input_tokens, output_tokens, cost_usd, task_type, player_id, route }`
- Written by `/api/tap-the-vein/distill` on every call (success or fallback).
- Watched by `bars-engine/scripts/check_llm_budget.sh` (Phase 2).

The Council's `check_model_quota.sh` and `MODEL_QUOTA.md` are NOT the production gate. The two systems serve different masters and have different cost models.

---

## 4. Phase ordering (recommended)

**Do NOT build all of this at once.** Phase 1 is the smallest thing that proves the seam. Phases 2+ only start after Phase 1 has L1–L4 verification (per the AGENTS.md Verification Gate rule).

### Phase 1 — Foundation (ships first)
**Goal:** The TTV → BAR flow works end-to-end with a stubbed LLM. No real LLM. No deck. 321 page is a stub.

Scope:
1. `TtvEntry` Prisma model + migration
2. `Bar.ttvEntryId` FK + migration
3. `/bars/tap-the-vein` page (basic free-write + count + submit)
4. `/api/tap-the-vein/entry` POST (create entry, no distillation yet)
5. `/bars/tap-the-vein/review` page (lists one stub candidate — title from first 80 chars)
6. `/api/tap-the-vein/review` POST (creates one Bar, attaches FK)
7. Cost attribution stub: write to `llm_ledger.jsonl` even when LLM is stubbed (so the schema is exercised)

NOT in Phase 1: real LLM, deck, 321 surface, deterministic fallback, budget guard.

Verification (per AGENTS.md L1–L4):
- L1: get_space_errors returns 0; routes return 200
- L2: POST /api/tap-the-vein/entry with valid body → 200 + entry row; invalid → 400
- L3: GET the entry back; POST /api/tap-the-vein/review creates a Bar with ttvEntryId
- L4: browser flow: write → submit → review → save → land on /bars/:id

### Phase 2 — LLM distillation + budget
**Goal:** The LLM pass works under a $5/day budget. Deterministic fallback is in place.

Scope:
1. Research memo (see § 7) — finished BEFORE this code is written
2. LLM provider integration (whatever the research memo recommends)
3. `/api/tap-the-vein/distill` (real LLM + fallback)
4. `bars-engine/scripts/check_llm_budget.sh` (read ledger, gate calls at 80% / stop at 95%)
5. Candidate list shape: 1–2 Extracts + 2–3 Forks
6. Update `/bars/tap-the-vein/review` to show real candidates with provenance labels

Verification:
- L1–L3 with a real LLM call (use a sandbox key with $1 limit)
- L4: write 750 words → get 4–5 candidates → save 2 → both Bars have working FK back to TtvEntry
- Budget: run 100 simulated calls, confirm guard engages at 80% / hard-stops at 95%

### Phase 3 — 321 surface + deck
**Goal:** 321 works in bars-engine as a stateless flow, with the deck as optional invocation.

Scope:
1. `Deck` + `DeckCard` Prisma models + migration
2. Seed: import `The Library/The Library/03 BARs/321-deck/core-deck.json` into `deck_cards` (slug: "321-core")
3. `/api/321-deck/cards` GET, `/api/321-deck/draw` POST
4. `/bars/321-deck` page (deck management — read-only this phase; full management deferred to admin)
5. `/bars/321` page (4-step unpacking, optional deck card draws per step, optional 6-face distill as separate button)
6. `/api/321/session` POST + PATCH + finalize
7. `/api/321/assist` GET (LLM phrase extractor, opt-in per step)

Verification:
- L1–L3: 321 round-trip produces a BarDraftFrom321 via the existing `deriveBarDraftFrom321` helper
- L4: end-to-end: draw cards → complete 4 steps → finalize → save as Bar → land on /bars/:id
- LLM call: confirm 321 assist hits the same budget guard as TTV

### Phase 4 — Polish + research threads
**Goal:** Make the surface feel finished, and run the A + C deterministic research.

Scope:
1. Move 321-deck management to admin
2. Recurring TTV (`/bars/tap-the-vein/streak` page)
3. Deterministic A: production-grade fallback (research thread, see § 7)
4. Deterministic C: deterministic extract capture as labeled training set (research thread, see § 7)
5. LLM provider swap path (so we can change providers without rewriting the route)

---

## 5. Deterministic fallback (Phase 2)

When the LLM is exhausted or errors, the deterministic fallback runs. The fallback is **not** a "best effort" of the LLM — it's a separate, designed-down version of the same job. Acceptance criteria:

1. Returns 1–3 candidates total (Mix strategy preserved, fewer)
2. Each candidate is a sentence or short paragraph
3. Source quotes from the free-write are preserved (Extract behavior)
4. Forks are produced by a small set of rules (e.g. "If the free-write contains 'I want' / 'I need' / 'I should', surface that as a fork")
5. Cost: $0.00 per call
6. Latency: < 200ms p99
7. Output is labeled `usedFallback: true` in the distill result

A + C research thread note: every deterministic extract IS saved as a labeled training example so we can later fine-tune a model. The training-set format is documented in the research memo (§ 7) — not decided here.

---

## 6. Data flow (the actual seam)

```
Player → /bars/tap-the-vein
  └─ POST /api/tap-the-vein/entry { freewrite }
     └─ TtvEntry created (wordCount computed, status="draft")
  └─ POST /api/tap-the-vein/distill { entryId }
     └─ check_llm_budget.sh → if ok, call LLM
     └─ if not ok OR error, run deterministic fallback
     └─ update TtvEntry.status="distilled", distillResult={...}
     └─ write to llm_ledger.jsonl
  └─ /bars/tap-the-vein/review shows candidates
  └─ Player selects 1..n
  └─ POST /api/tap-the-vein/review { entryId, selectedIds: [...] }
     └─ For each selectedId: create Bar (existing createCustomBar action) with ttvEntryId FK
     └─ update TtvEntry.status="saved"
  └─ Redirect to /bars/:id for first saved BAR
```

If the player closes the review page without saving anything, TtvEntry.status stays "distilled" and can be revisited (Phase 4). It is never deleted.

---

## 7. Research memos required (parallel work, not this spec)

These are not implementation tasks. They are research tasks that gate Phases 2 and 4 respectively.

### 7.1 LLM provider research (gates Phase 2)
**Open question:** What is the right LLM provider, given a $5/day budget, 1,000 daily users, and a Mix-shaped extract+forks job?
- Constraints: $0.005/call ceiling, deterministic JSON output, 750-word input
- Search vector: 3–4 providers compared on cost/quality/latency/reliability
- Decision criteria: cost per 1k tokens, batch support, structured output, budget caps
- Output: research memo + recommendation, **no code changes**
- Source: `COUNCIL/research/2026-06-20-llm-provider-memo.md`

### 7.2 Deterministic research (gates Phase 4)
**Open question:** What does "deterministic" mean in this context, and what does it take to fine-tune a custom model from the training set?
- Research A: production-grade deterministic extractors (TF-IDF, sentence-transformer + clustering, etc.)
- Research C: minimum viable fine-tuning pipeline from labeled extracts to a small model
- Output: research memo + recommendation
- Source: `COUNCIL/research/2026-06-20-deterministic-memo.md`

---

## 8. Files to create (Phase 1)

If you are a Claude Code session picking this up, the Phase 1 file list is:

```
prisma/migrations/{timestamp}_ttv_entries/migration.sql
prisma/schema.prisma                                  (add TtvEntry, Bar.ttvEntryId)
src/app/bars/tap-the-vein/page.tsx
src/app/bars/tap-the-vein/review/page.tsx
src/app/api/tap-the-vein/entry/route.ts               (POST + GET by id)
src/app/api/tap-the-vein/review/route.ts              (POST)
src/app/api/tap-the-vein/recent/route.ts              (GET)
src/actions/tap-the-vein.ts                           (server actions)
src/lib/tap-the-vein/types.ts                         (TtvEntry, Extract, Fork types)
src/lib/tap-the-vein/wordCount.ts                     (server word counter)
src/lib/llm-ledger.ts                                 (write/read llm_ledger.jsonl)
runtime/llm_ledger.jsonl                              (init empty, gitignored)
```

Plus a smoke test (per AGENTS.md L1–L4):
```
src/__tests__/tap-the-vein-smoke.ts                   (verify the full flow)
```

---

## 9. What is explicitly NOT this spec

These belong in **other** specs. Calling them out so they don't get conflated:

- **Council quota guard refactor** — separate spec. The two systems don't share infrastructure.
- **zo.space route migration** — out of scope. The user is keeping zo.space live for personal practice.
- **Vault 321 file migration** — out of scope. User data on the vault stays on the vault.
- **Morning pages lineage surface** — separate design thread.
- **Admin deck management UI** — Phase 4.
- **Onboarding flow that points to TTV** — separate product spec.

---

## 10. Open questions for the user (need answers before Phase 1 starts)

1. **Phase 1 verification:** Do you want L1–L4 (full battery) before Phase 2 starts, or is L1–L2 enough for a foundation phase?
2. **Stub candidate body in Phase 1:** When the LLM is stubbed, do you want the "candidate" to be a literal title (first 80 chars) or an actual sentence from the free-write?
3. **Free-write discard:** If a player creates a TtvEntry and never saves a BAR, is that TtvEntry permanent (you can revisit) or does it get cleaned up after N days? (Affects the "stats" UX in Phase 4.)
4. **Free-write minimum for ad-hoc TTV:** 750 words is the daily practice floor. What is the floor for ad-hoc TTV/BAR creation from text? (Options: 0, 50, 200.)
5. **Player id source:** bars-engine already uses a cookie-based `bars_player_id` for unauth'd players. Use the same mechanism, or require login for TTV/321?
6. **Deterministic fallback rules (Phase 2):** Are the rules in § 5 good as a starting point, or do you want to spec the rules up front?

---

## 11. Acceptance criteria (Phase 1 only — for the implementer)

- [ ] TtvEntry model migrated, Bar.ttvEntryId migrated
- [ ] `/bars/tap-the-vein` accepts free-write, computes word count, displays running count
- [ ] POST `/api/tap-the-vein/entry` returns 200 with `{ entryId, wordCount }`
- [ ] POST `/api/tap-the-vein/review` with `{ entryId, candidates: [{title, body}] }` creates Bars with FK
- [ ] LLM ledger is written to on every call, including the stub
- [ ] Smoke test passes (round-trip: write → save → Bar visible at /bars/:id with provenance link)
- [ ] No edits to existing 321 ingest path (`/api/321/ingest`) — that stays as-is
- [ ] No new dependencies added to package.json
- [ ] No changes to zo.space routes

**Stop here and ask the user before Phase 2.** Don't proceed without verification.

### 3.4 LLM distillation

**Endpoint:** `POST /api/tap-the-vein/distill`

**Inputs:**
- `entryId` (TtvEntry.id)
- `mode` (optional, default `"mix"`) — `"extract" | "fork" | "mix"`. Phase 1 ships `"mix"` only.

**Flow:**
1. Read `TtvEntry` and verify player ownership.
2. **Cost guard:** read `runtime/bars_llm_ledger.jsonl` (independent of Council), check `dailyBudgetUsd` (default $5), abort with `429` if cap would be exceeded.
3. **Provider call:** call LLM with a structured prompt (see § 3.5).
4. **On success:** write result to `TtvEntry.distillResult`, append ledger row, return candidates.
5. **On budget-exceeded / provider failure:** run the **deterministic fallback** (see § 4), mark `distillResult.usedFallback = true`, return candidates. The fallback is also captured as labeled training data (path C).

**Cost guard notes:**
- New file: `runtime/bars_llm_ledger.jsonl` (bars-engine local file, NOT a Prisma table — append-only, easy to trim).
- New file: `runtime/BARS_LLM_QUOTA.md` (JSON policy; mirror of Council's `MODEL_QUOTA.md` shape, separate concerns).
- New script: `scripts/bars-llm-quota.sh` (mirrors `check_model_quota.sh` shape; reads its own ledger).
- **Do NOT** reuse Council's `model_ledger.jsonl` or `check_model_quota.sh`. Different budget, different org, different alerting path. Future refactor can unify if needed.

### 3.5 LLM prompt contract (Mix mode)

```
SYSTEM:
You are a journal collaborator. The user wrote a free-write about charged
feelings. Your job: lead the journaling, surface the gems, do not overwrite
their voice.

USER:
<freewrite>

OUTPUT (JSON):
{
  "extracts": [
    {
      "title": "string (≤ 60 chars, in user's voice)",
      "body": "string (≤ 280 chars, lifted from the writing or its own words)",
      "evidence": "string (≤ 200 chars — the verbatim line this came from)"
    }
  ],
  "forks": [
    {
      "title": "string (≤ 60 chars)",
      "body": "string (≤ 280 chars, exploratory — where this could go)",
      "rationale": "string (≤ 200 chars, why this fork)"
    }
  ]
}

Rules:
- 1-2 extracts, 2-3 forks. Total 3-5 candidates.
- Extracts must honor the user's actual words. evidence field is required.
- Forks may invent language. Mark them clearly via shape; titles can use
  verbs that signal forward motion (Try, Ask, Build, Notice).
- Never invent facts the user did not write.
- Never return fewer than 3 total candidates unless free-write is < 100 words.
```

**Output validation:** server-side JSON parse; reject and fall back to deterministic if either array is empty or total < 3.

---

## 4. Deterministic fallback (path A, also feeds path C)

A two-pass rule-based extractor. Not a real LLM. Quality floor, not ceiling.

**Pass 1 — sentence segmentation + signal detection**
- Split free-write into sentences (simple `. ! ?` + newline).
- For each sentence, score signals: first-person ("I"), emotion words (look up against a small EA-aware lexicon), question marks (unresolved charge), length (longer = more weight).
- Keep top 30% by signal score.

**Pass 2 — extract & fork synthesis**
- For each kept sentence, build a candidate:
  - `title` = first 6 words, capitalized.
  - `body` = the sentence, possibly truncated.
  - `kind` = `"extract"` (echo) or `"fork"` (added `<where this could go>` suffix from sentence-ending verb).
- Re-rank by signal score, pick top 1 extract + 2 forks = 3 candidates.

**Output validation:** always succeeds. Empty free-write returns a single synthetic candidate: `{ title: "Empty write — start anywhere", body: "...", kind: "fork", rationale: "fallback path" }`.

**Training-set capture (path C):**
- Every fallback run appends a row to `TtvEntry.distillResult` with `usedFallback: true`.
- A separate scheduled job (out of scope here) batches these and emits a JSONL file tagged for future model fine-tuning. The shape is intentionally close to the LLM prompt contract so the file is a clean training set.

---

## 5. Phased build plan

### Phase 1 — TTV + provenance + cost guard (the must-haves)

Goal: player can do TTV in bars-engine, get BARs, and we don't blow the LLM budget.

1. **Prisma migration:** add `TtvEntry`, `Deck`, `DeckCard`. Add `ttvEntryId` FK to `Bar`.
2. **Seed deck:** one-time import of `The Library/The Library/03 BARs/321-deck/core-deck.json` into the new `Deck`/`DeckCard` tables. Read-only in this phase.
3. **`/api/tap-the-vein/entry`** (POST, GET) — create + read.
4. **`/api/tap-the-vein/distill`** — wire LLM call + deterministic fallback + ledger write + budget guard. **Mix mode only.**
5. **`/api/tap-the-vein/review`** — multi-select save; creates Bar rows with `ttvEntryId` FK. Free-write attaches only if user checks "keep as provenance."
6. **`/bars/tap-the-vein`** page + `/bars/tap-the-vein/review` page (React, two-step UX).
7. **Cost guard:** `runtime/bars_llm_ledger.jsonl`, `runtime/BARS_LLM_QUOTA.md`, `scripts/bars-llm-quota.sh`. **Hard stop at $5/day**, SMS alert at 80% via existing Zo channel (configurable).
8. **Deterministic fallback unit tests** (extracts/forks at 1k/2.5k/5k/10k words; empty write; mixed-language edge case skipped).
9. **LLM call tests** with mock provider (no real spend in CI).
10. **Smoke test:** end-to-end TTV → distill → save 1 BAR round-trip on the dev environment.

**Out of Phase 1:** the 321 unpacking surface, the deck draw UX, the GM-face distill helper, the LLM provider research, the custom-model thread.

### Phase 2 — 321 + deck + 6-face helper (after Phase 1 ships)

1. **`/api/321/session`** (start + patch + finalize) — uses the existing `map321ToBarDraft.ts`; **no manuscript flow**.
2. **`/bars/321`** page — 4-step wizard that mirrors zo.space's UX minus the manuscript panel.
3. **`/api/321-deck/draw`** + **`/bars/321-deck`** page — random draw by current step (belief/3rd/2nd/1st).
4. **`/api/321/session/:id/gm-distill`** — 6-face distill as an optional button on the finalize screen. Reuses the existing `gm-casting-ritual` shape.
5. **`/api/321/assist`** — per-move phrase extractor (NOT inline; players explicitly invoke). Capped at the same $5/day budget.
6. **Smoke test:** full 321 round-trip with deck draws.

### Phase 3 — Research + custom-model thread (out of scope for the build)

1. **Provider research memo** (delivered as a separate `.md`, not a build step). Compares hosted LLM costs, structured-output reliability, and rate limits. Recommendation: pick the cheapest reliable provider that can do structured JSON at ≤$0.005/call at 1k calls/day.
2. **Custom-model training pipeline** (long-running, separate spec). Uses the deterministic-fallback-tagged `distillResult` rows as training data. Not in this spec.

---

## 6. Files to create / modify

### New (bars-engine)
- `prisma/migrations/<ts>_ttv_deck/migration.sql`
- `prisma/seed-deck-321.ts` (one-time import; not part of `seed.ts` prod path)
- `src/app/bars/tap-the-vein/page.tsx` + `client.tsx`
- `src/app/bars/tap-the-vein/review/page.tsx` + `client.tsx`
- `src/app/bars/321/page.tsx` + `client.tsx` (Phase 2)
- `src/app/bars/321-deck/page.tsx` + `client.tsx` (Phase 2)
- `src/app/api/tap-the-vein/entry/route.ts`
- `src/app/api/tap-the-vein/distill/route.ts`
- `src/app/api/tap-the-vein/review/route.ts`
- `src/app/api/tap-the-vein/recent/route.ts`
- `src/app/api/321/session/route.ts` (Phase 2)
- `src/app/api/321/session/[id]/route.ts` (Phase 2)
- `src/app/api/321/session/[id]/finalize/route.ts` (Phase 2)
- `src/app/api/321/session/[id]/gm-distill/route.ts` (Phase 2)
- `src/app/api/321/assist/route.ts` (Phase 2)
- `src/app/api/321-deck/cards/route.ts` (Phase 2)
- `src/app/api/321-deck/draw/route.ts` (Phase 2)
- `src/lib/llm/types.ts` (provider-agnostic LLM interface)
- `src/lib/llm/quota.ts` (read `runtime/bars_llm_ledger.jsonl`, enforce `BARS_LLM_QUOTA.md`)
- `src/lib/llm/prompts/ttv-mix.ts` (the prompt in § 3.5)
- `src/lib/llm/fallback/ttv-deterministic.ts` (§ 4)
- `src/lib/llm/fallback/__tests__/ttv-deterministic.test.ts`
- `src/lib/llm/__tests__/quota.test.ts`
- `runtime/bars_llm_ledger.jsonl` (empty; appended to)
- `runtime/BARS_LLM_QUOTA.md` (default $5/day, $4 alert, $5 hard stop)
- `scripts/bars-llm-quota.sh`

### New (workspace)
- `docs/plans/2026-06-20-tap-the-vein-321-port-to-bars-engine-spec.md` (this file)
- `docs/plans/2026-06-20-llm-provider-research-memo.md` (Phase 3 research output; placeholder for now)
- `COUNCIL/issues/2026-06-20-ttv-321-port-handoff.md` (the handoff memo for the Claude Code session)
- `COUNCIL/AGENT_BACKLOG.md` entry (per workspace rule: every spec gets a backlog entry)

### Modified (bars-engine)
- `prisma/schema.prisma` (add TtvEntry, Deck, DeckCard; add `ttvEntryId` to `Bar`)
- `src/actions/create-bar.ts` — accept optional `ttvEntryId` from form data
- `src/lib/quest-grammar/map321ToBarDraft.ts` — extend, do not rewrite (existing mapping is correct)

### NOT modified
- Any zo.space route
- Any Council infrastructure (COUNCIL/runtime/*, COUNCIL/scripts/check_model_quota.sh, etc.)
- Any manuscript file

---

## 7. Open research threads (Phase 3, not part of this build)

1. **LLM provider research.** Compare 3–4 providers on: (a) cost per call at $0.005 ceiling, (b) structured JSON reliability, (c) rate limits, (d) cold-start latency, (e) terms of service (no retention of free-write data). Output: `docs/plans/2026-06-20-llm-provider-research-memo.md`.
2. **Custom-model fine-tuning thread.** The deterministic-fallback outputs are captured intentionally as training data. Future work: emit a JSONL file, evaluate a small model, compare quality vs cost. This is a separate spec, separate sprint.
3. **Morning pages lineage surface.** You said the product copy should keep the lineage framing. That's a design question for the page hero + onboarding, not a spec question. Defer to a separate UI thread.

---

## 8. Verification gate (per AGENTS.md)

The workspace rule says: L1 (route integrity) + L2 (API contract) + L3 (round-trip + regression) + L4 (manual browser) before declaring any step or feature done.

**Per Phase 1 step:**
- L1: `bash Skills/test-battery/run_battery.sh /api/tap-the-vein/entry` → exit 0, curl 200
- L2: valid payload → 200; missing entryId → 400; budget-exceeded → 429
- L3: TtvEntry row created, distill result stored, Bar row created with FK
- L4: open `/bars/tap-the-vein`, type, submit, see candidates, save one BAR, verify in `/bars`

**Specifically for the LLM distillation step:**
- Mock provider: pass.
- Real provider with hard-stop budget set to $0.01: 2nd call returns 429 + fallback output. **This must work in CI without spending money.**
- Deterministic fallback at 0/100/750/5000/10000 words: 5 unit tests, all pass.
- Empty free-write: returns 1 synthetic candidate.

---

## 9. Acceptance checklist (before declaring this spec done)

- [ ] Decisions Captured (Section 1) reflects what you actually said.
- [ ] Phases match what you want shipped first.
- [ ] Cost guard budget is $5/day hard stop, $4 SMS alert.
- [ ] LLM mode shipped in Phase 1 is Mix only.
- [ ] 321 manuscript skin is explicitly dropped.
- [ ] zo.space routes are explicitly NOT modified.
- [ ] No manuscript file is touched.
- [ ] Council infrastructure is explicitly NOT shared.
- [ ] `COUNCIL/AGENT_BACKLOG.md` entry created (workspace rule).
- [ ] `COUNCIL/issues/2026-06-20-ttv-321-port-handoff.md` written for the Claude Code handoff.

---

## 10. What I still don't know (and will ask before Phase 2)

1. **LLM provider pick** — pending research memo. Phase 1 ships behind a `LLM_PROVIDER` env var defaulting to `"mock"` so the build can complete without a provider decision.
2. **Minimax specifically** — you said "Minimax would be a good one to use" but Minimax is your local model family, not necessarily the right choice for production. Research memo will cover.
3. **The deck seed file's authoritative path** — I assumed `The Library/The Library/03 BARs/321-deck/core-deck.json`. **Verify with `ls` before Phase 1 starts** — I have not read this file in this session.
4. **Whether `Bar.ttvEntryId` should be a hard FK or a soft pointer** — current spec says hard FK. If players later want to attach a free-write to a non-TTV BAR (e.g., they wrote it elsewhere), a hard FK blocks that. Open question, defaults to hard FK with onDelete: SetNull.
5. **The 6-face GM distill helper** in 321 — reuses the existing `gm-casting-ritual` shape but I haven't confirmed the shape is appropriate for per-step invocations. Phase 2 will resolve.

---

**Stop here and ask the user before Phase 2.** Don't proceed without verification.
