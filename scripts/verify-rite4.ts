import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
    const playerId = process.env.DEV_PLAYER_ID || 'cm7bsv2k40000uxpwn75w9565' // Default dev player

    // Find or create an active quest for this player
    let playerQuest = await db.playerQuest.findFirst({
        where: { playerId, status: 'assigned' },
        include: { quest: true }
    })

    if (!playerQuest) {
        console.log('No active quest found. Creating a test quest...')
        const quest = await db.customBar.create({
            data: {
                title: "The Micro-Twine Trial",
                description: "A manifestation test for Rite 4.",
                creatorId: playerId,
                status: 'active',
                visibility: 'public'
            }
        })
        playerQuest = await db.playerQuest.create({
            data: {
                playerId,
                questId: quest.id,
                status: 'assigned'
            },
            include: { quest: true }
        })
    }

    const questId = playerQuest.questId
    console.log(`Enabling Micro-Twine for Quest: ${playerQuest.quest.title} (${questId})`)

    const config = {
        prologue: "The air is thick with anticipation. Your journey begins now.",
        moments: [
            {
                id: "1",
                text: "You stand before the Iron Gate. It hasn't been opened in a century.",
                options: [
                    { text: "Knock loudly", target: "2" },
                    { text: "Search for a hidden key", target: "3" }
                ]
            },
            {
                id: "2",
                text: "The gate groans but stays shut. A voice from within asks for a password.",
                options: [
                    { text: "Say 'Friend'", target: "4" },
                    { text: "Say 'Open Sesame'", target: "Epilogue" }
                ]
            },
            {
                id: "3",
                text: "You find a rusty key under a loose stone. It fits perfectly.",
                options: [
                    { text: "Turn the key", target: "4" }
                ]
            },
            {
                id: "4",
                text: "The path ahead is clear. You have breached the first layer.",
                options: [
                    { text: "Proceed to the inner sanctum", target: "Epilogue" }
                ]
            }
        ],
        epilogue: "You have completed the trial. The engine acknowledges your success."
    }

    // Upsert the module
    await db.microTwineModule.upsert({
        where: { questId },
        update: {
            canonicalJson: JSON.stringify(config),
            isDraft: false,
            htmlArtifact: "PENDING" // Will compile below
        },
        create: {
            questId,
            canonicalJson: JSON.stringify(config),
            tweeSource: "",
            isDraft: false
        }
    })

    // Compile (simulating the action)
    const passages = [
        { id: 1, name: "Start", text: config.prologue + "\n\n[[Begin|1]]" },
        ...config.moments.map(m => ({
            id: parseInt(m.id) + 1,
            name: m.id,
            text: m.text + "\n\n" + m.options.map(o => `[[${o.text}|${o.target}]]`).join('\n')
        })),
        { id: 100, name: "Epilogue", text: config.epilogue + "\n\nQuest Complete." }
    ]

    const storyData = `
<tw-storydata name="${questId} Narrative" startnode="1" creator="Micro-Twine Wizard" creator-version="1.0.0" ifid="${questId}-ifid" format="SugarCube" format-version="2.36.1">
${passages.map(p => `  <tw-passagedata pid="${p.id}" name="${p.name}" tags="" x="0" y="0">${p.text}</tw-passagedata>`).join('\n')}
</tw-storydata>`.trim()

    const htmlArtifact = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Quest Narrative</title></head><body>${storyData}</body></html>`

    await db.microTwineModule.update({
        where: { questId },
        data: { htmlArtifact }
    })

    console.log('✅ Micro-Twine Ritual enabled and compiled for verification.')
}

main()
    .catch(console.error)
    .finally(() => db.$disconnect())
