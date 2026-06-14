/**
 * Run a `prisma migrate` subcommand with the DIRECT Postgres URL resolved from
 * your env files — the clean-handoff wrapper for deploying migrations.
 *
 * Fixes the common Vercel / Prisma Postgres gotcha:
 *   - the `prisma` CLI auto-loads `.env`, NOT `.env.local` (where `vercel env
 *     pull` writes), so DATABASE_URL appears "not found".
 *   - `vercel env pull` provides PRISMA_DATABASE_URL — the Accelerate URL
 *     (`prisma+postgres://…`) — which CANNOT run migrations. Migrations need the
 *     DIRECT `postgres://…:5432` connection.
 *
 * This loads `.env` then `.env.local` (Next.js order), finds a direct Postgres
 * URL among the usual var names, exports it as DATABASE_URL (which schema.prisma
 * reads for both `url` and `directUrl`), and runs the command. On `deploy` it
 * also records the schema hash.
 *
 * Usage:  tsx scripts/migrate-with-direct-url.ts <deploy|status|...>
 *   npm run db:migrate:deploy
 *   npm run db:migrate:status
 */

import { config } from 'dotenv'
import { execSync } from 'node:child_process'

// Next.js order: base first, then .env.local overrides. (No-op on CI where the
// vars are already in process.env.)
config({ path: '.env' })
config({ path: '.env.local', override: true })

// Direct (non-Accelerate) URL candidates, best first. Non-pooling/direct vars
// before pooled ones so migrations get a clean connection.
const DIRECT_VARS = [
  'DATABASE_URL',
  'DIRECT_DATABASE_URL',
  'DIRECT_URL',
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL',
]

const isDirectPg = (u?: string): u is string => !!u && /^postgres(ql)?:\/\//.test(u)
const isAccelerate = (u?: string): u is string => !!u && /^prisma(\+postgres)?:\/\//.test(u)

function safeHost(u: string): string {
  try {
    const x = new URL(u)
    return `${x.hostname}:${x.port || '5432'}${x.pathname}`
  } catch {
    return '(unparseable url)'
  }
}

const command = (process.argv[2] || 'deploy').trim()

let chosen: { name: string; url: string } | null = null
for (const name of DIRECT_VARS) {
  if (isDirectPg(process.env[name])) {
    chosen = { name, url: process.env[name]! }
    break
  }
}

if (!chosen) {
  const accelVar = [...DIRECT_VARS, 'PRISMA_DATABASE_URL'].find((n) => isAccelerate(process.env[n]))
  console.error('\n✗ No direct Postgres URL found for migrations.')
  if (accelVar) {
    console.error(`  ${accelVar} holds an Accelerate URL (prisma+postgres://…) — that CANNOT run migrations.`)
  }
  console.error('  Migrations need the DIRECT connection, e.g.')
  console.error('    postgres://…@host:5432/db?sslmode=require')
  console.error('  Fix (either one):')
  console.error('    • add it to .env (gitignored):  DATABASE_URL="postgres://…:5432/…"')
  console.error('    • or run inline:  DATABASE_URL="postgres://…:5432/…" npm run db:migrate:deploy\n')
  process.exit(1)
}

// schema.prisma reads env("DATABASE_URL") for url + directUrl — point it at the direct URL.
process.env.DATABASE_URL = chosen.url
console.log(`→ Using direct Postgres URL from ${chosen.name} (${safeHost(chosen.url)})`)

try {
  execSync(`npx prisma migrate ${command}`, { stdio: 'inherit', shell: true, env: process.env })
  if (command === 'deploy') {
    execSync('npm run db:record-schema-hash', { stdio: 'inherit', shell: true, env: process.env })
    console.log('\n✓ Migrations deployed and schema hash recorded.')
  }
} catch {
  // The child already printed the error; surface a non-zero exit.
  process.exit(1)
}
