#!/usr/bin/env npx tsx
/**
 * Seed two public event-invite BARs + JSON CYOA (Partiful → BAR → story → /event + mini-game).
 *
 *   npx tsx scripts/with-env.ts "npx tsx scripts/seed-bruised-banana-event-invite-bar.ts"
 *
 * Stable ids:
 *   bb-event-invite-apr4-dance  → /invite/event/bb-event-invite-apr4-dance
 *   bb-event-invite-apr26       → /invite/event/bb-event-invite-apr26  (April 5)
 */
import './require-db-env'
import { db } from '../src/lib/db'
import type { EventInviteStory } from '../src/lib/event-invite-story/schema'
import { EVENT_INVITE_BAR_TYPE } from '../src/lib/event-invite-story/schema'
import { eventInviteStandardCtasWithMiniGame } from '../src/lib/event-invite-story/default-cta'
import { eventInitiationAdventureSlug } from '../src/lib/event-invite-party'

const BAR_APR4 = 'bb-event-invite-apr4-dance'
const BAR_APR5 = 'bb-event-invite-apr26'

/** Replace with real Partiful event URLs before production (see docs/events/PARTIFUL_ENGINE_LINKS.md). */
const PARTIFUL_PLACEHOLDER = 'https://partiful.com/'

const STORY_APR4: EventInviteStory = {
    id: 'bb-apr4-doorway',
    start: 'intro',
    endingCtas: eventInviteStandardCtasWithMiniGame('/event#bb-invite-bingo-apr4'),
    passages: [
        {
            id: 'intro',
            text:
                "**You're invited to the dance.**\n\n" +
                '**April 4** is the public night — music, movement, strangers welcome. ' +
                'No performance required; presence is enough.\n\n' +
                'This short path takes under two minutes. Pick a flavor:',
            choices: [
                { label: 'Tell me the vibe', next: 'playful' },
                { label: 'Just the facts', next: 'facts' },
            ],
        },
        {
            id: 'playful',
            text:
                'Think **low-pressure, high-signal** — a room that gets warmer because people showed up. ' +
                'You might meet someone you didn’t expect. You might only dance. Both count.\n\n' +
                '**How you can help:** show up, be kind, and if you love it — bring a friend next time (we’ll give you a playful way to do that).',
            choices: [{ label: 'What’s next?', next: 'help' }],
        },
        {
            id: 'facts',
            text:
                '**April 4 (Pacific)** — evening → late · **Kai’s Place** (full address after RSVP on **Partiful**).\n\n' +
                '**How you can help:** RSVP so we can plan the room; optional chip-in or deeper day on **April 5** if you’re curious.',
            choices: [{ label: 'Continue', next: 'help' }],
        },
        {
            id: 'help',
            text:
                '**RSVP + logistics** stay on **Partiful** — that’s the canonical invite.\n\n' +
                'This site is the **play surface**: campaign home, optional mini-game to **invite friends**, and deeper paths when you’re ready.',
            choices: [{ label: 'Ready', next: 'ready' }],
        },
        {
            id: 'ready',
            text:
                'Use the buttons below: **Campaign** for context, **Invite friends** for the party mini-game layer, **Hub** when you want the eight paths, **Join** when you’re ready to sign in.',
            ending: {
                role: 'Guest (pre–April 4)',
                description:
                    'You’re oriented. Save this link; replay anytime. At the party, we pick up in the room.',
            },
        },
    ],
}

const STORY_APR5: EventInviteStory = {
    id: 'bb-apr5-doorway',
    start: 'intro',
    endingCtas: eventInviteStandardCtasWithMiniGame('/event#bb-invite-bingo-apr5'),
    passages: [
        {
            id: 'intro',
            text:
                "**You're almost inside.**\n\n" +
                '**April 5** is *The Game* — a participatory day with the **BARs Engine**: quests, roles, and real contributions.\n\n' +
                'This takes under two minutes. Pick what fits:',
            choices: [
                { label: 'I want the playful version', next: 'playful' },
                { label: 'Just the facts', next: 'facts' },
            ],
        },
        {
            id: 'playful',
            text:
                'Imagine a **room that gets smarter** because everyone plays lightly — ' +
                'not a meeting, not a pitch deck. You bring curiosity; we bring structure.\n\n' +
                "**How you can help:** participate, name what you care about, and invite someone who should be in the room (we’ll offer a light mini-game for that).",
            choices: [{ label: "I'm in — what's next?", next: 'help' }],
        },
        {
            id: 'facts',
            text:
                '**April 5 (Pacific)** — daytime gathering for **potential collaborators and donors**.\n\n' +
                '- Guided and emergent quests  \n' +
                '- Small groups  \n' +
                '- BARs (playable moves) and shared context  \n\n' +
                '**How you can help:** show up prepared to co-create; RSVP on **Partiful** for logistics.',
            choices: [{ label: 'Continue', next: 'help' }],
        },
        {
            id: 'help',
            text:
                '**RSVP** lives on **Partiful**; this site is where the **engine** runs.\n\n' +
                'When you’re done here, you can open the **invite mini-game** to bring friends into the vibe without spamming them.',
            choices: [{ label: 'Continue', next: 'ready' }],
        },
        {
            id: 'ready',
            text:
                'Use the buttons below to land on the **campaign**, try the **invite friends** surface, open the **hub**, or **sign in**.',
            ending: {
                role: 'Guest player (pre–April 5)',
                description:
                    'You’re oriented. Save this link; optional replay anytime. At the event, we’ll pick up from here.',
            },
        },
    ],
}

type InitPassage = { nodeId: string; text: string; choices: { text: string; targetId: string }[] }

/** Published Twine shell for `/campaign/event/[eventSlug]/initiation` (player segment). */
async function upsertEventInitiationAdventure(
    eventSlug: 'apr-4-dance' | 'apr-5-game',
    title: string,
    description: string,
    passages: InitPassage[],
    startNodeId: string
) {
    const campaignRef = 'bruised-banana'
    const slug = eventInitiationAdventureSlug(campaignRef, eventSlug, 'player')

    const adventure = await db.adventure.upsert({
        where: { slug },
        create: {
            slug,
            title,
            status: 'ACTIVE',
            startNodeId,
            campaignRef,
            description,
            visibility: 'PUBLIC_ONBOARDING',
        },
        update: {
            title,
            status: 'ACTIVE',
            startNodeId,
            campaignRef,
            description,
        },
    })

    let created = 0
    let updated = 0
    for (const p of passages) {
        const choicesJson = JSON.stringify(p.choices)
        const existing = await db.passage.findUnique({
            where: { adventureId_nodeId: { adventureId: adventure.id, nodeId: p.nodeId } },
        })
        if (existing) {
            await db.passage.update({
                where: { id: existing.id },
                data: { text: p.text, choices: choicesJson },
            })
            updated++
        } else {
            await db.passage.create({
                data: {
                    adventureId: adventure.id,
                    nodeId: p.nodeId,
                    text: p.text,
                    choices: choicesJson,
                },
            })
            created++
        }
    }
    console.log(`   ${slug}: ${created} passages created, ${updated} updated`)
}

async function upsertBar(
    id: string,
    title: string,
    description: string,
    story: EventInviteStory,
    adminId: string,
    party: { partifulUrl: string | null; eventSlug: string }
) {
    await db.customBar.upsert({
        where: { id },
        create: {
            id,
            creatorId: adminId,
            title,
            description,
            type: EVENT_INVITE_BAR_TYPE,
            visibility: 'public',
            status: 'active',
            isSystem: true,
            campaignRef: 'bruised-banana',
            storyContent: JSON.stringify(story),
            reward: 0,
            partifulUrl: party.partifulUrl,
            eventSlug: party.eventSlug,
        },
        update: {
            title,
            description,
            type: EVENT_INVITE_BAR_TYPE,
            visibility: 'public',
            status: 'active',
            storyContent: JSON.stringify(story),
            campaignRef: 'bruised-banana',
            partifulUrl: party.partifulUrl,
            eventSlug: party.eventSlug,
        },
    })
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

    await upsertBar(
        BAR_APR4,
        'Bruised Banana — Dance night (April 4) · doorway',
        'Short orientation before the public dance. No login required.',
        STORY_APR4,
        admin.id,
        { partifulUrl: PARTIFUL_PLACEHOLDER, eventSlug: 'apr-4-dance' }
    )
    await upsertBar(
        BAR_APR5,
        'Bruised Banana — The Game (April 5) · doorway',
        'Short interactive orientation before the residency gathering. No login required.',
        STORY_APR5,
        admin.id,
        { partifulUrl: PARTIFUL_PLACEHOLDER, eventSlug: 'apr-5-game' }
    )

    const apr4Passages: InitPassage[] = [
        {
            nodeId: 'EIP_Apr4_Start',
            text:
                '**April 4 — Dance night**\n\n' +
                'You crossed from the invite into **event initiation**: a short orientation before the room. ' +
                'Logistics and RSVP stay on **Partiful**; here is the **play surface** for the residency.',
            choices: [{ text: 'Continue', targetId: 'EIP_Apr4_End' }],
        },
        {
            nodeId: 'EIP_Apr4_End',
            text:
                '**Next steps** — Open the [campaign hub](/campaign?ref=bruised-banana), try the invite mini-game from `/event`, or **create an account** when you are ready to play.',
            choices: [{ text: 'Create my account', targetId: 'signup' }],
        },
    ]
    const apr5Passages: InitPassage[] = [
        {
            nodeId: 'EIP_Apr5_Start',
            text:
                '**April 5 — The Game**\n\n' +
                'You are in the **collaborators and donors** day: participatory quests and BARs Engine play. ' +
                'This path orients you before you step into the room.',
            choices: [{ text: 'Continue', targetId: 'EIP_Apr5_End' }],
        },
        {
            nodeId: 'EIP_Apr5_End',
            text:
                '**Next steps** — [Campaign](/campaign?ref=bruised-banana), [support the residency](/event), or **sign up** to save progress.',
            choices: [{ text: 'Create my account', targetId: 'signup' }],
        },
    ]

    console.log('--- Event initiation Adventures (player) ---')
    await upsertEventInitiationAdventure(
        'apr-4-dance',
        'Bruised Banana — Apr 4 initiation (player)',
        'Event-scoped onboarding for the April 4 dance. Editable in Admin → Adventures.',
        apr4Passages,
        'EIP_Apr4_Start'
    )
    await upsertEventInitiationAdventure(
        'apr-5-game',
        'Bruised Banana — Apr 5 initiation (player)',
        'Event-scoped onboarding for April 5 (The Game). Editable in Admin → Adventures.',
        apr5Passages,
        'EIP_Apr5_Start'
    )

    console.log('✅ Event invite BARs ready')
    console.log(`   Apr 4:  /invite/event/${BAR_APR4}`)
    console.log(`   Apr 5:  /invite/event/${BAR_APR5}`)
    console.log('   Initiation: /campaign/event/apr-4-dance/initiation · /campaign/event/apr-5-game/initiation')
    console.log('   Replace partifulUrl in DB or edit seed when real Partiful links are live.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => db.$disconnect())
