#!/usr/bin/env npx tsx
/**
 * Connection forensics — which env vars are set and what the app would use.
 * Does NOT connect to the database. Safe to run anywhere.
 *
 * Usage: npm run diagnose:connection
 *
 * Helps answer: "How were things connecting before?" when debugging data loss.
 */

import { config } from 'dotenv'

config({ path: '.env.local' })
config({ path: '.env' })

const VAR_NAMES = [
    'DATABASE_URL',
    'POSTGRES_URL',
    'PRISMA_DATABASE_URL',
    'POSTGRES_PRISMA_URL',
] as const

function redact(url: string): string {
    try {
        const u = url.replace(/^postgres(ql)?:/i, 'https:').replace(/^prisma\+postgres(ql)?:/i, 'https:')
        const parsed = new URL(u)
        const host = parsed.hostname || '?'
        const db = parsed.pathname?.replace(/^\//, '') || '?'
        const scheme = url.startsWith('prisma+') ? 'Accelerate' : 'direct'
        return `${scheme} @ ${host} / ${db}`
    } catch {
        return '(invalid URL)'
    }
}

function main() {
    console.log('═══════════════════════════════════════════════════════════')
    console.log('  CONNECTION FORENSICS (no DB connection)')
    console.log('═══════════════════════════════════════════════════════════\n')

    console.log('NODE_ENV:', process.env.NODE_ENV || '(not set)')
    console.log('VERCEL:', process.env.VERCEL || '(not set)')
    console.log('')

    console.log('ENV VARS (which are set)')
    console.log('─'.repeat(50))
    for (const name of VAR_NAMES) {
        const val = process.env[name]
        if (val) {
            console.log(`   ${name}: ${redact(val)}`)
        } else {
            console.log(`   ${name}: (not set)`)
        }
    }

    console.log('')
    console.log('RESOLUTION (what app would use)')
    console.log('─'.repeat(50))

    const isDev = process.env.NODE_ENV !== 'production'
    const order = isDev
        ? VAR_NAMES
        : (['PRISMA_DATABASE_URL', 'POSTGRES_PRISMA_URL', 'DATABASE_URL', 'POSTGRES_URL'] as const)

    let picked: string | null = null
    for (const name of order) {
        const val = process.env[name]
        if (val && /^(prisma\+)?postgres(ql)?:\/\//i.test(val)) {
            picked = name
            console.log(`   Mode: ${isDev ? 'development' : 'production'}`)
            console.log(`   Would use: ${name}`)
            console.log(`   → ${redact(val)}`)
            break
        }
    }
    if (!picked) {
        console.log('   No valid Postgres URL found in env.')
    }

    console.log('')
    console.log('NOTES')
    console.log('─'.repeat(50))
    console.log('  • vercel env pull overwrites .env.local with Vercel vars')
    console.log('  • Dev prefers DATABASE_URL; prod prefers PRISMA_DATABASE_URL')
    console.log('  • If both point to different DBs, local vs prod may differ')
    console.log('  • Run npm run diagnose:db to verify actual connection and row counts')
    console.log('')
}

main()
