import { db } from '@/lib/db'

async function main() {
    const playerId = 'test-admin'
    console.log(`Checking ${playerId}...`)

    const player = await db.player.findUnique({
        where: { id: playerId },
        include: { roles: { include: { role: true } } }
    })

    if (!player) {
        console.error('Player test-admin not found!')
        return
    }

    const adminRole = await db.role.findUnique({ where: { key: 'admin' } })
    if (!adminRole) {
        console.error('Admin role not found!')
        return
    }

    const hasRole = player.roles.some(r => r.role.key === 'admin')
    console.log(`Current Admin Status: ${hasRole}`)

    if (!hasRole) {
        console.log('Adding admin role...')
        await db.playerRole.create({
            data: {
                playerId: player.id,
                roleId: adminRole.id
            }
        })
        console.log('Role added.')
    } else {
        console.log('Role already present.')
    }
}

main()
