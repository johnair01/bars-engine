import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
    const threadId = 'cmltr0uz20008emo4k0tmugtq'
    const arrivalQuestId = 'onboarding-arrival'

    // Find any player to be the creator
    const player = await db.player.findFirst()
    if (!player) throw new Error('No players found in DB')
    const creatorId = player.id

    // 1. Create the Arrival quest if it doesn't exist
    await db.customBar.upsert({
        where: { id: arrivalQuestId },
        update: {},
        create: {
            id: arrivalQuestId,
            title: 'The Crossing',
            description: 'You have arrived in the Conclave. The boundary has been crossed.',
            type: 'onboarding',
            reward: 0,
            status: 'active',
            visibility: 'public',
            creatorId,
            isSystem: true,
            inputs: JSON.stringify([
                {
                    key: 'presence',
                    label: 'Arrival confirmation',
                    type: 'hidden',
                    trigger: 'SIGN_IN',
                    defaultValue: 'arrived'
                }
            ])
        }
    })

    // 2. Shift existing quests in the thread
    const threadQuests = await db.threadQuest.findMany({
        where: { threadId },
        orderBy: { position: 'desc' }
    })

    for (const tq of threadQuests) {
        await db.threadQuest.update({
            where: { id: tq.id },
            data: { position: tq.position + 1 }
        })
    }

    // 3. Insert Arrival quest at position 1
    await db.threadQuest.create({
        data: {
            threadId,
            questId: arrivalQuestId,
            position: 1
        }
    })

    console.log('Successfully injected "The Crossing" into the Orientation Ritual.')
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect())
