/**
 * Smoke Test: Admin Validation Suite (Twine)
 *
 * Run with: npx tsx scripts/smoke-test-admin-validation.ts
 *
 * Validates the admin Twine pipeline:
 * 1. Seeds admin validation quests (Quick Mint, Labyrinth, Resurrection Loop)
 * 2. Plays through Quick Mint: assign → run → advance to END_MINT → auto-complete
 * 3. Verifies: PlayerQuest completed, VibulonEvent created, Ledger mint
 *
 * Spec: .specify/specs/admin-validation-suite-twine/spec.md
 */

import './require-db-env'
import { db } from '../src/lib/db'
import { autoCompleteQuestFromTwine } from '../src/actions/twine'
import { normalizeTwineStory } from '../src/lib/schemas'
import * as fs from 'fs'
import * as path from 'path'

const QUEST_ID = 'admin-test-quick-mint'
const STORY_SLUG = 'admin-test-quick-mint-story'

async function main() {
  console.log('=== ADMIN VALIDATION SUITE (TWINE) ===\n')
  const results: { test: string; status: 'PASS' | 'FAIL'; detail?: string }[] = []

  function pass(test: string, detail?: string) {
    results.push({ test, status: 'PASS', detail })
    console.log(`  PASS: ${test}${detail ? ` (${detail})` : ''}`)
  }
  function fail(test: string, detail?: string) {
    results.push({ test, status: 'FAIL', detail })
    console.log(`  FAIL: ${test}${detail ? ` - ${detail}` : ''}`)
  }

  const ts = Date.now()
  const email = `admin-validation-${ts}@test.local`
  let playerId: string | null = null
  let runId: string | null = null

  try {
    await db.player.count()
    pass('DB Connection')

    // 1. Seed admin validation quests
    const creator = await db.player.findFirst()
    if (!creator) {
      fail('Seed', 'No player found for createdById')
    } else {
      const storiesDir = path.join(process.cwd(), 'content', 'stories', 'admin_tests')
      const filePath = path.join(storiesDir, 'the-quick-mint.json')
      const rawJson = fs.readFileSync(filePath, 'utf-8')
      const normalized = normalizeTwineStory(JSON.parse(rawJson))
      const normalizedJson = JSON.stringify(normalized)

      const story = await db.twineStory.upsert({
        where: { slug: STORY_SLUG },
        update: { parsedJson: normalizedJson, isPublished: true },
        create: {
          title: 'The Quick Mint',
          slug: STORY_SLUG,
          sourceType: 'manual_seed',
          sourceText: 'From smoke test',
          parsedJson: normalizedJson,
          isPublished: true,
          createdById: creator.id,
        },
      })

      await db.customBar.upsert({
        where: { id: QUEST_ID },
        update: { twineStoryId: story.id, reward: 1, isSystem: true },
        create: {
          id: QUEST_ID,
          title: 'The Quick Mint',
          description: 'Admin validation test',
          creatorId: creator.id,
          reward: 1,
          twineStoryId: story.id,
          status: 'active',
          visibility: 'public',
          isSystem: true,
          inputs: '[]',
          rootId: QUEST_ID,
        },
      })
      pass('Seed admin quests', QUEST_ID)
    }

    // 2. Create test player
    const invite = await db.invite.create({
      data: { token: `av_${ts}`, status: 'used', usedAt: new Date() },
    })
    const account = await db.account.create({
      data: { email, passwordHash: 'test' },
    })
    const player = await db.player.create({
      data: {
        accountId: account.id,
        name: 'Admin Validation Tester',
        contactType: 'email',
        contactValue: email,
        inviteId: invite.id,
      },
    })
    playerId = player.id
    pass('Create test player', playerId)

    // 3. Assign quest
    await db.playerQuest.create({
      data: { playerId, questId: QUEST_ID, status: 'assigned' },
    })
    pass('Assign quest')

    // 4. Create TwineRun
    const quest = await db.customBar.findUnique({ where: { id: QUEST_ID } })
    if (!quest?.twineStoryId) {
      fail('Quest lookup', 'Missing twineStoryId')
    } else {
      const run = await db.twineRun.create({
        data: {
          storyId: quest.twineStoryId,
          playerId,
          questId: QUEST_ID,
          currentPassageId: '1',
          visited: JSON.stringify(['1']),
          firedBindings: '[]',
        },
      })
      runId = run.id
      pass('Create run', runId)
    }

    // 5. Advance to END_MINT (simulate navigation)
    if (runId) {
      await db.twineRun.update({
        where: { id: runId },
        data: {
          currentPassageId: 'END_MINT',
          visited: JSON.stringify(['1', 'END_MINT']),
        },
      })
      pass('Advance to END_MINT')
    }

    // 6. Trigger auto-complete
    if (runId && playerId) {
      const completed = await autoCompleteQuestFromTwine(QUEST_ID, runId, playerId)
      if (completed) {
        pass('Auto-complete triggered')
      } else {
        fail('Auto-complete', 'Returned false')
      }
    }

    // 7. Verify PlayerQuest completed
    const assignment = await db.playerQuest.findFirst({
      where: { playerId, questId: QUEST_ID },
    })
    if (assignment?.status === 'completed') {
      pass('PlayerQuest status = completed')
    } else {
      fail('PlayerQuest status', `Expected completed, got ${assignment?.status}`)
    }

    // 8. Verify VibulonEvent created
    const vibeEvent = await db.vibulonEvent.findFirst({
      where: { playerId, questId: QUEST_ID },
    })
    if (vibeEvent && vibeEvent.amount === 1) {
      pass('VibulonEvent created', `amount=${vibeEvent.amount}`)
    } else {
      fail('VibulonEvent', vibeEvent ? `amount=${vibeEvent.amount}` : 'Not found')
    }

    // 9. Verify Ledger mint (VibeulonLedger)
    const ledgerEntry = await db.vibeulonLedger.findFirst({
      where: { playerId, type: 'MINT' },
      orderBy: { createdAt: 'desc' },
    })
    if (ledgerEntry && ledgerEntry.amount > 0) {
      pass('Ledger mint recorded', `amount=${ledgerEntry.amount}`)
    } else {
      fail('Ledger mint', ledgerEntry ? `amount=${ledgerEntry.amount}` : 'No MINT entry found')
    }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    fail('Unexpected error', msg)
  }

  // Cleanup
  console.log('\nCleaning up...')
  try {
    if (playerId) {
      await db.vibulonEvent.deleteMany({ where: { playerId } }).catch(() => {})
      await db.vibeulonLedger.deleteMany({ where: { playerId } }).catch(() => {})
      await db.vibulon.deleteMany({ where: { ownerId: playerId } }).catch(() => {})
      await db.playerQuest.deleteMany({ where: { playerId, questId: QUEST_ID } })
      if (runId) await db.twineRun.delete({ where: { id: runId } }).catch(() => {})
      await db.player.delete({ where: { id: playerId } }).catch(() => {})
      await db.account.deleteMany({ where: { email } })
      await db.invite.deleteMany({ where: { token: { startsWith: `av_${ts}` } } })
    }
    console.log('  Cleanup complete.')
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.log(`  Cleanup warning: ${msg}`)
  }

  // Summary
  console.log('\n=== RESULTS ===')
  const passed = results.filter((r) => r.status === 'PASS').length
  const failed = results.filter((r) => r.status === 'FAIL').length
  console.log(`  ${passed} passed, ${failed} failed out of ${results.length} tests`)
  if (failed > 0) {
    console.log('\nFailed:')
    results.filter((r) => r.status === 'FAIL').forEach((r) => console.log(`  - ${r.test}: ${r.detail}`))
  }
  console.log('\n=== ADMIN VALIDATION SUITE COMPLETE ===')
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('Crashed:', e)
  process.exit(1)
})
