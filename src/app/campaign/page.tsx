import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CampaignReader } from './components/CampaignReader'
import { db } from '@/lib/db'
import { getActiveInstance } from '@/actions/instance'
import { getCurrentPlayer } from '@/lib/auth'
import { parseCampaignRef } from '@/lib/campaign-subcampaigns'
import fs from 'fs'
import path from 'path'

const FALLBACK_START = 'Center_Witness'
const DEFAULT_CAMPAIGN_REF = 'bruised-banana'

export default async function CampaignPage(props: {
    searchParams: Promise<{ ref?: string; ritual?: string; segment?: string }>
}) {
    const { ref: urlRef, ritual, segment } = await props.searchParams
    const player = await getCurrentPlayer()
    const isAdmin = !!player?.roles?.some((r: { role: { key: string } }) => r.role.key === 'admin')
    // P2: When no ref in URL, use instance.campaignRef (default bruised-banana)
    let rawRef = urlRef
    if (!rawRef) {
        const instance = await getActiveInstance()
        rawRef = instance?.campaignRef ?? DEFAULT_CAMPAIGN_REF
    }
    const { campaignRef, subcampaignDomain } = parseCampaignRef(rawRef)

    // Bruised Banana: prefer grammatical initiation when a published Adventure exists (top-level only)
    if (campaignRef === 'bruised-banana' && !subcampaignDomain) {
        const seg = segment && ['player', 'sponsor'].includes(segment) ? segment : 'player'
        const initAdventure = await db.adventure.findUnique({
            where: { slug: `bruised-banana-initiation-${seg}`, status: 'ACTIVE' },
            select: { id: true },
        })
        if (initAdventure) {
            redirect(`/campaign/initiation?segment=${seg}`)
        }
        if (ritual === 'initiation') {
            redirect(`/campaign/initiation?segment=${seg}`)
        }
        redirect('/campaign/twine?ref=bruised-banana')
    }

    // Resolve Adventure by campaignRef (+ subcampaignDomain for subcampaigns)
    let startNodeId = FALLBACK_START
    let adventureSlug: string | undefined
    try {
        const adventure = await db.adventure.findFirst({
            where: {
                status: 'ACTIVE',
                campaignRef,
                ...(subcampaignDomain
                    ? { subcampaignDomain }
                    : { subcampaignDomain: null }),
            },
        })
        if (!adventure) {
            // Fallback: match by slug (e.g. wake-up) or compound ref
            const fallback = await db.adventure.findFirst({
                where: {
                    status: 'ACTIVE',
                    OR: [
                        { slug: rawRef },
                        { slug: campaignRef },
                    ],
                },
            })
            if (fallback) {
                startNodeId = fallback.startNodeId ?? FALLBACK_START
                adventureSlug = fallback.slug
            }
        } else {
            startNodeId = adventure.startNodeId ?? FALLBACK_START
            adventureSlug = adventure.slug
        }
    } catch {
        // DB unreachable; fall through to file
    }

    // Fallback to wake-up when no Adventure found by campaignRef
    if (!adventureSlug) {
        try {
            const wakeUp = await db.adventure.findFirst({
                where: { slug: 'wake-up', status: 'ACTIVE' },
            })
            if (wakeUp) {
                startNodeId = wakeUp.startNodeId ?? FALLBACK_START
                adventureSlug = 'wake-up'
            }
        } catch {
            /* ignore */
        }
    }

    // Fallback to file-based map when DB has no active Adventure
    if (!adventureSlug) {
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
                    campaignRef={rawRef}
                    adventureSlug={adventureSlug}
                    isAdmin={isAdmin}
                />
            </div>
        </div>
    )
}
