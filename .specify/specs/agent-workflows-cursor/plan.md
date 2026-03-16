# Plan: Agent Workflows Cursor

## Overview

Enable agent workflows to run from Cursor without a separate terminal by (1) auto-starting the backend when scripts need it, and (2) exposing the six Game Master faces as MCP tools for Cursor AI.

## Phase 1: Backend Auto-Start

### 1.1 Create `src/lib/backend-health.ts`

- **`getBackendUrl()`** — returns `process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:8000'`
- **`checkBackendHealth(url?: string)`** — `GET ${url}/api/health` with 2s timeout; returns `{ ok: boolean; url: string; error?: string }`
- **`startBackendInBackground()`** — spawns `npm run dev:backend` with `spawn('npm', ['run', 'dev:backend'], { cwd: process.cwd(), detached: true, stdio: 'ignore', env: process.env, shell: true })`
- **`ensureBackendReady(options?: { url?: string; autoStart?: boolean })`**:
  1. `url = options?.url ?? getBackendUrl()`
  2. If `checkBackendHealth(url).ok` → return `url`
  3. If `autoStart === false` → throw with clear message
  4. Call `startBackendInBackground()`, log "Backend not running. Starting it in background..."
  5. Poll `checkBackendHealth(url)` every 1s for up to 30s
  6. If ready → return `url`; if timeout → throw

### 1.2 Wire scripts

Each script: parse `--no-auto-start`, call `await ensureBackendReady({ url: BACKEND_URL, autoStart: !NO_AUTO_START })` before any agent fetch.

| Script | BACKEND_URL source |
|--------|--------------------|
| sage-brief.ts | `flag('backend') ?? env ?? default` |
| sage-deft-plan.ts | Same |
| sage-backlog-assess.ts | `--backend=` or env |
| conclave-analyze.ts | Add `--backend` to parseArgs; env default |
| gather-clone-analyze.ts | Add `--backend`; env default |
| run-parallel-feature.ts | `getBackendUrl()` from backend-health |
| analyze-books-local.ts | `BACKEND_URL` env |

### 1.3 Documentation

Create `docs/AGENT_WORKFLOWS.md`: run-from-Cursor, manual mode, scripts list, troubleshooting.

Link from `docs/ENV_AND_VERCEL.md` under "Python Backend".

## Phase 2: MCP Server

### 2.1 Add dependency

Add `fastmcp` to `backend/pyproject.toml` dependencies.

### 2.2 Create `backend/app/mcp_server.py`

- Use FastMCP; create MCP app with tools
- Each tool imports agent logic from `app.agents.*` (architect, challenger, shaman, regent, diplomat, sage)
- Tools run agents in-process; create async DB session per request (or use sync fallback when DATABASE_URL missing)
- Entrypoint: `if __name__ == "__main__": mcp.run(transport="stdio")`

Tools to expose:
- `architect_draft(narrative_lock, quest_grammar)`
- `architect_compile(unpacking_answers_json, ...)`
- `architect_analyze_chunk(chunk_text, domain_hint)`
- `challenger_propose(context_json)`
- `shaman_read(context_json)`
- `shaman_identify(free_text)`
- `regent_assess(context_json)`
- `diplomat_guide(context_json)`
- `diplomat_bridge(narrative_text, move_type)`
- `diplomat_refine_copy(target_type, current_copy, context)`
- `sage_consult(question)`

### 2.3 Cursor MCP config

Create `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "bars-agents": {
      "command": "uv",
      "args": ["run", "python", "-m", "app.mcp_server"],
      "cwd": "${workspaceFolder}/backend"
    }
  }
}
```

### 2.4 npm script

Add to `package.json`: `"mcp:serve": "cd backend && uv run python -m app.mcp_server"`

## Phase 3: Verification

### 3.1 Script auto-start

1. Stop backend if running
2. Run `npm run sage:brief` — backend should start, brief should complete
3. Run `npm run sage:brief -- --no-auto-start` with backend stopped — should exit with instructions

### 3.2 MCP

1. Add bars-agents to Cursor MCP (or use project `.cursor/mcp.json`)
2. In Cursor, use a tool (e.g. sage_consult) — MCP should spawn and return result

## File Summary

| Action | Path |
|--------|------|
| Create | `src/lib/backend-health.ts` |
| Modify | `scripts/sage-brief.ts`, `sage-deft-plan.ts`, `sage-backlog-assess.ts` |
| Modify | `scripts/conclave-analyze.ts`, `gather-clone-analyze.ts`, `run-parallel-feature.ts`, `analyze-books-local.ts` |
| Create | `docs/AGENT_WORKFLOWS.md` |
| Modify | `docs/ENV_AND_VERCEL.md` |
| Modify | `backend/pyproject.toml` (add fastmcp) |
| Create | `backend/app/mcp_server.py` |
| Create | `.cursor/mcp.json` |
| Modify | `package.json` (mcp:serve) |
