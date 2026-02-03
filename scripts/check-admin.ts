import { db } from '@/lib/db'

async function main() {
    console.log('Checking admin user...')
    const player = await db.player.findUnique({
        where: { id: 'test-admin' },
        include: { roles: { include: { role: true } } }
    })

    console.log('Player:', player)

    if (player) {
        const isAdmin = player.roles.some(r => r.role.key === 'admin')
        console.log('Is Admin?', isAdmin)
    }

    const allRoles = await db.role.findMany()
    console.log('All Roles:', allRoles)
}

main()
