/**
 * Smoke Test: BAR Create + Share Flow
 * 
 * Run with: npx tsx scripts/smoke-test-bars.ts
 * 
 * Tests:
 * 1. Create User A and User B
 * 2. User A creates a BAR
 * 3. Verify BAR appears in User A's list
 * 4. User A sends BAR to User B
 * 5. Verify User B's received list includes the BAR
 * 6. Verify User A's sent list includes the BAR
 * 7. Cleanup
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
    console.log('=== BAR SMOKE TEST ===\n')
    const results: { test: string; status: 'PASS' | 'FAIL'; detail?: string }[] = []

    function pass(test: string, detail?: string) {
        results.push({ test, status: 'PASS', detail })
        console.log(`  PASS: ${test}${detail ? ` (${detail})` : ''}`)
    }
    function fail(test: string, detail?: string) {
        results.push({ test, status: 'FAIL', detail })
        console.log(`  FAIL: ${test}${detail ? ` - ${detail}` : ''}`)
    }

    const ts = Date.now()
    const emailA = `bar-test-a-${ts}@test.local`
    const emailB = `bar-test-b-${ts}@test.local`
    let playerA: { id: string } | null = null
    let playerB: { id: string } | null = null
    let barId: string | null = null
    let shareId: string | null = null

    try {
        // 1. DB check
        await db.player.count()
        pass('DB Connection')

        // 2. Create test players
        const invite = await db.invite.create({
            data: { token: `bar_smoke_${ts}`, status: 'used', usedAt: new Date() }
        })

        const accountA = await db.account.create({ data: { email: emailA, passwordHash: 'test' } })
        playerA = await db.player.create({
            data: {
                accountId: accountA.id, name: 'BAR Tester A', contactType: 'email',
                contactValue: emailA, inviteId: invite.id,
            }
        })
        const accountB = await db.account.create({ data: { email: emailB, passwordHash: 'test' } })
        playerB = await db.player.create({
            data: {
                accountId: accountB.id, name: 'BAR Tester B', contactType: 'email',
                contactValue: emailB, inviteId: invite.id,
            }
        })
        pass('Create test users', `A=${playerA.id}, B=${playerB.id}`)

        // 3. User A creates a BAR
        const bar = await db.customBar.create({
            data: {
                creatorId: playerA.id,
                title: 'Smoke Test BAR',
                description: 'This BAR was created by the smoke test script.',
                type: 'bar',
                reward: 0,
                visibility: 'private',
                status: 'active',
                storyContent: 'test,smoke,mvp',
                inputs: '[]',
                rootId: 'temp',
            }
        })
        await db.customBar.update({ where: { id: bar.id }, data: { rootId: bar.id } })
        barId = bar.id
        pass('Create BAR', `id=${barId}`)

        // 4. Verify BAR in User A's list
        const myBars = await db.customBar.findMany({
            where: { creatorId: playerA.id, type: 'bar', status: 'active' }
        })
        if (myBars.some(b => b.id === barId)) {
            pass('BAR in creator list')
        } else {
            fail('BAR in creator list', 'Not found')
        }

        // 5. User A sends BAR to User B
        const share = await db.barShare.create({
            data: {
                barId: barId,
                fromUserId: playerA.id,
                toUserId: playerB.id,
                note: 'Smoke test share',
            }
        })
        shareId = share.id
        pass('Send BAR A→B', `share=${shareId}`)

        // 6. Verify User B's received list
        const received = await db.barShare.findMany({
            where: { toUserId: playerB.id },
            include: { bar: { select: { id: true, title: true } } }
        })
        if (received.some(s => s.bar.id === barId)) {
            pass('BAR in recipient inbox')
        } else {
            fail('BAR in recipient inbox', 'Not found')
        }

        // 7. Verify User A's sent list
        const sent = await db.barShare.findMany({
            where: { fromUserId: playerA.id },
            include: { bar: { select: { id: true, title: true } } }
        })
        if (sent.some(s => s.bar.id === barId)) {
            pass('BAR in sender outbox')
        } else {
            fail('BAR in sender outbox', 'Not found')
        }

        // 8. Access control: B cannot see bar without share
        // (Already have share so B can see; verify the share-based access is there)
        const barDetail = await db.customBar.findUnique({
            where: { id: barId },
            include: { shares: true }
        })
        const bHasAccess = barDetail?.shares.some(s => s.toUserId === playerB.id)
        if (bHasAccess) {
            pass('Access control: recipient has access via share')
        } else {
            fail('Access control: recipient has access via share')
        }

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        fail('Unexpected error', msg)
    }

    // Cleanup
    console.log('\nCleaning up...')
    try {
        if (shareId) await db.barShare.delete({ where: { id: shareId } }).catch(() => {})
        if (barId) await db.customBar.delete({ where: { id: barId } }).catch(() => {})
        if (playerA) await db.player.delete({ where: { id: playerA.id } }).catch(() => {})
        if (playerB) await db.player.delete({ where: { id: playerB.id } }).catch(() => {})
        await db.account.deleteMany({ where: { email: { in: [emailA, emailB] } } })
        await db.invite.deleteMany({ where: { token: `bar_smoke_${ts}` } })
        console.log('  Cleanup complete.')
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.log(`  Cleanup warning: ${msg}`)
    }

    // Summary
    console.log('\n=== RESULTS ===')
    const passed = results.filter(r => r.status === 'PASS').length
    const failed = results.filter(r => r.status === 'FAIL').length
    console.log(`  ${passed} passed, ${failed} failed out of ${results.length} tests`)
    if (failed > 0) {
        console.log('\nFailed:')
        results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  - ${r.test}: ${r.detail}`))
    }
    console.log('\n=== BAR SMOKE TEST COMPLETE ===')
    process.exit(failed > 0 ? 1 : 0)
}

main().catch(e => {
    console.error('Smoke test crashed:', e)
    process.exit(1)
})
