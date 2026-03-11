// Test script to get archetype data
import './require-db-env'
import { db } from '../src/lib/db'

async function getArchetypes() {
    const archetypes = await db.archetype.findMany({
        orderBy: { name: 'asc' }
    })

    console.log(`Found ${archetypes.length} archetypes:\n`)

    archetypes.forEach(archetype => {
        console.log(`📖 ${archetype.name}`)
        console.log(`   ${archetype.description}`)
        console.log('')
    })

    await db.$disconnect()
}

getArchetypes().catch(console.error)
