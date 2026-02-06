import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient()

async function reset() {
    console.log('⚠️  WARNING: Starting Full Production Reset...')

    // Ordered deletions to handle foreign keys
    const tables = [
        'audit_logs',
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

    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`)
            console.log(`  ✓ Truncated ${table}`)
        } catch (e: any) {
            // Fallback for tables that might not exist or if CASCADE isn't supported exactly this way
            try {
                await prisma.$executeRawUnsafe(`DELETE FROM "${table}";`)
                console.log(`  ✓ Deleted from ${table}`)
            } catch (e2) {
                console.log(`  - Skip ${table} (likely doesn't exist or already empty)`)
            }
        }
    }

    console.log('✅ Reset complete. Now seeding...')

    // Run the actual seed script
    execSync('npx tsx prisma/seed.ts', { stdio: 'inherit' })

    console.log('🚀 Production reset and seed finished.')
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
