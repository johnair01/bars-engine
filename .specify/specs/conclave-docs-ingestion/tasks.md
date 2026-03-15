# Tasks: Conclave Docs Ingestion

## Phase 1: Script + Sage Consult

- [ ] **1.1** Create `scripts/conclave-analyze.ts`:
  - Parse `--path` arg (default: `./.specify/fixtures/conclave-docs` or env `CONCLAVE_DOCS_PATH`)
  - Read `.md` and `.twee` files from path
  - Build prompt: "Analyze these Conclave design docs. Extract: GM faces, anomaly types, emotional vectors, Orb phases, Bridge scenario entities. Identify conflicts with existing specs. Suggest implementation order."
  - Call `fetch(NEXT_PUBLIC_BACKEND_URL + '/api/agents/sage/consult', { method: 'POST', body: JSON.stringify({ question: prompt }) })`
  - Write response to `.specify/plans/conclave-analysis-{YYYYMMDD}.md`
- [ ] **1.2** Add `npm run conclave:analyze` to package.json
- [ ] **1.3** Copy or symlink Conclave docs to `.specify/fixtures/conclave-docs/` for CI (or document path requirement)
- [ ] **1.4** Add `scripts/conclave-analyze.test.ts` — mock fetch, assert output file written

## Phase 2: Dedicated API (Optional)

- [ ] **2.1** Create `POST /api/admin/conclave-docs/analyze` (Next.js or backend)
- [ ] **2.2** Define structured response schema
- [ ] **2.3** Update Sage prompt for JSON output

## Phase 3: Extracted Entities

- [ ] **3.1** Parse Sage response for entities; write to `extracted.json`
- [ ] **3.2** Document merge process for orb-encounter-grammar and bridge-scenario specs

## Verification

- [ ] Run `npm run conclave:analyze` with real docs path
- [ ] Output is readable and actionable
- [ ] Test passes with mocked Sage
