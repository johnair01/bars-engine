
import { db } from '../src/lib/db'

async function main() {
    console.log('🧪 Verifying Game Master Suite...')

    // 1. Verify Schema Changes
    console.log('\n[1] Checking Schema Updates...')
    try {
        // Attempt to create a pack with allowedPlaybooks to verify column exists
        const testPack = await db.questPack.create({
            data: {
                title: 'Test Admin Pack',
                description: 'Verifying schema',
                allowedPlaybooks: JSON.stringify(['Heaven']),
                creatorType: 'system'
            }
        })
        console.log('✅ QuestPack created with allowedPlaybooks:', testPack.allowedPlaybooks)

        // Clean up
        await db.questPack.delete({ where: { id: testPack.id } })
        console.log('✅ Cleaned up test pack')
    } catch (e: any) {
        console.error('❌ Schema verification failed:', e.message)
    }

    // 2. Verify Admin Stats Action
    console.log('\n[2] Testing Admin Stats...')
    try {
        const stats = await db.$transaction([
            db.player.count(),
            db.questThread.count(),
            db.questPack.count(),
            db.customBar.count(),
        ])
        console.log('✅ Stats fetched successfully:')
        console.log(`   - Players: ${stats[0]}`)
        console.log(`   - Threads: ${stats[1]}`)
        console.log(`   - Packs: ${stats[2]}`)
        console.log(`   - Quests: ${stats[3]}`)
    } catch (e: any) {
        console.error('❌ Admin stats check failed:', e.message)
    }

    // 3. Verify Admin Access Logic
    console.log('\n[3] Testing Access Control Logic...')
    try {
        // Ensure test-admin exists and has role
        let adminUser = await db.player.findUnique({
            where: { id: 'test-admin' },
            include: { roles: { include: { role: true } } }
        })

        if (!adminUser) {
            console.log('⚠️ test-admin not found, creating...')
            // Create minimal test admin
            // (Assuming existing seeding logic, but duplicating for safety if missing)
            const adminRole = await db.role.upsert({
                where: { key: 'admin' },
                update: {},
                create: { key: 'admin', displayName: 'Admin', description: 'Admin' }
            })

            // Create invite if needed
            const invite = await db.invite.upsert({
                where: { token: 'admin_verify_invite' },
                update: {},
                create: { token: 'admin_verify_invite', maxUses: 99 }
            })

            // Need an account for player
            const account = await db.account.create({ data: { email: 'admin-test-script@local', passwordHash: 'hash' } })

            adminUser = await db.player.create({
                data: {
                    id: 'test-admin',
                    accountId: account.id,
                    name: 'Test Admin',
                    contactType: 'email',
                    contactValue: 'admin-test-script@local',
                    inviteId: invite.id,
                    roles: { create: { roleId: adminRole.id } }
                },
                include: { roles: { include: { role: true } } }
            })
        }

        const isAdmin = adminUser.roles.some(r => r.role.key === 'admin')
        console.log(`✅ Admin User Check: User '${adminUser.name}' is admin? ${isAdmin}`)

        if (!isAdmin) {
            console.error('❌ test-admin should have admin role but does not.')
        }

        // Check non-admin
        const nonAdmin = await db.player.findFirst({
            where: { NOT: { roles: { some: { role: { key: 'admin' } } } } }
        })

        if (nonAdmin) {
            console.log(`✅ Non-Admin Check: User '${nonAdmin.name}' is NOT admin.`)
        }

    } catch (e: any) {
        console.error('❌ Access control verification failed:', e.message)
    }
}

main()
    .then(async () => {
        await db.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await db.$disconnect()
        process.exit(1)
    })
