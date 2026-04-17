/**
 * Smoke Test: DB Layer (Local Dev Loop)
 *
 * Fast, headless verification that the local dev DB is reachable and responsive.
 * Uses ONLY the local .env credentials — never Vercel/production.
 *
 * Run with: bun run scripts/smoke-db.ts
 * (No server required — runs standalone)
 */

import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

// Only load local .env — never override with Vercel credentials
config({ path: '.env', override: false })
config({ path: '.env.local', override: false })

async function main() {
  const errors: string[] = []

  console.log('🔍 Running DB Smoke Test (local dev)...\n')

  // 1. Verify DATABASE_URL is set
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    errors.push('DATABASE_URL is not set in .env or .env.local')
    console.error('❌ DATABASE_URL missing — run: npx vercel env pull .env.local')
  } else {
    console.log(`  ✓ DATABASE_URL found (${dbUrl.replace(/\/\/.*:.*@/, '//***:***@')})`)
  }

  // 2. Attempt connection + minimal read
  if (dbUrl) {
    const db = new PrismaClient({
      datasources: { db: { url: dbUrl } },
      log: ['error'],
    })

    try {
      await db.$connect()
      console.log('  ✓ DB connection established')

      // 3. Verify a real query works (Player table check)
      const playerCount = await db.player.count()
      console.log(`  ✓ DB responsive — ${playerCount} player(s) in DB`)

      // 4. Verify CustomBar table is accessible
      const barCount = await db.customBar.count()
      console.log(`  ✓ CustomBar table accessible — ${barCount} bar(s)`)

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`DB query failed: ${msg}`)
      console.error(`❌ DB query failed: ${msg}`)
    } finally {
      await db.$disconnect()
    }
  }

  console.log('')

  if (errors.length > 0) {
    console.error('❌ Smoke test FAILED')
    errors.forEach(e => console.error(`  - ${e}`))
    process.exit(1)
  } else {
    console.log('✅ Smoke test PASSED — local DB is ready for dev')
    process.exit(0)
  }
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
