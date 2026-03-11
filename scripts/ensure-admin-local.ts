/**
 * Ensure admin@admin.local exists with admin role. Idempotent — safe to run multiple times.
 * Use after db:seed or when production needs the canonical demo admin.
 *
 * Usage:
 *   DATABASE_URL="<url>" npx tsx scripts/ensure-admin-local.ts
 *
 * Credentials: admin@admin.local / password
 * @see .specify/specs/production-database-divergence/spec.md
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { hash } from 'bcryptjs'

const ADMIN_EMAIL = 'admin@admin.local'
const ADMIN_PASSWORD = 'password'

async function main() {
    console.log('--- Ensuring admin@admin.local ---')

    const adminPasswordHash = await hash(ADMIN_PASSWORD, 10)

    // Ensure PUBLIC invite exists (required for player)
    const publicInvite = await db.invite.upsert({
        where: { token: 'PUBLIC' },
        update: {},
        create: { token: 'PUBLIC', status: 'active', maxUses: 1000, uses: 0 },
    })

    // Ensure admin role exists
    const adminRole = await db.role.upsert({
        where: { key: 'admin' },
        update: { displayName: 'Administrator', description: 'Full system access' },
        create: { key: 'admin', displayName: 'Administrator', description: 'Full system access' },
    })

    const adminAccount = await db.account.upsert({
        where: { email: ADMIN_EMAIL },
        update: { passwordHash: adminPasswordHash },
        create: { email: ADMIN_EMAIL, passwordHash: adminPasswordHash },
    })

    const adminPlayer = await db.player.upsert({
        where: { id: 'test-admin' },
        update: { accountId: adminAccount.id, contactValue: ADMIN_EMAIL },
        create: {
            id: 'test-admin',
            name: 'Admin (God Mode)',
            contactType: 'email',
            contactValue: ADMIN_EMAIL,
            inviteId: publicInvite.id,
            accountId: adminAccount.id,
            onboardingComplete: true,
        },
    })

    await db.starterPack.upsert({
        where: { playerId: adminPlayer.id },
        update: {},
        create: { playerId: adminPlayer.id, data: JSON.stringify({ completedBars: [], activeBars: [] }) },
    })

    await db.playerRole.upsert({
        where: { playerId_roleId: { playerId: adminPlayer.id, roleId: adminRole.id } },
        update: {},
        create: { playerId: adminPlayer.id, roleId: adminRole.id },
    })

    console.log('✅ admin@admin.local ready')
    console.log(`   Email: ${ADMIN_EMAIL}`)
    console.log(`   Password: ${ADMIN_PASSWORD}`)
    console.log('   Log in at /conclave, then access /admin')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
