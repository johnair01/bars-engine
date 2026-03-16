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
3. Proceed with the agent call

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

## MCP server (Cursor AI tools)

The six Game Master faces are exposed as MCP tools so Cursor AI can invoke them directly:

- **Setup**: Add `bars-agents` to Cursor MCP config (see `.cursor/mcp.json`)
- **Run**: `npm run mcp:serve` to start the MCP server manually, or let Cursor spawn it when tools are used

Tools: `architect_draft`, `architect_compile`, `architect_analyze_chunk`, `challenger_propose`, `shaman_read`, `shaman_identify`, `regent_assess`, `diplomat_guide`, `diplomat_bridge`, `diplomat_refine_copy`, `sage_consult`, `sage_brief`.

## Troubleshooting

### Port 8000 in use

If another process is using port 8000, the backend will fail to start. Stop the other process or set `PORT` to a different value.

### Timeout waiting for backend

If the backend takes longer than 30s to start, the script exits. Check the backend logs for errors:

```bash
cd backend && uv run uvicorn app.main:app --reload --port 8000
```

### Backend already running

If the backend is already running, `ensureBackendReady` detects it and returns immediately. No duplicate process is started.
