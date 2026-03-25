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

## Day-to-day dev vs deployed backend (precedence)

**Default story (prioritize this):** Agent scripts, `ensureBackendReady`, and the **bars-agents** MCP wrapper target **local** FastAPI at **`http://127.0.0.1:8000`** (or `http://localhost:8000`). That is the path this repo is built around: edit code, run `npm run dev:backend` (or let the wrapper auto-start), hit `/api/health`, use MCP.

| Context | Intended backend | Notes |
|--------|-------------------|--------|
| **Daily dev** (Cursor, MCP, `strand_run`, `sage:brief`, strand consult scripts) | **Local** `127.0.0.1:8000` | Omit `NEXT_PUBLIC_BACKEND_URL` / `BARS_BACKEND_URL` for MCP health, or set explicitly to `http://127.0.0.1:8000`. |
| **Next.js app** (browser → agents) | From `NEXT_PUBLIC_BACKEND_URL` or fallback in `agent-client` | Vercel Preview/Production often points at **deployed** Railway; that is separate from “is my laptop MCP talking to local Python?”. |
| **Intentional remote agents** | Deployed URL (`https://…railway.app`) | Opt-in: you are testing production/staging agents or not running local API. Align `OPENAI_API_KEY` on **that** host. |

**Why this matters:** `NEXT_PUBLIC_BACKEND_URL` is loaded into the same `.env.local` that the **Python MCP process** reads. If it points at Railway while you expect **local** agents, MCP tools (`strand_run`, etc.) health-check the wrong origin — or you get `openai_configured: false` on the remote host. **When helping someone or writing runbooks, assume local-first**; mention deployed URLs only as an explicit alternate.

**MCP health probe fallback (strand_run gate):** `backend/app/mcp_health.py` probes `GET /api/health` on the URL derived from env (with bare-host normalization). If that probe **fails** and the primary origin was **not** already `http://127.0.0.1:8000` or `http://localhost:8000`, it **retries once** against **`http://127.0.0.1:8000/api/health`**. So with `npm run dev:backend` running locally, a bad or unreachable Railway URL in `.env.local` should not block `strand_run` by itself.

**Pin MCP to local explicitly:** set **`BARS_MCP_HEALTH_ORIGIN=http://127.0.0.1:8000`** in `.env.local`. That variable **only** affects the MCP Python process health check (not the browser/Next agent client). Use it when you want Next to keep pointing at Vercel/Railway but Cursor **bars-agents** must talk to local FastAPI.

See [CURSOR_MCP_TROUBLESHOOTING.md](./CURSOR_MCP_TROUBLESHOOTING.md) (dev-first + bare-host URL fixes).

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

3. **Agent rule** — Do **not** skip MCP by substituting ad-hoc “Sage synthesis” in chat when the user required **bars-agents** / `sage_consult` / **`strand_run`**. If a tool call errors (health URL, backend down, etc.): report the exact error, run **`npm run verify:bars-agents-mcp`**, ensure **`npm run dev:backend`** (or the MCP wrapper) is up, set **`BARS_MCP_HEALTH_ORIGIN=http://127.0.0.1:8000`** if you need to force local probe, **Reload Window**, and **retry the tool** — or **ask the user** how they want to proceed. Do **not** silently substitute inline synthesis without that loop and, when unclear, without **asking the user**.

4. **Optional smoke** — `npm run test:gm-agents` exercises HTTP `/api/agents/*` (same agents as MCP, not the MCP pipe).

5. **MCP errors in Cursor** — If **bars-agents** (or another server) shows **Error** → **Show output**, see [CURSOR_MCP_TROUBLESHOOTING.md](./CURSOR_MCP_TROUBLESHOOTING.md) (what to paste, PATH/`uv` fixes). This repo uses `bash scripts/run-bars-agents-mcp.sh` so Homebrew `uv`/`npx` are on PATH when Cursor was opened from the Dock.

## MCP server (Cursor AI tools)

The six Game Master faces are exposed as MCP tools so Cursor AI can invoke them directly:

- **Setup**: Add `bars-agents` to Cursor MCP config (see `.cursor/mcp.json`)
- **Verify**: `npm run verify:bars-agents-mcp` before relying on MCP in a workflow
- **Run**: `npm run mcp:serve` to start the MCP server manually, or let Cursor spawn it when tools are used
- **MCP wrapper**: `.cursor/mcp.json` points to `scripts/mcp-serve-with-backend.ts`, which ensures the backend is ready (auto-starts if needed) before spawning the MCP. Use `npm run mcp:serve:with-backend` for manual testing.
- **Reload after MCP code changes**: Cursor keeps the **bars-agents** Python process running until you reconnect it. If you edit `backend/app/mcp_server.py` (or other MCP server code), the old process may still be in memory, so tools can behave like the previous version (wrong async/sync path, confusing DB errors, etc.). **After changing MCP server code**, use **Command Palette → Developer: Reload Window**, or turn **bars-agents** off and on under **Settings → MCP**, so Cursor spawns a fresh process.

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

**Strand BAR ownership**: New strand BARs use `creatorId` = a dedicated agent `Player` (not arbitrary first user). Configure `STRAND_CREATOR_PLAYER_ID` in backend env or run `npm run seed:strand-agent` so **`BARS Strand Agent`** exists. See [ENV_AND_VERCEL.md](./ENV_AND_VERCEL.md) § STRAND_CREATOR_PLAYER_ID.

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

**Wrong `NEXT_PUBLIC_BACKEND_URL`**: See [Day-to-day dev vs deployed backend (precedence)](#day-to-day-dev-vs-deployed-backend-precedence). If `.env.local` points MCP/scripts at Railway while you meant local, or the remote host has no key, you get `openai_configured: false` or consult failures. For local dev, prefer unset or `http://127.0.0.1:8000`; use `--backend http://localhost:8000` on assess/brief scripts when overriding.

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
