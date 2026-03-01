import Link from 'next/link'
import { CampaignReader } from './components/CampaignReader'
import { db } from '@/lib/db'
import { getActiveInstance } from '@/actions/instance'
import fs from 'fs'
import path from 'path'

const FALLBACK_START = 'Center_Witness'
const DEFAULT_CAMPAIGN_REF = 'bruised-banana'

export default async function CampaignPage(props: { searchParams: Promise<{ ref?: string }> }) {
    const { ref: urlRef } = await props.searchParams
    // P2: When no ref in URL, use instance.campaignRef (default bruised-banana)
    let campaignRef = urlRef
    if (!campaignRef) {
        const instance = await getActiveInstance()
        campaignRef = instance?.campaignRef ?? DEFAULT_CAMPAIGN_REF
    }

    let startNodeId = FALLBACK_START
    let hasActiveAdventure = false

    // Bruised Banana flow: use BB_Intro when ref=bruised-banana
    if (campaignRef === 'bruised-banana') {
        startNodeId = 'BB_Intro'
    }

    // Prefer DB when Adventure wake-up exists and is ACTIVE (unless BB flow)
    if (startNodeId === FALLBACK_START) {
        try {
            const adventure = await db.adventure.findFirst({
                where: { slug: 'wake-up', status: 'ACTIVE' }
            })
            if (adventure) {
                hasActiveAdventure = true
                startNodeId = adventure.startNodeId ?? FALLBACK_START
            }
        } catch {
            // DB unreachable; fall through to file
        }
    } else {
        hasActiveAdventure = true // BB_Intro is served by API
    }

    // Fallback to file-based map when DB has no active Adventure
    if (!hasActiveAdventure) {
        const mapPath = path.join(process.cwd(), 'content', 'campaigns', 'wake_up', 'map.json')
        try {
            if (fs.existsSync(mapPath)) {
                const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'))
                if (mapData.startNodeId) startNodeId = mapData.startNodeId
            }
        } catch (e) {
            console.error("Failed to read campaign map:", e)
        }
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex flex-col items-center font-sans tracking-tight">
            <div className="w-full max-w-2xl flex justify-end mb-4">
                <Link
                    href="/event"
                    className="text-sm text-zinc-500 hover:text-green-400 transition-colors"
                >
                    Support the Residency →
                </Link>
            </div>
            <div className="flex-1 w-full max-w-2xl flex items-center justify-center">
                {/* We pass a dummy initial node, but CampaignReader will immediately fetch it based on id */}
                <CampaignReader
                    initialNode={{ id: startNodeId, text: '', choices: [] }}
                    campaignRef={campaignRef}
                    adventureSlug={campaignRef === 'bruised-banana' ? 'bruised-banana' : undefined}
                />
            </div>
        </div>
    )
}
