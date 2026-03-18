/**
 * Audit existing BARs for title/content changes impact.
 * Run: npx tsx scripts/with-env.ts "npx tsx scripts/audit-bars.ts"
 */

import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

function firstLine(s: string): string {
  return (s || '').trim().split(/\r?\n/)[0]?.trim() || ''
}

async function main() {
  console.log('=== BARs Audit ===\n')

  // 1. Total type='bar' count
  const totalBars = await db.customBar.count({
    where: { type: 'bar' },
  })
  console.log(`1. Total type='bar' BARs: ${totalBars}`)

  // 2. BARs where title != first line of description
  const bars = await db.customBar.findMany({
    where: { type: 'bar', status: 'active' },
    select: { id: true, title: true, description: true, createdAt: true },
  })

  const titleMismatch = bars.filter((b) => {
    const first = firstLine(b.description)
    return first && b.title !== first
  })
  console.log(`\n2. BARs where title != first line of description: ${titleMismatch.length}`)
  if (titleMismatch.length > 0 && titleMismatch.length <= 5) {
    titleMismatch.forEach((b) => {
      console.log(`   - ${b.id}: title="${b.title.slice(0, 40)}..." desc_first="${firstLine(b.description).slice(0, 40)}..."`)
    })
  } else if (titleMismatch.length > 5) {
    titleMismatch.slice(0, 3).forEach((b) => {
      console.log(`   - ${b.id}: title="${b.title.slice(0, 40)}..."`)
    })
    console.log(`   ... and ${titleMismatch.length - 3} more`)
  }

  // 3. Invitation BARs
  const invites = await db.invite.findMany({
    where: { invitationBarId: { not: null } },
    include: { invitationBar: { select: { id: true, title: true, description: true } } },
  })
  console.log(`\n3. Invites with invitationBarId: ${invites.length}`)
  invites.forEach((i) => {
    const bar = i.invitationBar
    if (bar) console.log(`   - invite ${i.id} -> bar ${bar.id}: "${bar.title?.slice(0, 40)}..."`)
  })

  // 4. Kernel BARs (Instance.kernelBarId) - may not exist in all DBs
  try {
    const instances = await db.instance.findMany({
      where: { kernelBarId: { not: null } },
      include: { kernelBar: { select: { id: true, title: true, description: true } } },
    })
    console.log(`\n4. Instances with kernelBarId: ${instances.length}`)
    instances.forEach((i) => {
      const bar = i.kernelBar
      if (bar) console.log(`   - instance ${i.slug} -> bar ${bar.id}: "${bar.title?.slice(0, 40)}..."`)
    })
  } catch {
    console.log(`\n4. Instances with kernelBarId: (column not in DB, skip)`)
  }

  // 5. QuestProposals with barId (BAR as quest seed)
  const proposals = await db.questProposal.count({ where: {} })
  console.log(`\n5. QuestProposals (use barId): ${proposals} total`)

  console.log('\n=== Audit complete ===')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => db.$disconnect())
