import { CampaignReader } from './components/CampaignReader'
import fs from 'fs'
import path from 'path'

export default async function CampaignPage() {
    const mapPath = path.join(process.cwd(), 'content', 'campaigns', 'wake_up', 'map.json')
    let startNodeId = 'Center_Witness' // fallback

    try {
        if (fs.existsSync(mapPath)) {
            const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'))
            if (mapData.startNodeId) startNodeId = mapData.startNodeId
        }
    } catch (e) {
        console.error("Failed to read campaign map:", e)
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex items-center justify-center font-sans tracking-tight">
            {/* We pass a dummy initial node, but CampaignReader will immediately fetch it based on id */}
            <CampaignReader initialNode={{ id: startNodeId, text: '', choices: [] }} />
        </div>
    )
}
