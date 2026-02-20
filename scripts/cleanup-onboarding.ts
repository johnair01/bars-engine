import { db } from '../src/lib/db'

async function cleanup() {
    console.log('=== STARTING ONBOARDING CLEANUP ===')

    // 1. Restore Admin Role & Assign to Argyra
    console.log('Restoring admin role...')
    const role = await db.role.upsert({
        where: { key: 'admin' },
        update: {},
        create: {
            displayName: 'Administrator',
            key: 'admin',
            description: 'Full access to all systems'
        }
    })

    const adminIds = ['test-argyra-danger-walker', 'test-admin']
    for (const adminId of adminIds) {
        await db.playerRole.upsert({
            where: {
                playerId_roleId: {
                    playerId: adminId,
                    roleId: role.id
                }
            },
            update: {},
            create: {
                playerId: adminId,
                roleId: role.id
            }
        })
        console.log(`  ✓ Admin role assigned to ${adminId}`)
    }

    // 2. Kill ALL Twine Stories and Runs (Extreme Cleanup)
    console.log('Purging all Twine stories and runs...')
    await db.twineRun.deleteMany({})
    const deletedStories = await db.twineStory.deleteMany({})
    console.log(`  ✓ Deleted ${deletedStories.count} Twine stories`)

    // 3. Delete Legacy Orientation Quests
    const legacyQuestIds = [
        'orientation-quest-1',
        'orientation-quest-2',
        'orientation-quest-3',
        'orientation-quest-4'
    ]
    const deletedQuests = await db.customBar.deleteMany({
        where: { id: { in: legacyQuestIds } }
    })
    console.log(`  ✓ Deleted ${deletedQuests.count} legacy orientation quests`)

    console.log('=== CLEANUP COMPLETE ===')
}

cleanup()
    .catch(console.error)
    .finally(() => db.$disconnect())
