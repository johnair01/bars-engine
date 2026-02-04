import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🧪 VALIDATING RELEASE FEATURES (SLICES 1-5)...\n')

    const timestamp = Date.now()
    const email = `test_release_${timestamp}@example.com`

    // --- SLICE 1/5: AUTH & ACCOUNTS ---
    console.log('1️⃣  Testing Auth & Account Separation...')

    // 1. Create Invite
    const invite = await prisma.invite.create({
        data: {
            token: `test_token_${timestamp}`,
            // email: email, // Optional, but good for tracking
            status: 'active'
        }
    })

    // 2. Create Account
    const account = await prisma.account.create({
        data: {
            email,
            passwordHash: 'hash123',
        }
    })

    // 3. Create Player linked to Account
    const player = await prisma.player.create({
        data: {
            accountId: account.id,
            name: `Tester ${timestamp}`,
            contactType: 'email',
            contactValue: email,
            inviteId: invite.id,
        }
    })

    console.log(`   ✓ Created Account: ${account.email}`)
    console.log(`   ✓ Created Linked Player: ${player.name}`)

    // Verify Link
    const fetchedPlayer = await prisma.player.findUnique({
        where: { id: player.id },
        include: { account: true }
    })

    if (fetchedPlayer?.account?.email !== email) {
        throw new Error('❌ Account <-> Player link failed!')
    }
    console.log(`   ✓ Link Verified: Player.account.email matches.\n`)


    // --- SLICE 4: RECURSIVE QUESTS ---
    console.log('2️⃣  Testing Quest Recursion Fields...')

    // Create a Root Quest (manually simulating the Action logic which sets rootId = id)
    const rootQuest = await prisma.customBar.create({
        data: {
            creatorId: player.id,
            title: `Root Quest ${timestamp}`,
            description: 'Root',
            type: 'vibe',
            rootId: 'temp_id_placeholder', // Will update
            status: 'active'
        }
    })

    // Simulate the logic: rootId = id
    await prisma.customBar.update({
        where: { id: rootQuest.id },
        data: { rootId: rootQuest.id }
    })

    const fetchedRoot = await prisma.customBar.findUnique({ where: { id: rootQuest.id } })
    if (fetchedRoot?.rootId !== rootQuest.id) {
        throw new Error('❌ RootId mismatch!')
    }
    console.log(`   ✓ Root Quest created with rootId=${fetchedRoot.rootId}`)

    // Create Child Quest
    const childQuest = await prisma.customBar.create({
        data: {
            creatorId: player.id,
            title: `Child Quest ${timestamp}`,
            description: 'Child',
            type: 'vibe',
            parentId: rootQuest.id,
            rootId: rootQuest.id, // Should inherit root
            status: 'active'
        }
    })

    const fetchedChild = await prisma.customBar.findUnique({ where: { id: childQuest.id } })
    if (fetchedChild?.parentId !== rootQuest.id || fetchedChild?.rootId !== rootQuest.id) {
        throw new Error('❌ Child recursion fields mismatch!')
    }
    console.log(`   ✓ Child Quest linked correctly (parentId, rootId).\n`)


    // --- SLICE 2/3: COMMISSION VISIBILITY ---
    console.log('3️⃣  Testing Commission Visibility Rules...')

    // Create Private Draft (No Assignee)
    await prisma.customBar.create({
        data: {
            creatorId: player.id,
            title: `Private Draft ${timestamp}`,
            description: 'Shh',
            type: 'vibe',
            visibility: 'private',
            claimedById: null, // No assignee
            rootId: 'ignore',
            status: 'active'
        }
    })

    // Create Public Quest
    await prisma.customBar.create({
        data: {
            creatorId: player.id,
            title: `Public Quest ${timestamp}`,
            description: 'Open to all',
            type: 'vibe',
            visibility: 'public',
            claimedById: null,
            rootId: 'ignore',
            status: 'active'
        }
    })

    // Query: What does a stranger see?
    const strangerId = 'stranger_id'
    const available = await prisma.customBar.findMany({
        where: {
            status: 'active',
            title: { contains: timestamp.toString() }, // Filter to this test's run
            OR: [
                { visibility: 'public', claimedById: null },
                { claimedById: strangerId },
                { visibility: 'private', creatorId: strangerId, claimedById: null },
            ]
        }
    })

    const sawPublic = available.some(b => b.title.includes('Public Quest'))
    const sawPrivate = available.some(b => b.title.includes('Private Draft'))

    if (sawPublic && !sawPrivate) {
        console.log(`   ✓ Visibility Logic passed: Stranger saw Public, did NOT see Private/Draft.`)
    } else {
        throw new Error(`❌ Visibility Check Failed! SawPublic=${sawPublic}, SawPrivate=${sawPrivate}`)
    }

    console.log('\n✅ ALL SYSTEMS GREEN.')

    // Cleanup
    console.log('\n🧹 Cleaning up test data...')
    await prisma.customBar.deleteMany({ where: { title: { contains: timestamp.toString() } } })
    await prisma.player.delete({ where: { id: player.id } })
    await prisma.account.delete({ where: { id: account.id } })
    console.log('   ✓ Test data removed.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => prisma.$disconnect())
