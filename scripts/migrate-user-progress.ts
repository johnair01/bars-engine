
import { db } from '../src/lib/db'

async function migrateUsers() {
    console.log('🚀 Migrating User Progress to PlayerQuest...\n')

    const packs = await db.starterPack.findMany({ include: { player: true } })
    console.log(`Found ${packs.length} starter packs to process.`)

    for (const pack of packs) {
        console.log(`Processing Player: ${pack.player.name} (${pack.playerId})`)
        let data: any = {}
        try {
            data = JSON.parse(pack.data)
        } catch (e) {
            console.error(`❌ Failed to parse data for ${pack.playerId}`)
            continue
        }

        const completed = data.completedBars || []
        const active = data.activeBars || []

        // Process Completed
        for (const item of completed) {
            const barId = item.id
            const inputs = item.inputs

            // Verify bar exists (it should, we just seeded them)
            const exists = await db.customBar.findUnique({ where: { id: barId } })
            if (!exists) {
                console.warn(`⚠️ Skipped unknown bar: ${barId}`)
                continue
            }

            await db.playerQuest.upsert({
                where: {
                    playerId_questId: {
                        playerId: pack.playerId,
                        questId: barId
                    }
                },
                update: {
                    status: 'completed',
                    inputs: JSON.stringify(inputs),
                    completedAt: new Date() // Approximate
                },
                create: {
                    playerId: pack.playerId,
                    questId: barId,
                    status: 'completed',
                    inputs: JSON.stringify(inputs),
                    completedAt: new Date(),
                    assignedAt: new Date()
                }
            })
            console.log(`  ✓ Migrated Completed: ${barId}`)
        }

        // Process Active
        for (const barId of active) {
            // Verify bar exists
            const exists = await db.customBar.findUnique({ where: { id: barId } })
            if (!exists) {
                console.warn(`⚠️ Skipped unknown bar: ${barId}`)
                continue
            }

            // Don't overwrite if already completed
            const distinct = await db.playerQuest.findUnique({
                where: {
                    playerId_questId: {
                        playerId: pack.playerId,
                        questId: barId
                    }
                }
            })

            if (!distinct) {
                await db.playerQuest.create({
                    data: {
                        playerId: pack.playerId,
                        questId: barId,
                        status: 'assigned',
                        inputs: null,
                        assignedAt: new Date()
                    }
                })
                console.log(`  ✓ Migrated Active: ${barId}`)
            }
        }
    }
    console.log('\n✅ User Progress Migrated!')
}

migrateUsers().catch(e => {
    console.error(e)
    process.exit(1)
})
