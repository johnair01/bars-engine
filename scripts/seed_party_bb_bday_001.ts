import './require-db-env'
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const db = new PrismaClient()

async function main() {
    const dataPath = path.join(process.cwd(), 'data', 'party_seed_bb_bday_001.json')
    const seedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))

    console.log(`🌱 Seeding Party Instance: ${seedData.instance.name}...`)

    // 0. Get a valid Creator ID (Admin)
    const adminPlayer = await db.player.findFirst({
        where: { roles: { some: { role: { key: 'admin' } } } }
    })
    const creator = adminPlayer || await db.player.findFirst()

    if (!creator) {
        console.error('❌ No players found. Please log in or create a player first.')
        process.exit(1)
    }
    console.log(`Using Creator ID: ${creator.id} (${creator.name})`)

    // 1. Upsert Instance
    const instance = await db.instance.upsert({
        where: { id: seedData.instance.id },
        update: {
            name: seedData.instance.name,
            targetDescription: seedData.instance.description,
            goalAmountCents: seedData.instance.goalVibeulons * 100,
            isEventMode: true,
            slug: seedData.instance.id.toLowerCase(),
            domainType: 'party'
        },
        create: {
            id: seedData.instance.id,
            slug: seedData.instance.id.toLowerCase(),
            name: seedData.instance.name,
            targetDescription: seedData.instance.description,
            goalAmountCents: seedData.instance.goalVibeulons * 100,
            isEventMode: true,
            domainType: 'party'
        }
    })
    console.log(`✅ Instance UPSERTED: ${instance.name}`)

    // 2. Upsert Campaigns (QuestThreads)
    const campaignMap = new Map<string, string>()
    for (const camp of seedData.campaigns) {
        const thread = await db.questThread.upsert({
            where: { id: camp.id },
            update: {
                title: camp.title,
                description: camp.description,
                completionReward: camp.baseRewardVibeulons
            },
            create: {
                id: camp.id,
                title: camp.title,
                description: camp.description,
                completionReward: camp.baseRewardVibeulons,
                threadType: 'campaign',
                creatorType: 'system'
            }
        })
        campaignMap.set(camp.id, thread.id)
        console.log(`✅ Campaign UPSERTED: ${thread.title}`)
    }

    // Campaign → Allyship Domain (WHERE) mapping
    const campaignToDomain: Record<string, string> = {
        'CAMP-BDAY': 'RAISE_AWARENESS',
        'CAMP-BANANA': 'GATHERING_RESOURCES',
        'CAMP-GRILL': 'GATHERING_RESOURCES',
        'CAMP-WHISKEY': 'GATHERING_RESOURCES',
        'CAMP-RESIDENCY': 'DIRECT_ACTION',
        'CAMP-ENGINE': 'SKILLFUL_ORGANIZING',
        'CAMP-VIBE': 'RAISE_AWARENESS',
        'CAMP-OPS': 'SKILLFUL_ORGANIZING',
    }

    // 3. Upsert Quests (CustomBars)
    for (const qData of seedData.quests) {
        const subquestText = qData.subquests.length > 0
            ? `\n\n**Subquests:**\n${qData.subquests.map((s: string) => `- ${s}`).join('\n')}`
            : ''

        const description = `${qData.description || ''}${subquestText}`
        const allyshipDomain = campaignToDomain[qData.campaignId] || null

        const quest = await db.customBar.upsert({
            where: { id: qData.id },
            update: {
                title: qData.title,
                description,
                reward: qData.rewardVibeulons,
                visibility: 'public',
                allyshipDomain
            },
            create: {
                id: qData.id,
                title: qData.title,
                description,
                reward: qData.rewardVibeulons,
                creatorId: creator.id,
                type: 'vibe',
                visibility: 'public',
                isSystem: true,
                allyshipDomain
            }
        })

        // Link to Campaign (ThreadQuest)
        const threadId = campaignMap.get(qData.campaignId)
        if (threadId) {
            // Find current position or default
            const existingLink = await db.threadQuest.findUnique({
                where: { threadId_questId: { threadId, questId: quest.id } }
            })

            if (!existingLink) {
                const count = await db.threadQuest.count({ where: { threadId } })
                await db.threadQuest.create({
                    data: {
                        threadId,
                        questId: quest.id,
                        position: count + 1
                    }
                })
                console.log(`🔗 Linked Quest "${quest.title}" to Campaign "${qData.campaignId}"`)
            }
        }
        console.log(`✅ Quest UPSERTED: ${quest.title}`)
    }

    console.log(`\n🚀 Seeding Complete!`)
    console.log(`\nTo enable donations: Admin → Instances → set Stripe URL (stripeOneTimeUrl) for "${instance.name}"`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
