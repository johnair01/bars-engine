# Tasks: BAR Pipeline Test Gate

## Phase 1: Test Gate Infrastructure

- [x] Done — Task 0: Extract SPEC-TEMPLATE.md from bars-engine → `06 Specs/SPEC-TEMPLATE.md`
- [x] Done — Task 1: File this spec kit in `06 Specs/bars-pipeline-test-gate/`
- [x] Done — Task 2: e2e_bar_review.py has L1/L2/L3 tests (4 data tests)
- [x] Done — Task 3: e2e_bar_review.py has L4 UI tests via agent-browser (2 tests)
- [ ] Task 4: Add contract test for `/api/bars-review/catalog` (L2)
- [ ] Task 5: Add contract test for `POST /api/bars-review/new-batch` (L3)
- [ ] Task 6: Add contract test for empty-batch behavior (L3)
- [ ] Task 7: Test results write to `bars-review/TEST-RESULTS-{timestamp}.json`

## Phase 2: AGENTS.md Integration

- [ ] Task 8: Add "zo.space workflow" section to AGENTS.md with test gate step
- [ ] Task 9: Add rule: "No deploy without test gate pass"
- [ ] Task 10: Add rule: "Tests live alongside the feature spec — not deferred"

## Phase 3: Automated Gate

- [ ] Task 11: Add bars-review E2E to `Skills/sprint-preflight/scripts/preflight.sh`
- [ ] Task 12: Pre-flight failure writes report to `COUNCIL/logs/`
- [ ] Task 13: Verify pre-flight runs clean

## Completion Criteria

All tasks checked. `python3 Skills/hey-pocket-ai/scripts/e2e_bar_review.py` → all tests pass.

## Notes

This spec kit was created in response to the 6-face GM analysis (2026-04-30). The analysis identified: no pre-deploy verification, UI contracts never verified against running server, empty-state behavior never tested. This spec addresses all four gaps.