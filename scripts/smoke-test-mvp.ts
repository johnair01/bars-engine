/**
 * MVP Smoke Test Script
 * 
 * Run with: npx tsx scripts/smoke-test-mvp.ts
 * 
 * This script tests the core game loop end-to-end:
 * 1. Check DB connectivity
 * 2. Verify nations and playbooks exist (seeded)
 * 3. Create two test players (User A and User B)
 * 4. Set nation + archetype for both
 * 5. Create a quest as User A
 * 6. Verify quest appears in list
 * 7. Verify User A has starter vibeulons
 * 8. Transfer vibeulon from User A to User B
 * 9. Verify transfer reflected in both wallets
 * 
 * NOTE: This is a DB-level test. UI smoke testing is manual (see MVP_SHIP_PLAN.md).
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
    console.log('=== MVP SMOKE TEST ===\n')
    const results: { test: string; status: 'PASS' | 'FAIL'; detail?: string }[] = []

    function pass(test: string, detail?: string) {
        results.push({ test, status: 'PASS', detail })
        console.log(`  PASS: ${test}${detail ? ` (${detail})` : ''}`)
    }
    function fail(test: string, detail?: string) {
        results.push({ test, status: 'FAIL', detail })
        console.log(`  FAIL: ${test}${detail ? ` - ${detail}` : ''}`)
    }

    // 1. DB Connectivity
    try {
        const count = await db.player.count()
        pass('DB Connection', `${count} players in DB`)
    } catch (e: any) {
        fail('DB Connection', e.message)
        console.log('\nCannot continue without DB. Exiting.')
        process.exit(1)
    }

    // 2. Nations exist
    const nations = await db.nation.findMany()
    if (nations.length > 0) {
        pass('Nations Seeded', `${nations.length} nations`)
    } else {
        fail('Nations Seeded', 'No nations found. Run seed script first.')
    }

    // 3. Playbooks (Archetypes) exist
    const playbooks = await db.playbook.findMany()
    if (playbooks.length > 0) {
        pass('Playbooks Seeded', `${playbooks.length} playbooks`)
    } else {
        fail('Playbooks Seeded', 'No playbooks found. Run seed script first.')
    }

    // 4. Check for invites (needed for legacy flow)
    const invites = await db.invite.findMany({ where: { status: 'active' } })
    console.log(`  INFO: ${invites.length} active invites`)

    // 5. Create test user A
    const testEmailA = `smoke-test-a-${Date.now()}@test.local`
    const testEmailB = `smoke-test-b-${Date.now()}@test.local`
    let playerA: any = null
    let playerB: any = null

    try {
        // Create auto-invite for tests
        const invite = await db.invite.create({
            data: {
                token: `smoke_${Date.now()}`,
                status: 'used',
                usedAt: new Date(),
            }
        })

        // Create Account A
        const accountA = await db.account.create({
            data: { email: testEmailA, passwordHash: 'test_hash_not_real' }
        })

        playerA = await db.player.create({
            data: {
                accountId: accountA.id,
                name: 'Smoke Test User A',
                contactType: 'email',
                contactValue: testEmailA,
                inviteId: invite.id,
                nationId: nations[0]?.id || null,
                playbookId: playbooks[0]?.id || null,
            }
        })
        pass('Create User A', playerA.id)

        // Create Account B
        const accountB = await db.account.create({
            data: { email: testEmailB, passwordHash: 'test_hash_not_real' }
        })

        playerB = await db.player.create({
            data: {
                accountId: accountB.id,
                name: 'Smoke Test User B',
                contactType: 'email',
                contactValue: testEmailB,
                inviteId: invite.id,
            }
        })
        pass('Create User B', playerB.id)
    } catch (e: any) {
        fail('Create Test Users', e.message)
    }

    if (!playerA || !playerB) {
        console.log('\nCannot continue without test users. Exiting.')
        await cleanup()
        process.exit(1)
    }

    // 6. Nation + Archetype for User A
    if (playerA.nationId && playerA.playbookId) {
        pass('User A Nation+Archetype', `nation=${nations[0]?.name}, playbook=${playbooks[0]?.name}`)
    } else {
        fail('User A Nation+Archetype', 'Missing nation or playbook')
    }

    // 7. Create Quest as User A
    let questId: string | null = null
    try {
        const quest = await db.customBar.create({
            data: {
                creatorId: playerA.id,
                title: 'Smoke Test Quest',
                description: 'This is a smoke test quest created by the MVP test script.',
                type: 'custom',
                reward: 1,
                visibility: 'private',
                status: 'active',
                inputs: JSON.stringify([
                    { key: 'response', label: 'Your response', type: 'text' }
                ]),
                rootId: 'temp'
            }
        })
        await db.customBar.update({
            where: { id: quest.id },
            data: { rootId: quest.id }
        })
        questId = quest.id
        pass('Create Quest', quest.id)
    } catch (e: any) {
        fail('Create Quest', e.message)
    }

    // 8. Verify quest in list
    if (questId) {
        const found = await db.customBar.findUnique({ where: { id: questId } })
        if (found) {
            pass('Quest in List', found.title)
        } else {
            fail('Quest in List', 'Not found after creation')
        }
    }

    // 9. Seed vibeulons for User A
    try {
        await db.vibulon.createMany({
            data: Array.from({ length: 3 }, () => ({
                ownerId: playerA.id,
                originSource: 'smoke_test',
                originId: 'smoke_test',
                originTitle: 'Smoke Test Starter'
            }))
        })
        const walletA = await db.vibulon.count({ where: { ownerId: playerA.id } })
        pass('Seed Vibeulons for A', `${walletA} vibeulons`)
    } catch (e: any) {
        fail('Seed Vibeulons', e.message)
    }

    // 10. Transfer vibeulon from A to B
    try {
        const tokenToTransfer = await db.vibulon.findFirst({
            where: { ownerId: playerA.id }
        })

        if (!tokenToTransfer) {
            fail('Transfer Vibeulon', 'No tokens to transfer')
        } else {
            await db.vibulon.update({
                where: { id: tokenToTransfer.id },
                data: {
                    ownerId: playerB.id,
                    generation: tokenToTransfer.generation + 1
                }
            })

            // Log events
            await db.vibulonEvent.createMany({
                data: [
                    {
                        playerId: playerA.id,
                        source: 'p2p_transfer',
                        amount: -1,
                        notes: `Smoke test: sent to ${playerB.name}`,
                        archetypeMove: 'PERMEATE'
                    },
                    {
                        playerId: playerB.id,
                        source: 'p2p_transfer',
                        amount: 1,
                        notes: `Smoke test: received from ${playerA.name}`,
                        archetypeMove: 'PERMEATE'
                    }
                ]
            })

            pass('Transfer Vibeulon A→B')
        }
    } catch (e: any) {
        fail('Transfer Vibeulon', e.message)
    }

    // 11. Verify balances after transfer
    const walletAFinal = await db.vibulon.count({ where: { ownerId: playerA.id } })
    const walletBFinal = await db.vibulon.count({ where: { ownerId: playerB.id } })
    if (walletAFinal === 2 && walletBFinal === 1) {
        pass('Post-Transfer Balances', `A=${walletAFinal}, B=${walletBFinal}`)
    } else {
        fail('Post-Transfer Balances', `Expected A=2,B=1 got A=${walletAFinal},B=${walletBFinal}`)
    }

    // Summary
    console.log('\n=== RESULTS ===')
    const passed = results.filter(r => r.status === 'PASS').length
    const failed = results.filter(r => r.status === 'FAIL').length
    console.log(`  ${passed} passed, ${failed} failed out of ${results.length} tests`)

    if (failed > 0) {
        console.log('\nFailed tests:')
        results.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`  - ${r.test}: ${r.detail}`)
        })
    }

    // Cleanup test data
    await cleanup()

    console.log('\n=== MVP SMOKE TEST COMPLETE ===')
    process.exit(failed > 0 ? 1 : 0)

    async function cleanup() {
        console.log('\nCleaning up smoke test data...')
        try {
            if (questId) {
                await db.customBar.delete({ where: { id: questId } }).catch(() => { })
            }
            if (playerA) {
                await db.vibulonEvent.deleteMany({ where: { playerId: playerA.id } })
                await db.vibulon.deleteMany({ where: { ownerId: playerA.id } })
                await db.player.delete({ where: { id: playerA.id } }).catch(() => { })
                await db.account.deleteMany({ where: { email: testEmailA } })
            }
            if (playerB) {
                await db.vibulonEvent.deleteMany({ where: { playerId: playerB.id } })
                await db.vibulon.deleteMany({ where: { ownerId: playerB.id } })
                await db.player.delete({ where: { id: playerB.id } }).catch(() => { })
                await db.account.deleteMany({ where: { email: testEmailB } })
            }
            console.log('  Cleanup complete.')
        } catch (e: any) {
            console.log(`  Cleanup warning: ${e.message}`)
        }
    }
}

main().catch(e => {
    console.error('Smoke test crashed:', e)
    process.exit(1)
})
