import './require-db-env'
import { promises as fs } from 'fs'
import path from 'path'
import { db } from '../src/lib/db'

async function sync() {
    console.log('--- Syncing Verification Completions to Backlog ---')

    const entries = await db.verificationCompletionLog.findMany({
        where: { syncedAt: null },
        include: { player: { select: { name: true } } },
        orderBy: { completedAt: 'asc' },
    })

    if (entries.length === 0) {
        console.log('No unsynced verification completions.')
        return
    }

    const byPath = new Map<string, typeof entries>()
    for (const e of entries) {
        const list = byPath.get(e.backlogPromptPath) ?? []
        list.push(e)
        byPath.set(e.backlogPromptPath, list)
    }

    const cwd = process.cwd()
    const now = new Date()

    for (const [backlogPromptPath, list] of byPath) {
        const fullPath = path.join(cwd, backlogPromptPath)
        try {
            let content = await fs.readFile(fullPath, 'utf-8')
            const verificationLines = list.map(
                (e) => `- Verified by ${e.player.name} on ${e.completedAt.toISOString().split('T')[0]}`
            )
            const newSection = `\n## Verification\n\n${verificationLines.join('\n')}\n`

            if (content.includes('## Verification')) {
                const match = content.match(/\n## Verification\n\n([\s\S]*?)(?=\n## |\n*$)/s)
                if (match) {
                    const existing = match[1].trimEnd()
                    const appended = existing ? `${existing}\n${verificationLines.join('\n')}` : verificationLines.join('\n')
                    content = content.replace(
                        /\n## Verification\n\n[\s\S]*?(?=\n## |\n*$)/s,
                        `\n## Verification\n\n${appended}\n`
                    )
                } else {
                    content = content.trimEnd() + newSection
                }
            } else {
                content = content.trimEnd() + newSection
            }

            await fs.writeFile(fullPath, content)
            console.log(`✅ Updated ${backlogPromptPath} (${list.length} verification(s))`)
        } catch (e) {
            console.error(`❌ Failed to update ${backlogPromptPath}:`, e)
            continue
        }

        await db.verificationCompletionLog.updateMany({
            where: { id: { in: list.map((e) => e.id) } },
            data: { syncedAt: now },
        })
    }

    console.log('--- Sync complete ---')
}

sync().catch((e) => {
    console.error(e)
    process.exit(1)
})
