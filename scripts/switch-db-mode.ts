#!/usr/bin/env tsx
/**
 * Switch between synthetic (local Docker) and real (Vercel) database modes.
 *
 * Usage:
 *   npm run switch -- local    # Use local Docker Postgres + seed data
 *   npm run switch -- vercel   # Use Vercel Postgres (real backend)
 */

import fs from 'fs'
import path from 'path'

const ENV_LOCAL_PATH = path.join(process.cwd(), '.env.local')
const ENV_BACKUP_PATH = path.join(process.cwd(), '.env.local.backup')

// Local Docker Postgres (standard development setup)
const LOCAL_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/bars_engine'

function readEnv(filePath: string): Record<string, string> {
    if (!fs.existsSync(filePath)) {
        return {}
    }
    const content = fs.readFileSync(filePath, 'utf-8')
    const env: Record<string, string> = {}
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
            env[match[1]] = match[2]
        }
    })
    return env
}

function writeEnv(filePath: string, env: Record<string, string>) {
    const content = Object.entries(env)
        .map(([key, value]) => `${key}="${value}"`)
        .join('\n') + '\n'
    fs.writeFileSync(filePath, content, 'utf-8')
}

async function switchMode(mode: 'local' | 'vercel') {
    const env = readEnv(ENV_LOCAL_PATH)

    if (mode === 'local') {
        console.log('🔄 Switching to SYNTHETIC mode (local Docker)...')

        // Backup Vercel's DATABASE_URL
        if (env.DATABASE_URL && !env.DATABASE_URL.includes('localhost')) {
            fs.writeFileSync(ENV_BACKUP_PATH, `DATABASE_URL="${env.DATABASE_URL}"\n`, 'utf-8')
            console.log(`   ✓ Backed up Vercel DATABASE_URL to ${ENV_BACKUP_PATH}`)
        }

        // Switch to local
        env.DATABASE_URL = LOCAL_DATABASE_URL
        writeEnv(ENV_LOCAL_PATH, env)
        console.log('   ✓ DATABASE_URL now points to local Docker')
        console.log('\n📋 Next steps:')
        console.log('   1. Start Docker: docker compose up postgres')
        console.log('   2. Seed data:  npm run db:seed')
        console.log('   3. Run app:    npm run dev')
        console.log('\n✨ You now have synthetic data with all 40 test players')
    } else if (mode === 'vercel') {
        console.log('🔄 Switching to REAL mode (Vercel)...')

        // Restore from backup if it exists
        if (fs.existsSync(ENV_BACKUP_PATH)) {
            const backup = readEnv(ENV_BACKUP_PATH)
            env.DATABASE_URL = backup.DATABASE_URL
            fs.unlinkSync(ENV_BACKUP_PATH)
            console.log('   ✓ Restored DATABASE_URL from backup')
        } else {
            console.log('   ⚠️  No backup found. Re-run: npm run env:pull')
            return
        }

        writeEnv(ENV_LOCAL_PATH, env)
        console.log('   ✓ DATABASE_URL now points to Vercel')
        console.log('\n📋 Next steps:')
        console.log('   1. Run app: npm run dev')
        console.log('   2. You now use the real production database')
        console.log('\n⚠️  Make sure you have database access and migrations are up to date')
    } else {
        console.error('❌ Unknown mode. Use "local" or "vercel"')
        process.exit(1)
    }
}

const mode = process.argv[2] as 'local' | 'vercel' | undefined
if (!mode || !['local', 'vercel'].includes(mode)) {
    console.error('Usage: npm run switch -- local|vercel')
    process.exit(1)
}

switchMode(mode).catch(err => {
    console.error(err)
    process.exit(1)
})
