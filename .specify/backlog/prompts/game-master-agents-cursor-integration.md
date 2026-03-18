# Prompt: Game Master Agents Cursor Integration

**Use this prompt when implementing bars-agents MCP alignment and Cursor subagent mapping.**

## Objective

Implement per [.specify/specs/game-master-agents-cursor-integration/spec.md](../specs/game-master-agents-cursor-integration/spec.md). MCP wrapper ensures backend is ready before spawning bars-agents. Cursor rule encodes six Game Master faces and Sage's mapping (shaman→explore, regent→evaluator, challenger→contrarian, architect→generalPurpose, diplomat→simplifier, sage→evaluator). bars-agents as orchestrators; Cursor subagents as their tools.

## Checklist

### Phase 1: MCP Wrapper

- [ ] Create `scripts/mcp-serve-with-backend.ts` — ensureBackendReady, then spawn MCP
- [ ] Update `.cursor/mcp.json` to use wrapper
- [ ] Add `mcp:serve:with-backend` to package.json

### Phase 2: Cursor Rule

- [ ] Create `.cursor/rules/game-master-agents.mdc` (alwaysApply)
- [ ] Add See Also in `.cursorrules`

### Phase 3: MCP Instructions

- [ ] Expand FastMCP instructions in `backend/app/mcp_server.py`

### Phase 4: Documentation

- [ ] Update `docs/AGENT_WORKFLOWS.md` — bars-agents vs mcp_task, mapping table

## Reference

- Spec: [.specify/specs/game-master-agents-cursor-integration/spec.md](../specs/game-master-agents-cursor-integration/spec.md)
- Plan: [.specify/specs/game-master-agents-cursor-integration/plan.md](../specs/game-master-agents-cursor-integration/plan.md)
- Tasks: [.specify/specs/game-master-agents-cursor-integration/tasks.md](../specs/game-master-agents-cursor-integration/tasks.md)
