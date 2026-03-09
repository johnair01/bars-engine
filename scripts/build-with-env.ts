/**
 * Build script that ensures DATABASE_URL is available before prisma migrate deploy.
 * When DATABASE_URL is missing, attempts to pull from Vercel (vercel env pull).
 * If pull fails, exits with a clear message.
 *
 * @see .specify/specs/prisma-migrate-deploy-database-url/spec.md
 */

import { config } from 'dotenv'
import { execSync, spawnSync } from 'child_process'

const BUILD_CMD = 'prisma migrate deploy && next build'

function hasDatabaseUrl(): boolean {
  return !!(process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL)
}

function loadEnv(): void {
  config({ path: '.env' })
  config({ path: '.env.local' })
}

function runBuild(): void {
  execSync(BUILD_CMD, { stdio: 'inherit', shell: true })
}

loadEnv()

if (hasDatabaseUrl()) {
  runBuild()
  process.exit(0)
}

// DATABASE_URL missing — try to pull from Vercel
console.log('DATABASE_URL not set. Attempting to pull from Vercel...')
const pull = spawnSync('npx', ['vercel', 'env', 'pull', '.env.local'], {
  stdio: 'inherit',
  shell: true,
})

if (pull.status !== 0) {
  console.error('\nDATABASE_URL is required for build.')
  console.error('Run \'npm run env:pull\' first (or add DATABASE_URL to .env.local).')
  console.error('See docs/ENV_AND_VERCEL.md')
  process.exit(1)
}

// Reload env after pull
loadEnv()

if (!hasDatabaseUrl()) {
  console.error('vercel env pull completed but DATABASE_URL is still not set.')
  console.error('Check that DATABASE_URL is configured in Vercel Dashboard → Settings → Environment Variables.')
  process.exit(1)
}

runBuild()
