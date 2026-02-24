import { db } from '../src/lib/db'
import * as fs from 'fs'
import * as path from 'path'

async function seed() {
    console.log('--- Seeding Admin Validation Quests ---')

    const creator = await db.player.findFirst()
    if (!creator) throw new Error('No player found for createdById')
    const createdById = creator.id

    const storiesDir = path.join(process.cwd(), 'content', 'stories', 'admin_tests')

    const quests = [
        {
            filename: 'the-quick-mint.json',
            id: 'admin-test-quick-mint',
            title: 'The Quick Mint',
            slug: 'admin-test-quick-mint-story',
            description: 'A one-step quest designed to test Vibeulon minting and the Graveyard transition.'
        },
        {
            filename: 'the-labyrinth.json',
            id: 'admin-test-labyrinth',
            title: 'The Labyrinth',
            slug: 'admin-test-labyrinth-story',
            description: 'A branching quest intended to test bidirectional passage navigation (the revertRun action).'
        },
        {
            filename: 'the-resurrection-loop.json',
            id: 'admin-test-resurrection-loop',
            title: 'The Resurrection Loop',
            slug: 'admin-test-resurrection-loop-story',
            description: 'Complete it, find it in the Graveyard, and invoke the Resurrection Ritual to restore it.'
        }
    ]

    for (const questData of quests) {
        const filePath = path.join(storiesDir, questData.filename)
        const rawJson = fs.readFileSync(filePath, 'utf-8')

        // 1. Seed TwineStory
        const story = await db.twineStory.upsert({
            where: { slug: questData.slug },
            update: {
                title: questData.title,
                parsedJson: rawJson,
                isPublished: true
            },
            create: {
                title: questData.title,
                slug: questData.slug,
                sourceType: 'manual_seed',
                sourceText: 'Implicitly defined in seed script files',
                parsedJson: rawJson,
                isPublished: true,
                createdById
            }
        })
        console.log(`✅ Seeded Story: ${questData.title}`)

        // 2. Seed CustomBar (Quest)
        await db.customBar.upsert({
            where: { id: questData.id },
            update: {
                title: questData.title,
                description: questData.description,
                reward: 1,
                twineStoryId: story.id,
                status: 'active',
                visibility: 'public',
                isSystem: true
            },
            create: {
                id: questData.id,
                title: questData.title,
                description: questData.description,
                creatorId: createdById,
                reward: 1,
                twineStoryId: story.id,
                status: 'active',
                visibility: 'public',
                isSystem: true
            }
        })
        console.log(`✅ Seeded Quest: ${questData.title} (${questData.id})`)
    }

    console.log('✅ Admin Validation Quests seeded successfully.')
}

seed().catch(console.error)
