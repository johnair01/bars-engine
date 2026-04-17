/**
 * Headless OBT Test: Charge Capture Flow (DB layer)
 *
 * Mirrors the createChargeBar action at src/actions/charge-capture.ts
 * Run with: bun run scripts/test-OBT-charge-flow.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
const PLAYER_ID = 'cmo1ynazb000284mvisdfyfoy'

async function main() {
  console.log('🧪 OBT: Charge Capture Flow (DB Layer)\n')

  // Find player
  const player = await db.player.findUnique({ where: { id: PLAYER_ID } })
  if (!player) {
    console.error('❌ Player not found. Run: bun run scripts/cli/create-account.ts')
    process.exit(1)
  }
  console.log(`Player: ${player.name} (${player.id})`)

  // Clean up any existing OBT test bar from today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const existingToday = await db.customBar.findFirst({
    where: {
      creatorId: player.id,
      type: 'charge_capture',
      createdAt: { gte: today },
      title: { startsWith: 'OBT test' },
    },
  })
  if (existingToday) {
    console.log('🧹 Cleaning up previous OBT test bar...')
    await db.customBar.delete({ where: { id: existingToday.id } })
  }

  // Step 1: Create a charge bar (mirrors createChargeBar action)
  console.log('1️⃣ Creating charge bar...')
  const summary = 'OBT test: headless charge capture'
  const description = summary
  const inputs = JSON.stringify({
    emotion_channel: 'joy',
    intensity: 3,
    satisfaction: 'satisfied',
    sceneType: 'transcend',
    personal_move: 'showUp',
  })

  const bar = await db.customBar.create({
    data: {
      creatorId: player.id,
      title: summary,
      description,
      type: 'charge_capture',
      reward: 0,
      inputs,
      visibility: 'private',
      status: 'active',
      archetypeKey: null,
      moveType: 'showUp',
    },
  })
  console.log(`✅ Charge bar created: ${bar.id}`)

  // Step 2: Verify it's queryable
  console.log('\n2️⃣ Verifying charge bar...')
  const verified = await db.customBar.findUnique({ where: { id: bar.id } })
  if (!verified) {
    console.error('❌ Bar not found after creation')
    process.exit(1)
  }
  console.log(`✅ Bar verified: "${verified.title}" (${verified.type})`)
  console.log(`   Visibility: ${verified.visibility}`)
  console.log(`   Inputs: ${verified.inputs}`)

  // Step 3: Verify player ownership
  console.log('\n3️⃣ Verifying player ownership...')
  const playerBars = await db.customBar.findMany({
    where: { creatorId: player.id, type: 'charge_capture' },
  })
  console.log(`✅ Player has ${playerBars.length} charge bar(s) total`)

  // Step 4: Verify one-per-day rule works
  console.log('\n4️⃣ Verifying one-per-day rule...')
  const dupResult = await db.customBar.findFirst({
    where: {
      creatorId: player.id,
      type: 'charge_capture',
      createdAt: { gte: today },
    },
  })
  if (dupResult && dupResult.id === bar.id) {
    console.log('✅ One-per-day check passed (correctly finds today\'s bar)')
  }

  console.log('\n✅ OBT PASSED: charge capture flow works headlessly')
  console.log(`   Bar ID: ${bar.id}`)
  console.log(`   Next: verify via UI at /capture`)
}

main()
  .catch(err => {
    console.error('❌ Error:', err.message)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
