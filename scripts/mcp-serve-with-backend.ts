#!/usr/bin/env npx tsx
/**
 * MCP wrapper: ensures backend is ready before spawning bars-agents MCP.
 * Cursor invokes this instead of the MCP directly so bars-agents works
 * even when the backend hasn't been started manually.
 *
 * Usage: npx tsx scripts/mcp-serve-with-backend.ts
 * Or: npm run mcp:serve:with-backend
 */

import { config } from 'dotenv'
import { spawn } from 'child_process'

// Load env so children (backend, MCP) inherit OPENAI_API_KEY
config({ path: '.env.local' })
config({ path: '.env' })
import { join } from 'path'
import { ensureBackendReady } from '../src/lib/backend-health'

async function main(): Promise<void> {
  try {
    // Use localhost explicitly — we start the local backend, not production
    await ensureBackendReady({ url: 'http://localhost:8000', autoStart: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('MCP wrapper: backend not ready:', msg)
    process.exit(1)
  }

  const child = spawn('uv', ['run', 'python', '-m', 'app.mcp_server'], {
    cwd: join(process.cwd(), 'backend'),
    stdio: 'inherit',
    env: process.env,
  })

  child.on('exit', (code, signal) => {
    process.exit(code ?? (signal ? 1 : 0))
  })
}

main()
