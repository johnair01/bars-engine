# Agent Workflows — Run from Cursor

Agent scripts (Sage brief, parallel feature work, etc.) can run from Cursor's terminal without a separate backend process. When the backend is down, scripts auto-start it in the background.

## Run from Cursor (default)

One command; backend auto-starts when needed:

```bash
npm run sage:brief
npm run sage:deft-plan
npm run sage:backlog-assess
npm run conclave:analyze
npm run gather:analyze
npm run run:parallel-feature -- "Add daemon discovery to onboarding"
npx tsx scripts/analyze-books-local.ts all
```

If the backend is not running, the script will:

1. Start it in the background (`npm run dev:backend`)
2. Poll `/api/health` until ready (up to 30s)
3. **Call `/api/health` again and warn if `openai_configured` is false** (missing `OPENAI_API_KEY` in Python — see [OPENAI_API_KEY and backend](#openai_api_key-and-backend))
4. Proceed with the agent call

Strand consult scripts (`strand:consult*`, `strand:invitation`) use the same `ensureBackendReady` helper and accept **`--no-auto-start`** to fail fast without spawning the backend.

## Manual mode

Use `--no-auto-start` to fail fast with clear instructions when the backend is down:

```bash
npm run sage:brief -- --no-auto-start
```

If the backend is not reachable, the script prints:

```
Backend not reachable at http://localhost:8000. Start it with: npm run dev:backend. Or omit --no-auto-start to have the script start it automatically.
```

Then exits with code 1.

## Scripts that need the backend

| Script | npm command |
|--------|-------------|
| Sage brief | `sage:brief` |
| Sage deft plan | `sage:deft-plan` |
| Sage backlog assess | `sage:backlog-assess` |
| Strand consult (strand system) | `strand:consult` |
| Strand consult (Admin Agent Forge) | `strand:consult:forge` |
| Compost strand consults | `compost:strand-consults` (moves consult files from Done specs to `.specify/archive/strand-consults/`) |
| Conclave analyze | `conclave:analyze` |
| Gather analyze | `gather:analyze` |
| Run parallel feature | `run:parallel-feature` |
| Analyze books local | `npx tsx scripts/analyze-books-local.ts [bookId\|all\|extracted]` |

## Start backend manually

To run the backend in a separate terminal:

```bash
npm run dev:backend
```

This starts the backend at `http://localhost:8000`. The backend reads `DATABASE_URL` and `OPENAI_API_KEY` from `.env.local` or `.env`.

## MCP availability (do not skip)

**Strand consult**, **sage_consult**, and other flows that assume **bars-agents** in Cursor must not move on until MCP is actually available.

1. **CLI verification** (config + backend + Python MCP module):

   ```bash
   npm run verify:bars-agents-mcp
   ```

   Fix any failures (`.cursor/mcp.json`, `cd backend && uv sync`, `npm run dev:backend`) before concluding the stack works.

2. **Cursor UI** — After the script passes:

   - Open **Settings → MCP**
   - Ensure **bars-agents** is **enabled** (the project ships `.cursor/mcp.json`; Cursor loads it for this workspace)
   - If **bars-agents** does not appear: **Command Palette** → `Developer: Reload Window`

3. **Agent rule** — Do **not** skip MCP by substituting ad-hoc “Sage synthesis” in chat when the user required **bars-agents** / `sage_consult`. If tools still do not appear after verify + reload, stop and fix the environment; document the blocker in the strand/spec output.

4. **Optional smoke** — `npm run test:gm-agents` exercises HTTP `/api/agents/*` (same agents as MCP, not the MCP pipe).

5. **MCP errors in Cursor** — If **bars-agents** (or another server) shows **Error** → **Show output**, see [CURSOR_MCP_TROUBLESHOOTING.md](./CURSOR_MCP_TROUBLESHOOTING.md) (what to paste, PATH/`uv` fixes). This repo uses `bash scripts/run-bars-agents-mcp.sh` so Homebrew `uv`/`npx` are on PATH when Cursor was opened from the Dock.

## MCP server (Cursor AI tools)

The six Game Master faces are exposed as MCP tools so Cursor AI can invoke them directly:

- **Setup**: Add `bars-agents` to Cursor MCP config (see `.cursor/mcp.json`)
- **Verify**: `npm run verify:bars-agents-mcp` before relying on MCP in a workflow
- **Run**: `npm run mcp:serve` to start the MCP server manually, or let Cursor spawn it when tools are used
- **MCP wrapper**: `.cursor/mcp.json` points to `scripts/mcp-serve-with-backend.ts`, which ensures the backend is ready (auto-starts if needed) before spawning the MCP. Use `npm run mcp:serve:with-backend` for manual testing.

Tools: `architect_draft`, `architect_compile`, `architect_analyze_chunk`, `challenger_propose`, `shaman_read`, `shaman_identify`, `regent_assess`, `diplomat_guide`, `diplomat_bridge`, `diplomat_refine_copy`, `sage_consult`, `strand_run`.

## MCP Tool Contracts

| Tool | Input | Output |
|------|-------|--------|
| sage_consult | question: string | JSON: `{ synthesis: string, deterministic?: boolean, error?: string }` |
| architect_draft | narrative_lock: string, quest_grammar?: string | JSON: quest draft (title, description, quest_type, grammar, move_type, etc.) |
| architect_compile | unpacking_answers_json: string, quest_grammar?: string | JSON: `{ overview, node_texts, deterministic? }` or `{ error }` |
| architect_analyze_chunk | chunk_text: string, domain_hint?: string | JSON: quest draft (same shape as architect_draft) |
| challenger_propose | context?: string | JSON: move proposal (available_moves, recommended_move, reasoning, energy_assessment) |
| shaman_read | context?: string | JSON: emotional reading |
| shaman_identify | free_text: string | JSON: identification result |
| regent_assess | instance_id?: string | JSON: campaign assessment |
| diplomat_guide | context?: string | JSON: community guidance |
| diplomat_bridge | narrative_text: string, move_type?: string | JSON: bridged narrative |
| diplomat_refine_copy | target_type: string, current_copy: string, context?: string | JSON: refined copy |
| strand_run | subject: string, strand_type?: string | JSON: `{ strandBarId, outputBarIds, ... }` |

**Deterministic fallbacks**: When `OPENAI_API_KEY` is missing or an AI call fails, all tools return valid JSON via deterministic fallbacks. Output may include `"deterministic": true`.

**Test outputs**: Run `npm run test:gm-agents` to smoke-test all 6 agent APIs. Backend auto-starts if needed. Use to verify deterministic and AI paths.

## When to use bars-agents vs mcp_task

- **bars-agents**: BARS domain work — quest design, emotional reading, campaign assessment, copy refinement, **integration/synthesis**. Use `sage_consult` for meta, coordination, or cross-cutting questions.
- **mcp_task**: When delegating to Cursor subagents — use the Sage's mapping below. bars-agents are orchestrators; Cursor subagents are their tools.
- **Sage = integration agent**: Use `sage_consult` or `mcp_task` with subagent_type `evaluator`.

## Game Master → Cursor subagent mapping

| Game Master | Cursor subagent | Rationale |
|-------------|-----------------|-----------|
| shaman | explore | Emotional states, hidden aspects; exploratory |
| regent | evaluator | Structures, systems; assessment |
| challenger | contrarian | Boundaries, narratives; skeptical lens |
| architect | generalPurpose | Quest design, strategy; versatile |
| diplomat | simplifier | Community, relationships; clarifies |
| sage | evaluator | Integration, synthesis, emergence |

## Troubleshooting

### OPENAI_API_KEY and backend

The **FastAPI app** (`npm run dev:backend`) loads env files in this order (later overrides earlier):

| File | Purpose |
|------|--------|
| `backend/.env` | Backend-only overrides |
| `.env` (repo root) | Shared secrets some teams use instead of `.env.local` |
| `.env.local` (repo root) | **Recommended** for local dev (same as Next.js) |

Set:

```bash
OPENAI_API_KEY=sk-...
```

**Verify the key is visible to Python** (not only Node):

```bash
# Backend must be running
curl -s http://localhost:8000/api/health
```

Expect `"openai_configured": true`. If `false`, the key is missing from those files or the backend needs a restart after editing env.

**Anti-fragile checks** (use in CI or before agent work):

| Command | What it checks |
|---------|----------------|
| `npm run smoke` | `OPENAI_API_KEY` present in **Node** env (`.env.local` / `.env`) |
| `npm run loop:ready -- --quick` | If backend is up, `openai_configured` via `/api/health` |
| `curl -s http://localhost:8000/api/health` | Backend’s merged settings (source of truth for agents) |

**Common pitfall**: Key only in Vercel or only in a shell export — fine for that session, but `uvicorn` started from another terminal/Cursor won’t see it unless it’s in one of the files above.

**Wrong `NEXT_PUBLIC_BACKEND_URL`**: Scripts that call Sage default to `localhost:8000`. If `.env.local` points at a remote Railway URL that has no key, you get healthy `/api/health` but `openai_configured: false`, or consult failures. For local dev, use `--backend http://localhost:8000` on assess/brief scripts or align the env var with where your keyed backend runs.

### Generic or deterministic agent output (Sage, strand, sage:brief)

**Symptom**: Sage consult returns "Without AI routing, consider..." or "deterministic fallback". Strand outputs are shallow. sage:brief shows routing hints instead of synthesis.

**Cause**: `OPENAI_API_KEY` is missing or not loaded in the backend environment. The backend reads env from the repo root `.env.local` (or `.env`). When the key is absent, all agents use deterministic fallbacks — no AI calls.

**Fix**:
1. Add `OPENAI_API_KEY=sk-...` to `.env.local` at the repo root.
2. Restart the backend (`npm run dev:backend`).
3. Verify: `npm run smoke` checks for the key.

Without this key, agent workflows are severely limited. It is a core dependency for how the app works. See [docs/OPENAI_KEY_BRITTLENESS_ANALYSIS.md](OPENAI_KEY_BRITTLENESS_ANALYSIS.md) for env loading analysis.

### Port 8000 in use

If another process is using port 8000, the backend will fail to start. Stop the other process or set `PORT` to a different value.

### Timeout waiting for backend

If the backend takes longer than 30s to start, the script exits. Check the backend logs for errors:

```bash
cd backend && uv run uvicorn app.main:app --reload --port 8000
```

### Backend already running

If the backend is already running, `ensureBackendReady` detects it and returns immediately. No duplicate process is started.
