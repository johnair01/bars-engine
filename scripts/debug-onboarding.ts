import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
    const questId = 'cmltr0uq80007emo4mr2ny0pm'
    const threadId = 'cmltr0uz20008emo4k0tmugtq'

    const quest = await db.customBar.findUnique({
        where: { id: questId }
    })
    console.log('Quest:', JSON.stringify(quest, null, 2))

    const progress = await db.threadProgress.findFirst({
        where: { threadId: threadId },
        include: {
            thread: {
                include: {
                    quests: {
                        orderBy: { position: 'asc' }
                    }
                }
            }
        }
    })
    console.log('Progress:', JSON.stringify(progress, null, 2))

    if (progress) {
        const player = await db.player.findUnique({
            where: { id: progress.playerId }
        })
        console.log('Player:', JSON.stringify(player, null, 2))
    }
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect())
