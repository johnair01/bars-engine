#!/usr/bin/env npx tsx
/**
 * MCP wrapper: ensures backend is ready before spawning bars-agents MCP.
 * Cursor invokes this instead of the MCP directly so bars-agents works
 * even when the backend hasn't been started manually.
 *
 * STDIO rule: Cursor speaks JSON-RPC on our stdout. Do not write ANYTHING to stdout
 * except what the child MCP process emits (stdio: 'inherit' after spawn).
 * Use quiet dotenv, quiet ensureBackendReady, and stderr for wrapper errors.
 *
 * Usage: npx tsx scripts/mcp-serve-with-backend.ts
 * Or: npm run mcp:serve:with-backend
 */

import { config } from 'dotenv'
import { spawn } from 'child_process'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

// Load env so children (backend, MCP) inherit OPENAI_API_KEY — quiet: no tips on stdout
config({ path: '.env.local', quiet: true })
config({ path: '.env', quiet: true })

import { ensureBackendReady } from '../src/lib/backend-health'

/** Cursor GUI often has no Homebrew on PATH; resolve uv like the shell wrapper would. */
function resolveUvExecutable(): string {
  const fromEnv = process.env.UV_EXECUTABLE?.trim()
  if (fromEnv && existsSync(fromEnv)) return fromEnv

  const home = process.env.HOME ?? ''
  const candidates = [
    '/opt/homebrew/bin/uv',
    '/usr/local/bin/uv',
    join(home, '.local/bin/uv'),
    join(home, '.cargo/bin/uv'),
  ]
  for (const p of candidates) {
    if (p && existsSync(p)) return p
  }

  try {
    const pathEnv = `/opt/homebrew/bin:/usr/local/bin:${process.env.PATH ?? ''}`
    const out = execSync('command -v uv', {
      encoding: 'utf-8',
      shell: '/bin/bash',
      env: { ...process.env, PATH: pathEnv },
    }).trim()
    if (out) return out
  } catch {
    /* ignore */
  }

  return 'uv'
}

async function main(): Promise<void> {
  try {
    await ensureBackendReady({
      url: 'http://localhost:8000',
      autoStart: true,
      quiet: true,
      // Avoid OpenAI warning on stderr polluting MCP logs unnecessarily
      skipOpenAIWarning: true,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('MCP wrapper: backend not ready:', msg)
    process.exit(1)
  }

  const uv = resolveUvExecutable()
  const child = spawn(uv, ['run', 'python', '-m', 'app.mcp_server'], {
    cwd: join(process.cwd(), 'backend'),
    stdio: 'inherit',
    env: process.env,
  })

  child.on('error', (err) => {
    console.error(
      'MCP wrapper: failed to spawn uv. Install: https://docs.astral.sh/uv/ — or set UV_EXECUTABLE to the full path to uv.',
      err
    )
    process.exit(1)
  })

  child.on('exit', (code, signal) => {
    process.exit(code ?? (signal ? 1 : 0))
  })
}

main()
