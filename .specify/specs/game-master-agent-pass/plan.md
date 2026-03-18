# Plan: Game Master Agent Pass — Deftness & Spec Kit

## Overview

Structured pass over the six Game Master agents to apply deftness improvements and complete spec kit coverage. No new features; improvements and documentation only.

## Phase 1: Deftness Improvements

### 1.1 Document MCP Tool API Contracts

Add to `docs/AGENT_WORKFLOWS.md` (or new `docs/GM_AGENT_API.md`):

| Tool | Input | Output |
|------|-------|--------|
| sage_consult | question: string | JSON: { synthesis, deterministic?, error? } |
| architect_draft | narrative_lock, quest_grammar | JSON: quest draft |
| architect_compile | unpacking_answers_json, quest_grammar | JSON: { overview, node_texts, deterministic? } |
| challenger_propose | context_json | JSON: move proposal |
| shaman_read | player_id?, context? | JSON: emotional reading |
| regent_assess | instance_id?, context? | JSON: assessment |
| diplomat_guide | context_json | JSON: guidance |

Reference: `backend/app/mcp_server.py` tool signatures.

### 1.2 Audit Deterministic Fallbacks

- [ ] sage_consult — has deterministic_sage_response fallback ✓
- [ ] architect_draft — has deterministic_architect_draft ✓
- [ ] architect_compile — has deterministic_architect_compile ✓
- [ ] challenger_propose — verify
- [ ] shaman_read — verify
- [ ] regent_assess — verify
- [ ] diplomat_guide — verify

For each: when `OPENAI_API_KEY` missing or call fails → deterministic path returns valid JSON.

### 1.3 Verify deftness_context in Agent Prompts

Check each agent's `system_prompt`:
- architect, challenger, diplomat, regent, shaman — use `deftness_context` from `_instructions.py`
- sage — verify

### 1.4 Token Economy (Cache Opportunities)

Per [ai-deftness-token-strategy](../ai-deftness-token-strategy/spec.md):
- Document: which agent calls have stable inputs (e.g. nation_context, archetype_context) that could be cached
- Defer implementation to separate spec if non-trivial

**Cache opportunities (stable inputs → cache key)**:

| Tool | Stable inputs | Cache key candidate |
|------|---------------|---------------------|
| sage_consult | question | hash(question) |
| architect_draft | narrative_lock, quest_grammar | hash(narrative_lock, quest_grammar) |
| architect_compile | unpacking_answers_json, quest_grammar | hash(unpacking_answers_json, quest_grammar) |
| architect_analyze_chunk | chunk_text, domain_hint | hash(chunk_text, domain_hint) |
| challenger_propose | context | hash(context) |
| shaman_read | context | hash(context) |
| shaman_identify | free_text | hash(free_text) |
| regent_assess | instance_id | hash(instance_id) |
| diplomat_guide | context | hash(context) |
| diplomat_bridge | narrative_text, move_type | hash(narrative_text, move_type) |
| diplomat_refine_copy | target_type, current_copy, context | hash(target_type, current_copy, context) |

**Note**: AgentDeps (player_id, instance_id) may affect output for HTTP API calls; include in cache key when present. MCP calls typically use deps with player_id=None. Implementation deferred to [ai-deftness-token-strategy](../ai-deftness-token-strategy/spec.md) Phase 3.

## Phase 2: Spec Kit Implementation

### 2.1 Add Practice Tag to GM Specs

- [ ] game-master-face-moves/spec.md — add `**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.`
- [ ] game-master-face-sentences/spec.md — add Practice tag
- [ ] game-master-template-content-generation/spec.md — add Practice tag

### 2.2 Fill Spec Kit Gaps

- [ ] game-master-template-content-generation — create plan.md if missing; create tasks.md if missing
- [ ] game-master-face-moves — add API Contracts section if it defines server actions (check EXPLORATION.md)

### 2.3 API Contracts for Agent Tools

Add section to this spec or `docs/AGENT_WORKFLOWS.md`:

```markdown
## MCP Tool Contracts

### sage_consult(question: string) -> string
Returns JSON: { synthesis: string, deterministic?: boolean, error?: string }

### architect_draft(narrative_lock: string, quest_grammar?: string) -> string
Returns JSON: quest draft object

### architect_compile(unpacking_answers_json: string, quest_grammar?: string) -> string
Returns JSON: { overview, node_texts, deterministic? }
...
```

## Phase 3: Verification

### 3.1 Verification Checklist

- [ ] **V1** Run `npm run mcp:serve:with-backend` — backend starts, MCP tools load
- [ ] **V2** Invoke sage_consult("What is the BARS Engine?") — returns synthesis (or deterministic fallback)
- [ ] **V3** Invoke architect_draft with narrative_lock — returns draft or deterministic fallback
- [ ] **V4** With OPENAI_API_KEY unset — all tools return valid JSON (no crash)
- [ ] **V5** `npm run build` and `npm run check` pass
- [ ] **V6** Cursor rule game-master-agents.mdc is loaded (alwaysApply) — verify in Cursor settings

### 3.2 Spec Kit Completeness

- [ ] All GM specs have Practice tag
- [ ] All GM specs with implementation have plan + tasks
- [ ] API contracts documented for MCP tools

## File Impacts

| File | Action |
|------|--------|
| docs/AGENT_WORKFLOWS.md | Add MCP tool contracts section |
| .specify/specs/game-master-face-moves/spec.md | Add Practice tag |
| .specify/specs/game-master-face-sentences/spec.md | Add Practice tag |
| .specify/specs/game-master-template-content-generation/spec.md | Add Practice tag; create plan/tasks if missing |
| backend/app/agents/*.py | Verify deftness_context, deterministic fallbacks |

## Order of Execution

1. Phase 1.2 — Audit fallbacks (quick verification)
2. Phase 1.3 — Verify deftness_context
3. Phase 2.1 — Add Practice tags (low risk)
4. Phase 1.1 + 2.3 — Document API contracts
5. Phase 2.2 — Fill plan/tasks gaps
6. Phase 1.4 — Document cache opportunities (no impl)
7. Phase 3 — Run verification checklist
