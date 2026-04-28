/**
 * Guard against running prisma migrate commands against production.
 * Refuses if DATABASE_URL host is not localhost/127.0.0.1.
 * For migrate dev: always blocks non-local (schema changes can break production parity)
 * For migrate deploy: blocks non-local and requires typing the DB name to confirm
 * 
 * Usage: tsx scripts/migrate-guard.ts "npx prisma migrate deploy"
 * Override with FORCE_MIGRATE=true when you explicitly intend to migrate a remote DB
 */

import { config } from 'dotenv'
import { execSync } from 'child_process'

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

function getDbNameFromUrl(url: string): string {
  try {
    const normalized = url.replace(/^prisma\+postgres(ql)?:/i, 'https:').replace(/^postgres(ql)?:/i, 'https:')
    const parsed = new URL(normalized)
    return parsed.pathname.replace(/^\//, '') || parsed.hostname
  } catch {
    return 'unknown'
  }
}

function main(): number {
  const forceMigrate = process.env.FORCE_MIGRATE === 'true'
  if (forceMigrate) {
    console.log('⚠️  FORCE_MIGRATE=true — bypassing guard. Proceeding.')
    const cmd = process.argv.slice(2).join(' ')
    if (cmd) execSync(cmd, { stdio: 'inherit', shell: true })
    return 0
  }

  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.staging_DATABASE_URL || ''
  if (!url) {
    // No URL found — let the command fail naturally with its own error
    console.log('⚠️  DATABASE_URL not set — letting command fail on its own error...')
    const cmd = process.argv.slice(2).join(' ')
    if (cmd) execSync(cmd, { stdio: 'inherit', shell: true })
    return 0
  }

  const host = getHostFromUrl(url)
  const dbName = getDbNameFromUrl(url)

  if (!host) {
    console.error(`❌ Could not parse DATABASE_URL host. Aborting.`)
    return 1
  }

  if (isLocalHost(host)) {
    // Local — safe, just run
    const cmd = process.argv.slice(2).join(' ')
    if (cmd) execSync(cmd, { stdio: 'inherit', shell: true })
    return 0
  }

  // Remote DB — require typed confirmation
  console.error('')
  console.error('═══════════════════════════════════════════════════════════════')
  console.error('  ⛔ MIGRATE REFUSED — DATABASE_URL points to non-local host')
  console.error('═══════════════════════════════════════════════════════════════')
  console.error('')
  console.error(`  Host: ${host}`)
  console.error(`  Database: ${dbName}`)
  console.error('')
  console.error('  This command will modify the database schema.')
  console.error('  Type the database name to confirm you intend to migrate this DB:')
  console.error('')
  process.stderr.write(`  Database name: `)

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const readline = require('readline')
    const rl = readline.createInterface({ input: process.stdin, output: process.stderr })
    const answer = await new Promise<string>(resolve => rl.question('', resolve))
    rl.close()

    if (answer.trim() !== dbName.trim()) {
      console.error('')
      console.error(`❌ Confirmation did not match "${dbName}". Aborting.`)
      return 1
    }

    console.error(`✅ Confirmed. Running migrate...`)
    const cmd = process.argv.slice(2).join(' ')
    if (cmd) execSync(cmd, { stdio: 'inherit', shell: true })
    return 0
  } catch {
    console.error('❌ Confirmation failed. Aborting.')
    return 1
  }
}

main()
  .then(code => process.exit(code))
  .catch(e => { console.error(e); process.exit(1) })
