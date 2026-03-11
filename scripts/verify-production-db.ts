/**
 * Verify production database state: connectivity, row counts, and admin@admin.local status.
 * Use to diagnose prod vs dev database divergence.
 *
 * Usage:
 *   DATABASE_URL="<url>" npx tsx scripts/verify-production-db.ts
 *   npx tsx scripts/verify-production-db.ts --url "<url>"
 *
 * Exits 0 if admin@admin.local exists with admin role; 1 otherwise.
 * @see .specify/specs/production-database-divergence/spec.md
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

config({ path: '.env.local' })
config({ path: '.env' })

// Allow --url to override env
const urlArg = process.argv.find(a => a.startsWith('--url='))
if (urlArg) {
    process.env.DATABASE_URL = urlArg.slice('--url='.length)
}

const url = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL
if (!url || url.trim() === '') {
    console.error('DATABASE_URL is required. Set it in env or pass --url=<connection-string>')
    process.exit(1)
}

function redactHost(u: string): string {
    try {
        const parsed = new URL(u.replace(/^postgresql:/, 'https:'))
        const host = parsed.hostname
        return host ? `***@${host}` : '***'
    } catch {
        return '***'
    }
}

const prisma = new PrismaClient({ datasources: { db: { url } } })

async function main() {
    console.log('🔍 Verifying production database...')
    console.log(`   Host: ${redactHost(url)}\n`)

    try {
        await prisma.$connect()
        await prisma.$queryRaw`SELECT 1`
    } catch (err) {
        console.error('❌ Database unreachable:', err instanceof Error ? err.message : err)
        process.exit(1)
    }

    const [accountsCount, playersCount, rolesCount] = await Promise.all([
        prisma.account.count(),
        prisma.player.count(),
        prisma.role.count(),
    ])

    console.log('📊 Row counts:')
    console.log(`   accounts: ${accountsCount}`)
    console.log(`   players:  ${playersCount}`)
    console.log(`   roles:    ${rolesCount}`)

    const adminAccount = await prisma.account.findUnique({
        where: { email: 'admin@admin.local' },
        include: { players: { include: { roles: { include: { role: true } } } } },
    })

    const hasAdmin = !!adminAccount
    const hasAdminRole = adminAccount?.players.some(p =>
        p.roles.some(r => r.role.key === 'admin')
    ) ?? false

    console.log('\n👤 admin@admin.local:')
    console.log(`   exists: ${hasAdmin ? 'yes' : 'no'}`)
    console.log(`   has admin role: ${hasAdminRole ? 'yes' : 'no'}`)

    if (hasAdmin && hasAdminRole) {
        console.log('\n✅ Admin ready. Exit 0.')
        process.exit(0)
    }

    console.log('\n⚠️  Admin missing or without role. Run: npm run db:seed && npx tsx scripts/ensure-admin-local.ts')
    process.exit(1)
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
