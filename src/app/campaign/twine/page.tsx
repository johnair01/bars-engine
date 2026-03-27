import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { getCurrentPlayer } from '@/lib/auth'
import { BruisedBananaTwinePlayer } from '@/components/campaign/BruisedBananaTwinePlayer'

/**
 * @page /campaign/twine
 * @entity CAMPAIGN
 * @description Legacy Twine-based campaign onboarding player (loads from twee file)
 * @permissions authenticated
 * @relationships CAMPAIGN (Bruised Banana onboarding story)
 * @dimensions WHO:player, WHAT:twine onboarding, WHERE:campaign, ENERGY:twee_passage
 * @example /campaign/twine
 * @agentDiscoverable false
 */

const TWEE_PATH = path.join(process.cwd(), 'content', 'twine', 'onboarding', 'bruised-banana-onboarding-draft.twee')

export default async function CampaignTwinePage() {
    const player = await getCurrentPlayer()
    let tweeSource = ''
    try {
        tweeSource = fs.readFileSync(TWEE_PATH, 'utf-8')
    } catch (e) {
        console.error('[campaign/twine] Failed to load twee:', e)
    }

    if (!tweeSource) {
        return (
            <div className="min-h-screen bg-black text-white p-8 flex flex-col items-center justify-center">
                <p className="text-red-400">Failed to load initiation story.</p>
                <Link href="/campaign?ref=bruised-banana" className="mt-4 text-purple-400 hover:text-purple-300">
                    ← Back to campaign
                </Link>
            </div>
        )
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
                <BruisedBananaTwinePlayer tweeSource={tweeSource} hasPlayer={!!player} />
            </div>
        </div>
    )
}
