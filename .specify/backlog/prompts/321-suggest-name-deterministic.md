# Prompt: 321 Suggest Name Deterministic Grammar

**Use this prompt when implementing the deterministic Suggest Name fix.**

## Context

The AI-based Suggest Name (Shaman) never resolved (404 or token issues). Replace with a deterministic 6-face name grammar (MTG-style Role + Description). Same input = same name; instant response.

## Prompt text

> Implement the 321 Suggest Name deterministic grammar per [.specify/specs/321-suggest-name/spec.md](../specs/321-suggest-name/spec.md). Create `src/lib/shadow-name-grammar.ts` with 6-face vocab and `deriveShadowName(charge, mask)`. Backend: use grammar as primary in suggest-shadow-name; remove AI path. Frontend: add 15s timeout to suggestShadowName; log errors. Spec: [path].

## Checklist

- [ ] Phase 1: shadow-name-grammar.ts
- [ ] Phase 2: Backend uses grammar
- [ ] Phase 3: Frontend timeout + error logging
- [ ] npm run build and npm run check

## Reference

- Spec: [.specify/specs/321-suggest-name/spec.md](../specs/321-suggest-name/spec.md)
- Plan: [.specify/specs/321-suggest-name/plan.md](../specs/321-suggest-name/plan.md)
- Tasks: [.specify/specs/321-suggest-name/tasks.md](../specs/321-suggest-name/tasks.md)
