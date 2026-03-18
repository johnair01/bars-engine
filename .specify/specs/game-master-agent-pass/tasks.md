# Tasks: Game Master Agent Pass — Deftness & Spec Kit

## Phase 1: Deftness Improvements

- [x] **1.1** Document MCP tool API contracts in docs/AGENT_WORKFLOWS.md
  - Add section "MCP Tool Contracts" with table: Tool, Input, Output
  - Cover: sage_consult, architect_draft, architect_compile, challenger_propose, shaman_read, regent_assess, diplomat_guide
- [x] **1.2** Audit deterministic fallbacks for all MCP tools (fixed architect_analyze_chunk bug)
  - For each tool: when OPENAI_API_KEY missing or call fails → deterministic path returns valid JSON
  - Verify: challenger, shaman, regent, diplomat (architect + sage already verified)
- [x] **1.3** Verify deftness_context in agent system prompts (all 6 agents use it)
  - architect, challenger, diplomat, regent, shaman, sage — all use deftness_context
  - Check backend/app/agents/*.py
- [ ] **1.4** Document cache opportunities per ai-deftness-token-strategy
  - Which agent calls have stable inputs (nation_context, archetype_context)?
  - Add note to plan; defer implementation to separate spec

## Phase 2: Spec Kit Implementation

- [x] **2.1** Add Practice tag to game-master-face-moves/spec.md
  - `**Practice**: Deftness Development — spec kit first, API-first (contract before UI), deterministic over AI.`
- [x] **2.2** Add Practice tag to game-master-face-sentences/spec.md
- [x] **2.3** Add Practice tag to game-master-template-content-generation/spec.md
- [x] **2.4** Create plan.md and tasks.md for game-master-template-content-generation
- [ ] **2.5** Add API Contracts section to game-master-face-moves if it defines server actions (check EXPLORATION.md)

## Phase 3: Verification

- [x] **3.1** Run `npm run test:gm-agents` — backend auto-starts, all 6 agent APIs return valid JSON
- [ ] **3.2** Invoke sage_consult("What is the BARS Engine?") — returns synthesis
- [ ] **3.3** With OPENAI_API_KEY unset — invoke sage_consult, architect_draft — both return valid JSON
- [ ] **3.4** Run `npm run build` and `npm run check` — pass
- [ ] **3.5** Confirm all GM specs have Practice tag; plans/tasks exist where applicable

## Verification Summary

| Check | Status |
|-------|--------|
| MCP tools documented | |
| Deterministic fallbacks verified | |
| deftness_context in all agents | |
| Practice tag on GM specs | |
| plan/tasks for template-content-generation | |
| Build + check pass | |
