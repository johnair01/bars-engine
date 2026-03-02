import './require-db-env'
import { db } from '../src/lib/db'
import * as fs from 'fs'
import * as path from 'path'

const QUEST_MAP_IDS = ['Q-MAP-1', 'Q-MAP-2', 'Q-MAP-3', 'Q-MAP-4', 'Q-MAP-5', 'Q-MAP-6', 'Q-MAP-7', 'Q-MAP-8']

async function main() {
    const dataPath = path.join(process.cwd(), 'data', 'bruised_banana_quest_map.json')
    const seedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

    console.log('--- Seeding Bruised Banana Quest Map ---')

    const creator = await db.player.findFirst({
        where: { roles: { some: { role: { key: 'admin' } } } }
    }) || await db.player.findFirst()

    if (!creator) {
        console.error('No players found. Create a player first (e.g. sign up).')
        process.exit(1)
    }

    const now = new Date()
    const timelineDays = seedData.instance.timelineDays ?? 30
    const endDate = new Date(now)
    endDate.setDate(endDate.getDate() + timelineDays)

    const instanceSlug = seedData.instance.slug || 'bb-bday-001'
    const instanceName = seedData.instance.name || 'Bruised Banana Birthday Residency'
    const goalAmountCents = seedData.instance.goalAmountCents ?? 300000

    const instance = await db.instance.upsert({
        where: { slug: instanceSlug },
        update: {
            goalAmountCents,
            startDate: now,
            endDate,
            targetDescription: seedData.instance.targetDescription ?? undefined,
            domainType: 'fundraiser',
            isEventMode: true,
            kotterStage: 1,
        },
        create: {
            slug: instanceSlug,
            name: instanceName,
            goalAmountCents,
            startDate: now,
            endDate,
            targetDescription: seedData.instance.targetDescription ?? null,
            domainType: 'fundraiser',
            isEventMode: true,
            kotterStage: 1,
        }
    })

    console.log(`Instance: ${instance.name} (${instance.slug}) — goal $${(goalAmountCents / 100).toLocaleString()}, ${timelineDays} days`)

    for (const q of seedData.quests) {
        if (!QUEST_MAP_IDS.includes(q.id)) continue

        const quest = await db.customBar.upsert({
            where: { id: q.id },
            update: {
                title: q.title,
                description: q.description,
                reward: q.reward ?? 1,
                visibility: 'public',
                isSystem: true,
                allyshipDomain: q.allyshipDomain ?? 'GATHERING_RESOURCES',
                kotterStage: q.kotterStage,
            },
            create: {
                id: q.id,
                title: q.title,
                description: q.description,
                reward: q.reward ?? 1,
                creatorId: creator.id,
                type: 'vibe',
                visibility: 'public',
                isSystem: true,
                allyshipDomain: q.allyshipDomain ?? 'GATHERING_RESOURCES',
                kotterStage: q.kotterStage,
            }
        })
        console.log(`  Quest: ${quest.title} (Stage ${quest.kotterStage})`)
    }

    console.log('Bruised Banana Quest Map seeded. Run npm run seed:party if instance not found.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => db.$disconnect())
