# Spec: Cert feedback durable persistence (Vercel Blob) — CFB

**Status:** Phase 1 (FR1–FR2, FR5 script) **implemented** — [`mirrorCertFeedbackLine`](../../../src/lib/feedback/mirror-cert-feedback-line.ts), [`npm run feedback:export-blob`](../../../scripts/export-cert-feedback-blob.ts). FR3 (ENV doc) below.  
**Backlog:** [BACKLOG.md § 1.60 CFB](../../backlog/BACKLOG.md).  
**Relates to:** [site-signal-nav-report](../site-signal-nav-report/spec.md), [docs/CERTIFICATION_FEEDBACK.md](../../../docs/CERTIFICATION_FEEDBACK.md), [.agents/skills/cert-feedback-triage/SKILL.md](../../../.agents/skills/cert-feedback-triage/SKILL.md), [book-upload-vercel-client-exception](../book-upload-vercel-client-exception/plan.md) (Blob env patterns).

## Purpose

Player feedback that today appends to **`.feedback/cert_feedback.jsonl`** must **survive serverless deploys** (Vercel): the runtime filesystem is **not** a shared, durable log. This spec defines **durable persistence** (primary: **Vercel Blob**) while preserving the **existing JSON line shape** so [cert-feedback-triage](../../../.agents/skills/cert-feedback-triage/SKILL.md) and automation keep working via a **sync/export path** for local triage.

## Problem

| Writer | Path |
|--------|------|
| `POST /api/feedback/cert` | [`src/app/api/feedback/cert/route.ts`](../../../src/app/api/feedback/cert/route.ts) |
| `POST /api/feedback/site-signal` | [`src/app/api/feedback/site-signal/route.ts`](../../../src/app/api/feedback/site-signal/route.ts) |
| Share Your Signal (quest complete) | [`src/actions/quest-engine.ts`](../../../src/actions/quest-engine.ts) (`system-feedback`) |
| Legacy server action | [`src/actions/certification-feedback.ts`](../../../src/actions/certification-feedback.ts) (`logCertificationFeedback`, deprecated) |

All use **`fs.appendFile`** → works on **local dev**; on **Vercel**, writes are **lost** or **fail** depending on runtime (and must not be relied on for production signals).

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Store** | **Vercel Blob** when `BLOB_READ_WRITE_TOKEN` is set (same env as [assets](../../../src/actions/assets.ts)); **fallback** to current `.feedback/cert_feedback.jsonl` when token absent (local dev, tests). |
| **Append semantics** | Blob has **no true append**. Use **one immutable object per feedback line** (recommended) at prefix e.g. `cert-feedback/events/{yyyy-mm-dd}/{uuid}.json` — body = **single JSON object** identical to today’s line fields. Avoid read-modify-write on one NDJSON file under concurrent requests. |
| **Object shape** | **Unchanged** from today: `timestamp`, `playerId`, `playerName`, `questId`, `passageName`, `feedback`. |
| **Access** | **`private`** blobs (no public gallery of player feedback). |
| **Code structure** | **Single helper** `persistCertFeedbackLine(entry)` (name TBD) invoked from all four writers; encapsulates token check, JSON serialize, `put`, and local fallback. |
| **Triage / agents** | Optional **`npm run feedback:export-blob`** (or script in `scripts/`) lists prefix for date range, downloads objects, writes/merges **`.feedback/cert_feedback.jsonl`** for `tail` + triage skill — **or** document `vercel blob list` workflow until script lands. |
| **Phase 2 (optional)** | Postgres `FeedbackEvent` row for admin UI / queries — **out of scope** for CFB v1 unless product insists. |

## Conceptual Model

| WHO | WHAT | WHERE |
|-----|------|--------|
| Player | Submits cert / site-signal / Share Your Signal | API or quest engine |
| System | Persists one durable record | Blob (prod) or `.feedback/` (dev) |
| Steward / agent | Triage | Local JSONL via export script or copied lines |

## API Contracts

### Internal: `persistCertFeedbackLine(entry: CertFeedbackJsonlLine): Promise<{ ok: true } \| { ok: false; error: string }>`

**Input:** Object matching current JSONL schema (see [CERTIFICATION_FEEDBACK.md](../../../docs/CERTIFICATION_FEEDBACK.md)).

**Behavior:**

1. If `process.env.BLOB_READ_WRITE_TOKEN` **set**: `put()` one object to `cert-feedback/events/{UTC-date}/{randomId}.json`, `contentType: application/json`, `access: 'private'`.
2. Else: `appendFile` to `.feedback/cert_feedback.jsonl` (current behavior).

**Output:** Success or error string for route handlers to map to HTTP 500 / logging.

- **No change** to public HTTP contracts of `/api/feedback/cert` or `/api/feedback/site-signal` (still `{ success: true }` / errors).

### Optional script: `feedback:export-blob` (Phase 1b)

**CLI:** e.g. `npx tsx scripts/export-cert-feedback-blob.ts [--since=ISO]`

**Output:** Append or overwrite-merge into `.feedback/cert_feedback.jsonl` for triage (document idempotency: skip if line fingerprint exists, or always dump to `cert_feedback.imported.jsonl`).

## User Stories

### P1 — Production feedback is not lost

**As a** player on Vercel, **I want** my site-signal / cert report to be stored durably, **so** stewards can act on it.

**Acceptance:** With `BLOB_READ_WRITE_TOKEN` on Vercel, submit feedback → object appears in Blob store under agreed prefix; no reliance on server local disk.

### P2 — Local dev unchanged ergonomics

**As a** developer without Blob token, **I want** feedback to keep landing in `.feedback/cert_feedback.jsonl`, **so** I can `tail` and triage as today.

**Acceptance:** Unset token → only filesystem write; no error.

## Functional Requirements

### Phase 1 — Core persistence

- **FR1:** ~~Implement `persistCertFeedbackLine` (or equivalent)~~ **Done:** [`mirrorCertFeedbackLine`](../../../src/lib/feedback/mirror-cert-feedback-line.ts) (`put`, `access: 'private'`, `cert-feedback/events/{date}/{uuid}.json`).
- **FR2:** ~~Wire routes~~ **Done:** single path via [`persistPlayerFeedbackToBacklog`](../../../src/lib/feedback/persist-player-feedback-to-backlog.ts) (cert API, site-signal API, `logCertificationFeedback`, Share Your Signal in quest-engine).
- **FR3:** **Done:** [docs/ENV_AND_VERCEL.md](../../../docs/ENV_AND_VERCEL.md) CFB subsection.
- **FR4:** Add `@vercel/blob` to `serverExternalPackages` in `next.config` **if** build fails (not required for current build).

### Phase 1b — Triage ergonomics

- **FR5:** **Done:** `npm run feedback:export-blob` → [scripts/export-cert-feedback-blob.ts](../../../scripts/export-cert-feedback-blob.ts) for [cert-feedback-triage](../../../.agents/skills/cert-feedback-triage/SKILL.md).

### Non-goals (v1)

- Public URL listing of feedback blobs.
- Admin UI inbox (Phase 2).
- Replacing JSONL as the **canonical** triage format for agents (export bridges Blob → JSONL).

## Non-Functional Requirements

- **Concurrency:** No shared mutable blob; one put per event.
- **PII:** Treat blob prefix as sensitive; private access; do not log full `feedback` body in stdout in production.
- **Backward compatibility:** Existing `.feedback/` behavior preserved when token missing.

## Persisted data & Prisma

**v1:** No Prisma migration — Blob only (+ existing local file).

| Check | Done |
|-------|------|
| Prisma change | N/A for v1 |
| Migration | N/A for v1 |

## Scaling Checklist

| Touchpoint | Mitigation |
|------------|------------|
| Blob list API volume | Prefix by date; export script filters by `--since` |
| Many small objects | Acceptable for feedback volume; revisit batching if metrics show cost |

## Verification Quest

1. **Local:** Unset `BLOB_READ_WRITE_TOKEN`, submit site-signal → line in `.feedback/cert_feedback.jsonl`.
2. **Staging / preview with token:** Submit site-signal → verify blob in Vercel dashboard (private).
3. **Regression:** Cert `POST` and Share Your Signal completion still return success and persist.

## Dependencies

- `@vercel/blob`, `BLOB_READ_WRITE_TOKEN` on Vercel project.

## Changelog

| Date | |
|------|--|
| 2026-03-27 | Initial spec kit (CFB backlog 1.60). |
| 2026-03-30 | Phase 1: `mirrorCertFeedbackLine`, export script, ENV doc, site-signal modal UX (SNP slice). |
