
import { db } from '../src/lib/db'

async function main() {
    console.log('Checking for latest generated quests...')
    const quests = await db.customBar.findMany({
        where: { type: 'vibe' },
        orderBy: { createdAt: 'desc' },
        take: 3
    })

    quests.forEach(q => {
        console.log(`[${q.createdAt.toISOString()}] ${q.title} (Creator: ${q.creatorId})`)
        console.log(`Moves: ${q.description.slice(0, 50)}...`)
    })
}

main()
