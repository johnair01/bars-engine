/**
 * Build script: when DATABASE_URL is set, runs prisma migrate deploy + next build.
 * When DATABASE_URL is missing, skips migrate and runs prisma generate + next build
 * so contributors can verify the app compiles without a database.
 *
 * @see .specify/specs/prisma-migrate-deploy-database-url/spec.md
 */

import { config } from 'dotenv'
import { execSync } from 'child_process'

const FULL_BUILD_CMD = 'prisma migrate deploy && next build'
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
  execSync(FULL_BUILD_CMD, { stdio: 'inherit', shell: true })
} else {
  console.warn(
    '⚠ DATABASE_URL not set. Skipping prisma migrate deploy. Run npm run env:pull or add DATABASE_URL to .env.local for full build.'
  )
  execSync(NO_MIGRATE_CMD, { stdio: 'inherit', shell: true })
}
