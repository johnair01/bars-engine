/**
 * READ-ONLY diagnostic: determine why production login/signup fails.
 * Does NOT modify the database. Run against prod DATABASE_URL to get root cause.
 *
 * Usage:
 *   DATABASE_URL="<prod-url>" npx tsx scripts/diagnose-prod-db.ts
 *
 * Outputs: migration state, schema state (players columns), and whether
 * prod DB matches what the current code expects.
 * @see .specify/specs/production-database-divergence/spec.md
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'

config({ path: '.env.local' })
config({ path: '.env' })

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
        return parsed.hostname ? `***@${parsed.hostname}` : '***'
    } catch {
        return '***'
    }
}

const prisma = new PrismaClient({ datasources: { db: { url } } })

async function main() {
    console.log('═══════════════════════════════════════════════════════════')
    console.log('  PRODUCTION DB DIAGNOSTIC (read-only)')
    console.log('═══════════════════════════════════════════════════════════\n')
    console.log(`Target: ${redactHost(url)}\n`)

    try {
        await prisma.$connect()
        await prisma.$queryRaw`SELECT 1`
    } catch (err) {
        console.error('❌ Database unreachable:', err instanceof Error ? err.message : err)
        process.exit(1)
    }

    // 1. Applied migrations
    console.log('📋 APPLIED MIGRATIONS')
    console.log('─'.repeat(50))
    let migrations: { migration_name: string; finished_at: Date | null }[] = []
    try {
        migrations = await prisma.$queryRaw`SELECT migration_name, finished_at FROM _prisma_migrations WHERE rolled_back_at IS NULL ORDER BY started_at`
        if (migrations.length === 0) {
            console.log('   (none — table may not exist or no migrations applied)\n')
        } else {
            migrations.forEach(m => {
                const status = m.finished_at ? '✓' : '✗ (failed)'
                console.log(`   ${status} ${m.migration_name}`)
            })
            console.log('')
        }
    } catch (e) {
        console.log('   Could not read _prisma_migrations:', (e as Error).message)
        console.log('   (DB may not use Prisma Migrate)\n')
    }

    // 2. Schema: players table columns (critical for playbook→archetype)
    console.log('📐 PLAYERS TABLE SCHEMA')
    console.log('─'.repeat(50))
    let playerColumns: string[] = []
    try {
        const rows = await prisma.$queryRaw<{ column_name: string }[]>`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'players'
            ORDER BY ordinal_position
        `
        playerColumns = rows.map(r => r.column_name)
        const hasArchetypeId = playerColumns.includes('archetypeId')
        const hasPlaybookId = playerColumns.includes('playbookId')
        console.log(`   archetypeId: ${hasArchetypeId ? '✓ YES' : '✗ NO'}`)
        console.log(`   playbookId:  ${hasPlaybookId ? '✓ YES' : '✗ NO'}`)
        if (hasPlaybookId && !hasArchetypeId) {
            console.log('\n   ⚠️  SCHEMA MISMATCH: DB has playbookId but code expects archetypeId.')
            console.log('   Current code (after playbook→archetype migration) expects archetypeId.')
            console.log('   Fix: Run prisma migrate deploy against this DB.')
        } else if (!hasPlaybookId && hasArchetypeId) {
            console.log('\n   ✓ Schema matches current code (archetypeId present).')
        }
        console.log('')
    } catch (e) {
        console.log('   Could not read schema:', (e as Error).message)
        console.log('   (players table may not exist)\n')
    }

    // 3. Tables: archetypes vs playbooks
    console.log('📋 TABLES: archetypes vs playbooks')
    console.log('─'.repeat(50))
    try {
        const tables = await prisma.$queryRaw<{ tablename: string }[]>`
            SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('archetypes', 'playbooks')
        `
        const hasArchetypes = tables.some(t => t.tablename === 'archetypes')
        const hasPlaybooks = tables.some(t => t.tablename === 'playbooks')
        console.log(`   archetypes: ${hasArchetypes ? '✓ exists' : '✗ missing'}`)
        console.log(`   playbooks:  ${hasPlaybooks ? '✓ exists' : '✗ missing'}`)
        if (hasPlaybooks && !hasArchetypes) {
            console.log('\n   ⚠️  SCHEMA MISMATCH: DB has playbooks table but code expects archetypes.')
        }
        console.log('')
    } catch (e) {
        console.log('   Could not check tables:', (e as Error).message, '\n')
    }

    // 4. Row counts (try both Prisma and raw if Prisma fails)
    console.log('📊 ROW COUNTS')
    console.log('─'.repeat(50))
    try {
        const [accounts, players, roles] = await Promise.all([
            prisma.account.count(),
            prisma.player.count(),
            prisma.role.count(),
        ])
        console.log(`   accounts: ${accounts}`)
        console.log(`   players:  ${players}`)
        console.log(`   roles:    ${roles}`)
        console.log('')
    } catch (e) {
        console.log('   Prisma count failed:', (e as Error).message)
        console.log('   (Likely schema mismatch — Prisma client expects current schema).')
        try {
            const accountsRaw = await prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) FROM accounts`
            const playersRaw = await prisma.$queryRaw<[{ count: bigint }]>`SELECT COUNT(*) FROM players`
            console.log(`   Raw counts: accounts=${accountsRaw[0]?.count ?? '?'}, players=${playersRaw[0]?.count ?? '?'}`)
        } catch { /* ignore */ }
        console.log('')
    }

    // 5. Admin existence (if Prisma works)
    console.log('👤 ADMIN: admin@admin.local')
    console.log('─'.repeat(50))
    try {
        const adminAccount = await prisma.account.findUnique({
            where: { email: 'admin@admin.local' },
            include: { players: { include: { roles: { include: { role: true } } } } },
        })
        const hasAdmin = !!adminAccount
        const hasAdminRole = adminAccount?.players.some(p =>
            p.roles.some(r => r.role.key === 'admin')
        ) ?? false
        console.log(`   exists: ${hasAdmin ? 'yes' : 'no'}`)
        console.log(`   has admin role: ${hasAdminRole ? 'yes' : 'no'}`)
        console.log('')
    } catch (e) {
        console.log('   Could not check (Prisma error):', (e as Error).message)
        console.log('')
    }

    // 6. Summary and recommendation
    console.log('═══════════════════════════════════════════════════════════')
    console.log('  DIAGNOSIS')
    console.log('═══════════════════════════════════════════════════════════\n')

    const playbookRenameApplied = migrations.some(m =>
        m.migration_name.includes('playbook_to_archetype') && m.finished_at
    )
    const hasArchetypeId = playerColumns.includes('archetypeId')
    const hasPlaybookId = playerColumns.includes('playbookId')

    if (hasPlaybookId && !hasArchetypeId) {
        console.log('ROOT CAUSE: Schema mismatch.')
        console.log('  Production DB has OLD schema (playbookId) but deployed code expects.')
        console.log('  NEW schema (archetypeId) from playbook→archetype migration.')
        console.log('')
        console.log('RECOMMENDATION:')
        console.log('  1. Run: DATABASE_URL="<prod>" npx prisma migrate deploy')
        console.log('     This applies pending migrations (including playbook→archetype).')
        console.log('  2. Migrations are designed to RENAME, not drop — data should be preserved.')
        console.log('  3. After deploy, run: npm run ensure:admin-local')
        console.log('  4. Redeploy app if needed (or next deploy will pick up schema).')
        console.log('')
    } else if (!playbookRenameApplied && migrations.length > 0) {
        console.log('ROOT CAUSE: playbook→archetype migration not applied.')
        console.log('  Run: DATABASE_URL="<prod>" npx prisma migrate deploy')
        console.log('')
    } else if (hasArchetypeId) {
        console.log('Schema appears correct. Issue may be:')
        console.log('  - Missing seed data (roles, admin account)')
        console.log('  - Connection/SSL/pooling issue')
        console.log('  - Different DATABASE_URL between local and prod')
        console.log('')
        console.log('RECOMMENDATION: Run npm run db:seed and ensure:admin-local against prod.')
        console.log('')
    } else {
        console.log('Insufficient schema info. Check output above.')
        console.log('')
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
