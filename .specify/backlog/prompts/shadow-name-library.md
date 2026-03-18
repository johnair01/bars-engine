# Prompt: Shadow Name Library

**Use this prompt when implementing the low-cost name library extension.**

## Context

Extend the 321 Suggest Name grammar into a vast, low-cost name library. Zero tokens at suggest time. Externalize vocab to JSON; expand words and patterns; optional feedback loop for improvement over time.

## Prompt text

> Implement the Shadow Name Library per [.specify/specs/shadow-name-library/spec.md](../specs/shadow-name-library/spec.md). Externalize vocab to JSON; expand to 8×8 per face; add grammar patterns. Refactor deriveShadowName to use config. Optional: feedback log when user accepts/edits; batch analysis script. Spec: [path].

## Checklist

- [ ] Phase 1: Vocab externalized and expanded
- [ ] Phase 2: Feedback (optional)
- [ ] Phase 3: Batch refinement (optional)
- [ ] npm run build and npm run check

## Reference

- Spec: [.specify/specs/shadow-name-library/spec.md](../specs/shadow-name-library/spec.md)
- Plan: [.specify/specs/shadow-name-library/plan.md](../specs/shadow-name-library/plan.md)
- Tasks: [.specify/specs/shadow-name-library/tasks.md](../specs/shadow-name-library/tasks.md)
- Depends on: [321 Suggest Name Deterministic](../specs/321-suggest-name/spec.md)
