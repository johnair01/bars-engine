
import { db } from '../src/lib/db'

async function main() {
    console.log('Checking Hexagrams...')
    const count = await db.bar.count()
    console.log(`Total Hexagrams: ${count}`)

    if (count > 0) {
        const first = await db.bar.findFirst()
        console.log('Sample:', first)
    } else {
        console.error('No hexagrams found! seeding needed.')
    }
}

main()
