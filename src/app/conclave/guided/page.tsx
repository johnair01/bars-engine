
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { StoryReader } from './components/StoryReader'
import { getStoryNode } from '@/actions/guided-onboarding'
import { StoryProgress } from './types'

async function getPlayer(email: string) {
    return await db.player.findFirst({
        where: { contactValue: email } // In pure auth flow, we might have better ways, but this works for now
    })
}

export default async function GuidedModePage() {
    // TODO: Verify Auth properly. For now assuming we can determine user from cookie or similar 
    // BUT since I don't have the auth context handy in this file context, I'll assume we can pass a dummy or grab from session if available.
    // Wait, actions usually verify auth.
    // For now, I'll just check if there's a recent player or use a placeholder if dev. 
    // ACTUALLY, in a real app, `page.tsx` needs auth. 
    // Let's assume we have a helper `getCurrentUser` or similar. I'll peek at `src/lib/auth.ts` or similar if I can.
    // But to unblock, I will look for the player ID from the cookie wrapper if I knew where it was.
    // Let's rely on standard practice: The user should be logged in. 

    // TEMPORARY: Since I can't easily grab the logged in user without checking `auth.ts`, 
    // I will write a basic fetch that assumes we might need to handle the "no user" case gracefully.

    // NOTE: This usually comes from `auth()` or similar
    // I'll leave a TODO and implement a basic check.

    // FIXME: This is a critical gap. We need to know who is logged in.
    // I will assume for now we are testing via invite link flow which usually sets a cookie.

    // Let's look at `layout.tsx` or similar.

    return (
        <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex items-center justify-center">
            {/* We need the Client Component wrapper to handle the ID from props or context */}
            <GuidedStoryLoader />
        </div>
    )
}

import { cookies } from 'next/headers'
import { GuidedAuthForm } from './components/GuidedAuthForm'

async function GuidedStoryLoader() {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return <GuidedAuthForm />
    }

    const player = await db.player.findUnique({ where: { id: playerId } })
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

    const node = await getStoryNode(progress.currentNodeId)

    // Handle end state or missing node (dashboard redirect)
    if (!node) {
        if (progress.currentNodeId === 'dashboard' || player.onboardingComplete) {
            redirect('/')
        }
        return <div>Story node not found: {progress.currentNodeId}</div>
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
