# Prompt: Creation Quest Bootstrap

**Use this prompt when implementing the creation quest bootstrap — rules-first runtime with AI fallback.**

## Context

The bootstrap loop uses AI to generate examples, derives heuristics from patterns, then runs rules-first at runtime with AI as fallback. API-first contracts: `extractCreationIntent`, `generateCreationQuest`, `assembleArtifact`. Output is deterministic when heuristics match; AI fallback preserves quality for edge cases.

## Prompt text

> Implement the Creation Quest Bootstrap per [.specify/specs/creation-quest-bootstrap/spec.md](../specs/creation-quest-bootstrap/spec.md). Add `src/lib/creation-quest/` with: types.ts, extractCreationIntent.ts, generateCreationQuest.ts, assembleArtifact.ts, index.ts. **API contracts first** — define CreationIntent, CreationQuestPacket, CreationContext. Implement extraction (rules + optional AI fallback), generation (rules-first, AI when no template matches), assembly (deterministic). Add bootstrap script for AI-generated examples → store → analyze → derive heuristics. Observability: log intentConfidence, heuristicVsAi, templateMatched. Feature flag CREATION_QUEST_AI_ENABLED. Run `npm run build` and `npm run check` — fail-fix.

## Checklist

- [ ] Phase 1: types.ts, index.ts (API contracts)
- [ ] Phase 2: extractCreationIntent, generateCreationQuest, assembleArtifact
- [ ] Phase 3: Bootstrap script (AI examples → store → analyze → derive rules)
- [ ] Phase 4: Rules-first runtime, threshold logic, AI fallback
- [ ] Phase 5: Observability, feature flag

## Reference

- Spec: [.specify/specs/creation-quest-bootstrap/spec.md](../specs/creation-quest-bootstrap/spec.md)
- Plan: [.specify/specs/creation-quest-bootstrap/plan.md](../specs/creation-quest-bootstrap/plan.md)
- Tasks: [.specify/specs/creation-quest-bootstrap/tasks.md](../specs/creation-quest-bootstrap/tasks.md)
- Design doc: [docs/creation-quest-bootstrap-design.md](../../docs/creation-quest-bootstrap-design.md)
