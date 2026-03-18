/**
 * Build script: when DATABASE_URL is set, runs prisma migrate deploy + next build.
 * When DATABASE_URL is missing, skips migrate and runs prisma generate + next build
 * so contributors can verify the app compiles without a database.
 *
 * IMPORTANT: When DATABASE_URL is set, migrate deploy MUST succeed. The build fails
 * if migrations cannot be applied — no silent fallback. This prevents deploying an
 * app with schema mismatch (500 errors, login failures).
 *
 * @see .specify/specs/prisma-migrate-deploy-database-url/spec.md
 * @see .specify/specs/production-db-connection-incident/ROOT_CAUSE_ANALYSIS.md
 */

import { config } from 'dotenv'
import { execSync } from 'child_process'

const NO_MIGRATE_CMD = 'prisma generate && next build'

function hasDatabaseUrl(): boolean {
  return !!(process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL)
}

function loadEnv(): void {
  config({ path: '.env' })
  config({ path: '.env.local' })
}

loadEnv()

if (hasDatabaseUrl()) {
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit', shell: true })
  } catch (err) {
    console.error('')
    console.error('❌ prisma migrate deploy failed. Build aborted.')
    console.error('   Production deploy requires migrations to be applied.')
    console.error('   Fix: Run "npx prisma migrate deploy" against the target DB.')
    console.error('   If P3018 (relation already exists): npx prisma migrate resolve --applied <migration_name>')
    console.error('   See docs/ENV_AND_VERCEL.md for P3009/P3018 troubleshooting.')
    console.error('')
    process.exit(1)
  }
  execSync('next build', { stdio: 'inherit', shell: true })
} else {
  console.warn(
    '⚠ DATABASE_URL not set. Skipping prisma migrate deploy. Run npm run env:pull or add DATABASE_URL to .env.local for full build.'
  )
  execSync(NO_MIGRATE_CMD, { stdio: 'inherit', shell: true })
}
