#!/usr/bin/env npx tsx
/**
 * Diagnose strand execution: health check, run a short strand, report timing.
 *
 * Usage:
 *   npx tsx scripts/strand-diagnose.ts
 *   npx tsx scripts/strand-diagnose.ts --run-strand "short subject"
 *
 * Requires: Backend running (npm run dev:backend)
 * Backend URL: http://localhost:8000 (or NEXT_PUBLIC_BACKEND_URL)
 */

import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

const useLocal = process.argv.includes('--local')
const raw = useLocal ? 'http://localhost:8000' : (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000')
const BACKEND_URL = raw.startsWith('http') ? raw : `https://${raw}`
const RUN_STRAND = process.argv.includes('--run-strand')
const SUBJECT = process.argv[process.argv.indexOf('--run-strand') + 1] || 'quick smoke test'
const STRAND_TIMEOUT_MS = 600_000 // 10 min for 3 LLM calls

async function main() {
  console.log('════════════════════════════════════════════════════════════')
  console.log('  Strand diagnostic')
  console.log('════════════════════════════════════════════════════════════\n')
  console.log('Backend URL:', BACKEND_URL)

  // 1. Health check (correct path: /api/health, not /health)
  console.log('\n1. Health check (GET /api/health)...')
  const healthStart = Date.now()
  try {
    const healthRes = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(10_000) })
    const healthMs = Date.now() - healthStart
    const health = (await healthRes.json()) as { status?: string; openai_configured?: boolean }
    console.log(`   ✓ ${healthMs}ms — status: ${health.status}, openai_configured: ${health.openai_configured}`)
  } catch (e) {
    console.log('   ✗ Failed:', (e as Error).message)
    console.log('\n   Possible causes:')
    console.log('   - Backend not running. Start with: npm run dev:backend')
    console.log('   - Wrong URL. Health is at /api/health, not /health')
    console.log('   - Network/firewall blocking localhost:8000')
    process.exit(1)
  }

  // 2. DB health
  console.log('\n2. DB health (GET /api/health/db)...')
  try {
    const dbRes = await fetch(`${BACKEND_URL}/api/health/db`, { signal: AbortSignal.timeout(10_000) })
    const db = (await dbRes.json()) as { status?: string }
    console.log(`   ✓ ${db.status}`)
  } catch (e) {
    console.log('   ✗ Failed:', (e as Error).message)
  }

  if (!RUN_STRAND) {
    console.log('\n3. Strand run: skipped (use --run-strand "subject" to run)')
    console.log('\n   Example: npx tsx scripts/strand-diagnose.ts --run-strand "domain expansion"')
    console.log('   Strand takes 3–10 min with real LLM calls. Use long timeout.')
    return
  }

  // 3. Run strand
  console.log('\n3. Strand run (POST /api/strands/run)...')
  console.log(`   Subject: "${SUBJECT}"`)
  console.log(`   Timeout: ${STRAND_TIMEOUT_MS / 1000}s`)
  const strandStart = Date.now()
  try {
    const ctrl = new AbortController()
    const timeout = setTimeout(() => ctrl.abort(), STRAND_TIMEOUT_MS)
    const strandRes = await fetch(`${BACKEND_URL}/api/strands/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'diagnostic', subject: SUBJECT }),
      signal: ctrl.signal,
    })
    clearTimeout(timeout)
    const strandMs = Date.now() - strandStart
    const result = (await strandRes.json()) as {
      strand_bar_id?: string
      output_bar_ids?: string[]
      detail?: string
    }
    if (!strandRes.ok) {
      console.log(`   ✗ ${strandRes.status} in ${strandMs}ms:`, result.detail || JSON.stringify(result))
      return
    }
    console.log(`   ✓ ${strandMs}ms`)
    console.log('   strand_bar_id:', result.strand_bar_id)
    console.log('   output_bar_ids:', result.output_bar_ids?.join(', '))
    console.log('\n   Fetch full results: npx tsx scripts/fetch-strand-results.ts', result.strand_bar_id)
  } catch (e) {
    const strandMs = Date.now() - strandStart
    const err = e as Error
    console.log(`   ✗ Failed after ${strandMs}ms:`, err.message)
    if (err.name === 'AbortError') {
      console.log('\n   Timeout. Strand runs 3 LLM calls (Shaman→Sage→Architect).')
      console.log('   Each call can take 30–90s. Total: 3–10 min typical.')
      console.log('   The strand may have completed on the server; check DB for new strand BARs.')
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
