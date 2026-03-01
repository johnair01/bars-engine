/**
 * Seed Bruised Banana Adventure (Option C + D)
 *
 * Creates Adventure bruised-banana with Passages for BB nodes. Uses template syntax
 * ({{instance.wakeUpContent}}, etc.) resolved at runtime. Admins can edit via Admin → Adventures.
 *
 * Run: npm run seed:bruised-banana
 */

import './require-db-env'
import { db } from '../src/lib/db'

const SLUG = 'bruised-banana'
const TITLE = 'Bruised Banana Campaign'
const BB_TOTAL_STEPS = 11

const PASSAGES: { nodeId: string; text: string; choices: { text: string; targetId: string }[] }[] = [
    {
        nodeId: 'BB_Intro',
        text: '{{instance.introText}}',
        choices: [
            { text: 'Continue', targetId: 'BB_ShowUp' },
            { text: 'Learn more about the game', targetId: 'BB_LearnMore' }
        ]
    },
    {
        nodeId: 'BB_LearnMore',
        text: '**Learn more** — Explore the knowledge base for definitions and lore:\n\n- [Bruised Banana campaign](/wiki/campaign/bruised-banana)\n- [The 4 moves](/wiki/moves)\n- [Allyship domains](/wiki/domains)\n- [Glossary](/wiki/glossary) (vibeulons, BAR, Kotter)',
        choices: [{ text: 'Continue to choose my path', targetId: 'BB_ShowUp' }]
    },
    {
        nodeId: 'BB_ShowUp',
        text: '{{instance.showUpContent}}{{instance.donateLink}}',
        choices: [{ text: 'Continue', targetId: 'BB_Developmental_Q1' }]
    },
    {
        nodeId: 'BB_Developmental_Q1',
        text: '**What draws you most right now?** — A quick signal to personalize your experience.',
        choices: [
            { text: 'Understanding — I want to see the big picture first', targetId: 'BB_SetDevelopmental_cognitive' },
            { text: 'Connecting — I want to relate and feel into it', targetId: 'BB_SetDevelopmental_emotional' },
            { text: 'Acting — I want to do something concrete', targetId: 'BB_SetDevelopmental_action' }
        ]
    },
    {
        nodeId: 'BB_SetDevelopmental_cognitive',
        text: '<<set $developmentalHint = "cognitive">>Got it. Now choose your path.',
        choices: [{ text: 'Continue', targetId: 'BB_ChooseNation' }]
    },
    {
        nodeId: 'BB_SetDevelopmental_emotional',
        text: '<<set $developmentalHint = "emotional">>Got it. Now choose your path.',
        choices: [{ text: 'Continue', targetId: 'BB_ChooseNation' }]
    },
    {
        nodeId: 'BB_SetDevelopmental_action',
        text: '<<set $developmentalHint = "action">>Got it. Now choose your path.',
        choices: [{ text: 'Continue', targetId: 'BB_ChooseNation' }]
    },
    {
        nodeId: 'BB_Moves_Intro',
        text: '**The Four Moves** — personal throughput in the game:\n\n- **Wake Up**: See more of what\'s available (who, what, where, how)\n- **Clean Up**: Get more emotional energy; unblock yourself\n- **Grow Up**: Level up skills through developmental lines\n- **Show Up**: Do the work — complete quests\n\nThese connect to your campaign path.',
        choices: [{ text: 'Continue', targetId: 'BB_Moves_WakeUp' }]
    },
    {
        nodeId: 'BB_Moves_WakeUp',
        text: '**Wake Up** — Raise awareness. See what\'s available: who can help, what resources exist, where the work happens, how to contribute. The Bruised Banana campaign needs people who wake up to the story and share it.',
        choices: [{ text: 'Next', targetId: 'BB_Moves_CleanUp' }]
    },
    {
        nodeId: 'BB_Moves_CleanUp',
        text: '**Clean Up** — Unblock emotional energy. When you\'re stuck, the Emotional First Aid kit helps. Clearing inner obstacles lets you take vibeulon-generating actions.',
        choices: [{ text: 'Next', targetId: 'BB_Moves_GrowUp' }]
    },
    {
        nodeId: 'BB_Moves_GrowUp',
        text: '**Grow Up** — Level up skills. Developmental lines (e.g. emotional, cognitive) expand your capacity. The campaign benefits when players grow.',
        choices: [{ text: 'Next', targetId: 'BB_Moves_ShowUp' }]
    },
    {
        nodeId: 'BB_Moves_ShowUp',
        text: '**Show Up** — Do the work. Complete quests, contribute resources, take direct action. This is how the Bruised Banana Residency gets supported.\n\nComplete this flow to earn **{{mvpSeedVibeulons}} starter vibeulons** when you sign up.',
        choices: [{ text: 'Create my account', targetId: 'signup' }]
    }
]

async function seed() {
    console.log('--- Seeding Bruised Banana Adventure ---')

    const adventure = await db.adventure.upsert({
        where: { slug: SLUG },
        update: {
            title: TITLE,
            status: 'ACTIVE',
            startNodeId: 'BB_Intro',
            campaignRef: 'bruised-banana',
            description: 'Bruised Banana onboarding. Editable in Admin → Adventures. Uses {{instance.wakeUpContent}}, {{instance.showUpContent}}, {{instance.storyBridgeCopy}}.'
        },
        create: {
            slug: SLUG,
            title: TITLE,
            status: 'ACTIVE',
            startNodeId: 'BB_Intro',
            campaignRef: 'bruised-banana',
            description: 'Bruised Banana onboarding. Editable in Admin → Adventures.',
            visibility: 'PUBLIC_ONBOARDING'
        }
    })

    console.log(`✅ Adventure: ${adventure.title} (${adventure.slug})`)

    let created = 0
    let updated = 0

    for (const p of PASSAGES) {
        const choicesJson = JSON.stringify(p.choices)
        const existing = await db.passage.findUnique({
            where: {
                adventureId_nodeId: {
                    adventureId: adventure.id,
                    nodeId: p.nodeId
                }
            }
        })

        if (existing) {
            await db.passage.update({
                where: { id: existing.id },
                data: { text: p.text, choices: choicesJson }
            })
            updated++
        } else {
            await db.passage.create({
                data: {
                    adventureId: adventure.id,
                    nodeId: p.nodeId,
                    text: p.text,
                    choices: choicesJson
                }
            })
            created++
        }
    }

    console.log(`✅ Passages: ${created} created, ${updated} updated`)
    console.log('✅ Bruised Banana Adventure seeded. Admin can edit at /admin/adventures')
}

seed().catch(console.error)
