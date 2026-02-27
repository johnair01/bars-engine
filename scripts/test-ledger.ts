import './require-db-env'
import { LedgerService } from '../src/lib/economy-ledger'
import { db } from '../src/lib/db'

async function test() {
    console.log('--- Testing LedgerService ---')

    // 1. Find or create a test player
    let player = await db.player.findFirst()
    if (!player) {
        console.log('No player found, creating dummy')
        // In a real env, we'd need more fields, but for a dev script we assume one exists.
        return
    }
    const playerId = player.id
    console.log(`Using player: ${player.name} (${playerId})`)

    // 2. Ensure they have some vibulons
    const currentTokens = await db.vibulon.count({ where: { ownerId: playerId } })
    if (currentTokens < 5) {
        console.log('Minting 5 vibulons for test...')
        await db.vibulon.createMany({
            data: Array(5).fill({
                ownerId: playerId,
                originSource: 'unit_test',
                originId: 'test',
                originTitle: 'Test Mint'
            })
        })
    }

    // 3. Find an instance
    let instance = await db.instance.findFirst()
    if (!instance) {
        console.log('Creating test instance...')
        instance = await db.instance.create({
            data: {
                slug: 'test-conclave-' + Date.now(),
                name: 'Test Conclave',
                domainType: 'test'
            }
        })
    }
    const instanceId = instance.id
    console.log(`Using instance: ${instance.name} (${instanceId})`)

    try {
        // 4. Test Attunement
        console.log('\n[1] Testing Attunement (Global -> Local)...')
        const participation = await LedgerService.attune(playerId, instanceId, 3)
        console.log('Success. Local Balance:', participation.localBalance)

        // 5. Test Spending
        console.log('\n[2] Testing Spending (Local)...')
        const spendEvent = await LedgerService.spendLocal(playerId, instanceId, 1, { reason: 'test-spend' })
        console.log('Success. Spend Event ID:', spendEvent.id)

        // 6. Test Transmutation (Local -> Global)
        console.log('\n[3] Testing Transmutation (Local -> Global)...')
        const transmuteEvent = await LedgerService.transmute({
            playerId,
            sourceInstanceId: instanceId,
            amount: 1,
            metadata: { ratifiedBy: 'admin' }
        })
        console.log('Success. Transmute Event ID:', transmuteEvent.id)

        // 7. Check Final State
        const finalParticipation = await db.instanceParticipation.findUnique({
            where: { playerId_instanceId: { playerId, instanceId } }
        })
        console.log('\nFinal Local Balance:', finalParticipation?.localBalance)

        const ledgerCount = await db.vibeulonLedger.count({ where: { playerId } })
        console.log('Total Ledger Events for Player:', ledgerCount)

        console.log('\n✅ LedgerService tests passed.')
    } catch (error) {
        console.error('\n❌ Test failed:', error)
    }
}

test().catch(console.error)
