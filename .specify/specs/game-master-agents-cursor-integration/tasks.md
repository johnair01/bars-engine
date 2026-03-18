# Tasks: Game Master Agents Cursor Integration

## Phase 1: MCP Wrapper

- [x] **1.1** Create `scripts/mcp-serve-with-backend.ts`
  - Import ensureBackendReady, spawn, join
  - await ensureBackendReady({ autoStart: true })
  - Spawn uv run python -m app.mcp_server in backend/, stdio inherit
  - Exit with child code
- [x] **1.2** Update `.cursor/mcp.json` — point bars-agents to wrapper (npx tsx scripts/mcp-serve-with-backend.ts)
- [x] **1.3** Add `mcp:serve:with-backend` to package.json

## Phase 2: Cursor Rule

- [x] **2.1** Create `.cursor/rules/game-master-agents.mdc`
  - alwaysApply: true
  - Canonical six faces, Sage = integration
  - bars-agents as orchestrators, Cursor subagents as tools
  - Sage's mapping table
  - When to use sage_consult vs mcp_task
  - Tool mapping (architect_draft→architect, etc.)
- [x] **2.2** Add See Also in `.cursorrules` for game-master-agents

## Phase 3: MCP Instructions

- [x] **3.1** Expand FastMCP instructions in `backend/app/mcp_server.py`
  - Six faces listed explicitly
  - Sage = integration/synthesis agent
  - Do not confuse with Cursor mcp_task subagents
  - For BARS domain work, use these tools

## Phase 4: Documentation

- [x] **4.1** Update `docs/AGENT_WORKFLOWS.md`
  - Section: When to use bars-agents vs mcp_task
  - Section: Game Master → Cursor subagent mapping (table)
  - Note: MCP wrapper ensures backend before spawn

## Verification

- [x] **V1** Run `npm run mcp:serve:with-backend` with backend stopped — backend auto-starts, MCP runs (verified)
- [x] **V2** Cursor invokes bars-agents — tools work (or wrapper runs successfully)
- [x] **V3** `npm run build` and `npm run check` pass
