/**
 * Conclave Preflight Check
 * 
 * Validates essential environment variables and database connectivity.
 * Run with: npx tsx scripts/preflight-env.ts
 */

import { PrismaClient } from '@prisma/client'
import process from 'process'

async function checkEnv() {
    console.log('🔍 Running Conclave Preflight Checks...')

    const required = [
        'DATABASE_URL',
    ]

    let missing = false
    for (const v of required) {
        if (!process.env[v]) {
            console.warn(`  ⚠️  Missing environment variable: ${v}`)
            missing = true
        } else {
            console.log(`  ✓ ${v} is present`)
        }
    }

    if (missing) {
        console.warn('\n  ! Some critical config is missing. The app may run in Guest Mode.')
    }

    // Attempt DB connection
    console.log('\n📡 Checking DB Connectivity...')
    const prisma = new PrismaClient()
    try {
        await prisma.$connect()
        await prisma.$queryRaw`SELECT 1`
        console.log('  ✓ Database is reachable')
    } catch (err: any) {
        console.warn(`  ❌ Database unreachable: ${err.message}`)
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
