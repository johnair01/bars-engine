import { db } from '../src/lib/db'
import { hashPassword } from '../src/lib/auth-utils'

async function main() {
    console.log('--- Creating Admin Account ---')

    const email = 'admin@bars-engine.local'
    const password = 'veritaserum'
    const name = 'admin'

    // Check if admin account already exists
    const existing = await db.account.findUnique({
        where: { email },
        include: { players: true }
    })

    if (existing) {
        console.log('Admin account already exists:', existing.email)
        console.log('Associated players:', existing.players.map(p => p.name).join(', '))
        return
    }

    // Get a random nation and playbook
    const nations = await db.nation.findMany()
    const playbooks = await db.playbook.findMany()

    if (nations.length === 0 || playbooks.length === 0) {
        console.error('No nations or playbooks found. Run seed-world-content.ts first.')
        return
    }

    const randomNation = nations[Math.floor(Math.random() * nations.length)]
    const randomPlaybook = playbooks[Math.floor(Math.random() * playbooks.length)]

    console.log(`Selected Nation: ${randomNation.name}`)
    console.log(`Selected Playbook: ${randomPlaybook.name}`)

    const passwordHash = await hashPassword(password)

    // Create admin account with player in a transaction
    const result = await db.$transaction(async (tx) => {
        // 1. Create Account
        const account = await tx.account.create({
            data: {
                email,
                passwordHash,
            }
        })

        // 2. Create Admin Invite (required for player)
        const invite = await tx.invite.create({
            data: {
                token: 'admin-invite',
                status: 'used',
                usedAt: new Date(),
            }
        })

        // 3. Create Player
        const player = await tx.player.create({
            data: {
                accountId: account.id,
                name,
                pronouns: 'they/them',
                contactType: 'email',
                contactValue: email,
                nationId: randomNation.id,
                playbookId: randomPlaybook.id,
                inviteId: invite.id,
            }
        })

        // 4. Initialize empty Starter Pack
        await tx.starterPack.create({
            data: {
                playerId: player.id,
                data: JSON.stringify({ completedBars: [] }),
                initialVibeulons: 0,
            }
        })

        // 5. Assign Admin Role
        const adminRole = await tx.role.findUnique({ where: { key: 'admin' } })
        if (adminRole) {
            await tx.playerRole.create({
                data: {
                    playerId: player.id,
                    roleId: adminRole.id,
                }
            })
            console.log('✓ Admin role assigned')
        } else {
            console.warn('⚠ Admin role not found in database')
        }

        return { account, player }
    })

    console.log('✅ Admin account created successfully!')
    console.log(`   Email: ${email}`)
    console.log(`   Password: ${password}`)
    console.log(`   Player Name: ${name}`)
    console.log(`   Player ID: ${result.player.id}`)
    console.log('')
    console.log('🔧 Admin can now:')
    console.log('   - Access admin console at /admin')
    console.log('   - Use developer identity switcher')
    console.log('   - Manage players, quests, and world data')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
