# Plan: BAR Pipeline Test Gate

## Files to Create

| File | Purpose |
|------|---------|
| `06 Specs/bars-pipeline-test-gate/SPEC.md` | This spec |
| `06 Specs/bars-pipeline-test-gate/PLAN.md` | This plan |
| `06 Specs/bars-pipeline-test-gate/TASKS.md` | Implementation tasks |
| `06 Specs/SPEC-TEMPLATE.md` | Canonical template for workspace |

## Architecture

```
SPEC filed → TASKS executed → TESTS written → GATE enforced
                    ↓
            AGENTS.md updated
            preflight.sh updated
```

## Implementation Sequence

### Step 0: Extract template from bars-engine (done)
- `SPEC-TEMPLATE.md` created in `06 Specs/`
- Adapts bars-engine template for workspace use (no Prisma sections, workspace-appropriate)

### Step 1: Write this spec kit (done)
- `bars-pipeline-test-gate/SPEC.md` filed

### Step 2: Implement tasks (this plan)
- Three phases: Infrastructure → AGENTS.md integration → Automated gate

### Step 3: Update AGENTS.md
- Add test gate step to zo.space workflow
- Add rule: no deploy without gate pass

### Step 4: Add to preflight
- `Skills/sprint-preflight/scripts/preflight.sh local` → add bars-review E2E

## Verification

Run `python3 Skills/hey-pocket-ai/scripts/e2e_bar_review.py` — all 6 tests pass = spec complete.