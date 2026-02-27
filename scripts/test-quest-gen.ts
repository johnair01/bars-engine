
import './require-db-env'
import { generateQuestCore } from '../src/actions/generate-quest'
import { db } from '../src/lib/db'

async function main() {
    console.log('🧪 Testing AI Quest Generation...')
    const apiKey = process.env.OPENAI_API_KEY
    console.log('🔑 OpenAI Key status:', apiKey ? '✅ Set ' + apiKey.slice(0, 4) + '...' : '❌ Missing')

    // Find a real player
    const player = await db.player.findFirst({
        where: { playbook: { isNot: null } }
    })

    if (!player) {
        console.error('❌ No players with playbooks found. Cannot test.')
        return
    }

    console.log(`👤 Using player: ${player.name} (${player.id})`)

    const hexagramId = 1
    console.log(`🔮 Generating quest for Hexagram ${hexagramId}...`)

    const result = await generateQuestCore(player.id, hexagramId)

    if (result.error) {
        console.error('❌ Generation Failed:', result.error)
    } else {
        console.log('✅ Generation Success!')
        console.log(JSON.stringify(result.quest, null, 2))
    }
}

main()
