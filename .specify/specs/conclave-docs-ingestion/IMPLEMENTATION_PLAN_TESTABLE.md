# Conclave Docs Ingestion — Testable Implementation Plan

## Overview

This plan is structured for **testability**. Each phase has verification steps you can run.

---

## Phase 1: Sage Analysis Script (Ready to Test)

### Deliverables

| Item | Status | Location |
|------|--------|----------|
| Analysis script | Done | `scripts/conclave-analyze.ts` |
| npm script | Done | `npm run conclave:analyze` |
| Fixture docs | Done | `.specify/fixtures/conclave-docs/` |
| Spec kit | Done | `.specify/specs/conclave-docs-ingestion/` |

### How to Test

1. **Start the backend**
   ```bash
   npm run dev:backend
   ```

2. **Run the analyzer**
   ```bash
   npm run conclave:analyze
   ```
   Or with custom path:
   ```bash
   npm run conclave:analyze -- --path "/Users/test/Downloads/Construc conclave (3)"
   ```

3. **Verify output**
   - File exists: `.specify/plans/conclave-analysis-{today}.md`
   - Contains Sage synthesis (summary, extracted entities, recommendations)
   - No crash when backend is down (clear error message)

4. **Expected output shape**
   - Header with date and agent info
   - Synthesis section (Sage's analysis)
   - Should mention: GM faces, Orb phases, anomaly types, Bridge scenario, onboarding order

### Failure Modes

- **Backend not running:** Script throws with message "Sage consult failed... Is the backend running?"
- **Empty path:** Script throws "Conclave docs path not found"
- **No docs:** Script exits with "No .md or .twee files found"

---

## Phase 2: Dedicated Analyze API (Optional)

### Deliverables

- `POST /api/admin/conclave-docs/analyze` (Next.js or backend)
- Structured response schema
- Admin auth check

### How to Test

```bash
curl -X POST http://localhost:3000/api/admin/conclave-docs/analyze \
  -H "Content-Type: application/json" \
  -d '{"docs":[{"name":"test","content":"# Test"}]}'
```

Assert: 200, JSON with `synthesis`, `extracted_entities`, or `analysis_id`.

---

## Phase 3: Integration with Existing Specs

### Merge Points

| Conclave Doc | Existing Spec | Action |
|--------------|---------------|--------|
| Orb Encounter Grammar | `orb-encounter-grammar` | Merge additional detail; ensure v0 scope aligned |
| Orb Triadic Twee Generator | (new) | Create `orb-twee-generator` spec |
| Bridge Scenario Engine | (new) | Create `bridge-scenario-engine` spec; discover archetypes first |
| Onboarding Grammar | onboarding flows | Update docs; ensure Bruised Banana follows Why→Where→How |

### Verification

- [ ] `orb-encounter-grammar` spec includes all 7 phases and 6 GM faces
- [ ] `orb-twee-generator` spec exists with 9-passage contract
- [ ] `bridge-scenario-engine` spec exists with archetype-gating
- [ ] Onboarding docs reference three orientations

---

## Test Script (Future)

```typescript
// scripts/conclave-analyze.test.ts
import { describe, it, expect, vi } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'

// Mock fetch
vi.stubGlobal('fetch', vi.fn())

it('writes output file when Sage returns', async () => {
  vi.mocked(fetch).mockResolvedValue({
    ok: true,
    json: async () => ({ output: { synthesis: 'Test analysis', consulted_agents: ['architect'] } }),
  } as Response)
  // Run script, assert file exists
})
```

---

## Summary: What to Run

| Goal | Command |
|------|---------|
| Analyze Conclave docs | `npm run dev:backend` (in one terminal), then `npm run conclave:analyze` |
| Use custom path | `npm run conclave:analyze -- --path "/path/to/docs"` |
| Check output | `cat .specify/plans/conclave-analysis-$(date +%Y%m%d).md` |
