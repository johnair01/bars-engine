import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function upsertQuest(title: string, data: any) {
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
        reward: 50,
        creatorId: creator.id,
        inputs: JSON.stringify([{ key: 'intention', label: 'My Intention', type: 'textarea' }])
    })

    const q2 = await upsertQuest('Digital Footprint', {
        description: 'Update your profile with a signature and a bio. Let others know who you are (or who you want to be).',
        type: 'standard',
        reward: 50,
        creatorId: creator.id,
        inputs: '[]'
    })

    const q3 = await upsertQuest('The Signal', {
        description: 'Check in with the Conclave. Send a "Hello" signal to the global feed to verify your connection.',
        type: 'standard',
        reward: 100,
        creatorId: creator.id,
        inputs: JSON.stringify([{ key: 'signal', label: 'Signal Message', type: 'text' }])
    })

    // 2. Upsert Orientation Thread
    // ===============================================
    console.log('Upserting "Welcome Aboard" Thread...')

    let thread = await db.questThread.findFirst({ where: { threadType: 'orientation' } })
    const threadData = {
        title: 'Welcome Aboard',
        description: 'Your official orientation to the Conclave. Complete these steps to unlock full access.',
        threadType: 'orientation',
        completionReward: 500
    }

    if (thread) {
        thread = await db.questThread.update({ where: { id: thread.id }, data: threadData })
    } else {
        thread = await db.questThread.create({ data: threadData })
    }

    // Relink Quests (Clear & Re-add to ensure order)
    await db.threadQuest.deleteMany({ where: { threadId: thread.id } })
    await db.threadQuest.createMany({
        data: [
            { threadId: thread.id, questId: q1.id, position: 1 },
            { threadId: thread.id, questId: q2.id, position: 2 },
            { threadId: thread.id, questId: q3.id, position: 3 }
        ]
    })
    console.log(`Linked 3 quests to thread "${thread.title}"`)

    // 3. Upsert Starter Pack
    // ===============================================
    const p1 = await upsertQuest('Hydration Check', {
        description: 'Drink a glass of water. Seriously. Do it now.',
        type: 'vibe',
        reward: 10,
        creatorId: creator.id,
        inputs: '[]'
    })

    const p2 = await upsertQuest('Touch Grass', {
        description: 'Go outside for at least 5 minutes. Look at the sky.',
        type: 'location',
        reward: 200,
        creatorId: creator.id,
        inputs: '[]'
    })

    console.log('Upserting "Rookie Essentials" Pack...')
    let pack = await db.questPack.findFirst({ where: { title: 'Rookie Essentials' } })
    const packData = {
        title: 'Rookie Essentials',
        description: 'Basic survival tasks for the modern digital wanderer.',
        creatorType: 'system'
    }

    if (pack) {
        pack = await db.questPack.update({ where: { id: pack.id }, data: packData })
    } else {
        pack = await db.questPack.create({ data: packData })
    }

    await db.packQuest.deleteMany({ where: { packId: pack.id } })
    await db.packQuest.createMany({
        data: [
            { packId: pack.id, questId: p1.id },
            { packId: pack.id, questId: p2.id }
        ]
    })
    console.log(`Linked 2 quests to pack "${pack.title}"`)

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
