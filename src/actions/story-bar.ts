'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { STARTER_BARS } from '@/lib/bars'
import { revalidatePath } from 'next/cache'

export async function completeStoryBar(prevState: any, formData: FormData) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    const barId = formData.get('barId') as string
    const inputsJson = formData.get('inputs') as string

    let inputs: Record<string, any>
    try {
        inputs = JSON.parse(inputsJson)
    } catch {
        return { error: 'Invalid input data' }
    }

    const barDef = STARTER_BARS.find(b => b.id === barId)
    if (!barDef) {
        return { error: 'Unknown bar' }
    }

    try {
        const starterPack = await db.starterPack.findUnique({
            where: { playerId }
        })

        if (!starterPack) {
            return { error: 'Starter pack not found' }
        }

        const data = JSON.parse(starterPack.data) as {
            completedBars: { id: string; inputs: Record<string, any>; status: string }[],
            activeBars?: string[]
        }

        // Check if already completed
        if (data.completedBars.some(cb => cb.id === barId)) {
            return { error: 'Already completed' }
        }

        // Add to completed with status
        data.completedBars.push({ id: barId, inputs, status: 'completed' })

        // Remove from active if it was there
        if (data.activeBars) {
            data.activeBars = data.activeBars.filter(id => id !== barId)
        }

        const reward = barDef.reward

        await db.$transaction([
            db.starterPack.update({
                where: { playerId },
                data: {
                    data: JSON.stringify(data),
                    initialVibeulons: { increment: reward }
                }
            }),
            db.vibulonEvent.create({
                data: {
                    playerId,
                    source: 'story_quest',
                    amount: reward,
                    notes: `Completed Story: ${barDef.title}`
                }
            })
        ])

        revalidatePath('/')

    } catch (e: any) {
        console.error("Story bar completion failed:", e?.message)
        return { error: 'Failed to complete quest' }
    }

    redirect('/')
}
