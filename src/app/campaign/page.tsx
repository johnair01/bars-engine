import Link from 'next/link'
import { CampaignReader } from './components/CampaignReader'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

const FALLBACK_START = 'Center_Witness'

export default async function CampaignPage() {
    let startNodeId = FALLBACK_START
    let hasActiveAdventure = false

    // Prefer DB when Adventure wake-up exists and is ACTIVE
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
                <CampaignReader initialNode={{ id: startNodeId, text: '', choices: [] }} />
            </div>
        </div>
    )
}
