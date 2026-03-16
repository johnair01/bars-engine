# Prompt: Agent Workflows Cursor

**Use this prompt when implementing run-from-Cursor agent workflows and MCP server.**

## Objective

Implement the Agent Workflows Cursor spec per [.specify/specs/agent-workflows-cursor/spec.md](../specs/agent-workflows-cursor/spec.md). Enable all agent scripts to run from Cursor without a separate terminal (auto-start backend when needed). Expose the six Game Master faces as MCP tools for Cursor AI.

## Checklist

### Phase 1: Backend Auto-Start

- [ ] Create `src/lib/backend-health.ts` with getBackendUrl, checkBackendHealth, startBackendInBackground, ensureBackendReady
- [ ] Wire sage-brief, sage-deft-plan, sage-backlog-assess, conclave-analyze, gather-clone-analyze, run-parallel-feature, analyze-books-local to ensureBackendReady
- [ ] Add `--no-auto-start` flag to all backend-dependent scripts
- [ ] Create `docs/AGENT_WORKFLOWS.md` and link from `docs/ENV_AND_VERCEL.md`

### Phase 2: MCP Server

- [ ] Add `fastmcp` to `backend/pyproject.toml`
- [ ] Create `backend/app/mcp_server.py` with six-face tools
- [ ] Create `.cursor/mcp.json` for bars-agents
- [ ] Add `npm run mcp:serve` to package.json

## Reference

- Spec: [.specify/specs/agent-workflows-cursor/spec.md](../specs/agent-workflows-cursor/spec.md)
- Plan: [.specify/specs/agent-workflows-cursor/plan.md](../specs/agent-workflows-cursor/plan.md)
- Tasks: [.specify/specs/agent-workflows-cursor/tasks.md](../specs/agent-workflows-cursor/tasks.md)
