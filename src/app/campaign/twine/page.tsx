import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { getCurrentPlayer } from '@/lib/auth'
import { BruisedBananaTwinePlayer } from '@/components/campaign/BruisedBananaTwinePlayer'
import { CampaignDonateButton } from '@/components/campaign/CampaignDonateButton'
import { CampaignOutlineNavButton } from '@/components/campaign/CampaignOutlineNavButton'

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

const DEFAULT_REF = 'bruised-banana'

export default async function CampaignTwinePage(props: {
    searchParams: Promise<{ ref?: string }>
}) {
    const { ref: urlRef } = await props.searchParams
    const campaignRef = urlRef?.trim() || DEFAULT_REF
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
            <nav
                aria-label="Campaign shortcuts"
                className="w-full max-w-2xl flex flex-wrap justify-end gap-2 mb-4"
            >
                <CampaignOutlineNavButton href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`}>
                    Portals
                </CampaignOutlineNavButton>
                <CampaignOutlineNavButton href={`/campaign/board?ref=${encodeURIComponent(campaignRef)}`}>
                    Featured field
                </CampaignOutlineNavButton>
                <CampaignDonateButton campaignRef={campaignRef} />
                <CampaignOutlineNavButton href="/event">Event page</CampaignOutlineNavButton>
            </nav>
            <div className="flex-1 w-full max-w-2xl flex items-center justify-center">
                <BruisedBananaTwinePlayer tweeSource={tweeSource} hasPlayer={!!player} />
            </div>
        </div>
    )
}
