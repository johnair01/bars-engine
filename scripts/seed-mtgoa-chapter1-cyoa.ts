/**
 * Seed MtGoA Chapter 1 book CYOA demo — Adventure + Passages + library quest + thread link.
 * @see .specify/specs/book-cyoa-campaign/spec.md
 *
 * Run: npm run seed:mtgoa-ch1
 * Requires: DATABASE_URL (see scripts/require-db-env.ts)
 */
import './require-db-env'
import { db } from '../src/lib/db'

const BOOK_SLUG = 'mastering-the-game-of-allyship'
const QUEST_TITLE = 'MtGoA Chapter 1 — Allyship stance (demo)'
const ADVENTURE_SLUG = 'mtgoa-chapter-1'
const CAMPAIGN_REF = 'mtgoa-chapter-1-demo'

async function seed() {
  console.log('--- Seeding MtGoA Chapter 1 CYOA demo ---')

  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player in DB — create a user first (needed for CustomBar.creatorId).')

  const book = await db.book.upsert({
    where: { slug: BOOK_SLUG },
    create: {
      slug: BOOK_SLUG,
      title: 'Mastering the Game of Allyship',
      author: 'Britt',
      status: 'published',
    },
    update: {
      title: 'Mastering the Game of Allyship',
      status: 'published',
    },
  })
  console.log(`  ✓ Book: ${book.title} (${book.slug})`)

  let quest = await db.customBar.findFirst({
    where: { title: QUEST_TITLE },
  })
  if (!quest) {
    quest = await db.customBar.create({
      data: {
        creatorId: creator.id,
        title: QUEST_TITLE,
        description:
          'A short practice: notice one moment today where allyship shows up — or where it could. ' +
          'Complete in your own words (no performance). This is Chapter 1 scope only.',
        type: 'vibe',
        moveType: 'wakeUp',
        status: 'active',
        visibility: 'public',
        isSystem: true,
        maxAssignments: 999,
        inputs: '[]',
        rootId: 'temp',
        campaignRef: CAMPAIGN_REF,
        allyshipDomain: 'RAISE_AWARENESS',
        successCondition: 'Player records one honest reflection or completion note.',
        completionEffects: JSON.stringify({ bookCyoaDemo: true, bookSlug: BOOK_SLUG, chapter: 1 }),
      },
    })
    await db.customBar.update({
      where: { id: quest.id },
      data: { rootId: quest.id },
    })
    console.log(`  ✓ Created quest BAR: ${quest.id}`)
  } else {
    console.log(`  ✓ Quest BAR exists: ${quest.id}`)
  }

  let thread =
    (await db.questThread.findUnique({ where: { bookId: book.id } })) ??
    (await db.questThread.create({
      data: {
        title: book.title,
        description: 'Library thread — MtGoA (demo)',
        threadType: 'standard',
        creatorType: 'library',
        bookId: book.id,
        status: 'active',
      },
    }))
  console.log(`  ✓ QuestThread: ${thread.id}`)

  await db.threadQuest.upsert({
    where: {
      threadId_questId: { threadId: thread.id, questId: quest.id },
    },
    create: {
      threadId: thread.id,
      questId: quest.id,
      position: 1,
    },
    update: { position: 1 },
  })

  const adventure = await db.adventure.upsert({
    where: { slug: ADVENTURE_SLUG },
    create: {
      slug: ADVENTURE_SLUG,
      title: 'MtGoA — Chapter 1 (demo)',
      description:
        'Structured preview of Chapter 1 — Epiphany Bridge + one practice quest. Not the full book.',
      status: 'ACTIVE',
      visibility: 'PUBLIC_ONBOARDING',
      campaignRef: CAMPAIGN_REF,
      startNodeId: 'MTGOA_CH1_Start',
    },
    update: {
      title: 'MtGoA — Chapter 1 (demo)',
      status: 'ACTIVE',
      campaignRef: CAMPAIGN_REF,
      startNodeId: 'MTGOA_CH1_Start',
    },
  })
  console.log(`  ✓ Adventure: ${adventure.slug} → ${adventure.id}`)

  await db.questThread.update({
    where: { id: thread.id },
    data: { adventureId: adventure.id },
  })
  console.log('  ✓ QuestThread.adventureId linked to Adventure')

  await db.questAdventureLink.upsert({
    where: {
      questId_moveType: { questId: quest.id, moveType: 'wakeUp' },
    },
    create: {
      questId: quest.id,
      adventureId: adventure.id,
      moveType: 'wakeUp',
    },
    update: { adventureId: adventure.id },
  })
  console.log('  ✓ QuestAdventureLink (wakeUp)')

  type PRow = {
    nodeId: string
    text: string
    choices: string
    metadata: Record<string, string>
    linkedQuestId?: string | null
  }

  const passageRows: PRow[] = [
    {
      nodeId: 'MTGOA_CH1_Start',
      text:
        '## Chapter 1 — Enter the book\n\n' +
        'This is a **preview**: one Epiphany Bridge beat and one **real** quest you can complete in-app. ' +
        'We stay inside *Wake Up* for this slice — noticing stance before bigger moves.',
      choices: JSON.stringify([{ text: 'Cross the bridge →', targetId: 'MTGOA_CH1_Bridge' }]),
      metadata: { passageType: 'expository', move: 'wake_up' },
    },
    {
      nodeId: 'MTGOA_CH1_Bridge',
      text:
        '## Epiphany Bridge\n\n' +
        'Allyship is not a performance score — it is **practice in relationship**. ' +
        'The game here is to bring awareness to *how you show up* when it matters.\n\n' +
        'Take a breath. When you are ready, continue to the practice passage.',
      choices: JSON.stringify([{ text: 'Continue to practice →', targetId: 'MTGOA_CH1_Practice' }]),
      metadata: { passageType: 'epiphany_bridge', move: 'wake_up' },
    },
    {
      nodeId: 'MTGOA_CH1_Practice',
      text:
        '## Practice — notice stance\n\n' +
        'Below you can **take the Chapter 1 quest** — it is the same quest pulled from the library thread, ' +
        'so completion counts as a real loop (Vault / PlayerQuest), not a decorative button.\n\n' +
        'When you have taken it, use **Continue** for a short recap.',
      choices: JSON.stringify([{ text: 'Chapter 1 recap →', targetId: 'MTGOA_CH1_Recap' }]),
      linkedQuestId: quest.id,
      metadata: { passageType: 'skill_development', move: 'wake_up' },
    },
    {
      nodeId: 'MTGOA_CH1_Recap',
      text:
        '## End of Chapter 1 preview\n\n' +
        'You can keep the quest in your Vault, browse the [Quest Library](/library), or return home. ' +
        'More chapters ship as we stabilize this path.',
      choices: JSON.stringify([
        { text: 'Quest Library', targetId: 'redirect:/library' },
        { text: 'Home', targetId: 'redirect:/' },
      ]),
      metadata: { passageType: 'expository', move: 'wake_up' },
    },
  ]

  for (const p of passageRows) {
    await db.passage.upsert({
      where: {
        adventureId_nodeId: { adventureId: adventure.id, nodeId: p.nodeId },
      },
      create: {
        adventureId: adventure.id,
        nodeId: p.nodeId,
        text: p.text,
        choices: p.choices,
        metadata: p.metadata,
        linkedQuestId: p.linkedQuestId ?? null,
      },
      update: {
        text: p.text,
        choices: p.choices,
        metadata: p.metadata,
        linkedQuestId: p.linkedQuestId ?? null,
      },
    })
  }
  console.log('  ✓ Passages: MTGOA_CH1_Start, _Bridge, _Practice (linked quest), _Recap')

  console.log('\nDone. Open: /campaign?ref=' + encodeURIComponent(CAMPAIGN_REF))
  console.log('CampaignReader uses adventure slug: ' + ADVENTURE_SLUG)
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
