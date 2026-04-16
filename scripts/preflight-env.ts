/**
 * Conclave Preflight Check
 *
 * Validates essential environment variables and database connectivity.
 * Loads .env.local then .env (same precedence as Next.js) so you can run
 * this after `npm run env:pull` or with a local .env to confirm DB access.
 *
 * Run with: npm run smoke   or   npx tsx scripts/preflight-env.ts
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'
import process from 'process'
import { resolveDatabaseUrl } from '../src/lib/db-resolve'

// Match runtime diagnostics/load order used elsewhere in the repo.
config({ path: '.env' })
config({ path: '.env.local', override: true })

async function checkEnv() {
    console.log('🔍 Running Conclave Preflight Checks...')

    const dbConfig = resolveDatabaseUrl()
    if (!dbConfig) {
        console.warn('  ⚠️  Missing database URL env var.')
        console.warn('     Set one of: DATABASE_URL, POSTGRES_URL, PRISMA_DATABASE_URL, POSTGRES_PRISMA_URL')
        console.warn('\n  ! Some critical config is missing. The app may run in Guest Mode.')
    } else {
        console.log(`  ✓ Database URL resolved from ${dbConfig.source}${dbConfig.accelerate ? ' (Accelerate)' : ''}`)
    }

    // Optional: OPENAI_API_KEY for AI features (Book analysis, I Ching quest gen)
    const optional = ['OPENAI_API_KEY']
    for (const v of optional) {
        if (!process.env[v]) {
            console.warn(`  ⚠️  Optional: ${v} missing — AI features (Book analysis, I Ching quest gen) will fail`)
        } else {
            console.log(`  ✓ ${v} is present`)
        }
    }

    // Attempt DB connection
    console.log('\n📡 Checking DB Connectivity...')
    const baseClient = dbConfig
      ? new PrismaClient({
          datasources: { db: { url: dbConfig.url } },
          log: [],
        })
      : new PrismaClient()
    const prisma = dbConfig?.accelerate
      ? (baseClient.$extends(withAccelerate()) as unknown as PrismaClient)
      : baseClient
    try {
        await prisma.$connect()
        await prisma.$queryRaw`SELECT 1`
        console.log('  ✓ Database is reachable')
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`  ❌ Database unreachable: ${msg}`)
        console.warn('  ! App will fallback to Guest Mode.')
    } finally {
        await prisma.$disconnect()
    }

    console.log('\n✨ Preflight complete.\n')
}

checkEnv().catch(err => {
    console.error('Fatal error during preflight:', err)
    process.exit(1)
})
