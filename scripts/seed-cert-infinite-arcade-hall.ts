/**
 * Verification quest: cert-infinite-arcade-hall-v1
 *
 * Readies the Infinite Arcade hall for its first patron (council spec .specify/specs/infinite-arcade-hall/, FR-015,
 * task T011): the tester stands at the grey gate, walks to each cabinet, drops a coin, keeps a ticket with a word,
 * lets one go, refills an empty purse on the bench, and sees the hall as a visitor without the pass.
 *
 * Idempotent. Run: npm run seed:cert:infinite-arcade-hall
 */
import './require-db-env'
import { db } from '../src/lib/db'

const slug = 'cert-infinite-arcade-hall-v1'
const title = 'Certification: Infinite Arcade Hall V1'
const HALL = '/between/land.html?place=arcade'

type Step = { title: string; text: string }
const steps: Step[] = [
  { title: 'Step through the grey gate', text: `[Open the hall with the pass](${HALL}&pass=1&fresh=1). Confirm you stand inside the grey gate with the change machine on your left, the prize counter on your right, and three lit cabinets down the corridor. One cabinet has a warm lamp over it, and no list or menu of games appears.` },
  { title: 'Walk to each cabinet', text: 'Tap a cabinet to walk to it, and drag to look around. The Ask and The Between say INSERT COIN on their marquees, and a ring of light glows on the floor in front of each. At each of them a card offers "Drop a coin" and nothing else. The Lantern Table says it lights soon, takes no coin, and offers to walk you to a cabinet that plays. Walk away from a cabinet and confirm nothing calls after you.' },
  { title: 'Drop a coin into The Between', text: 'At The Between, choose "Drop a coin". Confirm the coin clunks, the marquee brightens and the camera pushes through the screen into the Between within three seconds. Then choose "Back to the hall" at the top of the screen.' },
  { title: 'Keep a ticket with a word', text: 'Back in the hall, you stand at The Between and a ticket curls from the tray. Choose "Keep it", write one word, and choose "Hang it on the line". Walk to the prize counter and confirm your ticket hangs on the line in teal with your word on it. No number shows anywhere.' },
  { title: 'Ask, and let a ticket go', text: 'Drop a coin into The Ask. At the desk, write who you will ask and for what, then choose "I asked: pull the lever". Back in the hall, the ask cabinet asks what came back: choose any answer. Choose "Let it go" on that ticket and confirm it drops into the change machine\'s hopper.' },
  { title: 'Refill an empty purse', text: `[Open the hall with an empty purse](${HALL}&pass=1&coins=0&at=bench). Confirm the bench card offers "Sit a while" and "Melt a block". Sit a while, and confirm within a minute the purse at your hip hangs fuller and a cabinet offers "Drop a coin" again. No screen says "out of coins".` },
  { title: 'See the hall as a visitor', text: `[Open the hall without the pass](${HALL}&pass=0). Confirm you stand outside the grey gate, see the corridor's screens through the mist, cannot walk through the gate, and get one card naming the Patreon pass with a link to the page. No countdown appears and no cabinet plays.` },
]

const plain = (s: string) => s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)').replace(/[*#]/g, '')
const passages = [
  {
    name: 'START',
    pid: '1',
    text: 'The Infinite Arcade hall opens to its first patron soon. Walk it the way a patron will, on your phone, and confirm each step before the invite goes out.\n\nComplete each step in order, then finish to receive your reward.',
    cleanText: 'The Infinite Arcade hall opens to its first patron soon. Walk it the way a patron will, on your phone, and confirm each step before the invite goes out. Complete each step in order, then finish to receive your reward.',
    links: [{ label: 'Begin', target: 'STEP_1' }],
  },
  ...steps.map((s, i) => ({
    name: `STEP_${i + 1}`,
    pid: String(i + 2),
    text: `### Step ${i + 1}: ${s.title}\n\n${s.text}`,
    cleanText: `Step ${i + 1}: ${s.title}. ${plain(s.text)}`,
    links: [
      i + 1 < steps.length ? { label: 'Next', target: `STEP_${i + 2}` } : { label: 'Complete verification', target: 'END_SUCCESS' },
      { label: 'Report Issue', target: 'FEEDBACK' },
    ],
  })),
  {
    name: 'FEEDBACK',
    pid: String(steps.length + 2),
    text: "### Report an Issue\n\nSomething isn't working as expected? Describe what you encountered so we can fix it.",
    cleanText: "Report an Issue. Something isn't working as expected? Describe what you encountered so we can fix it.",
    links: [],
    tags: ['feedback'],
  },
  {
    name: 'END_SUCCESS',
    pid: String(steps.length + 3),
    text: 'Verification complete. The hall is ready for its first patron: the gate opens to the pass, every cabinet is reached by walking, a coin pushes you into the game, every round pays a ticket you can keep or let go, and an empty purse fills on the bench. Complete this quest to receive your vibeulon reward.',
    cleanText: 'Verification complete. The hall is ready for its first patron: the gate opens to the pass, every cabinet is reached by walking, a coin pushes you into the game, every round pays a ticket you can keep or let go, and an empty purse fills on the bench. Complete this quest to receive your vibeulon reward.',
    links: [],
  },
]

async function seed() {
  console.log('--- Seeding cert-infinite-arcade-hall-v1 ---')

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
      sourceText: 'Infinite Arcade hall certification quest (seed-cert-infinite-arcade-hall.ts)',
      parsedJson,
      isPublished: true,
      createdById,
    },
  })

  const description =
    'Readies the Infinite Arcade hall for its first patron: the grey gate, a walk to each cabinet, a coin dropped, a ticket kept with a word and one let go, an empty purse refilled on the bench, and the hall seen from outside the gate without the pass.'

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
      backlogPromptPath: 'public/between/arcade/arcade.js',
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
      backlogPromptPath: 'public/between/arcade/arcade.js',
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
