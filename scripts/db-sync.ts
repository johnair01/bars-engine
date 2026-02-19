import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { createHash } from 'crypto'
import { execSync } from 'child_process'
import { config } from 'dotenv'

// Load .env
config()

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

    const needsPush = currentHash !== storedHash

    // 1. Always Generate Types
    console.log('✨ Generating Prisma Client...')
    try {
        execSync('npx prisma generate', { stdio: 'inherit' })
    } catch (e) {
        console.error('❌ Prisma Generate failed')
        process.exit(1)
    }

    // 2. Conditional Push
    if (needsPush) {
        if (hasDbUrl) {
            console.log('🚀 Schema change detected. Pushing to Database...')
            try {
                // We use --accept-data-loss for rapid iteration during MVP. 
                // For later stages, we should switch to migrations.
                execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit' })
                if (currentHash) writeFileSync(HASH_FILE, currentHash)
                console.log('✅ Database synchronized.')
            } catch (e) {
                console.error('❌ Prisma DB Push failed. Check your DATABASE_URL.')
                // In CI, we want to fail the build if push fails
                if (isProd) process.exit(1)
            }
        } else {
            console.warn('⚠️ Schema changed but no DATABASE_URL found. Skipping push.')
        }
    } else {
        console.log('⏭️ Schema unchanged. Skipping DB push.')
    }

    console.log('--- [DB Sync] Complete ---')
}

sync()
