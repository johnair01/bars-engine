
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { StoryReader } from './components/StoryReader'
import { getStoryNode, resetOnboarding } from '@/actions/guided-onboarding'
import { StoryProgress } from './types'
import { GuidedAuthForm } from './components/GuidedAuthForm'

export default async function GuidedModePage({ searchParams }: { searchParams: Promise<{ step?: string, reset?: string }> }) {
    const { step, reset } = await searchParams

    if (reset === 'true') {
        const cookieStore = await cookies()
        const playerId = cookieStore.get('bars_player_id')?.value
        if (playerId) {
            await resetOnboarding(playerId)
        }
        redirect('/conclave/guided')
    }

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex items-center justify-center">
            <GuidedStoryLoader requestedStep={step} />
        </div>
    )
}

import { getCurrentPlayerSafe } from '@/lib/auth-safe'

async function GuidedStoryLoader({ requestedStep }: { requestedStep?: string }) {
    const { playerId, player, dbError, errorMessage } = await getCurrentPlayerSafe()

    if (dbError) {
        return (
            <div className="text-center p-8 bg-zinc-900 rounded-xl border border-red-900/50 max-w-md mx-auto">
                <h2 className="text-red-500 font-bold mb-4 text-xl tracking-tight uppercase">Database Unreachable</h2>
                <div className="text-zinc-400 text-sm leading-relaxed mb-6">
                    {errorMessage || "The database is currently unreachable. Guided Conclave require a functional database connection to load your story progress."}
                </div>
                <div className="space-y-4">
                    <div className="bg-black/50 p-3 rounded text-[10px] font-mono text-zinc-500 break-all border border-zinc-800">
                        Check your DATABASE_URL environment variable.
                    </div>
                </div>
            </div>
        )
    }

    if (!playerId) {
        return <GuidedAuthForm />
    }

    if (!player) redirect('/login')

    // Parse progress safe
    let progress: StoryProgress
    try {
        progress = player.storyProgress
            ? JSON.parse(player.storyProgress as string)
            : {
                currentNodeId: 'intro_001',
                completedNodes: [],
                decisions: [],
                vibeulonsEarned: 0,
                startedAt: new Date(),
                lastActiveAt: new Date()
            }
    } catch (e) {
        // Fallback
        progress = {
            currentNodeId: 'intro_001',
            completedNodes: [],
            decisions: [],
            vibeulonsEarned: 0,
            startedAt: new Date(),
            lastActiveAt: new Date()
        }
    }

    const visited = new Set([...(progress.completedNodes || []), progress.currentNodeId])
    // Allow direct jumps to mandatory setup steps even if they were not "visited" yet.
    // This supports redirecting users from login directly to nation/archetype selection.
    const alwaysAllowedSteps = new Set(['nation_select', 'playbook_select'])
    let effectiveNodeId =
        requestedStep && (visited.has(requestedStep) || alwaysAllowedSteps.has(requestedStep))
            ? requestedStep
            : progress.currentNodeId

    if (!player.nationId && (effectiveNodeId.startsWith('playbook') || effectiveNodeId === 'conclusion' || effectiveNodeId === 'dashboard')) {
        effectiveNodeId = 'nation_select'
    }
    if (!player.playbookId && (effectiveNodeId === 'conclusion' || effectiveNodeId === 'dashboard')) {
        effectiveNodeId = 'playbook_select'
    }
    if (requestedStep && requestedStep !== effectiveNodeId) {
        redirect(`/conclave/guided?step=${encodeURIComponent(effectiveNodeId)}`)
    }

    const node = await getStoryNode(effectiveNodeId, playerId)

    // Handle end state or missing node (dashboard redirect)
    if (!node) {
        if (progress.currentNodeId === 'dashboard' || player.onboardingComplete) {
            redirect('/')
        }
        return <div>Story node not found: {effectiveNodeId}</div>
    }

    return (
        <div className="w-full max-w-4xl">
            <StoryReader
                initialNode={node}
                playerId={playerId}
                progress={progress}
            />
        </div>
    )
}
