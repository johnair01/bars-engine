# Plan: Conclave Docs Ingestion — Sage-Powered Analysis

## Summary

Implement an API-first pipeline for Sage to analyze Conclave design docs. **Privilege canonical models**; document diffs and ask for clarity before implementing (see `MODEL_DIFF_AND_CLARITY_QUESTIONS.md`). Outputs feed spec kit updates and implementation planning. Testable via script and integration tests.

---

## Implementation Order

### Phase 1: Script + Sage Consult (No New API)

1. **Script `scripts/conclave-analyze.ts`**
   - Accept `--path` to Conclave docs folder
   - Read all `.md` and `.twee` files
   - Build prompt with doc content
   - Call `POST /api/agents/sage/consult` (or fetch backend)
   - Write analysis to `.specify/plans/conclave-analysis-{date}.md`

2. **npm run conclave:analyze**
   - Wrapper for script with default path

**Test:** Run script against `/Users/test/Downloads/Construc conclave (3)`; verify output file exists and contains synthesis.

---

### Phase 2: Dedicated Analyze API (Optional)

3. **POST /api/admin/conclave-docs/analyze**
   - Next.js API route or backend route
   - Accept `docs[]` or `path`
   - Call Sage with structured prompt
   - Return structured response (extracted_entities, conflicts, etc.)

4. **Structured output schema**
   - Define Pydantic/TypeScript schema for analysis response
   - Sage prompt asks for JSON matching schema

**Test:** POST with sample docs; assert response shape.

---

### Phase 3: Extracted Entities → Spec Kit

5. **Write extracted entities to `.specify/specs/conclave-docs-ingestion/extracted.json`**
   - GM faces, anomaly types, emotional vectors, Orb phases
   - Used by orb-encounter-grammar and bridge-scenario specs

6. **Merge recommendations**
   - Sage suggests spec updates; human reviews and applies

---

## File Impacts

| Action | File |
|--------|------|
| Create | `scripts/conclave-analyze.ts` |
| Create | `scripts/with-conclave-docs.ts` (helper to read from path) |
| Edit | `package.json` — add `conclave:analyze` script |
| Create | `.specify/plans/conclave-analysis-*.md` (output) |
| Create | `backend/app/routes/conclave_docs.py` (Phase 2) |

---

## Verification

- [ ] `npm run conclave:analyze -- --path "/path/to/docs"` runs without error
- [ ] Output file contains Sage synthesis
- [ ] Script works when backend is down (graceful fallback or clear error)
- [ ] Extracted entities are parseable (if structured output enabled)
