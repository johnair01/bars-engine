# Cursor MCP troubleshooting (bars-agents, Ouroboros)

When an MCP server shows **Error** and **Show output**, use this to fix it or to paste the right information for help.

## What to copy from “Show output”

1. Click **Show output** (or open **View → Output**, choose the MCP log from the dropdown).
2. Copy **everything** from the **first line** through the **first error / Traceback / exit code** (about 40–80 lines is usually enough).
3. Especially useful:
   - `command not found: …` (uv, npx, node, python, tsx)
   - `MCP wrapper: backend not ready: …`
   - Python `Traceback: …`
   - `ModuleNotFoundError`, `DATABASE_URL`, `Connection refused`
   - `exit code 1` with **no** other text (often PATH or silent failure — still paste it)

**You don’t need to guess which line is “the” line** — paste the whole output panel from the top through the end of the error block.

## bars-agents (this repo)

### How it starts

1. Cursor runs `.cursor/mcp.json` → `bash scripts/run-bars-agents-mcp.sh` → `npx tsx scripts/mcp-serve-with-backend.ts`.
2. Wrapper ensures backend on `http://localhost:8000` (may auto-start), **without printing to stdout** (MCP JSON-RPC uses stdout).
3. Wrapper runs **`uv run python -m app.mcp_server`** in `backend/`, with stdio inherited so **Python** is the real MCP server on stdio.

### Fix: `Unexpected token 'd', "[dotenv@17."... is not valid JSON`

The MCP client only understands JSON on **stdout**. Anything else (dotenv tips, `console.log` from “Backend ready”) breaks the stream.

**Repo fix:** `mcp-serve-with-backend.ts` uses `dotenv` with `{ quiet: true }` and `ensureBackendReady({ quiet: true })`. Pull latest and **Reload Window**.

### Fix: `Error: spawn uv ENOENT` / `syscall: 'spawn uv'`

Cursor is often started from the Dock (GUI), which has a **minimal PATH** (no Homebrew). The wrapper now **resolves `uv` to a full path** (`/opt/homebrew/bin/uv`, `~/.local/bin/uv`, etc.) before spawning.

**Try in order:**

1. **Install `uv`** (Astral) if you don’t have it:

   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

   Then confirm: `which uv` (e.g. `/opt/homebrew/bin/uv` or `~/.local/bin/uv`).

2. **Point the wrapper explicitly** (optional):

   ```bash
   # in .env.local (repo root)
   UV_EXECUTABLE=/opt/homebrew/bin/uv
   ```

   Use the path from `which uv`.

3. **Use the shell wrapper** (repo default): `.cursor/mcp.json` → `bash scripts/run-bars-agents-mcp.sh`.

4. **Start Cursor from a terminal** (inherits your shell PATH):

   ```bash
   cd /path/to/bars-engine
   cursor .
   ```

5. **Manual verify**:

   ```bash
   cd /path/to/bars-engine
   npm run verify:bars-agents-mcp
   ```

### Fix: `MCP wrapper: backend not ready`

- Run `npm run dev:backend` once manually and watch for errors.
- Ensure `.env.local` has a working `DATABASE_URL` if the API expects DB on startup.
- See `docs/AGENT_WORKFLOWS.md` and `npm run diagnose:connection`.

### Fix: Python / `app.mcp_server` errors

```bash
cd backend && uv sync && uv run python -c "from app.mcp_server import mcp"
```

If that fails, paste the **full** terminal output (not only Cursor).

## Ouroboros (plugin)

Ouroboros is usually configured **outside** this repo (user / global Cursor MCP). The same rules apply:

- Copy **full Show output** from the top.

### Fix: `spawn uvx ENOENT`

The plugin runs `uvx --python 3.14 --from ouroboros-ai …`. **`uvx` ships with `uv`** — same root cause as bars-agents: **Cursor can’t find `uv` / `uvx`**.

1. Install **uv** (see above); confirm `which uvx` in Terminal.
2. In **Cursor → Settings → MCP**, open the **Ouroboros** server config. If there is an **Environment** / **Env** field, set e.g.:

   `PATH=/opt/homebrew/bin:/usr/local/bin:<rest of your PATH>`

   (Get a full PATH from Terminal: `echo $PATH`.)
3. Or launch **Cursor from Terminal** so it inherits PATH: `cursor .`

If the log mentions a path or command, run that command in **Terminal** and paste **that** output too — often clearer than the MCP panel alone.

## Quick checklist

| Check | Command or action |
|--------|-------------------|
| Repo MCP verify | `npm run verify:bars-agents-mcp` |
| Backend | `npm run dev:backend` |
| Backend health | Open `http://localhost:8000/api/health` |
| Cursor PATH | Launch `cursor .` from terminal from repo root |
| Reload MCP | Command Palette → **Developer: Reload Window** |

## Still stuck?

Paste into an issue / chat:

1. **OS** (e.g. macOS 14) and **Cursor version** (Help → About).
2. **Full** MCP “Show output” for **bars-agents** (top through error).
3. **Full** MCP “Show output” for **ouroboros** (same).
4. Result of: `npm run verify:bars-agents-mcp` (terminal, from repo root).

No need to trim — we can skim for the real error line.
