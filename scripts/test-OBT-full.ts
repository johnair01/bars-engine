/**
 * Full OBT Sequence — Headless
 *
 * Usage: bun run scripts/test-OBT-full.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const INSTANCE_SLUG = 'mastering-allyship'

async function cleanup(name: string) {
  const players = await db.player.findMany({
    where: { name: { startsWith: name } },
    select: { id: true, accountId: true },
  })
  for (const p of players) {
    await db.customBar.deleteMany({ where: { creatorId: p.id } })
  }
  const accountIds = players.map(p => p.accountId).filter(Boolean)
  if (accountIds.length) {
    await db.account.deleteMany({ where: { id: { in: accountIds } } })
  }
  await db.player.deleteMany({ where: { name: { startsWith: name } } })
}

async function createTestAccount(name: string) {
  const email = `${name}@test.conclave.test`

  let invite = await db.invite.findFirst({ where: { token: 'SHOW_CAP' } })
  if (!invite) {
    invite = await db.invite.create({
      data: {
        token: 'SHOW_CAP',
        createdById: 'SYSTEM',
        expiresAt: new Date('2030-01-01'),
        status: 'active',
      },
    })
  }

  const bcrypt = await import('bcryptjs')
  const testHash = await bcrypt.hash('password', 10)

  const account = await db.account.create({
    data: { email, passwordHash: testHash },
  })

  const player = await db.player.create({
    data: {
      name,
      contactType: 'email',
      contactValue: email,
      onboardingComplete: true,
      inviteId: invite.id,
      accountId: account.id,
    },
  })

  console.log(`  ✓ ${name} (${player.id})`)
  return player
}

async function main() {
  console.log('🧪 Full OBT Sequence — Headless\n')

  const p1Name = `obt_p1_${Date.now()}`
  const p2Name = `obt_p2_${Date.now()}`

  try {
    console.log('1️⃣ Creating test accounts...')
    const p1 = await createTestAccount(p1Name)
    const p2 = await createTestAccount(p2Name)
    console.log()

    console.log('2️⃣ P1 creates charge capture...')
    const instance = await db.instance.findFirst({ where: { slug: INSTANCE_SLUG } })
    if (!instance) {
      console.error(`  ✗ Instance '${INSTANCE_SLUG}' not found`)
      process.exit(1)
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    await db.customBar.deleteMany({
      where: { creatorId: p1.id, type: 'charge_capture', createdAt: { gte: today } },
    })

    const chargeRaw = await db.customBar.create({
      data: {
        creatorId: p1.id,
        title: 'OBT charge test',
        description: 'Created by headless OBT full sequence',
        type: 'charge_capture',
        reward: 1,
        visibility: 'private',
        status: 'active',
        claimedById: p1.id,
        inputs: JSON.stringify([]),
        rootId: 'temp',
        campaignRef: INSTANCE_SLUG,
      },
    })
    const chargeBar = await db.customBar.update({
      where: { id: chargeRaw.id },
      data: { rootId: chargeRaw.id },
    })
    console.log(`  ✓ Charge bar: ${chargeBar.id}\n`)

    console.log('3️⃣ P1 creates offer bar (time/space)...')
    const offerRaw = await db.customBar.create({
      data: {
        creatorId: p1.id,
        title: 'OBT offer test',
        description: 'A headless OBT time/space offer',
        type: 'vibe',
        reward: 1,
        visibility: 'private',
        status: 'active',
        claimedById: p1.id,
        inputs: JSON.stringify([]),
        rootId: 'temp',
        campaignRef: INSTANCE_SLUG,
        docQuestMetadata: JSON.stringify({ kind: 'offer_bar', venue: 'time-space' }),
      },
    })
    const offerBar = await db.customBar.update({
      where: { id: offerRaw.id },
      data: { rootId: offerRaw.id },
    })
    console.log(`  ✓ Offer bar: ${offerBar.id}\n`)

    console.log('4️⃣ P2 claims P1 offer bar...')
    await db.customBar.update({
      where: { id: offerBar.id },
      data: { claimedById: p2.id, visibility: 'public' },
    })
    console.log(`  ✓ P2 claimed offer bar\n`)

    console.log('5️⃣ Verifying all states...')
    const p1Bars = await db.customBar.findMany({ where: { creatorId: p1.id } })
    const p2Bars = await db.customBar.findMany({ where: { claimedById: p2.id } })

    const p1Charge = p1Bars.filter(b => b.type === 'charge_capture')
    const p1Offer = p1Bars.filter(b => b.type === 'vibe')
    const p2Claimed = p2Bars.filter(b => b.id === offerBar.id)

    const checks = [
      { label: 'P1 has charge bar',        pass: p1Charge.length >= 1 },
      { label: 'P1 has offer bar',          pass: p1Offer.length >= 1 },
      { label: 'P2 claimed offer bar',       pass: p2Claimed.length >= 1 },
      { label: 'Charge bar has rootId set',   pass: chargeBar.rootId !== 'temp' },
      { label: 'Offer bar has docQuestMeta',  pass: offerBar.docQuestMetadata !== null },
    ]

    let allPassed = true
    for (const check of checks) {
      console.log(`  ${check.pass ? '✓' : '✗'} ${check.label}`)
      if (!check.pass) allPassed = false
    }
    console.log()

    if (allPassed) {
      console.log('✅ ALL CHECKS PASSED — Full OBT sequence verified')
    } else {
      console.log('❌ SOME CHECKS FAILED')
      process.exit(1)
    }
  } finally {
    console.log('\n🧹 Cleaning up...')
    await cleanup(p1Name)
    await cleanup(p2Name)
    await db.$disconnect()
  }
}

main().catch(err => {
  console.error('❌ Fatal:', err.message)
  process.exit(1)
})
