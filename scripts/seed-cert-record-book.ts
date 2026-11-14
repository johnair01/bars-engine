/**
 * Verification quest: cert-record-book-v1
 *
 * Walks a tester through the record book at the coin table (Six-faces-council spec .specify/specs/record-book, FR-013;
 * his A on rb-new-page and on rb-ad-look-1, the ink diary): open the book at the table, turn to yourself by a tab, write
 * a new name on the blank page, toss and keep, sit again and find the book open at the new page, plant a spark from it.
 *
 * Idempotent. Run: npm run seed:cert:record-book
 */
import './require-db-env'
import { db } from '../src/lib/db'

const slug = 'cert-record-book-v1'
const title = 'Certification: Record Book V1'

const passages = [
  {
    "name": "START",
    "pid": "1",
    "text": "This certification walks the **record book** at the coin table: one page per person you toss for, a blank last page for a new name, and the casts you kept on each page.\n\nComplete each step in order, then finish to receive your reward.",
    "cleanText": "This certification walks the record book at the coin table: one page per person you toss for, a blank last page for a new name, and the casts you kept on each page. Complete each step in order, then finish to receive your reward.",
    "links": [
      {
        "label": "Begin",
        "target": "STEP_1"
      }
    ]
  },
  {
    "name": "STEP_1",
    "pid": "2",
    "text": "### Step 1: Open the book at the table\n\n[Open your nook](/ontology-game/between?nook=1). In your nook, walk to the low table by the hearth and sit. Confirm the book opens beside the coins at the page you last tossed for (Yourself on a first sitting), with a tab for every page on its edge.",
    "cleanText": "Step 1: Open the book at the table. In your nook, walk to the low table by the hearth and sit. Confirm the book opens beside the coins at the page you last tossed for (Yourself on a first sitting), with a tab for every page on its edge.",
    "links": [
      {
        "label": "Next",
        "target": "STEP_2"
      },
      {
        "label": "Report Issue",
        "target": "FEEDBACK"
      }
    ]
  },
  {
    "name": "STEP_2",
    "pid": "3",
    "text": "### Step 2: Turn to yourself by a tab\n\nTouch the Yourself tab. Confirm the page turns to Yourself in one touch and the action at the bottom reads Toss for yourself.",
    "cleanText": "Step 2: Turn to yourself by a tab. Touch the Yourself tab. Confirm the page turns to Yourself in one touch and the action at the bottom reads Toss for yourself.",
    "links": [
      {
        "label": "Next",
        "target": "STEP_3"
      },
      {
        "label": "Report Issue",
        "target": "FEEDBACK"
      }
    ]
  },
  {
    "name": "STEP_3",
    "pid": "4",
    "text": "### Step 3: Write a name on the blank page\n\nTouch the last, empty tab. Confirm the blank page says Write a name. Write a name, and confirm the action reads Toss for that name.",
    "cleanText": "Step 3: Write a name on the blank page. Touch the last, empty tab. Confirm the blank page says Write a name. Write a name, and confirm the action reads Toss for that name.",
    "links": [
      {
        "label": "Next",
        "target": "STEP_4"
      },
      {
        "label": "Report Issue",
        "target": "FEEDBACK"
      }
    ]
  },
  {
    "name": "STEP_4",
    "pid": "5",
    "text": "### Step 4: Toss and keep\n\nToss for that name, six tosses, and keep the move. Confirm the words say it was kept on their page.",
    "cleanText": "Step 4: Toss and keep. Toss for that name, six tosses, and keep the move. Confirm the words say it was kept on their page.",
    "links": [
      {
        "label": "Next",
        "target": "STEP_5"
      },
      {
        "label": "Report Issue",
        "target": "FEEDBACK"
      }
    ]
  },
  {
    "name": "STEP_5",
    "pid": "6",
    "text": "### Step 5: Sit again\n\nStand up, then sit at the table again. Confirm the book opens to the new page, with the cast you kept written on it in ink: its six lines, its name and its move, newest at the top, and nothing counted.",
    "cleanText": "Step 5: Sit again. Stand up, then sit at the table again. Confirm the book opens to the new page, with the cast you kept written on it in ink: its six lines, its name and its move, newest at the top, and nothing counted.",
    "links": [
      {
        "label": "Next",
        "target": "STEP_6"
      },
      {
        "label": "Report Issue",
        "target": "FEEDBACK"
      }
    ]
  },
  {
    "name": "STEP_6",
    "pid": "7",
    "text": "### Step 6: Plant a spark from the page\n\nIf you are enrolled in Flirtcraft, steer the table to Flirtcraft and touch Plant a spark for that name. Confirm the Plant a spark sheet opens with the name already written in it. Plant it, come back to the table, and confirm the page keeps its casts. (Not enrolled: confirm the plant line does not show.)",
    "cleanText": "Step 6: Plant a spark from the page. If you are enrolled in Flirtcraft, steer the table to Flirtcraft and touch Plant a spark for that name. Confirm the Plant a spark sheet opens with the name already written in it. Plant it, come back to the table, and confirm the page keeps its casts. (Not enrolled: confirm the plant line does not show.)",
    "links": [
      {
        "label": "Complete verification",
        "target": "END_SUCCESS"
      },
      {
        "label": "Report Issue",
        "target": "FEEDBACK"
      }
    ]
  },
  {
    "name": "FEEDBACK",
    "pid": "8",
    "text": "### Report an Issue\n\nSomething isn't working as expected? Describe what you encountered so we can fix it.",
    "cleanText": "Report an Issue. Something isn't working as expected? Describe what you encountered so we can fix it.",
    "links": [],
    "tags": [
      "feedback"
    ]
  },
  {
    "name": "END_SUCCESS",
    "pid": "9",
    "text": "Verification complete. The book opened beside the coins, a tab turned to a page in one touch, a new name took a page, a kept cast was written on it, and the book opened to it again. Complete this quest to receive your vibeulon reward.",
    "cleanText": "Verification complete. The book opened beside the coins, a tab turned to a page in one touch, a new name took a page, a kept cast was written on it, and the book opened to it again. Complete this quest to receive your vibeulon reward.",
    "links": []
  }
]

async function seed() {
  console.log('--- Seeding cert-record-book-v1 ---')

  // Reset completion so admins can re-run the quest after a reseed.
  const deletedQuests = await db.playerQuest.deleteMany({ where: { questId: slug } })
  const deletedRuns = await db.twineRun.deleteMany({ where: { questId: slug } })
  if (deletedQuests.count > 0 || deletedRuns.count > 0) {
    console.log(`🔄 Reset ${deletedQuests.count} PlayerQuest(s) and ${deletedRuns.count} TwineRun(s)`)
  }

  const creator = await db.player.findFirst()
  if (!creator) throw new Error('No player found for createdById')
  const createdById = creator.id

  const parsedJson = JSON.stringify({ title, startPassage: 'START', passages })

  const story = await db.twineStory.upsert({
    where: { slug },
    update: { title, parsedJson, isPublished: true },
    create: {
      title,
      slug,
      sourceType: 'manual_seed',
      sourceText: 'Record book certification quest (seed-cert-record-book.ts)',
      parsedJson,
      isPublished: true,
      createdById,
    },
  })

  const description =
    'Walks the record book at the coin table in the nook: the book opens beside the coins, a tab turns to a page, a new name is written on the blank page, a cast is kept on it, the book opens to it again, and a spark is planted from it.'

  const quest = await db.customBar.upsert({
    where: { id: slug },
    update: {
      title,
      description,
      reward: 1,
      twineStoryId: story.id,
      status: 'active',
      visibility: 'public',
      isSystem: true,
      backlogPromptPath: 'Six-faces-council .specify/specs/record-book/spec.md',
    },
    create: {
      id: slug,
      title,
      description,
      creatorId: createdById,
      reward: 1,
      twineStoryId: story.id,
      status: 'active',
      visibility: 'public',
      isSystem: true,
      backlogPromptPath: 'Six-faces-council .specify/specs/record-book/spec.md',
    },
  })

  console.log(`✅ Story seeded: ${story.title} (${story.id})`)
  console.log(`✅ Quest seeded: ${quest.title} (${quest.id})`)
}

seed()
  .then(() => db.$disconnect())
  .catch(async (err) => {
    console.error(err)
    await db.$disconnect()
    process.exit(1)
  })
