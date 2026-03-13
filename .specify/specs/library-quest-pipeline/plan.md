# Plan: Library Quest Pipeline

## Phase 1: Fix Infrastructure (FR1-FR2)

1. Fix `isBackendAvailable()` health check URL: `/health` → `/api/health`
2. Verify backend responds at `http://localhost:8000/api/health`
3. Run `npm run check` to verify TypeScript compiles

## Phase 2: Diagnose & Analyze (FR3-FR4)

4. Diagnose The Skilled Helper: query `bookAnalysisResumeLog` and `metadataJson.analysis`
5. Create `scripts/analyze-books-local.ts` — calls `analyzeBook()` against local DB
6. Run analysis: Hearts Blazing (9K words)
7. Verify quest creation from step 6
8. Run analysis: Holacracy Constitution (11K)
9. Run analysis: Integral Communication (47K)
10. Run analysis: Reinventing Organizations (152K)
11. Run analysis: 10000 Hours of Play (139K)

## Phase 3: Verify (FR5-FR6)

12. Count new library-sourced quests
13. Check backend logs for agent routing evidence
14. `npm run build` — full build verification
