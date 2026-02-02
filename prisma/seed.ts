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

    // 2. Create 64 Bars (Placeholder)
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

    // 4. Create Nations (Canonical Spec)
    const nations = [
        { name: 'Argyra', description: 'The Silver City. Logic, reflection, and mirrors.', imgUrl: '/nations/argyra.png' },
        { name: 'Pyrakanth', description: 'The Burning Garden. Passion, consumption, and growth.', imgUrl: '/nations/pyrakanth.png' },
        { name: 'Virelune', description: 'The Green Moon. Mystery, tides, and secrets.', imgUrl: '/nations/virelune.png' },
        { name: 'Meridia', description: 'The Golden Noon. Clarity, trade, and exchange.', imgUrl: '/nations/meridia.png' },
        { name: 'Lamenth', description: 'The Weeping Stone. Memory, history, and foundations.', imgUrl: '/nations/lamenth.png' },
    ]

    for (const n of nations) {
        await prisma.nation.upsert({
            where: { name: n.name },
            update: {},
            create: n,
        })
    }

    // 5. Create Playbooks (Trigram Canonical)
    const playbooks = [
        { name: 'Heaven (Qian)', description: 'Initiating, strong, persistent.', moves: JSON.stringify(['Force Output', 'Overclock', 'Command']) },
        { name: 'Earth (Kun)', description: 'Yielding, devoted, grounding.', moves: JSON.stringify(['Absorb Impact', 'Nurture', 'Stabilize']) },
        { name: 'Thunder (Zhen)', description: 'Shocking, mobilizing, awakening.', moves: JSON.stringify(['Thunderclap', 'Disrupt', 'Awaken']) },
        { name: 'Water (Kan)', description: 'Dangerous, profound, adaptable.', moves: JSON.stringify(['Flow State', 'Infiltrate', 'Deep Dive']) },
        { name: 'Mountain (Gen)', description: 'Still, resting, stopping.', moves: JSON.stringify(['Blockade', 'Meditate', 'Immovable']) },
        { name: 'Wind (Xun)', description: 'Penetrating, gentle, traveling.', moves: JSON.stringify(['Whisper', 'Spread', 'Permeate']) },
        { name: 'Fire (Li)', description: 'Radiant, clinging, clarifying.', moves: JSON.stringify(['Spotlight', 'Analyze', 'Ignite']) },
        { name: 'Lake (Dui)', description: 'Joyous, exchanging, open.', moves: JSON.stringify(['Charisma', 'Mirror', 'Celebrate']) },
    ]

    for (const p of playbooks) {
        await prisma.playbook.upsert({
            where: { name: p.name },
            update: {},
            create: p,
        })
    }

    // 6. Create Demo Invite Tokens
    const demoTokens = [
        { token: 'WENDELL', preassignedRoleKey: 'ACE' },
        { token: 'PLAYER_TWO', preassignedRoleKey: 'ROOKIE' },
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
