#!/usr/bin/env npx tsx
/**
 * Verify bars-agents MCP prerequisites before treating "MCP unavailable" as final.
 *
 * Checks:
 * 1. `.cursor/mcp.json` defines `bars-agents` (project MCP config)
 * 2. Backend is reachable (auto-starts via ensureBackendReady, same as MCP wrapper)
 * 3. `backend/app/mcp_server.py` imports — FastMCP `bars-agents` present
 *
 * This does NOT list Cursor UI tools — after this passes, confirm in Cursor:
 * Settings → MCP → bars-agents enabled. Reload window if the server does not appear.
 *
 * Usage: npm run verify:bars-agents-mcp
 */
import { config } from 'dotenv'

config({ path: '.env.local', quiet: true })
config({ path: '.env', quiet: true })

import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { ensureBackendReady } from '../src/lib/backend-health'

const BASE = 'http://localhost:8000'

async function main() {
  const root = process.cwd()
  const mcpPath = join(root, '.cursor', 'mcp.json')

  if (!existsSync(mcpPath)) {
    console.error('❌ Missing .cursor/mcp.json')
    console.error('   Create it per docs/AGENT_WORKFLOWS.md § MCP availability (do not skip).')
    process.exit(1)
  }

  let mcp: { mcpServers?: Record<string, { command?: string; args?: unknown }> }
  try {
    mcp = JSON.parse(readFileSync(mcpPath, 'utf-8')) as typeof mcp
  } catch (e) {
    console.error('❌ Could not parse .cursor/mcp.json:', e)
    process.exit(1)
  }

  const bars = mcp.mcpServers?.['bars-agents']
  if (!bars) {
    console.error('❌ mcpServers.bars-agents is missing in .cursor/mcp.json')
    process.exit(1)
  }

  const args = Array.isArray(bars.args) ? bars.args : []
  const argStr = args.map(String).join(' ')
  const usesWrapperScript =
    argStr.includes('run-bars-agents-mcp.sh') || argStr.includes('mcp-serve-with-backend')
  if (!usesWrapperScript) {
    console.warn(
      '⚠️  bars-agents should use scripts/run-bars-agents-mcp.sh or mcp-serve-with-backend.ts (see docs/CURSOR_MCP_TROUBLESHOOTING.md).'
    )
  }

  console.log('✓ .cursor/mcp.json defines bars-agents\n')

  console.log('   Ensuring backend is ready (auto-start if needed)...')
  try {
    await ensureBackendReady({ url: BASE, autoStart: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('❌ Backend not ready:', msg)
    console.error('   Fix: npm run dev:backend, or install uv in backend/. See docs/AGENT_WORKFLOWS.md')
    process.exit(1)
  }

  try {
    execSync(
      `uv run python -c "from app.mcp_server import mcp; assert mcp.name == 'bars-agents'"`,
      {
        cwd: join(root, 'backend'),
        stdio: 'pipe',
        env: process.env,
      }
    )
  } catch {
    console.error('❌ backend app.mcp_server failed to import.')
    console.error('   Fix: cd backend && uv sync && uv run python -c "from app.mcp_server import mcp"')
    process.exit(1)
  }

  console.log('✓ app.mcp_server loads (FastMCP name=bars-agents)\n')

  console.log('✅ CLI verification passed.\n')
  console.log('📌 Cursor (required for AI tool calls):')
  console.log('   • Open Settings → MCP')
  console.log('   • Ensure **bars-agents** is ON (project uses .cursor/mcp.json)')
  console.log('   • If it is missing: Command Palette → “Developer: Reload Window”')
  console.log('   • Smoke tools: invoke **sage_consult** from the agent; or run npm run mcp:serve:with-backend\n')
  console.log('Do not skip this — strand consult / sage_consult in Cursor depends on MCP.\n')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
