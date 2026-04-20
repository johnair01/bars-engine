import { config } from 'dotenv'
config({ path: '.env.local' })

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗')
  console.log('║   Phase 2a.3: Campaign Transformation Verification        ║')
  console.log('╚════════════════════════════════════════════════════════════╝\n')

  const campaigns = await db.campaign.findMany({
    where: { slug: { in: ['summer-solidarity-drive', 'casey-s-birthday'] } },
    select: {
      id: true,
      slug: true,
      name: true,
      allyshipDomain: true,
      campaignFlavorLayers: true,
    },
  })

  let allPass = true

  for (const c of campaigns) {
    const layers = c.campaignFlavorLayers as any
    console.log(`\n${'='.repeat(70)}`)
    console.log(`Campaign: ${c.name} (${c.slug})`)
    console.log('='.repeat(70))

    // Check 1: Scope
    const scopePass = layers?.scope?.allyship_domains?.[0] === c.allyshipDomain
    console.log(`\n✓ OLD → NEW Mapping:`)
    console.log(`  OLD: allyshipDomain = "${c.allyshipDomain}"`)
    console.log(`  NEW: scope.allyship_domains = ${JSON.stringify(layers?.scope?.allyship_domains)}`)
    console.log(`  Status: ${scopePass ? '✅ PASS' : '❌ FAIL'}`)
    if (!scopePass) allPass = false

    // Check 2: Quest Generation
    const questGen = layers?.quest_generation
    let questPass = false
    if (Array.isArray(questGen)) {
      const count = questGen.length
      const expectedCount = c.slug === 'summer-solidarity-drive' ? 2 : 6
      questPass = count === expectedCount
      console.log(`\n✓ Quest Generation:`)
      console.log(`  Count: ${count} quests`)
      console.log(`  Expected: ${expectedCount} quests`)
      console.log(`  Status: ${questPass ? '✅ PASS' : '❌ FAIL'}`)
      
      // Show quest names
      console.log(`  Quests:`)
      questGen.slice(0, 3).forEach((q: any, i: number) => {
        console.log(`    [${i+1}] ${q.templateName || 'Unknown'} (${q.settings?.moveType || 'unknown'})`)
      })
      if (questGen.length > 3) console.log(`    ... and ${questGen.length - 3} more`)
    }
    if (!questPass) allPass = false

    // Check 3: Metadata
    const meta = layers?.additional_metadata
    const metaPass = meta && meta.migrated_from && meta.migrated_at && meta.original_campaign_id
    console.log(`\n✓ Metadata:`)
    console.log(`  migrated_from: "${meta?.migrated_from || 'MISSING'}"`)
    console.log(`  migrated_at: "${meta?.migrated_at || 'MISSING'}"`)
    console.log(`  original_campaign_id: "${meta?.original_campaign_id || 'MISSING'}"`)
    console.log(`  Status: ${metaPass ? '✅ PASS' : '❌ FAIL'}`)
    if (!metaPass) allPass = false

    // Check 4: JSON validity
    const jsonValid = typeof layers === 'object' && layers !== null
    console.log(`\n✓ JSON Validity:`)
    console.log(`  Type: ${typeof layers}`)
    console.log(`  Size: ${JSON.stringify(layers).length} bytes`)
    console.log(`  Status: ${jsonValid ? '✅ PASS' : '❌ FAIL'}`)
    if (!jsonValid) allPass = false
  }

  console.log(`\n${'='.repeat(70)}`)
  console.log(`\nOVERALL RESULT: ${allPass ? '✅ ALL CHECKS PASSED' : '❌ SOME CHECKS FAILED'}`)
  console.log()

  await db.$disconnect()
  process.exit(allPass ? 0 : 1)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
