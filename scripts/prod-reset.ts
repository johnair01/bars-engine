import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

async function safeAudit(action: string, payload: Record<string, unknown>) {
    try {
        await prisma.auditLog.create({
            data: {
                actorAdminId: 'system',
                action,
                targetType: 'system',
                targetId: String(payload.resetRunId || 'unknown'),
                payloadJson: JSON.stringify(payload)
            }
        })
    } catch (error) {
        console.log(`  - Audit log skipped for ${action}: ${(error as Error).message}`)
    }
}

async function reset() {
    console.log('⚠️  WARNING: Starting Full Production Reset...')
    const resetRunId = `prod_reset_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const startedAt = new Date()
    await safeAudit('PROD_RESET_STARTED', {
        resetRunId,
        source: 'script:prod-reset',
        startedAt: startedAt.toISOString()
    })

    // Ordered deletions to handle foreign keys
    const tables = [
        // Keep audit_logs so reset history survives resets.
        'admin_audit_log',
        'player_roles',
        'thread_quests',
        'thread_progress',
        'pack_progress',
        'starter_quest_progress',
        'player_quests',
        'vibulon_events',
        'vibulons',
        'starter_packs',
        'thread_progress', // duplicated just in case
        'custom_bars',
        'quest_threads',
        'players',
        'accounts',
        'invites',
        'nations',
        'playbooks',
        'story_ticks',
        'global_state',
        'app_config',
        'bars' // Legacy bars table
    ]

    const resetSummary = {
        truncated: [] as string[],
        deleted: [] as string[],
        skipped: [] as string[]
    }

    try {
        for (const table of tables) {
            try {
                await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`)
                console.log(`  ✓ Truncated ${table}`)
                resetSummary.truncated.push(table)
            } catch {
                // Fallback for tables that might not exist or if CASCADE isn't supported exactly this way
                try {
                    await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`)
                    console.log(`  ✓ Deleted from ${table}`)
                    resetSummary.deleted.push(table)
                } catch {
                    console.log(`  - Skip ${table} (likely doesn't exist or already empty)`)
                    resetSummary.skipped.push(table)
                }
            }
        }

        console.log('✅ Reset complete. Now seeding...')

        // Run the actual seed script
        execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' })

        await safeAudit('PROD_RESET_COMPLETED', {
            resetRunId,
            source: 'script:prod-reset',
            startedAt: startedAt.toISOString(),
            completedAt: new Date().toISOString(),
            summary: resetSummary
        })

        console.log('🚀 Production reset and seed finished.')
    } catch (error) {
        await safeAudit('PROD_RESET_FAILED', {
            resetRunId,
            source: 'script:prod-reset',
            startedAt: startedAt.toISOString(),
            failedAt: new Date().toISOString(),
            error: error instanceof Error ? error.message : String(error),
            summary: resetSummary
        })
        throw error
    }
}

reset()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Reset failed:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
