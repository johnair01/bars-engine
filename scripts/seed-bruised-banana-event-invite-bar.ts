#!/usr/bin/env npx tsx
/**
 * Seed a public event-invite BAR + JSON CYOA for Apr 5 prep (Partiful → BAR → story).
 *
 *   npx tsx scripts/with-env.ts "npx tsx scripts/seed-bruised-banana-event-invite-bar.ts"
 *
 * Stable id: `bb-event-invite-apr26` → share URL `/invite/event/bb-event-invite-apr26`
 */
import './require-db-env'
import { db } from '../src/lib/db'
import type { EventInviteStory } from '../src/lib/event-invite-story/schema'
import { EVENT_INVITE_BAR_TYPE } from '../src/lib/event-invite-story/schema'

const BAR_ID = 'bb-event-invite-apr26'

const STORY: EventInviteStory = {
    id: 'bb-apr5-doorway',
    start: 'intro',
    passages: [
        {
            id: 'intro',
            text:
                "**You're almost inside.**\n\n" +
                'April 5 is *The Game* — a participatory day with the **BARs Engine**: quests, roles, and real contributions.\n\n' +
                'This takes under two minutes. Pick what fits:',
            choices: [
                { label: 'I want the playful version', next: 'playful' },
                { label: 'Just the facts', next: 'facts' },
            ],
        },
        {
            id: 'playful',
            text:
                'Nice. Imagine a **party where the room gets smarter** because everyone plays lightly — ' +
                'not a meeting, not a pitch deck. You bring curiosity; we bring structure.\n\n' +
                "You don't need to understand the engine yet. You'll **learn by playing**.",
            choices: [{ label: "I'm in — what's next?", next: 'ready' }],
        },
        {
            id: 'facts',
            text:
                '**April 5 (Pacific)** — daytime gathering for **potential collaborators and donors**.\n\n' +
                '- Guided and emergent quests  \n' +
                '- Small groups  \n' +
                '- BARs (playable moves) and shared context  \n\n' +
                'RSVP logistics are on **Partiful**; this site is the **play surface**.',
            choices: [{ label: 'Continue', next: 'ready' }],
        },
        {
            id: 'ready',
            text:
                'When you land on the campaign page, you can open the **8 paths** (hub), the **gameboard**, or **sign in** to go deeper.\n\n' +
                'See you in the field.',
            ending: {
                role: 'Guest player (pre-April 5)',
                description:
                    'You’re oriented. Save this link; optional replay anytime. At the event, we’ll pick up from here.',
            },
        },
    ],
}

async function main() {
    const admin =
        (await db.player.findFirst({
            where: { roles: { some: { role: { key: 'admin' } } } },
            select: { id: true },
        })) ?? (await db.player.findFirst({ select: { id: true } }))

    if (!admin) {
        console.error('No player found. Sign up once, then re-run.')
        process.exit(1)
    }

    await db.customBar.upsert({
        where: { id: BAR_ID },
        create: {
            id: BAR_ID,
            creatorId: admin.id,
            title: 'Bruised Banana — The Game (April 5) · doorway',
            description: 'Short interactive orientation before the residency gathering. No login required.',
            type: EVENT_INVITE_BAR_TYPE,
            visibility: 'public',
            status: 'active',
            isSystem: true,
            campaignRef: 'bruised-banana',
            storyContent: JSON.stringify(STORY),
            reward: 0,
        },
        update: {
            title: 'Bruised Banana — The Game (April 5) · doorway',
            description: 'Short interactive orientation before the residency gathering. No login required.',
            type: EVENT_INVITE_BAR_TYPE,
            visibility: 'public',
            status: 'active',
            storyContent: JSON.stringify(STORY),
            campaignRef: 'bruised-banana',
        },
    })

    console.log(`✅ Event invite BAR ready`)
    console.log(`   Public URL: /invite/event/${BAR_ID}`)
    console.log(`   Paste in Partiful “optional pre-experience” or confirmation email.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => db.$disconnect())
