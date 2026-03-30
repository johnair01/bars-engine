import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import { execSync } from 'child_process'
import { config } from 'dotenv'

// Load .env.local first, then .env (same order as Next.js and require-db-env)
config({ path: '.env.local' })
config({ path: '.env' })

const ROOT = process.cwd()
const SCHEMA_PATH = join(ROOT, 'prisma', 'schema.prisma')
const HASH_FILE = join(ROOT, '.prisma_hash')

function getHash(filePath: string) {
    if (!existsSync(filePath)) return null
    const content = readFileSync(filePath, 'utf8')
    return createHash('md5').update(content).digest('hex')
}

function sync() {
    console.log('--- [DB Sync] Checking Schema Status ---')

    const currentHash = getHash(SCHEMA_PATH)
    const storedHash = existsSync(HASH_FILE) ? readFileSync(HASH_FILE, 'utf8').trim() : null

    const isProd = process.env.NODE_ENV === 'production' || !!process.env.VERCEL
    const hasDbUrl = !!(process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL)

    const needsAttention = currentHash !== storedHash

    // 1. Always Generate Types
    console.log('✨ Generating Prisma Client...')
    try {
        execSync('npx prisma generate', { stdio: 'inherit' })
    } catch {
        console.error('❌ Prisma Generate failed')
        process.exit(1)
    }

    // 2. First run on this clone: record hash (no db push — see docs/PRISMA_MIGRATE_STRATEGY.md)
    if (!storedHash && currentHash) {
        writeFileSync(HASH_FILE, currentHash)
        console.log('📝 Initialized .prisma_hash for this clone.')
        console.log('   If the database is new or behind: npx prisma migrate deploy')
        console.log('--- [DB Sync] Complete ---')
        return
    }

    // 3. Schema file changed vs last recorded hash — never prisma db push
    if (needsAttention && storedHash) {
        if (isProd) {
            console.warn('⚠️  Schema changed in production build context. Skipping DB apply.')
            console.warn('👉 Production must use committed migrations + prisma migrate deploy.')
            return
        }

        if (!hasDbUrl) {
            console.error('❌ Schema changed but DATABASE_URL is not set.')
            console.error('')
            console.error('To fix:')
            console.error('  • With Vercel access: npm run env:pull')
            console.error('  • Without: cp .env.example .env and add DATABASE_URL')
            console.error('')
            console.error('See docs/ENV_AND_VERCEL.md')
            process.exit(1)
        }

        console.error('')
        console.error('❌ prisma/schema.prisma changed since last recorded .prisma_hash.')
        console.error('')
        console.error('   prisma db push is NOT allowed — it bypasses migrations and causes drift.')
        console.error('   Using db push (humans or AI agents) breaks the deploy contract.')
        console.error('')
        console.error('   Do this instead:')
        console.error('   • Pulled schema from main:  npx prisma migrate deploy')
        console.error('   • You edited the schema:    npx prisma migrate dev --name describe_change')
        console.error('   Then commit the migration folder, apply migrations, and run:')
        console.error('   • npm run db:record-schema-hash')
        console.error('')
        console.error('   See docs/PRISMA_MIGRATE_STRATEGY.md')
        console.error('')
        process.exit(1)
    }

    console.log('⏭️ Schema hash matches last sync. No migration action needed.')
    console.log('--- [DB Sync] Complete ---')
}

sync()
