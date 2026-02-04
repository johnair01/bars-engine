
import { db } from '../src/lib/db'

async function main() {
    const name = process.argv[2]
    if (!name) {
        console.error('Usage: npx tsx scripts/find-player-id.ts <name>')
        process.exit(1)
    }

    const player = await db.player.findFirst({
        where: { name: { equals: name, mode: 'insensitive' } } // Case insensitive search
    })

    if (player) {
        console.log(`Found ID: ${player.id}`)
    } else {
        console.error('Player not found')
        process.exit(1)
    }
}

main()
    .then(async () => await db.$disconnect())
    .catch(async (e) => {
        console.error(e)
        await db.$disconnect()
        process.exit(1)
    })
