# Plan: Game Master Agents Cursor Integration

## Overview

Implement MCP wrapper for backend auto-start, Cursor rule for agent names and subagent mapping, expanded MCP instructions, and documentation. Bars-agents become orchestrators; Cursor subagents become their tools.

## Phase 1: MCP Wrapper

### 1.1 Create `scripts/mcp-serve-with-backend.ts`

- Import `ensureBackendReady` from `src/lib/backend-health`
- Import `spawn` from `child_process`, `join` from `path`
- Async main: `await ensureBackendReady({ autoStart: true })`
- Spawn: `uv run python -m app.mcp_server` with `cwd: join(process.cwd(), 'backend')`, `stdio: 'inherit'`, `env: process.env`
- On child exit: `process.exit(code ?? 0)`
- Handle ensureBackendReady rejection: log and exit 1

### 1.2 Update `.cursor/mcp.json`

Change bars-agents from:

```json
"command": "uv",
"args": ["run", "python", "-m", "app.mcp_server"],
"cwd": "${workspaceFolder}/backend"
```

To:

```json
"command": "npx",
"args": ["tsx", "scripts/mcp-serve-with-backend.ts"],
"cwd": "${workspaceFolder}"
```

### 1.3 Add npm script

In package.json: `"mcp:serve:with-backend": "tsx scripts/mcp-serve-with-backend.ts"`

## Phase 2: Cursor Rule

### 2.1 Create `.cursor/rules/game-master-agents.mdc`

Frontmatter: `alwaysApply: true`, `description: "Game Master faces and Cursor subagent mapping"`

Content:
- Canonical six faces: shaman, regent, challenger, architect, diplomat, sage
- Sage = integration agent (synthesis, meta, coordination, cross-cutting)
- bars-agents as orchestrators; Cursor subagents as tools
- Mapping: shaman→explore, regent→evaluator, challenger→contrarian, architect→generalPurpose, diplomat→simplifier, sage→evaluator
- When integration needed: sage_consult (bars-agents) or mcp_task evaluator
- Prefer bars-agents MCP tools for BARS domain work
- Tool mapping: architect_draft/architect_compile→architect, challenger_propose→challenger, shaman_read/shaman_identify→shaman, regent_assess→regent, diplomat_guide/diplomat_bridge→diplomat, sage_consult→sage

### 2.2 Update `.cursorrules`

Add to See Also: `- **\`.cursor/rules/game-master-agents.mdc\`** — Game Master faces, Cursor subagent mapping, when to use bars-agents`

## Phase 3: MCP Instructions

### 3.1 Expand `backend/app/mcp_server.py` FastMCP instructions

Current: "Game Master agents for BARS Engine: Architect (quest design), Challenger (moves), Shaman (emotional reading), Regent (campaign), Diplomat (community), Sage (meta/synthesis). Use sage_consult for integrated guidance."

Add: "The six Game Master faces are shaman, regent, challenger, architect, diplomat, sage. Sage is the integration/synthesis agent — use sage_consult for meta, coordination, or cross-cutting questions. Do not confuse these with Cursor's mcp_task subagents (evaluator, contrarian, etc.). For BARS domain work, use these tools."

## Phase 4: Documentation

### 4.1 Update `docs/AGENT_WORKFLOWS.md`

Add section **When to use bars-agents vs mcp_task**:
- bars-agents: BARS domain work (quest design, emotional reading, campaign assessment, copy refinement, integration/synthesis)
- mcp_task: when delegating — use Sage's mapping (shaman→explore, regent→evaluator, challenger→contrarian, architect→generalPurpose, diplomat→simplifier, sage→evaluator)
- Sage = integration agent; use sage_consult or mcp_task evaluator

Add section **Game Master → Cursor subagent mapping** with the table from the spec.

Add note about MCP wrapper: Cursor invokes wrapper which ensures backend is ready before spawning MCP.

## File Impacts

| File | Action |
|------|--------|
| `scripts/mcp-serve-with-backend.ts` | Create |
| `.cursor/mcp.json` | Modify |
| `package.json` | Add script |
| `.cursor/rules/game-master-agents.mdc` | Create |
| `.cursorrules` | Add See Also |
| `backend/app/mcp_server.py` | Expand instructions |
| `docs/AGENT_WORKFLOWS.md` | Add sections |
