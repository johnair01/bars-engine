import './require-db-env'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function upsertQuest(title: string, data: Record<string, unknown>) {
    const existing = await db.customBar.findFirst({ where: { title } })
    if (existing) {
        console.log(`Quest "${title}" exists. Updating...`)
        return db.customBar.update({
            where: { id: existing.id },
            data
        })
    }
    console.log(`Creating Quest "${title}"...`)
    return db.customBar.create({ data: { ...data, title } })
}

async function main() {
    console.log('🌱 Seeding World Content (Idempotent Run)...')

    // 0. Get a valid Creator ID (Admin)
    const adminPlayer = await db.player.findFirst({
        where: { roles: { some: { role: { key: 'admin' } } } }
    })
    const creator = adminPlayer || await db.player.findFirst()

    if (!creator) {
        console.error('❌ No players found.')
        process.exit(1)
    }
    console.log(`Using Creator ID: ${creator.id} (${creator.name})`)

    // 1. Upsert Orientation Quests
    // ===============================================
    const q1 = await upsertQuest('The First Spark', {
        description: 'Before you begin your journey, pause and reflect. What is your intention for joining the Conclave? Write it down to manifest it used the "Note" feature or simply hold it in your mind.',
        type: 'vibe',
        reward: 1,
        creatorId: creator.id,
        inputs: JSON.stringify([{ key: 'intention', label: 'My Intention', type: 'textarea' }])
    })

    const q2 = await upsertQuest('Digital Footprint', {
        description: 'Update your profile with a signature and a bio. Let others know who you are (or who you want to be).',
        type: 'standard',
        reward: 1,
        creatorId: creator.id,
        inputs: '[]'
    })

    const q3 = await upsertQuest('The Signal', {
        description: 'Check in with the Conclave. Send a "Hello" signal to the global feed to verify your connection.',
        type: 'standard',
        reward: 1,
        creatorId: creator.id,
        inputs: JSON.stringify([{ key: 'signal', label: 'Signal Message', type: 'text' }])
    })

    // 2. Welcome Aboard thread (deprecated — not useful for this instance; filtered in quest-thread.ts)
    // q1, q2, q3 remain as CustomBar records but are not linked to any thread.

    // 3. Upsert Starter Pack
    // ===============================================
    await upsertQuest('Hydration Check', {
        description: 'Drink a glass of water. Seriously. Do it now.',
        type: 'vibe',
        reward: 10,
        creatorId: creator.id,
        inputs: '[]'
    })

    await upsertQuest('Touch Grass', {
        description: 'Go outside for at least 5 minutes. Look at the sky.',
        type: 'location',
        reward: 200,
        creatorId: creator.id,
        inputs: '[]'
    })

    // Rookie Essentials pack removed per dashboard-ui-vibe-cleanup Phase 2

    console.log('🌱 Seeding Complete!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
