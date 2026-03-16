# Spec: Agent Workflows Cursor

## Purpose

Enable all agent workflows to run from Cursor without a separate terminal. Scripts auto-start the backend when needed. MCP server exposes the six Game Master faces as Cursor AI tools so the AI can invoke agents directly.

**Problem**: Agent scripts (sage:brief, run:parallel-feature, etc.) require `npm run dev:backend` in another terminal. Contributors get stuck when the backend is not running. Cursor AI cannot invoke agents directly.

**Practice**: Deftness Development — run from one place, fail fast with clear instructions when manual steps are needed.

## Design Decisions

| Topic | Decision |
|-------|----------|
| **Script auto-start** | Scripts call `ensureBackendReady()` before agent calls; auto-start backend if down (unless `--no-auto-start`) |
| **Manual mode** | `--no-auto-start` flag exits with clear instructions when backend is down |
| **MCP server** | Runs agents in-process; no HTTP backend needed for MCP flows. Cursor spawns MCP when tools are used. |
| **Backend spawn** | Use `npm run dev:backend` via child_process; detached, stdio: ignore; poll `/api/health` until ready (max 30s) |

## User Stories

### P1: Run from Cursor

**As a contributor**, I want to run `npm run sage:brief` from Cursor's terminal and have the backend start automatically if needed, so I don't need to manage another terminal.

**Acceptance**: Run `npm run sage:brief`; if backend is down, script starts it in background, waits for health, then proceeds.

### P2: Manual mode

**As a contributor**, I want to use `--no-auto-start` to fail fast with clear instructions when the backend is down, so I can start it myself in a separate terminal if preferred.

**Acceptance**: `npm run sage:brief -- --no-auto-start` with backend down prints: "Backend not reachable at {url}. Start it with: npm run dev:backend. Or omit --no-auto-start to have the script start it automatically." and exits 1.

### P3: Cursor AI tools

**As a contributor**, I want Cursor AI to call architect_draft, sage_consult, etc. via MCP tools, so I can invoke agents from Composer/Chat without running scripts.

**Acceptance**: Add bars-agents to Cursor MCP config; Cursor spawns MCP when tools are used; tools run agents in-process.

## Functional Requirements

### Phase 1: Backend Auto-Start

- **FR1**: Create `src/lib/backend-health.ts` with `getBackendUrl`, `checkBackendHealth`, `startBackendInBackground`, `ensureBackendReady`
- **FR2**: Wire sage-brief, sage-deft-plan, sage-backlog-assess, conclave-analyze, gather-clone-analyze, run-parallel-feature, analyze-books-local to `ensureBackendReady`
- **FR3**: Add `--no-auto-start` flag to all backend-dependent scripts
- **FR4**: Create `docs/AGENT_WORKFLOWS.md` documenting run-from-Cursor flows

### Phase 2: MCP Server

- **FR5**: Create MCP server at `backend/app/mcp_server.py` exposing six-face tools: architect_draft, architect_compile, architect_analyze_chunk, challenger_propose, shaman_read, shaman_identify, regent_assess, diplomat_guide, diplomat_bridge, diplomat_refine_copy, sage_consult
- **FR6**: Add `fastmcp` to `backend/pyproject.toml` dependencies
- **FR7**: Create `.cursor/mcp.json` config for bars-agents MCP server
- **FR8**: Add `npm run mcp:serve` script

## Scripts That Need Backend

| Script | npm command |
|--------|------------|
| Sage brief | `sage:brief` |
| Sage deft plan | `sage:deft-plan` |
| Sage backlog assess | `sage:backlog-assess` |
| Conclave analyze | `conclave:analyze` |
| Gather analyze | `gather:analyze` |
| Run parallel feature | `run:parallel-feature` |
| Analyze books local | (direct: `tsx scripts/analyze-books-local.ts`) |

## References

- [backend/app/routes/agents.py](../../backend/app/routes/agents.py) — agent HTTP routes
- [src/lib/agent-client.ts](../../src/lib/agent-client.ts) — frontend agent client
- [docs/ENV_AND_VERCEL.md](../../docs/ENV_AND_VERCEL.md) — env and backend docs
