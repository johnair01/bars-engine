/**
 * Test canonical hexagram data flow: JSON → DB → touchpoints.
 *
 * 1. Validates content/iching-canonical.json
 * 2. Verifies DB Bar records match canonical (after seed)
 * 3. Simulates what casting ritual, quest grammar, and wiki receive
 *
 * Run: npm run test:iching-flow
 * Prereq: npm run db:seed (to load canonical into DB)
 */

import { config } from 'dotenv'
config({ path: '.env' })
config({ path: '.env.local' })

import fs from 'fs'
import path from 'path'
import { PrismaClient } from '@prisma/client'

const CANONICAL_PATH = path.join(process.cwd(), 'content', 'iching-canonical.json')

type Hexagram = { id: number; name: string; tone: string; text: string }

function loadCanonical(): Hexagram[] {
  if (!fs.existsSync(CANONICAL_PATH)) {
    throw new Error(`Canonical file not found: ${CANONICAL_PATH}`)
  }
  return JSON.parse(fs.readFileSync(CANONICAL_PATH, 'utf8')) as Hexagram[]
}

async function main() {
  console.log('🔮 I Ching Hexagram Flow Test\n')

  // 1. Load canonical
  const canonical = loadCanonical()
  console.log(`   Canonical: ${canonical.length} hexagrams from content/iching-canonical.json`)

  const sampleIds = [1, 15, 20]
  const sampleCanonical = sampleIds.map((id) => canonical.find((h) => h.id === id)!).filter(Boolean)

  // 2. Query DB
  const prisma = new PrismaClient()
  const bars = await prisma.bar.findMany({
    where: { id: { in: sampleIds } },
    orderBy: { id: 'asc' },
  })

  if (bars.length === 0) {
    console.log('\n⚠️  No Bar records found. Run: npm run db:seed')
    process.exit(1)
  }

  // 3. Compare
  let allMatch = true
  for (const bar of bars) {
    const can = canonical.find((h) => h.id === bar.id)
    if (!can) continue
    const nameMatch = bar.name === can.name
    const toneMatch = bar.tone === can.tone
    const textMatch = bar.text === can.text
    if (!nameMatch || !toneMatch || !textMatch) allMatch = false

    const tag = nameMatch && toneMatch && textMatch ? '✓' : '✗'
    console.log(`\n   #${bar.id} ${tag}`)
    console.log(`      DB:   "${bar.name}" | ${bar.tone?.slice(0, 30)}...`)
    console.log(`      JSON: "${can.name}" | ${can.tone?.slice(0, 30)}...`)
    if (!nameMatch) console.log(`      ⚠ name mismatch`)
    if (!toneMatch) console.log(`      ⚠ tone mismatch`)
    if (!textMatch) console.log(`      ⚠ text mismatch (DB len=${bar.text?.length ?? 0}, JSON len=${can.text?.length ?? 0})`)
  }

  // 4. Simulate touchpoint outputs
  const bar1 = bars.find((b) => b.id === 1)
  if (bar1) {
    console.log('\n   --- Touchpoint simulation (hexagram 1) ---')
    console.log('   Casting ritual:')
    console.log(`     name: "${bar1.name}"`)
    console.log(`     tone: "${bar1.tone}"`)
    console.log(`     text: "${bar1.text?.slice(0, 80)}..."`)
    console.log('   Quest grammar prompt context:')
    console.log(`     Hexagram: #1 ${bar1.name} — ${bar1.tone}`)
    console.log(`     Meaning: ${bar1.text?.slice(0, 100)}...`)
    console.log('   Wiki table:')
    console.log(`     #1 — ${bar1.name}`)
  }

  await prisma.$disconnect()

  if (!allMatch) {
    console.log('\n⚠️  DB does not match canonical. Re-run: npm run db:seed')
    process.exit(1)
  }

  console.log('\n✅ Canonical hexagram data flows correctly through the system.')
  console.log('   Manual checks: /iching (cast), /wiki/iching (table), gameboard unpacking.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
