import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // 1. Create Roles
    const roles = [
        { key: 'ACE', displayName: 'Ace (Gilligan)', description: 'The innocent, the wildcard.' },
        { key: 'VETERAN', displayName: 'Veteran (Skipper)', description: 'The leader, the protector.' },
        { key: 'ENGINEER', displayName: 'Engineer (Professor)', description: 'The builder, the solver.' },
        { key: 'ROOKIE', displayName: 'Rookie (Mary Ann)', description: 'The grounded, the hopeful.' },
        { key: 'LEADER', displayName: 'Leader (Howell)', description: 'The resource holder.' },
    ]

    for (const role of roles) {
        await prisma.role.upsert({
            where: { key: role.key },
            update: {},
            create: role,
        })
    }

    // 2. Create 64 Bars
    // For MVP, just creating placeholder names
    for (let i = 1; i <= 64; i++) {
        await prisma.bar.upsert({
            where: { id: i },
            update: {},
            create: {
                id: i,
                name: `Bar #${i}`,
                tone: 'Neutral',
                text: `This is the state of Bar ${i}. Potential energy waiting for form.`,
            },
        })
    }

    // 3. Create Admin Invite
    await prisma.invite.upsert({
        where: { token: 'ANTIGRAVITY' },
        update: {},
        create: {
            token: 'ANTIGRAVITY',
            status: 'active',
            preassignedRoleKey: 'ENGINEER',
        },
    })

    // 4. Create Demo Invite Tokens for Testing
    const demoTokens = [
        { token: 'DEMO_TOKEN_1', preassignedRoleKey: null },
        { token: 'DEMO_TOKEN_2', preassignedRoleKey: 'ROOKIE' },
        { token: 'DEMO_TOKEN_3', preassignedRoleKey: 'ACE' },
    ]
    for (const dt of demoTokens) {
        await prisma.invite.upsert({
            where: { token: dt.token },
            update: {},
            create: {
                token: dt.token,
                status: 'active',
                preassignedRoleKey: dt.preassignedRoleKey,
            },
        })
    }

    // 5. Create Initial Quest (using upsert for idempotency)
    await prisma.quest.upsert({
        where: { id: 'quest_arrival' },
        update: {},
        create: {
            id: 'quest_arrival',
            title: 'The Arrival',
            prompt: 'Look around you. Find a small object that represents where you came from. What is it?',
            returnType: 'text'
        }
    })

    console.log('Seeding complete.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
