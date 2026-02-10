import { db } from '../src/lib/db'
import { ensureOrientationQuest3IChingTrigger } from '../src/lib/iching-hardening'

async function main() {
    const result = await ensureOrientationQuest3IChingTrigger(db)

    if (!result.questFound) {
        console.error('❌ Quest not found: orientation-quest-3')
        process.exit(1)
    }

    if (!result.updated) {
        console.log('✅ orientation-quest-3 already has ICHING_CAST trigger.')
        return
    }

    console.log('✅ Added ICHING_CAST trigger to orientation-quest-3.')
}

main()
    .catch((error) => {
        console.error('❌ Failed to patch orientation quest trigger:', error)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
    })
