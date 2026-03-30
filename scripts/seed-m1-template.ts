import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Registering Canonical Coaster Template (clb-coaster-v0)...')

    const coasterSlots = [
        { nodeId: 'LIFT', label: 'The Ascent', order: 0 },
        { nodeId: 'DROP', label: 'The Freefall', order: 1 },
        { nodeId: 'INVERSION', label: 'The Flip', order: 2 },
        { nodeId: 'BRAKE', label: 'The Deceleration', order: 3 },
        { nodeId: 'STATION', label: 'The Arrival', order: 4 }
    ]

    await prisma.adventureTemplate.upsert({
        where: { id: 'clb-coaster-v0' },
        update: {
            key: 'coaster-v0',
            name: 'Canonical Coaster (M1)',
            description: 'A 5-phase narrative arc: Lift, Drop, Inversion, Brake, Station.',
            passageSlots: JSON.stringify(coasterSlots),
            startNodeId: 'LIFT',
            ownership: 'system'
        },
        create: {
            id: 'clb-coaster-v0',
            key: 'coaster-v0',
            name: 'Canonical Coaster (M1)',
            description: 'A 5-phase narrative arc: Lift, Drop, Inversion, Brake, Station.',
            passageSlots: JSON.stringify(coasterSlots),
            startNodeId: 'LIFT',
            ownership: 'system'
        }
    })

    console.log('Seeding complete.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
