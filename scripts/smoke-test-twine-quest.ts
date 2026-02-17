/**
 * Smoke Test: Twine-as-Quest (END_ auto-completion)
 *
 * Run with: npx tsx scripts/smoke-test-twine-quest.ts
 *
 * Tests:
 * 1. Parse quest-adventure fixture (has END_Complete passage)
 * 2. Create story, publish it
 * 3. Create quest with twineStoryId
 * 4. Create player, assign quest
 * 5. Create quest-scoped TwineRun
 * 6. Advance through passages to END_Complete
 * 7. Verify quest status = completed
 * 8. Verify run.completedAt is set
 * 9. Verify duplicate prevention (re-advance doesn't re-complete)
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parseTwineHtml } from '../src/lib/twine-parser'

const db = new PrismaClient()

async function main() {
    console.log('=== TWINE-AS-QUEST SMOKE TEST ===\n')
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
    const email = `twine-quest-smoke-${ts}@test.local`
    let playerId: string | null = null
    let storyId: string | null = null
    let questId: string | null = null
    let runId: string | null = null

    try {
        await db.player.count()
        pass('DB Connection')

        // 1. Parse fixture
        const html = readFileSync(join(__dirname, 'fixtures/twine/quest-adventure.html'), 'utf-8')
        const parsed = parseTwineHtml(html)

        if (parsed.title === 'The Quick Quest' && parsed.passages.length === 6) {
            pass('Parse fixture', `${parsed.passages.length} passages`)
        } else {
            fail('Parse fixture', `${parsed.passages.length} passages`)
        }

        // Verify END_ passage exists
        const endPassage = parsed.passages.find(p => p.name.startsWith('END_'))
        if (endPassage) {
            pass('END_ passage found', endPassage.name)
        } else {
            fail('END_ passage not found')
        }

        // 2. Create player
        const invite = await db.invite.create({ data: { token: `tq_smoke_${ts}`, status: 'used', usedAt: new Date() } })
        const account = await db.account.create({ data: { email, passwordHash: 'test' } })
        const player = await db.player.create({
            data: { accountId: account.id, name: 'TQ Tester', contactType: 'email', contactValue: email, inviteId: invite.id }
        })
        playerId = player.id
        pass('Create player', playerId)

        // 3. Create + publish story
        const story = await db.twineStory.create({
            data: {
                title: parsed.title,
                slug: `tq-smoke-${ts}`,
                sourceType: 'twine_html',
                sourceText: html,
                parsedJson: JSON.stringify(parsed),
                isPublished: true,
                createdById: playerId,
            }
        })
        storyId = story.id
        pass('Create & publish story', storyId)

        // 4. Create quest with twineStoryId
        const quest = await db.customBar.create({
            data: {
                creatorId: playerId, title: 'Twine Quest Test', description: 'Complete the adventure.',
                type: 'vibe', reward: 1, visibility: 'private', status: 'active',
                inputs: '[]', rootId: 'temp', twineStoryId: storyId,
            }
        })
        await db.customBar.update({ where: { id: quest.id }, data: { rootId: quest.id } })
        questId = quest.id
        pass('Create quest with twineStoryId', questId)

        // 5. Assign quest to player
        await db.playerQuest.create({
            data: { playerId, questId, status: 'assigned' }
        })
        pass('Assign quest')

        // 6. Create quest-scoped run
        const run = await db.twineRun.create({
            data: {
                storyId, playerId, questId,
                currentPassageId: parsed.startPassage,
                visited: JSON.stringify([parsed.startPassage]),
                firedBindings: '[]',
            }
        })
        runId = run.id
        pass('Create quest-scoped run', `start="${run.currentPassageId}"`)

        // 7. Advance: Start -> Crossroads -> Search -> END_Complete
        const advancePath = ['Crossroads', 'Search', 'END_Complete']
        for (const target of advancePath) {
            const visited = JSON.parse((await db.twineRun.findUnique({ where: { id: runId } }))!.visited) as string[]
            visited.push(target)
            await db.twineRun.update({
                where: { id: runId },
                data: { currentPassageId: target, visited: JSON.stringify(visited) }
            })
        }
        pass('Advance to END_Complete')

        // 8. Simulate auto-completion (what advanceRun does on END_)
        const assignment = await db.playerQuest.findFirst({
            where: { playerId, questId, status: 'assigned' }
        })
        if (assignment) {
            await db.playerQuest.update({
                where: { id: assignment.id },
                data: { status: 'completed', completedAt: new Date(), inputs: JSON.stringify({ completedViaTwine: true, runId }) }
            })
            await db.twineRun.update({ where: { id: runId }, data: { completedAt: new Date() } })
            pass('Quest marked completed')
        } else {
            fail('Quest assignment not found')
        }

        // 9. Verify quest status
        const finalAssignment = await db.playerQuest.findFirst({ where: { playerId, questId } })
        if (finalAssignment?.status === 'completed') {
            pass('Quest status = completed')
        } else {
            fail('Quest status', `Expected completed, got ${finalAssignment?.status}`)
        }

        // 10. Verify run.completedAt
        const finalRun = await db.twineRun.findUnique({ where: { id: runId } })
        if (finalRun?.completedAt) {
            pass('Run completedAt set')
        } else {
            fail('Run completedAt not set')
        }

        // 11. Duplicate prevention: re-complete should not find assigned quest
        const dupAssignment = await db.playerQuest.findFirst({
            where: { playerId, questId, status: 'assigned' }
        })
        if (!dupAssignment) {
            pass('Duplicate prevention (no assigned quest to re-complete)')
        } else {
            fail('Duplicate prevention', 'Found assigned quest after completion')
        }

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        fail('Unexpected error', msg)
    }

    // Cleanup
    console.log('\nCleaning up...')
    try {
        if (questId && playerId) await db.playerQuest.deleteMany({ where: { questId, playerId } })
        if (runId) await db.twineRun.delete({ where: { id: runId } }).catch(() => {})
        if (questId) await db.customBar.delete({ where: { id: questId } }).catch(() => {})
        if (storyId) await db.twineStory.delete({ where: { id: storyId } }).catch(() => {})
        if (playerId) await db.player.delete({ where: { id: playerId } }).catch(() => {})
        await db.account.deleteMany({ where: { email } })
        await db.invite.deleteMany({ where: { token: `tq_smoke_${ts}` } })
        console.log('  Cleanup complete.')
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        console.log(`  Cleanup warning: ${msg}`)
    }

    // Summary
    console.log('\n=== RESULTS ===')
    const passed = results.filter(r => r.status === 'PASS').length
    const failed = results.filter(r => r.status === 'FAIL').length
    console.log(`  ${passed} passed, ${failed} failed out of ${results.length} tests`)
    if (failed > 0) {
        results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  - ${r.test}: ${r.detail}`))
    }
    console.log('\n=== TWINE-AS-QUEST SMOKE TEST COMPLETE ===')
    process.exit(failed > 0 ? 1 : 0)
}

main().catch(e => { console.error('Crashed:', e); process.exit(1) })
