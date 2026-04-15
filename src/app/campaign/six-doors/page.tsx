import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { getCurrentPlayer } from '@/lib/auth'
import { BruisedBananaTwinePlayer } from '@/components/campaign/BruisedBananaTwinePlayer'
import { CampaignOutlineNavButton } from '@/components/campaign/CampaignOutlineNavButton'

const TWEE_PATH = path.join(process.cwd(), 'content', 'twine', 'offers', 'six-doors-cta.twee')

export default async function CampaignSixDoorsPage() {
    const player = await getCurrentPlayer()
    let tweeSource = ''

    try {
        tweeSource = fs.readFileSync(TWEE_PATH, 'utf-8')
    } catch (e) {
        console.error('[campaign/six-doors] Failed to load twee:', e)
    }

    if (!tweeSource) {
        return (
            <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
                <p className="text-red-400">Failed to load Six Doors CTA story.</p>
                <Link href="/campaign" className="mt-4 text-purple-400 hover:text-purple-300">
                    ← Back to campaign
                </Link>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex flex-col items-center font-sans tracking-tight">
            <nav aria-label="Campaign shortcuts" className="w-full max-w-2xl flex flex-wrap justify-end gap-2 mb-4">
                <CampaignOutlineNavButton href="/campaign">Campaign</CampaignOutlineNavButton>
                <CampaignOutlineNavButton href="/campaign/twine?ref=bruised-banana">Legacy Twine</CampaignOutlineNavButton>
            </nav>
            <div className="flex-1 w-full max-w-2xl flex items-center justify-center">
                <BruisedBananaTwinePlayer tweeSource={tweeSource} hasPlayer={!!player} />
            </div>
        </div>
    )
}
