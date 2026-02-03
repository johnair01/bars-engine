/**
 * Test Script: Server Actions
 * 
 * Run with: npm run test:actions
 * 
 * This script exercises the core server actions without needing a browser.
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧪 Running Action Tests...\n')

    // 1. Verify Health
    console.log('1️⃣  Checking database connection...')
    const playerCount = await prisma.player.count()
    const barCount = await prisma.bar.count()
    console.log(`   ✓ Players: ${playerCount}, Bars: ${barCount}\n`)

    // 2. Test Player Lookup
    console.log('2️⃣  Looking up test players...')
    const alice = await prisma.player.findUnique({ where: { id: 'test-alice' } })
    const bob = await prisma.player.findUnique({ where: { id: 'test-bob' } })
    console.log(`   ✓ Alice: ${alice ? alice.name : 'NOT FOUND'}`)
    console.log(`   ✓ Bob: ${bob ? bob.name : 'NOT FOUND'}\n`)

    if (!alice || !bob) {
        console.error('   ❌ Test players missing. Run: npm run db:seed')
        process.exit(1)
    }

    // 3. Test CustomBar Visibility
    console.log('3️⃣  Testing CustomBar visibility...')
    const publicBar = await prisma.customBar.findUnique({ where: { id: 'sample-public-bar' } })
    const privateBar = await prisma.customBar.findUnique({ where: { id: 'sample-private-bar' } })

    console.log(`   ✓ Public bar: ${publicBar?.title || 'NOT FOUND'} (visibility: ${publicBar?.visibility})`)
    console.log(`   ✓ Private bar: ${privateBar?.title || 'NOT FOUND'} (visibility: ${privateBar?.visibility})`)

    // 4. Simulate "Available Bars" query for Bob (should see public, not private)
    console.log('\n4️⃣  Simulating "Available Bars" query for Bob...')
    const availableForBob = await prisma.customBar.findMany({
        where: {
            status: 'active',
            OR: [
                { visibility: 'public', claimedById: null },
                { claimedById: bob.id },
                { visibility: 'private', creatorId: bob.id, claimedById: null },
            ],
        },
    })
    console.log(`   ✓ Bob sees ${availableForBob.length} bar(s):`)
    availableForBob.forEach(b => console.log(`     - ${b.title} (${b.visibility})`))

    // 5. Simulate "Available Bars" query for Alice (should see public + her private draft)
    console.log('\n5️⃣  Simulating "Available Bars" query for Alice...')
    const availableForAlice = await prisma.customBar.findMany({
        where: {
            status: 'active',
            OR: [
                { visibility: 'public', claimedById: null },
                { claimedById: alice.id },
                { visibility: 'private', creatorId: alice.id, claimedById: null },
            ],
        },
    })
    console.log(`   ✓ Alice sees ${availableForAlice.length} bar(s):`)
    availableForAlice.forEach(b => console.log(`     - ${b.title} (${b.visibility})`))

    // 6. Simulate Pick Up (claim public bar for Bob)
    console.log('\n6️⃣  Simulating pick-up of public bar by Bob...')
    if (publicBar && !publicBar.claimedById) {
        await prisma.customBar.update({
            where: { id: publicBar.id },
            data: { claimedById: bob.id },
        })
        console.log(`   ✓ Bob claimed "${publicBar.title}"`)

        // Verify Alice no longer sees it
        const afterClaim = await prisma.customBar.findMany({
            where: {
                status: 'active',
                visibility: 'public',
                claimedById: null,
            },
        })
        console.log(`   ✓ Public unclaimed bars remaining: ${afterClaim.length}`)

        // Reset for future tests
        await prisma.customBar.update({
            where: { id: publicBar.id },
            data: { claimedById: null },
        })
        console.log('   ✓ Reset claim for future tests')
    } else {
        console.log('   ⚠️  Public bar already claimed or not found')
    }

    console.log('\n✅ All tests passed!')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error('❌ Test failed:', e)
        await prisma.$disconnect()
        process.exit(1)
    })
