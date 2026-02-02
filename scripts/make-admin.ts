
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

async function main() {
    const playerId = process.argv[2]

    if (!playerId) {
        console.error('Usage: npx tsx scripts/make-admin.ts <playerId>')
        process.exit(1)
    }

    console.log(`Granting ADMIN role to player ${playerId}...`)

    // 1. Check if player exists
    const player = await db.player.findUnique({
        where: { id: playerId }
    })

    if (!player) {
        console.error('Player not found!')
        process.exit(1)
    }

    // 2. Ensure Role Definition Exists
    let adminRole = await db.role.findUnique({
        where: { key: 'admin' }
    })

    if (!adminRole) {
        console.log('Admin role definition not found. Creating it...')
        adminRole = await db.role.create({
            data: {
                key: 'admin',
                name: 'Administrator',
                description: 'Full access to admin panel'
            }
        })
    }

    // 3. Grant Role
    // Upsert to avoid duplicates
    await db.playerRole.deleteMany({
        where: {
            playerId: playerId,
            roleId: adminRole.id
        }
    })

    await db.playerRole.create({
        data: {
            playerId: playerId,
            roleId: adminRole.id,
            grantedByAdminId: 'system' // self-granted via CLI
        }
    })

    console.log(`✅ Success! Player ${player.name} is now an ADMIN.`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
