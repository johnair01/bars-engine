import { db } from '../src/lib/db'

async function main() {
    console.log('--- Verifying Town Square Data ---')

    // 1. Find the test user
    const player = await db.player.findFirst({
        where: { name: 'testtttt' }
    })

    if (!player) {
        console.error('Test player not found')
        return
    }

    // 2. Find "Rookie Essentials" pack
    const pack = await db.questPack.findFirst({
        where: { title: 'Rookie Essentials' },
        include: { quests: true }
    })

    if (pack) {
        console.log(`Found pack: ${pack.title}`)
        // Force complete it for the player
        const allQuestIds = pack.quests.map(q => q.questId)

        await db.packProgress.upsert({
            where: {
                packId_playerId: { packId: pack.id, playerId: player.id }
            },
            create: {
                packId: pack.id,
                playerId: player.id,
                completed: JSON.stringify(allQuestIds),
                completedAt: new Date()
            },
            update: {
                completed: JSON.stringify(allQuestIds),
                completedAt: new Date()
            }
        })
        console.log('Marked pack as complete for player (enabling Recycle)')

        // Also ensure creatorId is set to player so they can recycle it
        // (Since it was system created properly, we might need to fake ownership for this test 
        // OR just test that System packs can't be recycled... 
        // Wait, "Community Packs" implementation guidelines: "Player-created packs that have been released".
        // A system pack is NOT a player pack.
        // So I should create a NEW player pack to test recycling.

        const playerPack = await db.questPack.create({
            data: {
                title: 'My Custom Pack',
                description: 'A pack created by testtttt',
                creatorType: 'player',
                creatorId: player.id,
                status: 'active',
                visibility: 'private',
                quests: {
                    create: {
                        quest: {
                            create: {
                                creatorId: player.id,
                                title: 'My Custom Quest',
                                description: 'Test quest inside pack',
                                type: 'vibe',
                                reward: 10
                            }
                        }
                    }
                },
                progress: {
                    create: {
                        playerId: player.id,
                        completed: '[]', // Not completed yet
                        completedAt: null
                    }
                }
            },
            include: { quests: true }
        })

        // Mark IT as complete
        const pqIds = playerPack.quests.map(q => q.questId)
        await db.packProgress.update({
            where: { packId_playerId: { packId: playerPack.id, playerId: player.id } },
            data: {
                completed: JSON.stringify(pqIds),
                completedAt: new Date()
            }
        })
        console.log(`Created and completed player pack: ${playerPack.title} (ID: ${playerPack.id})`)
    }

    // 3. Create a public "Salad Bowl" quest
    await db.customBar.create({
        data: {
            creatorId: player.id,
            title: 'Community Potluck',
            description: 'A shared quest for everyone in the Town Square.',
            type: 'vibe',
            visibility: 'public', // This puts it in Salad Bowl
            isSystem: false,
            reward: 5
        }
    })
    console.log('Created public Salad Bowl quest: Community Potluck')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
