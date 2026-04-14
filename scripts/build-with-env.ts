/**
 * Build script: when DATABASE_URL is set, runs prisma migrate deploy + next build.
 * When DATABASE_URL is missing, skips migrate and runs prisma generate + next build
 * so contributors can verify the app compiles without a database.
 *
 * IMPORTANT: When DATABASE_URL is set, migrate deploy MUST succeed. The build fails
 * if migrations cannot be applied — no silent fallback. This prevents deploying an
 * app with schema mismatch (500 errors, login failures).
 *
 * Vercel Preview: By default we skip `prisma migrate deploy` during PR builds. Preview
 * often cannot reach the same DB as Production (P1001), and PR builds should not be
 * required to mutate the database. Migrations apply on Production deploy. Override:
 * set `VERCEL_RUN_MIGRATE_ON_PREVIEW=1` when Preview has a reachable staging `DATABASE_URL`.
 * Or set `SKIP_PRISMA_MIGRATE_DEPLOY=1` to force-skip migrate on any environment.
 *
 * @see .specify/specs/prisma-migrate-deploy-database-url/spec.md
 * @see .specify/specs/production-db-connection-incident/ROOT_CAUSE_ANALYSIS.md
 */

import { config } from 'dotenv'
import { execSync } from 'child_process'

function hasDatabaseUrl(): boolean {
  return !!(process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL)
}

/** Skip migrate during build (still run prisma generate + next build). */
function shouldSkipMigrateDeploy(): boolean {
  if (process.env.SKIP_PRISMA_MIGRATE_DEPLOY === '1') return true
  const isPreview = process.env.VERCEL_ENV === 'preview'
  const forceMigrateOnPreview = process.env.VERCEL_RUN_MIGRATE_ON_PREVIEW === '1'
  if (isPreview && !forceMigrateOnPreview) return true
  return false
}

/** Run Next production build; exit 1 with a short banner (real errors are above via stdio: inherit). */
function runNextBuild(): void {
  try {
    execSync('next build', { stdio: 'inherit', shell: true })
  } catch {
    console.error('')
    console.error('❌ next build failed (non-zero exit).')
    console.error('   Scroll up in this log for TypeScript, compile, or static-generation errors.')
    console.error('   Local repro: npm run build')
    console.error('')
    process.exit(1)
  }
}

function loadEnv(): void {
  config({ path: '.env' })
  config({ path: '.env.local' })
}

loadEnv()

if (hasDatabaseUrl() && !shouldSkipMigrateDeploy()) {
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit', shell: true })
  } catch {
    console.error('')
    console.error('❌ prisma migrate deploy failed. Build aborted.')
    console.error('   Production deploy requires migrations to be applied.')
    console.error('   Fix: Run "npx prisma migrate deploy" against the target DB.')
    console.error('   If P3018 (relation already exists): npx prisma migrate resolve --applied <migration_name>')
    console.error('   See docs/ENV_AND_VERCEL.md for P3009/P3018 troubleshooting.')
    console.error('')
    process.exit(1)
  }
  runNextBuild()
} else if (hasDatabaseUrl() && shouldSkipMigrateDeploy()) {
  if (process.env.VERCEL_ENV === 'preview') {
    console.warn(
      '⚠ Vercel Preview: skipping prisma migrate deploy (avoids P1001 when DB is unreachable from build). Migrations apply on Production deploy. Staging DB + migrate on PR: set VERCEL_RUN_MIGRATE_ON_PREVIEW=1.'
    )
  } else if (process.env.SKIP_PRISMA_MIGRATE_DEPLOY === '1') {
    console.warn('⚠ SKIP_PRISMA_MIGRATE_DEPLOY=1 — skipping prisma migrate deploy.')
  }
  try {
    execSync('npx prisma generate', { stdio: 'inherit', shell: true })
  } catch {
    console.error('')
    console.error('❌ prisma generate failed. Build aborted.')
    console.error('')
    process.exit(1)
  }
  runNextBuild()
} else {
  console.warn(
    '⚠ DATABASE_URL not set. Skipping prisma migrate deploy. Run npm run env:pull or add DATABASE_URL to .env.local for full build.'
  )
  try {
    execSync('npx prisma generate', { stdio: 'inherit', shell: true })
  } catch {
    console.error('')
    console.error('❌ prisma generate failed. Build aborted.')
    console.error('')
    process.exit(1)
  }
  runNextBuild()
}
