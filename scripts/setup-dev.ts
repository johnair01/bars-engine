#!/usr/bin/env npx tsx
/**
 * One-command dev setup: migrate deploy → db:seed → pre-launch seeds → loop:ready:quick
 * Fails fast with clear message at first error.
 * @see .specify/specs/dev-setup-anti-fragile/spec.md
 */

import { config } from 'dotenv'
import { execSync } from 'child_process'

config({ path: '.env.local' })
config({ path: '.env' })

const STEPS = [
    { name: 'Migrate deploy', cmd: 'npx tsx scripts/with-env.ts "prisma migrate deploy"' },
    { name: 'Base seed (db:seed)', cmd: 'npm run db:seed' },
    { name: 'Pre-launch: party', cmd: 'npm run seed:party' },
    { name: 'Pre-launch: quest-map', cmd: 'npm run seed:quest-map' },
    { name: 'Pre-launch: onboarding', cmd: 'npm run seed:onboarding' },
    { name: 'Pre-launch: cert:cyoa', cmd: 'npm run seed:cert:cyoa' },
    { name: 'Loop readiness', cmd: 'npm run loop:ready:quick' },
]

function main() {
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_PRISMA_URL) {
        console.error('❌ DATABASE_URL is required.')
        console.error('   Run: npm run env:pull  (or add DATABASE_URL to .env.local)')
        console.error('   See: docs/ENV_AND_VERCEL.md')
        process.exit(1)
    }

    console.log('🔧 Dev Setup — migrate → seeds → loop:ready\n')

    for (const step of STEPS) {
        console.log(`▶ ${step.name}...`)
        try {
            execSync(step.cmd, { stdio: 'inherit', cwd: process.cwd(), env: process.env })
        } catch {
            console.error(`\n❌ Failed at: ${step.name}`)
            console.error(`   Command: ${step.cmd}`)
            console.error('   See: .specify/specs/dev-setup-anti-fragile/INCIDENTS.md')
            process.exit(1)
        }
    }

    console.log('\n✅ Setup complete. Run: npm run dev')
}

main()
