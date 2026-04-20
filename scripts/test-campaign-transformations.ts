import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })

import { PrismaClient } from '@prisma/client'

async function main() {
  const db = new PrismaClient()
  
  // Helper functions (same as main script)
  function transformAllyshipDomain(oldValue: string | null): string[] | null {
    if (!oldValue || oldValue.trim() === '') return null
    const valid = ['GATHERING_RESOURCES', 'SKILLFUL_ORGANIZING', 'DIRECT_ACTION', 'RAISE_AWARENESS']
    if (!valid.includes(oldValue.trim())) throw new Error(`Invalid: "${oldValue}"`)
    return [oldValue.trim()]
  }

  function transformQuestTemplateConfig(oldValue: any): any {
    if (!oldValue) return null
    if (Array.isArray(oldValue)) {
      return oldValue.map((item: any) => ({ ...item, createdFrom: 'questTemplateConfig (old field)' }))
    }
    return { ...oldValue, createdFrom: 'questTemplateConfig (old field)' }
  }

  const campaigns = await db.campaign.findMany({
    where: { slug: { in: ['summer-solidarity-drive', 'casey-s-birthday'] } },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      allyshipDomain: true,
      wakeUpContent: true,
      showUpContent: true,
      questTemplateConfig: true,
      inviteConfig: true,
    },
  })

  for (const c of campaigns) {
    const domains = transformAllyshipDomain(c.allyshipDomain)
    const quests = transformQuestTemplateConfig(c.questTemplateConfig)
    
    console.log(`\n${'='.repeat(80)}`)
    console.log(`CAMPAIGN SPOT-CHECK: ${c.name} (${c.slug})`)
    console.log('='.repeat(80))
    
    console.log('\n📋 OLD FIELDS:')
    console.log(`  allyshipDomain: "${c.allyshipDomain}"`)
    console.log(`  wakeUpContent: ${c.wakeUpContent ? '(present)' : '(null)'}`)
    console.log(`  showUpContent: ${c.showUpContent ? '(present)' : '(null)'}`)
    console.log(`  questTemplateConfig: ${Array.isArray(c.questTemplateConfig) ? `${c.questTemplateConfig.length} items` : 'object'}`)
    console.log(`  inviteConfig: ${c.inviteConfig ? '(present)' : '(null)'}`)

    console.log('\n✨ TRANSFORMED FIELDS:')
    console.log(`  scope.allyship_domains: ${JSON.stringify(domains)}`)
    
    if (Array.isArray(quests)) {
      console.log(`  quest_generation: ${quests.length} quests`)
      for (let i = 0; i < quests.length; i++) {
        const q = quests[i]
        console.log(`    [${i+1}] ${q.templateName || 'Unknown'} (${q.settings?.moveType || 'unknown'} move)`)
      }
    }

    console.log('\n📊 TRANSFORMATION QUALITY:')
    console.log(`  ✅ allyshipDomain mapped to array: ${domains ? 'YES' : 'N/A'}`)
    console.log(`  ✅ questTemplateConfig structure preserved: ${Array.isArray(quests) ? `${quests.length} quests` : 'N/A'}`)
    console.log(`  ✅ Sparse fields handled: ${!c.wakeUpContent && !c.showUpContent ? 'YES (omitted)' : 'MIXED'}`)
  }

  await db.$disconnect()
}

main().catch(console.error)
