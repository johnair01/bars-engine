#!/usr/bin/env npx tsx
import { db } from '@/lib/db'
import { runStoryQuestForensicsHarness } from '@/actions/story-clock'

type CliArgs = {
    questId?: string
    mode: 'A' | 'B' | 'C'
    n: number
}

function parseArgs(argv: string[]): CliArgs {
    let questId: string | undefined
    let mode: 'A' | 'B' | 'C' = 'A'
    let n = 6

    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i]
        if (token === '--questId' && argv[i + 1]) {
            questId = argv[i + 1]
            i += 1
        } else if (token === '--mode' && argv[i + 1]) {
            const value = argv[i + 1].toUpperCase()
            if (value === 'A' || value === 'B' || value === 'C') {
                mode = value
            }
            i += 1
        } else if (token === '--n' && argv[i + 1]) {
            const parsed = Number(argv[i + 1])
            if (Number.isFinite(parsed) && parsed > 0) {
                n = Math.min(20, Math.max(1, Math.floor(parsed)))
            }
            i += 1
        }
    }

    return { questId, mode, n }
}

async function resolveQuestId(inputQuestId?: string) {
    if (!process.env.DATABASE_URL) {
        throw new Error('DATABASE_URL is required to run forensics harness.')
    }
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
    const args = parseArgs(process.argv.slice(2))
    const questId = await resolveQuestId(args.questId)
    const result = await runStoryQuestForensicsHarness({
        questId,
        mode: args.mode,
        n: args.n,
        debug: true,
    })

    if ('error' in result) {
        throw new Error(result.error)
    }

    console.log('\nQuest Forensics Harness')
    console.log(`mode=${result.mode} questId=${questId}`)
    console.log(stable(result.summary))
    console.log('\nDiagnosis')
    result.diagnosis.forEach((line, index) => {
        console.log(`${index + 1}. ${line}`)
    })

    console.log('\nSample (first 5)')
    result.samples.slice(0, 5).forEach((sample) => {
        console.log(stable(sample))
    })
}

function stable(value: unknown) {
    return JSON.stringify(value, null, 2)
}

main().catch((error) => {
    console.error('[quest-forensics] failed:', error instanceof Error ? error.message : error)
    process.exit(1)
})
