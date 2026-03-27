/**
 * DB Connection Diagnostic — observe before act.
 *
 * Reports which database URL the app uses (same resolution as db.ts) and whether
 * that database has the expected tables. No speculation. Facts only.
 *
 * Usage: npm run diagnose:db
 *
 * @see .specify/specs/db-connection-diagnostic/spec.md
 */

import { config } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'

config({ path: '.env' })
config({ path: '.env.local', override: true })

import { resolveDatabaseUrl } from '../src/lib/db-resolve'

function parseDbIdentity(url: string): { host: string; database: string } {
    try {
        const normalized = url.replace(/^prisma\+postgres(ql)?:/i, 'https:').replace(/^postgres(ql)?:/i, 'https:')
        const parsed = new URL(normalized)
        const host = parsed.hostname || '?'
        const database = parsed.pathname?.replace(/^\//, '') || '?'
        return { host, database }
    } catch {
        return { host: '?', database: '?' }
    }
}

async function main() {
    const dbConfig = resolveDatabaseUrl()

    if (!dbConfig) {
        console.error('No valid DB URL found. Set one of: PRISMA_DATABASE_URL, POSTGRES_PRISMA_URL, DATABASE_URL, POSTGRES_URL')
        process.exit(1)
    }

    const identity = parseDbIdentity(dbConfig.url)

    console.log('═══════════════════════════════════════════════════════════')
    console.log('  DB CONNECTION DIAGNOSTIC (read-only)')
    console.log('═══════════════════════════════════════════════════════════\n')
    console.log(`Env source: ${dbConfig.source}${dbConfig.accelerate ? ' (Accelerate)' : ''}`)
    console.log(`Database identity: ${identity.host} / ${identity.database}`)
    console.log('')

    const baseClient = new PrismaClient({
        datasources: { db: { url: dbConfig.url } },
        log: [],
    })
    const client = dbConfig.accelerate
        ? (baseClient.$extends(withAccelerate()) as unknown as PrismaClient)
        : baseClient

    try {
        await client.$connect()
        await client.$queryRaw`SELECT 1`
    } catch (err) {
        console.error('❌ Database unreachable:', err instanceof Error ? err.message : String(err))
        process.exit(1)
    }

    // Check tables and row counts
    console.log('📋 TABLES')
    console.log('─'.repeat(50))

    try {
        const partifulCols = await client.$queryRaw<{ column_name: string }[]>`
            SELECT column_name FROM information_schema.columns
            WHERE table_schema = 'public' AND table_name = 'custom_bars'
            AND column_name IN ('partifulUrl', 'eventSlug')
        `
        const names = new Set(partifulCols.map((r) => r.column_name))
        const ok = names.has('partifulUrl') && names.has('eventSlug')
        console.log(
            `   custom_bars EIP columns (partifulUrl, eventSlug): ${ok ? 'present' : 'MISSING — run migrate deploy against this DB'}`,
        )
    } catch (e) {
        console.log(`   custom_bars column check: error (${(e as Error).message})`)
    }

    const tables = ['players', 'app_config', 'instances'] as const
    for (const table of tables) {
        try {
            const existsRows = await client.$queryRaw<[{ exists: boolean }]>`
                SELECT EXISTS(
                    SELECT 1 FROM information_schema.tables
                    WHERE table_schema = 'public' AND table_name = ${table}
                ) as exists
            `
            const exists = existsRows[0]?.exists ?? false
            if (!exists) {
                console.log(`   ${table}: missing`)
                continue
            }
            const countRows = await client.$queryRawUnsafe<[{ count: bigint }]>(
                `SELECT COUNT(*)::bigint as count FROM "${table}"`
            )
            const count = Number(countRows[0]?.count ?? 0)
            console.log(`   ${table}: exists (${count} rows)`)
        } catch (e) {
            console.log(`   ${table}: error (${(e as Error).message})`)
        }
    }

    // Check audit_logs for recent destructive resets (survives resets)
    console.log('')
    console.log('📜 RECENT RESET EVENTS (audit_logs)')
    console.log('─'.repeat(50))
    try {
        const resets = await client.auditLog.findMany({
            where: {
                action: {
                    in: [
                        'SYSTEM_RESET_STARTED',
                        'SYSTEM_RESET_COMPLETED',
                        'SYSTEM_RESET_FAILED',
                        'PROD_RESET_STARTED',
                        'PROD_RESET_COMPLETED',
                        'PROD_RESET_FAILED',
                    ],
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: { action: true, createdAt: true, payloadJson: true },
        })
        if (resets.length === 0) {
            console.log('   No reset events found.')
        } else {
            for (const r of resets) {
                let source = 'unknown'
                try {
                    const p = r.payloadJson ? JSON.parse(r.payloadJson) : {}
                    source = (p as { source?: string }).source || source
                } catch {
                    /* ignore */
                }
                const when = r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt)
                console.log(`   ${r.action} | ${when} | source: ${source}`)
            }
        }
    } catch (e) {
        console.log(`   Error: ${(e as Error).message}`)
    }

    // Prisma migrate history — recent activity on this physical DB (not a full "who reset" proof)
    console.log('')
    console.log('📦 PRISMA MIGRATIONS (this database)')
    console.log('─'.repeat(50))
    try {
        const latest = await client.$queryRaw<{ migration_name: string; finished_at: Date }[]>`
            SELECT migration_name, finished_at
            FROM _prisma_migrations
            WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
            ORDER BY finished_at DESC
            LIMIT 1
        `
        if (latest[0]) {
            const t = latest[0].finished_at instanceof Date ? latest[0].finished_at.toISOString() : String(latest[0].finished_at)
            console.log(`   Latest applied: ${latest[0].migration_name}`)
            console.log(`   Finished at:    ${t}`)
        } else {
            console.log('   No finished migrations found (empty _prisma_migrations or new DB).')
        }
        const last24h = await client.$queryRaw<{ migration_name: string; finished_at: Date }[]>`
            SELECT migration_name, finished_at
            FROM _prisma_migrations
            WHERE finished_at IS NOT NULL
              AND rolled_back_at IS NULL
              AND finished_at > NOW() - INTERVAL '24 hours'
            ORDER BY finished_at DESC
        `
        if (last24h.length === 0) {
            console.log('   Migrations applied in last 24h: none')
        } else {
            console.log(`   Migrations applied in last 24h: ${last24h.length}`)
            for (const m of last24h.slice(0, 15)) {
                const t = m.finished_at instanceof Date ? m.finished_at.toISOString() : String(m.finished_at)
                console.log(`     • ${m.migration_name} @ ${t}`)
            }
            if (last24h.length > 15) console.log(`     … and ${last24h.length - 15} more`)
        }
    } catch (e) {
        const msg = (e as Error).message
        if (msg.includes('does not exist') || msg.includes('42P01')) {
            console.log(
                '   No _prisma_migrations table — migrate history unavailable (db push–only DB, or non-standard schema).',
            )
        } else {
            console.log(`   Could not read _prisma_migrations: ${msg}`)
        }
    }

    // Data recency hint (optional — empty DB or all-new rows may indicate wrong instance)
    console.log('')
    console.log('📅 DATA RECENCY (players)')
    console.log('─'.repeat(50))
    try {
        const agg = await client.$queryRaw<{ min_c: Date | null; max_c: Date | null }[]>`
            SELECT MIN("createdAt") AS min_c, MAX("createdAt") AS max_c FROM players
        `
        const row = agg[0]
        if (row?.min_c != null) {
            const min = row.min_c instanceof Date ? row.min_c.toISOString() : String(row.min_c)
            const max = row.max_c instanceof Date ? row.max_c.toISOString() : String(row.max_c)
            console.log(`   Oldest player createdAt: ${min}`)
            console.log(`   Newest player createdAt: ${max}`)
        } else {
            console.log('   (no players rows)')
        }
    } catch (e) {
        console.log(`   Could not query players: ${(e as Error).message}`)
    }

    console.log('')
    console.log('To verify: Compare "Database identity" and row counts to what you expect.')
    console.log('')
    console.log('If this is the wrong database:')
    console.log('  • Development: DATABASE_URL > POSTGRES_URL > PRISMA_DATABASE_URL > POSTGRES_PRISMA_URL')
    console.log('  • Production: PRISMA_DATABASE_URL > POSTGRES_PRISMA_URL > DATABASE_URL > POSTGRES_URL')
    console.log('  • To use a different DB: unset or comment out higher-priority vars in .env.local')
    console.log('  • vercel env pull overwrites .env.local with Production vars; check Vercel Dashboard')
    console.log('    for which URL is set per environment (Production / Preview / Development).')
    console.log('')
    await client.$disconnect()
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
