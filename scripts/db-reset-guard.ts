/**
 * Guard against running db:reset against production.
 * Refuses if DATABASE_URL host is not localhost/127.0.0.1.
 * Override with FORCE_RESET=true when you explicitly intend to reset a remote DB.
 *
 * @see .specify/specs/db-data-safety/spec.md
 */

import { config } from 'dotenv'

config({ path: '.env.local' })
config({ path: '.env' })

function getHostFromUrl(url: string): string | null {
  try {
    const normalized = url
      .replace(/^prisma\+postgres(ql)?:/i, 'https:')
      .replace(/^postgres(ql)?:/i, 'https:')
    const parsed = new URL(normalized)
    return parsed.hostname || null
  } catch {
    return null
  }
}

function isLocalHost(host: string): boolean {
  const h = host.toLowerCase()
  return h === 'localhost' || h === '127.0.0.1' || h === '::1'
}

function main(): number {
  const forceReset = process.env.FORCE_RESET === 'true'
  if (forceReset) {
    console.log('⚠️  FORCE_RESET=true — bypassing guard. Proceeding with db:reset.')
    return 0
  }

  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL
  if (!url) {
    console.error('\x1b[31m❌ DATABASE_URL not set. Cannot verify target. Aborting db:reset.\x1b[0m')
    console.error('   Set DATABASE_URL in .env.local, or use FORCE_RESET=true to override.')
    return 1
  }

  const host = getHostFromUrl(url)
  if (!host) {
    console.error('\x1b[31m❌ Could not parse DATABASE_URL host. Aborting db:reset.\x1b[0m')
    return 1
  }

  if (isLocalHost(host)) {
    return 0
  }

  console.error('')
  console.error('\x1b[31m═══════════════════════════════════════════════════════════════\x1b[0m')
  console.error('\x1b[31m  ⛔ db:reset REFUSED — DATABASE_URL points to non-local host\x1b[0m')
  console.error('\x1b[31m═══════════════════════════════════════════════════════════════\x1b[0m')
  console.error('')
  console.error(`  Host: ${host}`)
  console.error('  db:reset wipes all data. Running it against production would cause data loss.')
  console.error('')
  console.error('  If you truly intend to reset this database:')
  console.error('    FORCE_RESET=true npm run db:reset')
  console.error('')
  return 1
}

process.exit(main())
