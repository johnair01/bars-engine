import './require-db-env'
import { db } from '../src/lib/db'
import { STARTER_BARS } from '../src/lib/bars'

// Helper to ensure system user exists
async function ensureSystemUser() {
    const systemUser = await db.player.findFirst({ where: { contactValue: 'system@bars.engine' } })
    if (systemUser) return systemUser.id

    // Create system invite if needed
    const invite = await db.invite.upsert({
        where: { token: 'SYSTEM_INVITE' },
        update: {},
        create: { token: 'SYSTEM_INVITE', maxUses: 999 }
    })

    const user = await db.player.create({
        data: {
            name: 'System',
            contactType: 'email',
            contactValue: 'system@bars.engine',
            inviteId: invite.id
        }
    })
    return user.id
}

async function run() {
    try {
        const sysId = await ensureSystemUser()

        // Patch the CREATE payload with the sysId
        // Upsert creates need the ID.
        // I'll modify the loop to include creatorId: sysId

        console.log('🚀 Migrating Starter Bars to CustomBar (System Quests)...\n')

        for (const bar of STARTER_BARS) {
            console.log(`Processing: ${bar.title} (${bar.id})`)

            await db.customBar.upsert({
                where: { id: bar.id },
                update: {
                    title: bar.title,
                    description: bar.description,
                    type: bar.type,
                    reward: bar.reward,
                    inputs: JSON.stringify(bar.inputs || []),
                    storyPath: bar.storyPath || null,
                    isSystem: true,
                    // visibility: 'public', // Don't override visibility if it was changed manually? Actually system quests are always public.
                },
                create: {
                    id: bar.id,
                    creatorId: sysId,
                    title: bar.title,
                    description: bar.description,
                    type: bar.type,
                    reward: bar.reward,
                    inputs: JSON.stringify(bar.inputs || []),
                    storyPath: bar.storyPath || null,
                    isSystem: true,
                    visibility: 'public',
                    status: 'active',
                    kotterStage: 1
                }
            })
        }
        console.log('\n✅ Starter Bars Migrated!')

    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}

run()
