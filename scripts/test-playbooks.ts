// Test script to get playbook data
import './require-db-env'
import { db } from '../src/lib/db'

async function getPlaybooks() {
    const playbooks = await db.playbook.findMany({
        orderBy: { name: 'asc' }
    })

    console.log(`Found ${playbooks.length} playbooks:\n`)

    playbooks.forEach(pb => {
        console.log(`📖 ${pb.name}`)
        console.log(`   ${pb.description}`)
        console.log('')
    })

    await db.$disconnect()
}

getPlaybooks().catch(console.error)
