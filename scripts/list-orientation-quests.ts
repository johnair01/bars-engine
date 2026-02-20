import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
    const threadId = 'cmltr0uz20008emo4k0tmugtq'

    const thread = await db.questThread.findUnique({
        where: { id: threadId },
        include: {
            quests: {
                orderBy: { position: 'asc' },
                include: { quest: true }
            }
        }
    })

    if (!thread) {
        console.error('Thread not found')
        return
    }

    console.log('Orientation Thread Quests:')
    thread.quests.forEach(tq => {
        console.log(`Pos ${tq.position}: ${tq.quest.title} (ID: ${tq.quest.id}) Type: ${tq.quest.type}`)
        console.log(`Inputs: ${tq.quest.inputs}`)
        console.log('---')
    })
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect())
