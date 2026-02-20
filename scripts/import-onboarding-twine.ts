import { db } from '../src/lib/db'
import { parseTwineHtml } from '../src/lib/twine-parser'
import * as fs from 'fs'
import * as path from 'path'

async function importOnboardingStories() {
    console.log('=== IMPORTING ONBOARDING TWINE STORIES ===')

    const htmlPath = path.join(__dirname, '../onboarding_stories.html')
    if (!fs.existsSync(htmlPath)) {
        console.error(`File not found: ${htmlPath}`)
        process.exit(1)
    }

    const fullHtml = fs.readFileSync(htmlPath, 'utf-8')

    // Split by stories (naively finding <tw-storydata tags)
    const storyBlocks = fullHtml.match(/<tw-storydata[\s\S]*?<\/tw-storydata>/gi)

    if (!storyBlocks) {
        console.error('No <tw-storydata> blocks found.')
        process.exit(1)
    }

    // Get an admin player to own the stories
    const creator = await db.player.findFirst({
        where: { roles: { some: { role: { key: 'admin' } } } }
    }) || await db.player.findFirst({
        where: { name: { contains: 'Argyra' } }
    })

    if (!creator) {
        console.error('Could not find admin player "Argyra" to own stories.')
        process.exit(1)
    }

    console.log(`Using creator: ${creator.name} (${creator.id})`)
    console.log(`Found ${storyBlocks.length} stories.`)

    for (const block of storyBlocks) {
        const parsed = parseTwineHtml(block)
        // Clean up title: remove " (Twine)" suffix
        parsed.title = parsed.title.replace(/\s*\(Twine\)$/i, '')

        const slug = parsed.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        console.log(`\nImporting: "${parsed.title}" (slug: ${slug})`)

        // Find or create the story
        let story = await db.twineStory.findUnique({ where: { slug } })

        if (story) {
            story = await db.twineStory.update({
                where: { id: story.id },
                data: {
                    title: parsed.title,
                    sourceText: block,
                    parsedJson: JSON.stringify(parsed),
                    isPublished: true
                }
            })
            console.log(`  ↻ Updated Story ID: ${story.id}`)
        } else {
            story = await db.twineStory.create({
                data: {
                    title: parsed.title,
                    slug,
                    sourceType: 'twine_html',
                    sourceText: block,
                    parsedJson: JSON.stringify(parsed),
                    isPublished: true,
                    createdById: creator.id
                }
            })
            console.log(`  ✓ Created Story ID: ${story.id}`)
        }

        // APPLY BINDINGS
        if (parsed.title.includes('Nation')) {
            console.log('  Adding SET_NATION binding to "Identity Match"...')
            await db.twineBinding.deleteMany({
                where: { storyId: story.id, scopeId: 'Identity Match' }
            })
            await db.twineBinding.create({
                data: {
                    storyId: story.id,
                    scopeType: 'passage',
                    scopeId: 'Identity Match',
                    actionType: 'SET_NATION',
                    payload: JSON.stringify({
                        title: 'Recommended Nation',
                        visibility: 'private',
                        nationId: 'cmlsn2ptd00087l648ptas9up' // Pyrakanth
                    }),
                    createdById: creator.id
                }
            })
        }

        if (parsed.title.includes('Archetype')) {
            console.log('  Adding SET_ARCHETYPE binding to "The Way"...')
            await db.twineBinding.deleteMany({
                where: { storyId: story.id, scopeId: 'The Way' }
            })
            await db.twineBinding.create({
                data: {
                    storyId: story.id,
                    scopeType: 'passage',
                    scopeId: 'The Way',
                    actionType: 'SET_ARCHETYPE',
                    payload: JSON.stringify({
                        title: 'Recommended Archetype',
                        visibility: 'private',
                        playbookId: 'cmlsn2qgj000f7l64rc5bz5ed' // The Movers
                    }),
                    createdById: creator.id
                }
            })
        }
    }

    console.log('\n=== IMPORT COMPLETE ===')
}

importOnboardingStories()
    .catch(err => {
        console.error(err)
        process.exit(1)
    })
    .finally(() => db.$disconnect())
