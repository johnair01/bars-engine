#!/usr/bin/env npx tsx
import { db } from '@/lib/db'
import { composeQuestCacheKey } from '@/lib/quest-forensics'
import { runStoryQuestForensicsHarness } from '@/actions/story-clock'

function assert(condition: unknown, message: string) {
    if (!condition) throw new Error(message)
}

function parseArgs(argv: string[]) {
    const strict = argv.includes('--strict')
    const questIdFlag = argv.findIndex((token) => token === '--questId')
    const questId = questIdFlag >= 0 ? argv[questIdFlag + 1] : undefined
    return { strict, questId }
}

async function resolveQuestId(inputQuestId?: string) {
    if (inputQuestId) return inputQuestId
    const quest = await db.customBar.findFirst({
        where: {
            status: 'active',
            completionEffects: { contains: '"questSource":"story_clock"' }
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true }
    })
    if (!quest) throw new Error('No active story_clock quest found. Provide --questId.')
    return quest.id
}

async function main() {
    const { strict, questId: maybeQuestId } = parseArgs(process.argv.slice(2))
    const keyA = composeQuestCacheKey({
        version: 'story-quest-cache-v1',
        questId: maybeQuestId || 'quest-x',
        seed: '1',
        inputsFingerprint: 'abc'
    })
    const keyB = composeQuestCacheKey({
        version: 'story-quest-cache-v1',
        questId: maybeQuestId || 'quest-x',
        seed: '2',
        inputsFingerprint: 'abc'
    })
    const keyC = composeQuestCacheKey({
        version: 'story-quest-cache-v1',
        questId: maybeQuestId || 'quest-x',
        seed: '1',
        inputsFingerprint: 'xyz'
    })
    assert(keyA !== keyB, 'Cache key should change when seed changes.')
    assert(keyA !== keyC, 'Cache key should change when inputs fingerprint changes.')
    assert(keyA.includes(`quest=${maybeQuestId || 'quest-x'}`), 'Cache key should include questId.')

    if (!process.env.DATABASE_URL) {
        console.log('DATABASE_URL missing; skipped live forensics harness checks. Cache-key tests passed.')
        return
    }

    const questId = await resolveQuestId(maybeQuestId)

    const sensitivity = await runStoryQuestForensicsHarness({
        questId,
        mode: 'B',
        n: 6,
        debug: true,
    })
    if ('error' in sensitivity) throw new Error(sensitivity.error)
    const variability = await runStoryQuestForensicsHarness({
        questId,
        mode: 'A',
        n: 6,
        debug: true,
    })
    if ('error' in variability) throw new Error(variability.error)
    const cacheCheck = await runStoryQuestForensicsHarness({
        questId,
        mode: 'C',
        n: 4,
        debug: true,
    })
    if ('error' in cacheCheck) throw new Error(cacheCheck.error)

    const minPromptDistinct = 40
    const minOutputDistinct = 25
    const minStyleAfterRepair = 90

    const promptDistinct = sensitivity.summary.distinct_prompt_fingerprint_pct
    const outputDistinct = variability.summary.distinct_output_fingerprint_pct
    const styleAfterRepair = variability.summary.style_pass_rate_after_repair_pct

    const findings = [
        `Sensitivity prompt distinct %: ${promptDistinct}`,
        `Variability output distinct %: ${outputDistinct}`,
        `Style pass after repair %: ${styleAfterRepair}`,
        `Cache hit rate % (mode C): ${cacheCheck.summary.cache_hit_rate_pct}`,
    ]

    console.log('Quest Forensics acceptance checks')
    findings.forEach((line) => console.log(`- ${line}`))

    if (strict) {
        assert(promptDistinct >= minPromptDistinct, `Prompt distinct % must be >= ${minPromptDistinct}`)
        assert(outputDistinct >= minOutputDistinct, `Output distinct % must be >= ${minOutputDistinct}`)
        assert(styleAfterRepair >= minStyleAfterRepair, `Style pass after repair % must be >= ${minStyleAfterRepair}`)
    }
}

main().catch((error) => {
    console.error('[test-quest-forensics] failed:', error instanceof Error ? error.message : error)
    process.exit(1)
})
