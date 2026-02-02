import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('--- RESETTING GAME STATE ---')

    // 1. Delete Dependencies first (to avoid FK constraints if not cascading)
    // Note: Deleting Players usually cascades to PlayerRoles, PlayerBars, etc. if schema is set,
    // but explicit is safe.
    await prisma.playerRole.deleteMany({})
    await prisma.playerBar.deleteMany({})
    await prisma.playerQuest.deleteMany({})
    await prisma.vibulonEvent.deleteMany({})

    // 2. Delete Main Entities
    await prisma.player.deleteMany({})
    await prisma.invite.deleteMany({})
    // keep Roles and Bars and Quests (Static Content)

    console.log('✔ Cleared Players and Invites')

    // 3. Create Wendell's Invite
    // Wendell is the ACE
    const invite = await prisma.invite.create({
        data: {
            token: 'WENDELL',
            status: 'active',
            preassignedRoleKey: 'ACE',
        }
    })

    console.log(`✔ Generated Invite for Wendell: ${invite.token} (Role: ACE)`)

    // 4. Create Admin Invite (Just in case you need it back)
    await prisma.invite.create({
        data: {
            token: 'ANTIGRAVITY',
            status: 'active',
            preassignedRoleKey: 'ENGINEER',
        }
    })
    console.log(`✔ Restored Admin Invite: ANTIGRAVITY`)
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
