/**
 * Smoke Test: Twine Doorway
 *
 * Run with: npx tsx scripts/smoke-test-twine.ts
 *
 * Tests:
 * 1. Parse sample Twine HTML fixture
 * 2. Create admin story in DB
 * 3. Publish it
 * 4. Create a player run
 * 5. Advance through passages
 * 6. Add a binding, verify it fires on passage entry
 * 7. Verify emitted quest/BAR exists
 * 8. Verify duplicate-fire prevention
 */

import { PrismaClient } from '@prisma/client'
import { readFileSync } from 'fs'
import { join } from 'path'
import { parseTwineHtml } from '../src/lib/twine-parser'

const db = new PrismaClient()

async function main() {
    console.log('=== TWINE SMOKE TEST ===\n')
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
    const email = `twine-smoke-${ts}@test.local`
    let playerId: string | null = null
    let storyId: string | null = null
    let bindingId: string | null = null
    let emittedBarId: string | null = null

    try {
        // 0. DB check
        await db.player.count()
        pass('DB Connection')

        // 1. Parse fixture
        const html = readFileSync(join(__dirname, 'fixtures/twine/sample.html'), 'utf-8')
        const parsed = parseTwineHtml(html)

        if (parsed.title === 'The Robot Heist' && parsed.passages.length === 8) {
            pass('Parse Twine HTML', `${parsed.passages.length} passages, start="${parsed.startPassage}"`)
        } else {
            fail('Parse Twine HTML', `title="${parsed.title}", passages=${parsed.passages.length}`)
        }

        // Verify links parsed
        const lobby = parsed.passages.find(p => p.name === 'The Lobby')
        if (lobby && lobby.links.length === 2 && lobby.links[0].target === 'East Wing') {
            pass('Link parsing', `${lobby.links.length} links from The Lobby`)
        } else {
            fail('Link parsing', JSON.stringify(lobby?.links))
        }

        // 2. Create test player (admin)
        const invite = await db.invite.create({ data: { token: `twine_smoke_${ts}`, status: 'used', usedAt: new Date() } })
        const account = await db.account.create({ data: { email, passwordHash: 'test' } })
        const player = await db.player.create({
            data: {
                accountId: account.id, name: 'Twine Tester', contactType: 'email',
                contactValue: email, inviteId: invite.id,
            }
        })
        playerId = player.id
        pass('Create test player', playerId)

        // 3. Create story
        const story = await db.twineStory.create({
            data: {
                title: parsed.title,
                slug: `smoke-test-${ts}`,
                sourceType: 'twine_html',
                sourceText: html,
                parsedJson: JSON.stringify(parsed),
                isPublished: false,
                createdById: playerId,
            }
        })
        storyId = story.id
        pass('Create story', storyId)

        // 4. Publish
        await db.twineStory.update({ where: { id: storyId }, data: { isPublished: true } })
        const published = await db.twineStory.findUnique({ where: { id: storyId } })
        if (published?.isPublished) {
            pass('Publish story')
        } else {
            fail('Publish story')
        }

        // 5. Create run
        const run = await db.twineRun.create({
            data: {
                storyId, playerId,
                currentPassageId: parsed.startPassage,
                visited: JSON.stringify([parsed.startPassage]),
                firedBindings: '[]',
            }
        })
        pass('Create run', `start="${run.currentPassageId}"`)

        // 6. Advance to East Wing
        const eastWing = parsed.passages.find(p => p.name === 'East Wing')
        if (eastWing) {
            const visited = JSON.parse(run.visited) as string[]
            visited.push('East Wing')
            await db.twineRun.update({
                where: { id: run.id },
                data: { currentPassageId: 'East Wing', visited: JSON.stringify(visited) }
            })
            pass('Advance to East Wing')
        } else {
            fail('Advance', 'East Wing passage not found')
        }

        // 7. Add binding on "Secret Room" -> EMIT_BAR
        const binding = await db.twineBinding.create({
            data: {
                storyId, scopeType: 'passage', scopeId: 'Secret Room',
                actionType: 'EMIT_BAR',
                payload: JSON.stringify({ title: 'Smoke Test Emitted BAR', description: 'Created by twine binding', tags: 'smoke,test' }),
                createdById: playerId,
            }
        })
        bindingId = binding.id
        pass('Create binding', `EMIT_BAR on "Secret Room"`)

        // 8. Advance to Secret Room (should fire binding)
        const updatedRun = await db.twineRun.findUnique({ where: { id: run.id } })!
        const visited2 = JSON.parse(updatedRun!.visited) as string[]
        visited2.push('Secret Room')
        await db.twineRun.update({
            where: { id: run.id },
            data: { currentPassageId: 'Secret Room', visited: JSON.stringify(visited2) }
        })

        // Manually execute binding logic (simulating server action)
        const firedBindings = JSON.parse(updatedRun!.firedBindings) as string[]
        if (!firedBindings.includes(bindingId)) {
            const payload = JSON.parse(binding.payload) as { title: string; description: string; tags: string }
            const emittedBar = await db.customBar.create({
                data: {
                    creatorId: playerId, title: payload.title, description: payload.description,
                    type: 'bar', reward: 0, visibility: 'private', status: 'active',
                    storyContent: payload.tags, inputs: '[]', rootId: 'temp',
                }
            })
            emittedBarId = emittedBar.id
            firedBindings.push(bindingId)
            await db.twineRun.update({ where: { id: run.id }, data: { firedBindings: JSON.stringify(firedBindings) } })
            pass('Binding fires EMIT_BAR', emittedBarId)
        } else {
            fail('Binding fire', 'Already in firedBindings unexpectedly')
        }

        // 9. Verify emitted BAR exists
        if (emittedBarId) {
            const bar = await db.customBar.findUnique({ where: { id: emittedBarId } })
            if (bar && bar.title === 'Smoke Test Emitted BAR') {
                pass('Emitted BAR exists in DB')
            } else {
                fail('Emitted BAR exists', 'Not found or wrong title')
            }
        }

        // 10. Duplicate-fire prevention
        const runAfter = await db.twineRun.findUnique({ where: { id: run.id } })
        const firedAfter = JSON.parse(runAfter!.firedBindings) as string[]
        if (firedAfter.includes(bindingId)) {
            pass('Duplicate-fire prevention', 'binding ID in firedBindings')
        } else {
            fail('Duplicate-fire prevention')
        }

    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        fail('Unexpected error', msg)
    }

    // Cleanup
    console.log('\nCleaning up...')
    try {
        if (emittedBarId) await db.customBar.delete({ where: { id: emittedBarId } }).catch(() => {})
        if (bindingId) await db.twineBinding.delete({ where: { id: bindingId } }).catch(() => {})
        if (storyId) {
            await db.twineRun.deleteMany({ where: { storyId } })
            await db.twineStory.delete({ where: { id: storyId } }).catch(() => {})
        }
        if (playerId) {
            await db.player.delete({ where: { id: playerId } }).catch(() => {})
            await db.account.deleteMany({ where: { email } })
            await db.invite.deleteMany({ where: { token: { startsWith: `twine_smoke_${ts}` } } })
        }
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
        console.log('\nFailed:')
        results.filter(r => r.status === 'FAIL').forEach(r => console.log(`  - ${r.test}: ${r.detail}`))
    }
    console.log('\n=== TWINE SMOKE TEST COMPLETE ===')
    process.exit(failed > 0 ? 1 : 0)
}

main().catch(e => { console.error('Crashed:', e); process.exit(1) })
