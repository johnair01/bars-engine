# Spec: Game Master Agent Pass — Deftness & Spec Kit

## Purpose

A structured pass over the six Game Master agents (Shaman, Regent, Challenger, Architect, Diplomat, Sage) to apply deftness improvements and ensure spec kit completeness. The pass aligns agent behavior with Deftness Development principles and fills gaps in specs, plans, and tasks so implementation is traceable and consistent.

**Problem**: GM agents exist and are wired (MCP, Cursor rules), but (1) deftness discipline (API contracts, deterministic fallbacks, token economy) is uneven across agents, and (2) several GM-related specs lack full spec kit coverage (plan, tasks, Practice tag, API contracts).

**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Pass scope** | Deftness improvements + spec kit audit; no new agent features |
| **Deftness focus** | API contracts, deterministic fallbacks, token economy, scaling checklist |
| **Spec kit focus** | Practice tag, API Contracts section, plan.md, tasks.md where missing |
| **Agent surface** | Backend MCP tools (`backend/app/agents/`, `mcp_server.py`); Cursor rules; docs |

## Deftness Improvements (Targets)

| Area | Current | Target |
|------|---------|--------|
| **API contracts** | Tools have signatures; not documented in spec | Document all MCP tool I/O in spec or plan |
| **Deterministic fallbacks** | Most tools have fallbacks when no API key | Audit; ensure all tools degrade gracefully |
| **Token economy** | deftness_context in prompts; no cache | Add cache for stable inputs per ai-deftness-token-strategy |
| **Scaling checklist** | Not explicit per agent | Add to spec: AI calls, env, timeouts |

## Spec Kit Audit (GM-Related Specs)

| Spec | spec.md | plan.md | tasks.md | Practice | API Contracts |
|------|---------|---------|----------|----------|---------------|
| game-master-agents-cursor-integration | ✅ | ✅ | ✅ | ✅ | N/A (config) |
| game-master-face-moves | ✅ | ✅ | ✅ | ❌ | ❌ |
| game-master-face-sentences | ✅ | ✅ | ✅ | ❌ | N/A (content) |
| game-master-template-content-generation | ✅ | ❓ | ❓ | ❓ | ❓ |
| deftness-uplevel (parent) | ✅ | — | — | ✅ | — |

## User Stories

### P1: Deftness discipline applied to GM agents

**As a contributor**, I want GM agent tools to follow deftness principles (API contracts documented, deterministic fallbacks verified, token economy considered), so scaling and maintenance are predictable.

**Acceptance**: All MCP tools have documented I/O; all have deterministic fallbacks when OpenAI unavailable; deftness_context is applied consistently.

### P2: Spec kit complete for GM specs

**As a contributor**, I want every GM-related spec to have Practice tag, plan, tasks, and API contracts where applicable, so implementation is traceable and consistent with project standards.

**Acceptance**: game-master-face-moves, game-master-face-sentences, game-master-template-content-generation have Practice tag; plans and tasks exist; API contracts documented for agent tools.

### P3: Verification that GM agents are used correctly

**As a contributor**, I want a verification checklist so I can confirm GM agents respond correctly and Cursor uses them per the rules.

**Acceptance**: Checklist in plan; at least one smoke test per agent (or sage_consult as proxy).

## Functional Requirements

### Phase 1: Deftness Improvements

- **FR1**: Document MCP tool API contracts (input/output shapes) in this spec or `docs/AGENT_WORKFLOWS.md`.
- **FR2**: Audit deterministic fallbacks — every tool that calls OpenAI MUST have a fallback when `OPENAI_API_KEY` is missing or call fails.
- **FR3**: Add deftness_context to any agent missing it (currently: architect, challenger, diplomat, regent, shaman, sage — verify all).
- **FR4**: Reference [ai-deftness-token-strategy](../ai-deftness-token-strategy/spec.md) for cache opportunities; document in plan.

### Phase 2: Spec Kit Implementation

- **FR5**: Add "**Practice**: Deftness Development" to game-master-face-moves, game-master-face-sentences, game-master-template-content-generation specs.
- **FR6**: Ensure game-master-template-content-generation has plan.md and tasks.md; fill gaps.
- **FR7**: Add API Contracts section to game-master-face-moves if it defines server actions or routes.

### Phase 3: Verification

- **FR8**: Create verification checklist (GM Agent Pass) in plan.
- **FR9**: Run `npm run build` and `npm run check`; MCP tools invokable via `mcp:serve:with-backend`.

## Non-Functional Requirements

- Pass does not add new agent features; improvements only.
- Documentation updates must not bloat Cursor rules (keep game-master-agents.mdc concise).

## Dependencies

- [game-master-agents-cursor-integration](../game-master-agents-cursor-integration/spec.md)
- [deftness-uplevel-character-daemons-agents](../deftness-uplevel-character-daemons-agents/spec.md)
- [ai-deftness-token-strategy](../ai-deftness-token-strategy/spec.md)
- [Deftness Development Skill](../../.agents/skills/deftness-development/SKILL.md)

## References

- MCP tools: [backend/app/mcp_server.py](../../backend/app/mcp_server.py)
- Agent prompts: [backend/app/agents/_instructions.py](../../backend/app/agents/_instructions.py)
- Cursor rule: [.cursor/rules/game-master-agents.mdc](../../.cursor/rules/game-master-agents.mdc)
- Docs: [docs/AGENT_WORKFLOWS.md](../../docs/AGENT_WORKFLOWS.md)
