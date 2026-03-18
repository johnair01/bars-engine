/**
 * Post-PITR restore runbook — fix schema drift and verify.
 * Run after restoring production from a Prisma Postgres PITR backup.
 *
 * Usage: DATABASE_URL="<restored-db-url>" npm run db:post-restore
 *
 * @see .specify/specs/db-data-safety/spec.md
 */

import { config } from 'dotenv'
import { execSync } from 'child_process'

config({ path: '.env.local' })
config({ path: '.env' })

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is required. Set it in env or .env.local')
  process.exit(1)
}

function run(label: string, fn: () => void): boolean {
  try {
    console.log(`\n▶ ${label}`)
    fn()
    console.log(`  ✅ ${label} — PASS`)
    return true
  } catch (e) {
    console.error(`  ❌ ${label} — FAIL:`, e instanceof Error ? e.message : String(e))
    return false
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  DB POST-RESTORE RUNBOOK')
  console.log('═══════════════════════════════════════════════════════════')
  console.log('  Fixes schema drift after PITR restore. Idempotent.')

  let passed = 0
  let failed = 0

  run('apply-migration-direct', () => {
    execSync('npx tsx scripts/apply-migration-direct.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    })
  }) ? passed++ : failed++

  run('fix-post-restore-columns', () => {
    execSync('npx tsx scripts/fix-post-restore-columns.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    })
  }) ? passed++ : failed++

  run('prisma migrate deploy', () => {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    })
  }) ? passed++ : failed++

  run('verify:prod-db', () => {
    execSync('npx tsx scripts/verify-production-db.ts', {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: process.env,
    })
  }) ? passed++ : failed++

  console.log('\n═══════════════════════════════════════════════════════════')
  console.log(`  SUMMARY: ${passed} passed, ${failed} failed`)
  console.log('═══════════════════════════════════════════════════════════\n')

  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
