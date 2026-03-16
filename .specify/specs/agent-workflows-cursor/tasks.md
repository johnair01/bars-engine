# Tasks: Agent Workflows Cursor

## Phase 1: Backend Auto-Start

- [ ] **1.1** Create `src/lib/backend-health.ts`
  - `getBackendUrl()`, `checkBackendHealth(url?)`, `startBackendInBackground()`, `ensureBackendReady(options?)`
- [ ] **1.2** Wire `scripts/sage-brief.ts` to `ensureBackendReady`, add `--no-auto-start`
- [ ] **1.3** Wire `scripts/sage-deft-plan.ts` to `ensureBackendReady`, add `--no-auto-start`
- [ ] **1.4** Wire `scripts/sage-backlog-assess.ts` to `ensureBackendReady`, add `--no-auto-start`
- [ ] **1.5** Wire `scripts/conclave-analyze.ts` to `ensureBackendReady`, add `--backend` and `--no-auto-start`
- [ ] **1.6** Wire `scripts/gather-clone-analyze.ts` to `ensureBackendReady`, add `--backend` and `--no-auto-start`
- [ ] **1.7** Wire `scripts/run-parallel-feature.ts` to `ensureBackendReady` before `runParallelFeatureWork`
- [ ] **1.8** Wire `scripts/analyze-books-local.ts` to `ensureBackendReady`, replace health check
- [ ] **1.9** Create `docs/AGENT_WORKFLOWS.md` and link from `docs/ENV_AND_VERCEL.md`

## Phase 2: MCP Server

- [ ] **2.1** Add `fastmcp` to `backend/pyproject.toml` dependencies
- [ ] **2.2** Create `backend/app/mcp_server.py` with six-face tools
  - architect_draft, architect_compile, architect_analyze_chunk
  - challenger_propose, shaman_read, shaman_identify
  - regent_assess, diplomat_guide, diplomat_bridge, diplomat_refine_copy
  - sage_consult
- [ ] **2.3** Create `.cursor/mcp.json` for bars-agents MCP server
- [ ] **2.4** Add `npm run mcp:serve` to `package.json`

## Phase 3: Verification

- [ ] **3.1** Run `npm run sage:brief` with backend stopped — backend auto-starts, brief completes
- [ ] **3.2** Run `npm run sage:brief -- --no-auto-start` with backend stopped — exits with instructions
- [ ] **3.3** Verify MCP tools work from Cursor (or `npm run mcp:serve` for manual test)
