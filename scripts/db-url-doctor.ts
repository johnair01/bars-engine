#!/usr/bin/env npx tsx
/**
 * DATABASE_URL doctor — diagnose (and optionally fix) the Vercel/Prisma env so
 * `prisma migrate` can actually run locally.
 *
 * The gotcha this exists for:
 *   - `prisma/schema.prisma` reads env("DATABASE_URL") for BOTH `url` and
 *     `directUrl`, and migrations need a DIRECT `postgres://…:5432` connection.
 *   - `vercel env pull` writes `.env.local` (the Prisma CLI reads `.env`, not
 *     `.env.local`) and usually provides the ACCELERATE url
 *     (`prisma+postgres://…`, often as PRISMA_DATABASE_URL) which CANNOT migrate.
 *
 * What it does:
 *   - Loads `.env` then `.env.local` (override), classifies every known DB var
 *     as DIRECT (migratable), Accelerate (not migratable), or missing.
 *   - Tells you whether migrations can run, and which var would be used.
 *   - With `--write`: if a DIRECT url exists under any var, upserts
 *     `DATABASE_URL=<that direct url>` into `.env.local` so plain `npx prisma …`
 *     and `npm run build` work too (re-run after each `vercel env pull`).
 *
 * Usage:
 *   npm run db:url:doctor            # diagnose only
 *   npm run db:url:doctor -- --write # also normalize DATABASE_URL in .env.local
 *
 * It never prints secrets — only protocol + host:port + database name.
 */
import { config } from 'dotenv'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'

config({ path: '.env' })
config({ path: '.env.local', override: true })

// Direct (migratable) vars first, Accelerate-only last. Mirrors migrate-with-direct-url.ts.
const CANDIDATES = [
  'DATABASE_URL',
  'DIRECT_URL',
  'DIRECT_DATABASE_URL',
  'POSTGRES_URL_NON_POOLING',
  'POSTGRES_PRISMA_URL',
  'POSTGRES_URL',
  'PRISMA_DATABASE_URL',
] as const

const isDirect = (u?: string): u is string => !!u && /^postgres(ql)?:\/\//.test(u)
const isAccelerate = (u?: string): u is string => !!u && /^prisma(\+postgres)?:\/\//.test(u)

function safe(u: string): string {
  try {
    const x = new URL(u)
    return `${x.protocol}//${x.hostname}:${x.port || '5432'}${x.pathname}`
  } catch {
    return '(unparseable url)'
  }
}

const write = process.argv.includes('--write')

console.log('\nDATABASE_URL doctor — env files: .env' + (existsSync('.env.local') ? ' + .env.local' : ' (no .env.local)') + '\n')

let firstDirect: { name: string; url: string } | null = null
let sawAccelerate = false

for (const name of CANDIDATES) {
  const u = process.env[name]
  if (!u) {
    console.log(`  ${name.padEnd(26)} —  missing`)
    continue
  }
  if (isDirect(u)) {
    console.log(`  ${name.padEnd(26)} ✓  DIRECT (migratable)   ${safe(u)}`)
    if (!firstDirect) firstDirect = { name, url: u }
  } else if (isAccelerate(u)) {
    sawAccelerate = true
    console.log(`  ${name.padEnd(26)} ✗  Accelerate — CANNOT migrate   ${safe(u)}`)
  } else {
    console.log(`  ${name.padEnd(26)} ?  unrecognized scheme   ${safe(u)}`)
  }
}

console.log('')

if (!firstDirect) {
  console.log('✗ No DIRECT Postgres URL found — `prisma migrate` / `npm run db:migrate:*` cannot run.\n')
  if (sawAccelerate) {
    console.log('  You only have the Accelerate URL (prisma+postgres://…). Migrations need the')
    console.log('  DIRECT connection. Fix it once in Vercel so every pull includes it:\n')
  } else {
    console.log('  No Postgres URL at all. Pull the production env, then re-run:\n')
    console.log('    npm run env:pull:production\n')
    console.log('  If it still has no direct URL, add one in Vercel:\n')
  }
  console.log('   1. Get the DIRECT connection string from your DB provider')
  console.log('      (Prisma Postgres dashboard → Connect → "Direct connection",')
  console.log('       shape: postgres://USER:PASS@HOST:5432/DB?sslmode=require).')
  console.log('   2. Vercel → bars-engine → Settings → Environment Variables → add')
  console.log('      DATABASE_URL (or DIRECT_DATABASE_URL) for the Production scope.')
  console.log('   3. Re-pull:  npm run env:pull:production')
  console.log('   4. Re-run:   npm run db:url:doctor\n')
  console.log('  One-off without changing Vercel (paste the direct URL inline):')
  console.log('    DATABASE_URL="postgres://…:5432/…?sslmode=require" npm run db:migrate:status\n')
  process.exit(1)
}

console.log(`✓ Migrations can run — they will use ${firstDirect.name} (${safe(firstDirect.url)}).`)
console.log('  `npm run db:migrate:status` / `db:migrate:deploy` resolve this automatically.\n')

const dbUrl = process.env.DATABASE_URL
if (isDirect(dbUrl) && dbUrl === firstDirect.url) {
  console.log('  DATABASE_URL is already the direct URL — plain `npx prisma …` works too. Nothing to fix.\n')
  process.exit(0)
}

if (!write) {
  console.log(`  Note: DATABASE_URL itself is ${dbUrl ? (isAccelerate(dbUrl) ? 'the Accelerate URL' : 'not the direct URL') : 'unset'}.`)
  console.log(`  The db:migrate:* scripts handle that, but plain \`npx prisma …\` and \`npm run build\` read DATABASE_URL.`)
  console.log(`  Run with --write to normalize it in .env.local:\n`)
  console.log('    npm run db:url:doctor -- --write\n')
  process.exit(0)
}

// --write: upsert DATABASE_URL into .env.local so all tools see the direct URL.
const file = '.env.local'
const line = `DATABASE_URL="${firstDirect.url}"`
let body = existsSync(file) ? readFileSync(file, 'utf8') : ''
if (/^DATABASE_URL=.*$/m.test(body)) {
  body = body.replace(/^DATABASE_URL=.*$/m, line)
} else {
  body += (body.endsWith('\n') || body === '' ? '' : '\n') + line + '\n'
}
writeFileSync(file, body)
console.log(`  ✓ Wrote DATABASE_URL (direct, from ${firstDirect.name}) into ${file}.`)
console.log('    Re-run after each `vercel env pull` (pull overwrites .env.local).\n')
