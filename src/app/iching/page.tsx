import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CastingRitual } from '@/components/CastingRitual'
import Link from 'next/link'
import { db } from '@/lib/db'
import type { IChingCastContext } from '@/lib/iching-cast-context'

/**
 * @page /iching
 * @entity SYSTEM
 * @description I Ching (Book of Changes) casting ritual - ancient divination with optional campaign context
 * @permissions authenticated
 * @searchParams instanceId:string (optional) - Campaign instance for context
 * @searchParams campaignRef:string (optional) - Campaign reference key
 * @searchParams threadId:string (optional) - Story thread identifier
 * @relationships performs hexagram casting with optional CAMPAIGN context, records cast history
 * @energyCost 0 (divination tool, no game state change)
 * @dimensions WHO:playerId, WHAT:SYSTEM, WHERE:divination, ENERGY:wisdom, PERSONAL_THROUGHPUT:wake_up
 * @example /iching?instanceId=inst_001&campaignRef=bruised-banana
 * @agentDiscoverable false
 */
export default async function IChingPage(props: {
    searchParams: Promise<{ instanceId?: string; campaignRef?: string; threadId?: string }>
}) {
    const player = await getCurrentPlayer()

    if (!player) {
        redirect('/')
    }

    const sp = await props.searchParams
    const instanceId = sp.instanceId?.trim() || null
    const campaignRef = sp.campaignRef?.trim() || null
    const threadId = sp.threadId?.trim() || null

    let instanceName: string | null = null
    if (instanceId) {
        const inst = await db.instance.findUnique({
            where: { id: instanceId },
            select: { name: true },
        })
        instanceName = inst?.name ?? null
    }

    const castingContext: IChingCastContext | null =
        instanceId || campaignRef || threadId
            ? { instanceId, campaignRef, threadId, instanceName }
            : null

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="max-w-2xl mx-auto px-6 py-12">
                {/* Header */}
                <header className="text-center mb-12">
                    <Link href="/" className="text-zinc-600 hover:text-zinc-400 text-sm mb-4 inline-block">
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">
                        The I Ching
                    </h1>
                    <p className="text-zinc-500 mt-2">Book of Changes</p>
                </header>

                {/* Casting Ritual */}
                <CastingRitual castingContext={castingContext} />

                {/* Info Footer */}
                <footer className="mt-16 text-center text-xs text-zinc-700 space-y-2">
                    <p>The I Ching is an ancient Chinese divination text dating back 3000 years.</p>
                    <p>Each hexagram represents a state of being and offers wisdom for your journey.</p>
                </footer>
            </div>
        </div>
    )
}
