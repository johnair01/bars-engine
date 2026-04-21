# SPEC: bar-asset-pipeline-002 — Clean Sprint

**Owner:** sprint/bar-asset-pipeline-002 | **Created:** 2026-04-21 | **Status:** Pre-build
**Root cause of 001 failure:** corrupted source files (literal `\n` in JSDoc headers), no branch CI gate, merged to main without verification

---

## Context

`bar-asset-pipeline-001` produced real implementation work across 9 commits (Phases 1-4): types, translation layer, persistence, feedback loop. The architecture is sound. The execution was corrupted by literal `\n` sequences in committed source files, a missing CI gate, and a merge-to-main-without-testing pattern.

This spec governs a clean rebuild on `sprint/bar-asset-pipeline-002`, using the old sprint as architectural reference — not as donor files.

---

## What We Keep From 001 (Architectural Reference)

These are proven patterns to rebuild from spec, not copy from git:

| Pattern | Location in 001 | What It Does |
|---|---|---|
| `AuthoredContent` interface | `translator.ts` | Minimal input type for translation layer |
| `SeedMaturityError` / `TranslationError` | `translator.ts` | Typed error classes |
| `hasMinimumMaturityForConstructorB` gate | `types.ts` | Enforces `maturity >= 'shared_or_acted'` |
| `promoteToIntegrated` | `types.ts` | Sets `maturity = 'integrated'` on output |
| `buildStructuredBarId` + `BAR_TYPE_PREFIXES` | `id.ts` | Structured ID convention |
| `dispatchAI` dispatcher pattern | `dispatcher.ts` | Provider-agnostic AI dispatch |
| `persistBarAsset` upsert logic | `persistence.ts` | Insert-or-update with `createdAt` tracking |
| `callZoAI` / Zo provider | `providers/zo.ts` | Zo `/zo/ask` API integration |
| `buildUserPrompt` + `SYSTEM_PROMPT` | `prompts/blessed-object.ts` | NL prompt templates for dungeon rooms |
| Phase 1-4 commit history | git log `origin/sprint/bar-asset-pipeline-001` | Architectural reference |

---

## What We Build Fresh

All implementation on 002 is written from this spec. No file is copied from 001. No file is assumed correct without verification.

### Phase 1 — Types and ID Convention ✓
- `src/lib/bar-asset/types.ts` — `BarAsset`, `hasMinimumMaturityForConstructorB`, `promoteToIntegrated`
- `src/lib/bar-asset/id.ts` — `buildStructuredBarId`, `BAR_TYPE_PREFIXES`, `BarType`
- Re-export `MaturityPhase` from `bar-seed-metabolization/types`
- **Verification:** `tsc --noEmit` clean, unit tests pass

### Phase 2 — Translation Layer
- `src/lib/bar-asset/translator.ts` — `translateBarSeedToAsset()`, `AuthoredContent`, error classes
- `src/lib/bar-asset/dispatcher.ts` — `dispatchAI` interface
- `src/lib/bar-asset/providers.ts` — `AICompletionRequest`, `AICompletionResponse` types
- `src/lib/bar-asset/providers/zo.ts` — `callZoAI` via Zo `/zo/ask`
- `src/lib/bar-asset/prompts/blessed-object.ts` — NL prompt templates
- **Verification:** `tsc --noEmit` clean, `bun test` pass (unit only, no live API)

### Phase 3 — Persistence
- `src/lib/bar-asset/persistence.ts` — `persistBarAsset` upsert
- Route: `POST /api/bar-asset/translate` — translate + persist in one call
- **Verification:** `tsc --noEmit` clean, unit tests pass, DB migration verified

### Phase 4 — Feedback Loop
- `src/lib/bar-asset/feedback-loop.ts` — `processPlayEvent`, play-data ingestion
- Route: `POST /api/bar-asset/play-event` — ingest play events
- **Verification:** `tsc --noEmit` clean, unit tests pass

---

## What We Do NOT Build Yet (Out of Scope)

- `run-chapter-1` script — deferred until pipeline is stable on main
- Constructor C (game renderer) — no DOM generation yet
- Feedback loop → new BarSeed cycle — deferred
- Multi-BAR-type support (only `blessed_object` for now)

---

## Process Rules (Non-Negotiable)

| # | Rule | Why |
|---|---|---|
| 1 | **Branch CI gate before any merge** — `tsc --noEmit` + `bun test` must pass on the branch before merge | Prevents recurrence of the 3-deploy failure pattern |
| 2 | **`rm -rf .next` before `tsc --noEmit`** — always clean `.next/types/` before running type check | Prevents `.next/types/` cache from masking errors |
| 3 | **No `python3 << 'PYEOF'` for TypeScript/JS source** — use `create_or_rewrite_file` or `edit_file_llm` only | Shell heredoc expansion corrupts backtick-wrapped code |
| 4 | **Binary inspection before declaring a file clean** — run the Python byte-check script on any file that touched JSDoc comments | Catches literal `\n` corruption before it commits |
| 5 | **Preview deploy only** — `npx vercel` (not `--prod`) to validate before production | Keeps production clean until branch is proven |
| 6 | **No merge to main until preview URL returns 200** — verify with `curl -sI` | Final gate before touching production |

---

## Binary Corruption Detection Script

Run on any file that touched JSDoc comments before staging:

```python
# check_literal_n.py — run from repo root
import os, sys
def check(path):
    data = open(path, 'rb').read()
    lit = data.count(b'\x5c\x6e')
    real = data.count(b'\x0a')
    ok = lit == 0
    print(f"{'FAIL' if not ok else 'OK'} {path}: lit={lit} real={real}")
    return ok
ok = all(check(f) for f in sys.argv[1:])
sys.exit(0 if ok else 1)
```

```bash
python3 scripts/check_literal_n.py src/lib/bar-asset/translator.ts
```

---

## Exit Criteria

| # | Criterion | Measurement |
|---|---|---|
| 1 | Branch CI passes | `tsc --noEmit` + `bun test` exit 0 on `sprint/bar-asset-pipeline-002` |
| 2 | All unit tests pass | 60+ tests passing, 0 failures (integration tests may skip without API keys) |
| 3 | Preview deploy succeeds | `curl -sI https://bars-engine-git-[hash].vercel.app/` returns 200 |
| 4 | No literal `\n` in committed files | `python3 scripts/check_literal_n.py $(find src -name '*.ts')` exit 0 |
| 5 | `POST /api/bar-asset/translate` works | Tested against preview with real credentials |
| 6 | `POST /api/bar-asset/play-event` works | Tested against preview with real credentials |
| 7 | Merge to main only after all above | No exceptions |

---

## Companion Files

- `src/lib/bar-asset/PROTOCOL.md` — architectural reference (do not modify)
- `src/lib/bar-seed-metabolization/types.ts` — maturity phases (existing, reference)
- `src/lib/bars.ts` — `BarDef`, `BarInput` (existing, reference)
- `AAR_BARSENGINE_RESTORE_2026-04-21.md` — root cause analysis (workspace COUNCIL/logs/)
- `AAR_BARSENGINE_ORCHESTRATION_2026-04-21.md` — orchestration lessons (workspace COUNCIL/logs/)
