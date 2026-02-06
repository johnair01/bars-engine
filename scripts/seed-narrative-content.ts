
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding narrative content...')

    // -------------------------------------------------------------
    // NATIONS (World Settings)
    // -------------------------------------------------------------

    const nations = [
        {
            name: 'Argyra',
            description: 'The Silver City. Architects of precision. Logic, reflection, and clarity shape every interaction.',
            imgUrl: '/nations/argyra.jpg', // Placeholder
            wakeUp: 'Analyze the situation logically.',
            cleanUp: 'Refine a system to be more efficient.',
            growUp: 'Realize that clarity requires action.',
            showUp: 'Execute a perfect plan with precision.'
        },
        {
            name: 'Pyrakanth',
            description: 'The Burning Garden. Gardeners of fire. Passion, intensity, and transformation are sacred.',
            imgUrl: '/nations/pyrakanth.jpg',
            wakeUp: 'Feel the intensity of the moment.',
            cleanUp: 'Burn away what no longer serves you.',
            growUp: 'Channel wild passion into purpose.',
            showUp: 'Transform disaster into opportunity through sheer will.'
        },
        {
            name: 'Virelune',
            description: 'The Green Moon. Joyful growers. Life expands playfully toward light with unstoppable energy.',
            imgUrl: '/nations/virelune.jpg',
            wakeUp: 'Reach toward a new possibility joyfully.',
            cleanUp: 'Grow around an obstacle instead of fighting it.',
            growUp: 'Find a path that no one else saw.',
            showUp: 'Overwhelm the problem with life force.'
        },
        {
            name: 'Meridia',
            description: 'The Golden Noon. Voice of balance. Fairness, trade, and clear sight reveal the win-win.',
            imgUrl: '/nations/meridia.jpg',
            wakeUp: 'See all sides of the conflict clearly.',
            cleanUp: 'Restore balance to a chaotic situation.',
            growUp: 'Make a hard choice instead of staying neutral.',
            showUp: 'Negotiate a solution where everyone wins.'
        },
        {
            name: 'Lamenth',
            description: 'The Weeping Stone. Keepers of meaning. Poignance, beauty, and deep connection matter most.',
            imgUrl: '/nations/lamenth.jpg',
            wakeUp: 'Feel the deep meaning of the situation.',
            cleanUp: 'Honor what was lost to build a foundation.',
            growUp: 'Protect what is beautiful even if it hurts.',
            showUp: 'Move with the weight of history and grace.'
        }
    ]

    for (const n of nations) {
        await prisma.nation.upsert({
            where: { name: n.name },
            update: n,
            create: n,
        })
    }

    // -------------------------------------------------------------
    // PLAYBOOKS (Archetypes)
    // -------------------------------------------------------------

    const playbooks = [
        {
            name: 'Heaven (Qian)',
            description: 'The Bold Heart. You act when others hesitate. Start things with creative force.',
            wakeUp: 'Initiate action before you feel ready.',
            cleanUp: 'Break a stalemate through sheer will.',
            growUp: 'Realize not everything needs your spark.',
            showUp: 'Transform "stuck" into "already happening".',
            moves: JSON.stringify(['The First Mover', 'Creative Force', 'Unstoppable Spark'])
        },
        {
            name: 'Earth (Kun)',
            description: 'The Devoted Guardian. Nurturing strength. You hold space so others can rise.',
            wakeUp: 'Check on how everyone is feeling.',
            cleanUp: 'Absorb a blow meant for someone else.',
            growUp: 'Demand care for yourself.',
            showUp: 'Empower an ally to do the impossible.',
            moves: JSON.stringify(['Grounding Force', 'Unshakeable Support', 'Devoted Shield'])
        },
        {
            name: 'Thunder (Zhen)',
            description: 'The Decisive Storm. You act in the crucial moment. Shock the system awake.',
            wakeUp: 'Sense the tension building to a breaking point.',
            cleanUp: 'Disrupt a stagnant situation instantly.',
            growUp: 'Wait for the PERFECT moment.',
            showUp: 'Seize the initiative with shocking force.',
            moves: JSON.stringify(['Storm Strike', 'Breaking Point', 'Shock & Awe'])
        },
        {
            name: 'Wind (Xun)',
            description: 'The Subtle Influence. Gentle persistence. Change everything without being seen.',
            wakeUp: 'Notice the small crack in the defense.',
            cleanUp: 'Gently push a conversation until it changes.',
            growUp: 'Step into the spotlight and be seen.',
            showUp: ' Reveal you changed the outcome ten minutes ago.',
            moves: JSON.stringify(['Unseen Hand', 'Gentle Pressure', 'Infiltration'])
        },
        {
            name: 'Water (Kan)',
            description: 'The Danger Walker. Thrive in chaos. Flow where others fear to tread.',
            wakeUp: 'Head directly toward the most dangerous thing.',
            cleanUp: 'Adapt your plan completely mid-stream.',
            growUp: 'Find a moment of safety and accept it.',
            showUp: 'Turn a disaster into a flowing victory.',
            moves: JSON.stringify(['Flow State', 'Danger Sense', 'Adaptive Form'])
        },
        {
            name: 'Fire (Li)',
            description: 'The Truth Seer. Radiant clarity. See and speak what is real.',
            wakeUp: 'Call out the elephant in the room.',
            cleanUp: 'Illuminate a hidden truth.',
            growUp: 'Soften your truth with compassion.',
            showUp: 'Reveal the solution everyone was avoiding.',
            moves: JSON.stringify(['Radiant Gaze', 'Illumination', 'Burning Truth'])
        },
        {
            name: 'Mountain (Gen)',
            description: 'The Still Point. Deliberate stopping. Know when to hold your ground.',
            wakeUp: 'Stop moving when everyone else is rushing.',
            cleanUp: 'Create a sanctuary in chaos.',
            growUp: 'Move before you feel completely safe.',
            showUp: 'Become an immovable object.',
            moves: JSON.stringify(['Immovable object', 'Sanctuary', 'Perfect Stillness'])
        },
        {
            name: 'Lake (Dui)',
            description: 'The Joyful Connector. Open delight. Bring people together through joy.',
            wakeUp: 'Share something genuine with a stranger.',
            cleanUp: 'Turn a tense moment into a playful one.',
            growUp: 'Set a boundary to protect your joy.',
            showUp: 'Network everyone into a cooperative force.',
            moves: JSON.stringify(['Contagious Joy', 'Open Heart', 'Network Effect'])
        }
    ]

    for (const p of playbooks) {
        await prisma.playbook.upsert({
            where: { name: p.name },
            update: p,
            create: p,
        })
    }

    console.log('Seeding complete!')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
