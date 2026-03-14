#!/usr/bin/env npx tsx
import { config } from 'dotenv'
config({ path: '.env.local' })
config({ path: '.env' })
import { execSync } from 'child_process'
import { PrismaClient } from '@prisma/client'

type CheckResult = {
    check: string
    status: 'PASS' | 'FAIL'
    note?: string
}

/** Remediation hints for common failures. See .specify/specs/dev-setup-anti-fragile/INCIDENTS.md */
function getRemediation(check: string, note?: string): string | null {
    const n = (note ?? '').toLowerCase()
    if (check === 'Core quest configuration intact') {
        if (n.includes('orientation-quest-1') || n.includes('system-feedback')) {
            return 'Fix: npm run db:seed. For full setup: npm run setup'
        }
    }
    if (check === 'Build passes') {
        return 'Fix: npx tsx scripts/with-env.ts "prisma migrate deploy" or npm run db:sync. See docs/DB_STRATEGY.md'
    }
    if (check === 'Feedback cap integration test' && (n.includes('column') || n.includes('does not exist') || n.includes('agentMetadata'))) {
        return 'Fix: Schema out of sync. Run: npx tsx scripts/with-env.ts "prisma migrate deploy"'
    }
    if (check === 'Reset history script runs' || check === 'Feedback cap history query') {
        if (n.includes('column') || n.includes('does not exist')) {
            return 'Fix: npx tsx scripts/with-env.ts "prisma migrate deploy"'
        }
    }
    return null
}

const prisma = new PrismaClient()
const quickMode = process.argv.includes('--quick')
const results: CheckResult[] = []

function addResult(check: string, status: 'PASS' | 'FAIL', note?: string) {
    results.push({ check, status, note })
}

function runCommand(check: string, command: string) {
    try {
        execSync(command, {
            stdio: 'inherit',
            cwd: process.cwd(),
            env: process.env,
        })
        addResult(check, 'PASS')
        return true
    } catch (error) {
        addResult(check, 'FAIL', (error as Error).message)
        return false
    }
}

function parseJsonArray(value: string | null): unknown[] {
    if (!value) return []
    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

async function verifyCoreQuestConfig() {
    const notes: string[] = []
    const [feedbackQuest, intentionQuest] = await Promise.all([
        prisma.customBar.findUnique({
            where: { id: 'system-feedback' },
            select: { id: true, title: true, inputs: true }
        }),
        prisma.customBar.findUnique({
            where: { id: 'orientation-quest-1' },
            select: { id: true, title: true, inputs: true, twineLogic: true }
        })
    ])

    if (!feedbackQuest) {
        throw new Error('Missing quest: system-feedback')
    }
    if (!intentionQuest) {
        throw new Error('Missing quest: orientation-quest-1')
    }

    const feedbackInputs = parseJsonArray(feedbackQuest.inputs)
    const sentimentInput = feedbackInputs.find((input) => input?.key === 'sentiment')
    const clarityInput = feedbackInputs.find((input) => input?.key === 'clarity')

    if (!sentimentInput?.label || !clarityInput?.label) {
        throw new Error('Feedback quest select labels are missing.')
    }
    if (sentimentInput.type !== 'select' || clarityInput.type !== 'select') {
        throw new Error('Feedback quest sentiment/clarity inputs are not select fields.')
    }

    const intentionInputs = parseJsonArray(intentionQuest.inputs)
    const intentionInput = intentionInputs.find((input) => input?.key === 'intention')
    if (!intentionInput) {
        // Runtime fallback in QuestDetailModal provides direct intention input if DB lacks it.
        notes.push('Intention input missing in DB, covered by runtime fallback')
    }

    if (!intentionQuest.twineLogic) {
        // Runtime fallback in QuestDetailModal provides guided Twine logic if DB lacks it.
        notes.push('Guided twine missing in DB, covered by runtime fallback')
    } else {
        const twine = JSON.parse(intentionQuest.twineLogic) as { passages?: unknown[]; startPassageId?: string }
        if (!twine.startPassageId || !Array.isArray(twine.passages) || twine.passages.length === 0) {
            throw new Error('Intention quest twine logic is malformed.')
        }
    }

    return notes.length > 0 ? notes.join('; ') : 'feedback labels + intention direct/guided paths present'
}

async function main() {
    console.log('🚦 Basic Game Loop Readiness Runner\n')

    if (!process.env.DATABASE_URL) {
        console.error('❌ DATABASE_URL is required for loop readiness checks.')
        process.exit(1)
    }

    if (!quickMode) {
        runCommand('Build passes', 'npm run build')
    } else {
        addResult('Build passes', 'PASS', 'Skipped in --quick mode')
    }

    runCommand('Reset history script runs', 'npm run db:reset-history')

    try {
        const note = await verifyCoreQuestConfig()
        addResult('Core quest configuration intact', 'PASS', note)
    } catch (error) {
        addResult('Core quest configuration intact', 'FAIL', (error as Error).message)
    }

    runCommand('Feedback cap integration test', 'npm run test:feedback-cap')
    runCommand('Feedback cap history query', 'npm run db:feedback-cap-history')

    console.log('\n📋 Loop Readiness Summary')
    console.table(results)

    const failed = results.filter((result) => result.status === 'FAIL')
    if (failed.length > 0) {
        console.log(`\n❌ NO-GO: ${failed.length} check(s) failed.`)
        for (const r of failed) {
            const rem = getRemediation(r.check, r.note)
            if (rem) {
                console.log(`\n  ${r.check}:`)
                console.log(`  ${rem}`)
            }
        }
        console.log('\nSee .specify/specs/dev-setup-anti-fragile/INCIDENTS.md for more.')
        process.exit(1)
    }

    console.log('\n✅ GO: Basic game loop readiness checks passed.')
}

main()
    .catch((error) => {
        console.error('\n❌ Loop readiness run failed:', error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
