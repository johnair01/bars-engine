'use server'

/**
 * @deprecated This module implements a simple form-based onboarding for nation/archetype selection.
 * The new system uses QuestThread (threadType: 'orientation') with completionEffects.
 * See: quest-engine.ts processCompletionEffects() and seed-onboarding-thread.ts.
 * These functions remain for backward compatibility — new code should use the thread system.
 */

import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createRequestId, logActionError } from '@/lib/mvp-observability'

export async function getMvpProfileSetupData() {
    const player = await getCurrentPlayer()
    if (!player) return { error: 'Not logged in' as const }

    const [nations, playbooks] = await Promise.all([
        db.nation.findMany({
            where: { archived: false },
            select: { id: true, name: true, description: true },
            orderBy: { name: 'asc' }
        }),
        db.playbook.findMany({
            select: { id: true, name: true, description: true },
            orderBy: { name: 'asc' }
        }),
    ])

    return {
        player,
        nations,
        playbooks,
    }
}

export async function saveMvpProfileSetup(formData: FormData) {
    const requestId = createRequestId()
    const player = await getCurrentPlayer()

    if (!player) {
        redirect('/login')
    }

    const nationId = (formData.get('nationId') as string || '').trim()
    const playbookId = (formData.get('playbookId') as string || '').trim()

    if (!nationId || !playbookId) {
        redirect('/onboarding/profile?error=missing')
    }

    try {
        const [nation, playbook] = await Promise.all([
            db.nation.findUnique({ where: { id: nationId }, select: { id: true } }),
            db.playbook.findUnique({ where: { id: playbookId }, select: { id: true } }),
        ])

        if (!nation || !playbook) {
            redirect('/onboarding/profile?error=invalid')
        }

        await db.player.update({
            where: { id: player.id },
            data: {
                nationId,
                playbookId,
            }
        })

        revalidatePath('/')
        revalidatePath('/onboarding/profile')
        redirect('/')
    } catch (error) {
        logActionError(
            { action: 'saveMvpProfileSetup', requestId, userId: player.id, extra: { nationId, playbookId } },
            error
        )
        redirect('/onboarding/profile?error=save_failed')
    }
}
