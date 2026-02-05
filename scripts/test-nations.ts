// Test script to verify nation data access
import { db } from '../src/lib/db'

async function testNationAccess() {
    console.log('Fetching nations from database...\n')

    const nations = await db.nation.findMany({
        orderBy: { name: 'asc' }
    })

    console.log(`Found ${nations.length} nations:\n`)

    nations.forEach(nation => {
        console.log(`🏛️  ${nation.name}`)
        console.log(`   Description: ${nation.description}`)
        console.log(`   Wake Up: ${nation.wakeUp || 'Not set'}`)
        console.log(`   Clean Up: ${nation.cleanUp || 'Not set'}`)
        console.log(`   Grow Up: ${nation.growUp || 'Not set'}`)
        console.log(`   Show Up: ${nation.showUp || 'Not set'}`)
        console.log('')
    })

    await db.$disconnect()
}

testNationAccess().catch(console.error)
