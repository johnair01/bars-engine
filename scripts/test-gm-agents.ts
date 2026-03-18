#!/usr/bin/env npx tsx
/**
 * Smoke test for Game Master agent outputs.
 * Calls backend /api/agents/* endpoints to verify deterministic and AI paths.
 *
 * Usage: npx tsx scripts/test-gm-agents.ts
 *        npx tsx scripts/test-gm-agents.ts --with-backend  (auto-start backend)
 * Requires: Backend running (npm run dev:backend) or --with-backend
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

import { ensureBackendReady } from '../src/lib/backend-health'

const BASE = process.env.BACKEND_URL ?? 'http://localhost:8000'
const WITH_BACKEND = process.argv.includes('--with-backend')

async function fetchJson(path: string, body?: object): Promise<unknown> {
  const res = await fetch(`${BASE}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${path}`)
  return res.json()
}

async function main() {
  if (WITH_BACKEND) {
    console.log('   Ensuring backend is ready...')
    await ensureBackendReady({ url: BASE, autoStart: true })
  }

  console.log('🔮 Game Master Agent Output Test')
  console.log('   Backend:', BASE)
  console.log('')

  const tests: { name: string; fn: () => Promise<unknown> }[] = [
    {
      name: 'Sage consult',
      fn: () => fetchJson('/api/agents/sage/consult', { question: 'What is the BARS Engine in one sentence?' }),
    },
    {
      name: 'Architect draft',
      fn: () =>
        fetchJson('/api/agents/architect/draft', {
          narrative_lock: 'A player fears sharing their work',
          quest_grammar: 'epiphany_bridge',
        }),
    },
    {
      name: 'Challenger propose',
      fn: () => fetchJson('/api/agents/challenger/propose', {}),
    },
    {
      name: 'Shaman read',
      fn: () => fetchJson('/api/agents/shaman/read', { context: 'Current state' }),
    },
    {
      name: 'Regent assess',
      fn: () => fetchJson('/api/agents/regent/assess', { instance_id: 'default' }),
    },
    {
      name: 'Diplomat guide',
      fn: () => fetchJson('/api/agents/diplomat/guide', {}),
    },
  ]

  for (const { name, fn } of tests) {
    process.stdout.write(`   ${name}... `)
    try {
      const out = await fn()
      const preview = JSON.stringify(out).slice(0, 80) + (JSON.stringify(out).length > 80 ? '...' : '')
      console.log('✓', preview)
    } catch (e) {
      console.log('✗', e instanceof Error ? e.message : String(e))
    }
  }

  console.log('')
  console.log('✅ Done. Check outputs above. With OPENAI_API_KEY: AI responses. Without: deterministic fallbacks.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
