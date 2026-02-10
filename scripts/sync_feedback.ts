import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const LOG_PATH = '/Users/test/.gemini/antigravity/brain/3501faa0-1a49-41a7-ab02-2bc53c0ef272/dev_issue_log.md'

async function syncFeedback() {
    console.log('🔄 Syncing feedback from database to dev_issue_log.md...')

    try {
        // Fetch all completed feedback quests
        const completions = await prisma.playerQuest.findMany({
            where: {
                questId: 'system-feedback',
                status: 'completed'
            },
            include: {
                player: true
            },
            orderBy: {
                completedAt: 'desc'
            }
        })

        if (completions.length === 0) {
            console.log('✅ No feedback found in database.')
            return
        }

        // Read the current log
        let content = fs.readFileSync(LOG_PATH, 'utf8')

        // Prepare new feedback entries
        let feedbackEntries = ''
        for (const completion of completions) {
            const inputs = completion.inputs ? JSON.parse(completion.inputs) : {}
            const date = completion.completedAt?.toLocaleString() || completion.assignedAt.toLocaleString()

            // Deduplicate: Check if this completion (by player and date) is already in the log
            const uniqueId = `<!-- ID: ${completion.id} -->`
            if (content.includes(uniqueId)) continue

            feedbackEntries += `### 📡 Signal from ${completion.player.name} (${date})\n`
            feedbackEntries += `- **Resonance**: ${inputs.sentiment || 'N/A'}\n`
            feedbackEntries += `- **Clarity**: ${inputs.clarity || 'N/A'}\n`
            feedbackEntries += `- **Transmission**: ${inputs.feedback || 'No text provided'}\n`
            feedbackEntries += `${uniqueId}\n\n`
        }

        if (!feedbackEntries) {
            console.log('✅ All feedback already synced.')
            return
        }

        // Insert into the placeholder
        const marker = '<!-- FEEDBACK_START -->'
        const insertPos = content.indexOf(marker) + marker.length

        const newContent = content.slice(0, insertPos) + '\n\n' + feedbackEntries + content.slice(insertPos)

        fs.writeFileSync(LOG_PATH, newContent)
        console.log(`🚀 Successfully synced ${completions.length} feedback entries to dev_issue_log.md`)

    } catch (error) {
        console.error('❌ Error syncing feedback:', error)
    } finally {
        await prisma.$disconnect()
    }
}

syncFeedback()
